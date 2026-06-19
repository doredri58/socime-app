import { NextRequest, NextResponse } from 'next/server'
import { generatePost, moderateContent } from '@/lib/llm'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { businessDesc, userId } = await req.json()

    if (!businessDesc || typeof businessDesc !== 'string' || businessDesc.trim().length < 3) {
      return NextResponse.json({ error: 'תיאור עסק קצר מדי' }, { status: 400 })
    }

    // Generate post
    const { text, hashtags, tokensUsed, costUsd } = await generatePost(businessDesc.trim())

    // Moderation check (OpenAI only)
    if ((process.env.LLM_PROVIDER ?? 'openai').toLowerCase() === 'openai') {
      const fullText = `${text} ${hashtags}`
      const moderation = await moderateContent(fullText)
      if (moderation.flagged) {
        return NextResponse.json({ error: 'התוכן לא עבר בדיקת מודרציה' }, { status: 422 })
      }
    }

    // Log to token_ledger if user is logged in
    if (userId) {
      const db = createServiceClient()
      await db.from('token_ledger').insert({
        user_id: userId,
        tokens_used: tokensUsed,
        api_cost_usd: costUsd,
        action_type: 'generate_post',
      })
      // Deduct from balance
      await db.rpc('decrement_tokens', { uid: userId, amount: tokensUsed })
    }

    return NextResponse.json({
      text,
      hashtags,
      tokensUsed,
      moderationPassed: true,
    })
  } catch (err: unknown) {
    console.error('[/api/generate]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
