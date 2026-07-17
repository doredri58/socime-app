import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { generateReadyPosts, generateReadyVideos } from '@/lib/gemini'
import { getActiveBusiness } from '@/lib/business'
import { enrichSystemPrompt } from '@/lib/prompt-vars'
import { checkTokenBalance, deductTokens, getTokenBalance } from '@/lib/tokens'
import { enforce, limiters } from '@/lib/ratelimit'

// Generating 6 full items in one Gemini call can be slow, so the function needs
// a long ceiling. 120s requires a Vercel plan that allows it (Pro+); on Hobby
// the 60s cap would truncate. (Observed ~12s on production, so this is headroom.)
export const maxDuration = 120

// Generates a batch of 6 personalised items — posts (default) or video scripts —
// for the active business and caches them on the profile. Flat 20 tokens either
// way (a bundle). User-triggered only. The batch persists until the user
// regenerates or sends every item to the studio (see the consume route).
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { kind } = await req.json().catch(() => ({ kind: 'post' }))
  const isVideo = kind === 'video'
  const noun = isVideo ? 'תסריטים' : 'פוסטים'

  const limited = await enforce(limiters.aiIdeas, user.id, 'יותר מדי ריענונים. נסו שוב בעוד שעה.')
  if (limited) return limited

  const business = await getActiveBusiness(user.id)
  if (!business) {
    return NextResponse.json(
      { error: `צריך פרופיל עסק כדי לייצר ${noun} מותאמים`, noBusiness: true },
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

  let items: unknown[]
  try {
    items = isVideo ? await generateReadyVideos(systemPrompt) : await generateReadyPosts(systemPrompt)
  } catch (err) {
    console.error('[/api/ideas/generate]', err)
    return NextResponse.json({ error: `שגיאה ביצירת ${noun}, נסו שוב` }, { status: 502 })
  }

  if (items.length === 0) {
    return NextResponse.json({ error: `לא הצלחנו לייצר ${noun} הפעם, נסו שוב` }, { status: 502 })
  }

  // Only charge once we actually have items to show.
  await deductTokens(user.id, 'generate_ideas')

  const withIds = items.map((it, i) => ({ ...(it as object), id: `gen-${Date.now()}-${i}` }))

  const db = createServiceClient()
  const now = new Date().toISOString()
  const patch = isVideo
    ? { cached_video_ideas: withIds, video_ideas_generated_at: now }
    : { cached_post_ideas: withIds, post_ideas_generated_at: now }
  await db.from('business_profiles').update(patch).eq('id', business.id)

  const tokensRemaining = await getTokenBalance(user.id)
  return NextResponse.json({ items: withIds, tokensRemaining: tokensRemaining ?? 0 })
}
