import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PLANS, isPlanId, planAmountIls, type BillingCycle } from '@/lib/plans'

export const runtime = 'nodejs'

const PAYPLUS_API = 'https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink'

// POST { plan: 'basic'|'pro'|'agency', billing: 'monthly'|'annual' }
export async function POST(req: NextRequest) {
  try {
    // Authenticated session (don't trust a userId from the body)
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { plan, billing } = await req.json()
    if (!isPlanId(plan)) return NextResponse.json({ error: 'מסלול לא חוקי' }, { status: 400 })
    const cycle: BillingCycle = billing === 'annual' ? 'annual' : 'monthly'

    const selected = PLANS[plan]
    const amountIls = planAmountIls(plan, cycle)
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const body = {
      payment_page_uid: process.env.NEXT_PUBLIC_PAYPLUS_PAGE_UID,
      charge_method:    1, // one-time charge for the billing period
      currency_code:    'ILS',
      send_email:       true,
      customer: {
        customer_name: user.email?.split('@')[0] ?? 'לקוח',
        email:         user.email,
        vat_number:    '',
        phone_number:  '',
      },
      items: [{
        name:     `${selected.name} · ${cycle === 'annual' ? 'שנתי' : 'חודשי'}`,
        quantity: 1,
        price:    amountIls,
        vat_type: 1,
      }],
      more_info_1: user.id,   // identify the user in the webhook
      more_info_2: plan,      // plan id
      more_info_3: cycle,     // billing cycle
      success_url: `${origin}/payment/success?plan=${plan}`,
      cancel_url:  `${origin}/payment/cancel`,
    }

    const res = await fetch(PAYPLUS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': JSON.stringify({
          api_key:    process.env.PAYPLUS_API_KEY,
          secret_key: process.env.PAYPLUS_SECRET,
        }),
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok || data.results?.status !== '1') {
      console.error('[PayPlus checkout]', data)
      return NextResponse.json({ error: 'שגיאה ביצירת דף תשלום' }, { status: 502 })
    }

    return NextResponse.json({ paymentUrl: data.data?.payment_page_link })
  } catch (err) {
    console.error('[/api/payplus/checkout]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
