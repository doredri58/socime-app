import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'
import { PLANS, isPlanId, planAmountIls, type BillingCycle, type PlanId } from '@/lib/plans'

export const runtime = 'nodejs'

// Vercel Cron: daily (vercel.json). Renews expired subscriptions by charging
// the saved PayPlus card token. After MAX_FAILURES consecutive failed charge
// attempts (one per day) the user is downgraded to the free tier.
// Authorization: Bearer CRON_SECRET

const MAX_FAILURES = 3
// PayPlus token-charge endpoint — VERIFY path + body fields against PayPlus
// docs before going live (Transactions/Charge with token is the documented
// pattern for recurring billing).
const PAYPLUS_CHARGE_API = 'https://restapi.payplus.co.il/api/v1.0/Transactions/Charge'

interface RenewalUser {
  id: string
  email: string | null
  subscription_plan: string
  subscription_cycle: string
  payplus_token_uid: string | null
  renewal_failures: number
}

async function chargeToken(tokenUid: string, amountIls: number, planName: string, email: string | null) {
  const res = await fetch(PAYPLUS_CHARGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': JSON.stringify({
        api_key:    process.env.PAYPLUS_API_KEY,
        secret_key: process.env.PAYPLUS_SECRET,
      }),
    },
    body: JSON.stringify({
      terminal_uid:  process.env.PAYPLUS_TERMINAL_UID,
      token:         tokenUid,
      amount:        amountIls,
      currency_code: 'ILS',
      more_info_1:   'auto_renewal',
      item_name:     `${planName} · חידוש אוטומטי`,
      ...(email ? { customer: { email } } : {}),
    }),
  })
  const data = await res.json().catch(() => ({}))
  const approved = res.ok && (data?.results?.status === '1' || data?.data?.status_code === '000')
  return { approved, transactionUid: data?.data?.transaction_uid ?? null, raw: data }
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const now = new Date().toISOString()

  // Paying users whose paid period has ended
  const { data: due } = await db
    .from('users')
    .select('id, email, subscription_plan, subscription_cycle, payplus_token_uid, renewal_failures')
    .neq('tier', 'free')
    .not('subscription_expires_at', 'is', null)
    .lte('subscription_expires_at', now)
    .limit(50)

  if (!due || due.length === 0) return NextResponse.json({ renewed: 0, downgraded: 0 })

  let renewed = 0, downgraded = 0, failed = 0

  for (const user of due as RenewalUser[]) {
    const plan = user.subscription_plan
    const cycle: BillingCycle = user.subscription_cycle === 'annual' ? 'annual' : 'monthly'

    // No valid plan or no saved card → can't auto-renew; downgrade immediately.
    if (!isPlanId(plan) || !user.payplus_token_uid) {
      await downgrade(db, user.id)
      await notify(db, user.id, 'המנוי שלך הסתיים', 'לא נמצא אמצעי תשלום שמור לחידוש אוטומטי, והחשבון הועבר למסלול החינמי. ניתן לחדש את המנוי בכל עת מדף החיובים.')
      downgraded++
      continue
    }

    const config = PLANS[plan as PlanId]
    let approved = false
    let transactionUid: string | null = null

    try {
      const tokenUid = decrypt(user.payplus_token_uid)
      const result = await chargeToken(tokenUid, planAmountIls(plan as PlanId, cycle), config.name, user.email)
      approved = result.approved
      transactionUid = result.transactionUid
    } catch (err) {
      console.error('[cron/renewals] charge error for', user.id, err)
    }

    if (approved) {
      const expiresAt = new Date()
      if (cycle === 'annual') expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      else                    expiresAt.setMonth(expiresAt.getMonth() + 1)

      await db.from('users').update({
        token_balance:           config.tokens,
        subscription_expires_at: expiresAt.toISOString(),
        renewal_failures:        0,
      }).eq('id', user.id)

      await db.from('transactions').insert({
        user_id:           user.id,
        transaction_type:  'renewal',
        amount_paid_ils:   planAmountIls(plan as PlanId, cycle),
        tokens_granted:    config.tokens,
        stripe_payment_id: transactionUid,
      })

      await notify(db, user.id, '✅ המנוי חודש אוטומטית', `המנוי ${config.name} חודש בהצלחה ו-${config.tokens} טוקנים נטענו לחשבון.`)
      renewed++
    } else {
      const failures = (user.renewal_failures ?? 0) + 1
      if (failures >= MAX_FAILURES) {
        await downgrade(db, user.id)
        await notify(db, user.id, 'המנוי שלך הסתיים', 'החיוב האוטומטי נכשל מספר פעמים והחשבון הועבר למסלול החינמי. ניתן לחדש את המנוי בכל עת מדף החיובים.')
        downgraded++
      } else {
        // Leave expires_at in the past — tomorrow's run retries the charge.
        await db.from('users').update({ renewal_failures: failures }).eq('id', user.id)
        await notify(db, user.id, '⚠️ בעיה בחידוש המנוי', `החיוב האוטומטי נכשל (ניסיון ${failures}/${MAX_FAILURES}). בדוק את אמצעי התשלום בדף החיובים.`)
        failed++
      }
    }
  }

  return NextResponse.json({ renewed, failed, downgraded })
}

async function downgrade(db: ReturnType<typeof createServiceClient>, userId: string) {
  await db.from('users').update({
    tier:                    'free',
    subscription_plan:       null,
    subscription_cycle:      null,
    subscription_expires_at: null,
    renewal_failures:        0,
  }).eq('id', userId)
}

async function notify(db: ReturnType<typeof createServiceClient>, userId: string, title: string, body: string) {
  await db.from('notifications').insert({
    user_id: userId, title, body, url: '/dashboard/profile',
  }).then(() => {}, () => {/* non-fatal */})
}
