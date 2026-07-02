import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generatePost } from '@/lib/llm'
import { checkTokenBalance, deductTokens } from '@/lib/tokens'

export async function POST(req: NextRequest) {
  try {
    // Session auth — never trust a userId from the body
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'נדרשת התחברות' }, { status: 401 })

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

    const { text, hashtags, tokensUsed, costUsd } = await generatePost(businessDesc.trim())

    // deduct the FIXED economy cost (TOKEN_COSTS.generate_post); log the real $ cost
    await deductTokens(user.id, 'generate_post', undefined, costUsd)

    return NextResponse.json({ text, hashtags, tokensUsed })
  } catch (err: unknown) {
    console.error('[/api/generate]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
