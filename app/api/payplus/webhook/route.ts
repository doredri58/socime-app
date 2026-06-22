import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const PLAN_CONFIG = {
  basic: { tier: 'basic', tokens: 100 },
  pro:   { tier: 'pro',   tokens: 300 },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // PayPlus שולח את סטטוס התשלום
    const status      = body.data?.status_code         // '000' = הצלחה
    const userId      = body.data?.more_info_1
    const plan        = body.data?.more_info_2 as keyof typeof PLAN_CONFIG
    const transactionId = body.data?.transaction_uid

    if (status !== '000' || !userId || !plan) {
      return NextResponse.json({ ok: false })
    }

    const config = PLAN_CONFIG[plan]
    if (!config) return NextResponse.json({ ok: false })

    const db = createServiceClient()

    // עדכון tier + token_balance של המשתמש
    await db.from('users')
      .update({
        plan:          plan,
        tier:          config.tier,
        token_balance: config.tokens,
      })
      .eq('id', userId)

    // רישום העסקה
    await db.from('transactions').insert({
      user_id:           userId,
      transaction_type:  'subscription',
      amount_paid_ils:   plan === 'basic' ? 49 : 99,
      tokens_granted:    config.tokens,
      stripe_payment_id: transactionId ?? null, // שדה קיים — משתמשים בו ל-PayPlus transaction id
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/payplus/webhook]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
