import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase'

function verifyPayPlusSignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYPLUS_SECRET) return false
  const expected = createHmac('sha256', process.env.PAYPLUS_SECRET)
    .update(body)
    .digest('hex')
  return expected === signature
}

const PLAN_CONFIG = {
  basic: { tier: 'basic', tokens: 500,  amountIls: 79  },
  pro:   { tier: 'pro',   tokens: 1500, amountIls: 149 },
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-payplus-signature')
    if (!verifyPayPlusSignature(rawBody, signature)) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const body = JSON.parse(rawBody)

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

    // עדכון tier ומתן טוקנים אטומי
    await Promise.all([
      db.from('users').update({ tier: config.tier }).eq('id', userId),
      db.rpc('grant_tokens', { uid: userId, amount: config.tokens }),
    ])

    // רישום העסקה
    await db.from('transactions').insert({
      user_id:           userId,
      transaction_type:  'subscription',
      amount_paid_ils:   config.amountIls,
      tokens_granted:    config.tokens,
      stripe_payment_id: transactionId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/payplus/webhook]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
