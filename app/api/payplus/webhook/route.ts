import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase'
import { PLANS, isPlanId, planAmountIls, type BillingCycle } from '@/lib/plans'

export const runtime = 'nodejs'

function verifyPayPlusSignature(body: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYPLUS_SECRET) return false
  const expected = createHmac('sha256', process.env.PAYPLUS_SECRET).update(body).digest('hex')
  return expected === signature
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-payplus-signature')
    if (!verifyPayPlusSignature(rawBody, signature)) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
    const body = JSON.parse(rawBody)

    const status        = body.data?.status_code        // '000' = success
    const userId        = body.data?.more_info_1
    const plan          = body.data?.more_info_2
    const cycle: BillingCycle = body.data?.more_info_3 === 'annual' ? 'annual' : 'monthly'
    const transactionId = body.data?.transaction_uid

    if (status !== '000' || !userId || !isPlanId(plan)) {
      return NextResponse.json({ ok: false })
    }

    const config = PLANS[plan]
    const db = createServiceClient()

    // Idempotency: a replayed/duplicated webhook must not grant tokens twice.
    if (transactionId) {
      const { data: existing } = await db
        .from('transactions')
        .select('id')
        .eq('stripe_payment_id', transactionId)
        .maybeSingle()
      if (existing) return NextResponse.json({ ok: true, duplicate: true })
    }

    // Activate subscription: set tier + grant a fresh monthly token allotment.
    await db.from('users')
      .update({ tier: config.tier, token_balance: config.tokens })
      .eq('id', userId)

    // Record the transaction.
    await db.from('transactions').insert({
      user_id:           userId,
      transaction_type:  'subscription',
      amount_paid_ils:   planAmountIls(plan, cycle),
      tokens_granted:    config.tokens,
      stripe_payment_id: transactionId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/payplus/webhook]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
