import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { generatePostIdeas } from '@/lib/gemini'
import { getActiveBusiness } from '@/lib/business'
import { enrichSystemPrompt } from '@/lib/prompt-vars'
import { enforce, limiters } from '@/lib/ratelimit'

// Personalised post ideas for the active business. Free (0 tokens) by product
// decision, so the cost guard here is the rate limiter, not the token balance.
// Results are cached on business_profiles so the bank loads instantly; this
// route only runs on first visit or when the user hits "רענן".
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const limited = await enforce(limiters.aiIdeas, user.id, 'יותר מדי ריענונים. נסו שוב בעוד שעה.')
  if (limited) return limited

  const business = await getActiveBusiness(user.id)
  if (!business) {
    return NextResponse.json(
      { error: 'צריך פרופיל עסק כדי לייצר רעיונות מותאמים', noBusiness: true },
      { status: 400 },
    )
  }

  const basePrompt = business.parsed_system_prompt
    ?? `אתה עוזר שיווק לעסק בשם ${business.business_name ?? 'עסק ישראלי'}. כתוב תוכן בעברית.`
  const systemPrompt = enrichSystemPrompt(basePrompt, business)

  let ideas
  try {
    ideas = await generatePostIdeas(systemPrompt)
  } catch (err) {
    console.error('[/api/ideas/generate]', err)
    return NextResponse.json({ error: 'שגיאה ביצירת רעיונות, נסו שוב' }, { status: 502 })
  }

  if (ideas.length === 0) {
    return NextResponse.json({ error: 'לא הצלחנו לייצר רעיונות הפעם, נסו שוב' }, { status: 502 })
  }

  // Attach stable ids so the client can key/save them.
  const withIds = ideas.map((idea, i) => ({ ...idea, id: `gen-${i}` }))

  const db = createServiceClient()
  await db
    .from('business_profiles')
    .update({ cached_post_ideas: withIds, post_ideas_generated_at: new Date().toISOString() })
    .eq('id', business.id)

  return NextResponse.json({ ideas: withIds })
}
