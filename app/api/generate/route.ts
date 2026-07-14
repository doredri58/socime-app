import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generatePost } from '@/lib/llm'
import { checkTokenBalance, deductTokens } from '@/lib/tokens'
import { getActiveBusiness } from '@/lib/business'
import { buildBusinessVars, businessFactsBlock } from '@/lib/prompt-vars'
import { enforce, limiters } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    // Session auth — never trust a userId from the body
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'נדרשת התחברות' }, { status: 401 })

    // 30 יצירות לדקה למשתמש — הגנה על עלויות Gemini (מעבר לניכוי הטוקנים)
    const limited = await enforce(limiters.aiText, user.id, 'יותר מדי בקשות יצירה. המתינו רגע ונסו שוב.')
    if (limited) return limited

    const { businessDesc } = await req.json()

    if (!businessDesc || typeof businessDesc !== 'string' || businessDesc.trim().length < 3) {
      return NextResponse.json({ error: 'תיאור עסק קצר מדי' }, { status: 400 })
    }

    const check = await checkTokenBalance(user.id, 'generate_post')
    if (!check.ok) {
      return NextResponse.json(
        { error: `אין מספיק טוקנים (נדרש ${check.required}, נותר ${check.balance})`, insufficientTokens: true },
        { status: 402 }
      )
    }

    // Inject the active business's tone / audience / address / hours so the post
    // matches the brand, not just the generic prompt.
    const business = await getActiveBusiness(user.id)
    const facts = businessFactsBlock(buildBusinessVars(business))

    const { text, hashtags, tokensUsed, costUsd } = await generatePost(businessDesc.trim(), facts)

    // deduct the FIXED economy cost (TOKEN_COSTS.generate_post); log the real $ cost
    await deductTokens(user.id, 'generate_post', undefined, costUsd)

    return NextResponse.json({ text, hashtags, tokensUsed })
  } catch (err: unknown) {
    console.error('[/api/generate]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
