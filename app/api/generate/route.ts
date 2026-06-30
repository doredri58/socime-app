import { NextRequest, NextResponse } from 'next/server'
import { generatePost } from '@/lib/llm'
import { checkTokenBalance, deductTokens } from '@/lib/tokens'

export async function POST(req: NextRequest) {
  try {
    const { businessDesc, userId } = await req.json()

    if (!businessDesc || typeof businessDesc !== 'string' || businessDesc.trim().length < 3) {
      return NextResponse.json({ error: 'תיאור עסק קצר מדי' }, { status: 400 })
    }

    if (userId) {
      const check = await checkTokenBalance(userId, 'generate_post')
      if (!check.ok) {
        return NextResponse.json(
          { error: `אין מספיק טוקנים (נדרש ${check.required}, נותר ${check.balance})`, insufficientTokens: true },
          { status: 402 }
        )
      }
    }

    const { text, hashtags, tokensUsed, costUsd } = await generatePost(businessDesc.trim())

    if (userId) {
      // deduct the FIXED economy cost (TOKEN_COSTS.generate_post); log the real $ cost
      await deductTokens(userId, 'generate_post', undefined, costUsd)
    }

    return NextResponse.json({ text, hashtags, tokensUsed })
  } catch (err: unknown) {
    console.error('[/api/generate]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
