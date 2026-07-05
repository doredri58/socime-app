import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { generateIdeas } from '@/lib/gemini'
import { checkTokenBalance, deductTokens } from '@/lib/tokens'
import { getActiveBusiness } from '@/lib/business'
import { enrichSystemPrompt } from '@/lib/prompt-vars'

const CATEGORIES = ['value', 'marketing', 'vibe'] as const

export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()
  const business = await getActiveBusiness(user.id)

  const basePrompt = business?.parsed_system_prompt
    ?? `אתה עוזר שיווק לעסק בשם ${business?.business_name ?? 'עסק ישראלי'}. כתוב תוכן בעברית.`
  // Append tone / audience / address / phone / hours / etc. so the AI has the
  // full business context even if the baked prompt didn't include it.
  const systemPrompt = enrichSystemPrompt(basePrompt, business)

  // בדיקת יתרת טוקנים לפני קריאת AI
  const tokenCheck = await checkTokenBalance(user.id, 'generate_ideas')
  if (!tokenCheck.ok) {
    return NextResponse.json(
      { error: `אין מספיק טוקנים (נדרש ${tokenCheck.required}, נותר ${tokenCheck.balance})`, insufficientTokens: true },
      { status: 402 }
    )
  }

  // Generate ~3 ideas per category in parallel, then shuffle
  const batches = await Promise.allSettled(
    CATEGORIES.map(cat => generateIdeas(cat, systemPrompt).then(texts =>
      texts.slice(0, 4).map(text => ({ text, category: cat }))
    ))
  )

  const ideas: { text: string; category: string }[] = []
  for (const batch of batches) {
    if (batch.status === 'fulfilled') ideas.push(...batch.value)
  }

  // Shuffle
  for (let i = ideas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ideas[i], ideas[j]] = [ideas[j], ideas[i]]
  }

  await deductTokens(user.id, 'generate_ideas')

  return NextResponse.json({ ideas: ideas.slice(0, 12) })
}
