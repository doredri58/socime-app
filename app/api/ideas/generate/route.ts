import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { generateReadyPosts } from '@/lib/gemini'
import { getActiveBusiness } from '@/lib/business'
import { enrichSystemPrompt } from '@/lib/prompt-vars'
import { checkTokenBalance, deductTokens, getTokenBalance } from '@/lib/tokens'
import { enforce, limiters } from '@/lib/ratelimit'

// Generating 6 full posts in one Gemini call is slow (~60-90s observed), so the
// function needs a long ceiling. 120s requires a Vercel plan that allows it
// (Pro+); on Hobby the 60s cap would truncate the request.
export const maxDuration = 120

// Generates a batch of 6 publish-ready posts for the active business and caches
// them on the profile. Costs a flat 20 tokens (a bundle: cheaper than the 30 it
// would take to write 6 posts one by one in the studio). User-triggered only —
// no auto-generation. The batch persists until the user regenerates or sends
// every post to the studio (see the consume route).
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const limited = await enforce(limiters.aiIdeas, user.id, 'יותר מדי ריענונים. נסו שוב בעוד שעה.')
  if (limited) return limited

  const business = await getActiveBusiness(user.id)
  if (!business) {
    return NextResponse.json(
      { error: 'צריך פרופיל עסק כדי לייצר פוסטים מותאמים', noBusiness: true },
      { status: 400 },
    )
  }

  const tokenCheck = await checkTokenBalance(user.id, 'generate_ideas')
  if (!tokenCheck.ok) {
    return NextResponse.json(
      { error: `אין מספיק טוקנים (נדרש ${tokenCheck.required}, נותר ${tokenCheck.balance})`, insufficientTokens: true },
      { status: 402 },
    )
  }

  const basePrompt = business.parsed_system_prompt
    ?? `אתה עוזר שיווק לעסק בשם ${business.business_name ?? 'עסק ישראלי'}. כתוב תוכן בעברית.`
  const systemPrompt = enrichSystemPrompt(basePrompt, business)

  let posts
  try {
    posts = await generateReadyPosts(systemPrompt)
  } catch (err) {
    console.error('[/api/ideas/generate]', err)
    return NextResponse.json({ error: 'שגיאה ביצירת פוסטים, נסו שוב' }, { status: 502 })
  }

  if (posts.length === 0) {
    return NextResponse.json({ error: 'לא הצלחנו לייצר פוסטים הפעם, נסו שוב' }, { status: 502 })
  }

  // Only charge once we actually have posts to show.
  await deductTokens(user.id, 'generate_ideas')

  const withIds = posts.map((p, i) => ({ ...p, id: `gen-${Date.now()}-${i}` }))

  const db = createServiceClient()
  await db
    .from('business_profiles')
    .update({ cached_post_ideas: withIds, post_ideas_generated_at: new Date().toISOString() })
    .eq('id', business.id)

  const tokensRemaining = await getTokenBalance(user.id)
  return NextResponse.json({ posts: withIds, tokensRemaining: tokensRemaining ?? 0 })
}
