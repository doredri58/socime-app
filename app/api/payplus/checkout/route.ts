import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

const PAYPLUS_API = 'https://restapi.payplus.co.il/api/v1.0/PaymentPages/generateLink'

const PLANS = {
  basic: { name: 'SociMe Basic', price: 4900, tokens: 100 },  // price in agorot (₪49)
  pro:   { name: 'SociMe Pro',   price: 9900, tokens: 300 },  // ₪99
}

export async function POST(req: NextRequest) {
  try {
    const { userId, plan, email } = await req.json()

    if (!userId || !plan || !PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: 'פרמטרים חסרים' }, { status: 400 })
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS]
    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    // יצירת payment page ב-PayPlus
    const body = {
      payment_page_uid: process.env.NEXT_PUBLIC_PAYPLUS_PAGE_UID,
      charge_method:    1, // one-time charge
      currency_code:    'ILS',
      send_email:       true,
      customer: {
        customer_name:  email?.split('@')[0] ?? 'לקוח',
        email,
        vat_number:     '',
        phone_number:   '',
      },
      items: [{
        name:     selectedPlan.name,
        quantity: 1,
        price:    selectedPlan.price / 100, // PayPlus expects ILS not agorot
        vat_type: 1,
      }],
      more_info_1: userId,   // נשמור userId לזיהוי ב-webhook
      more_info_2: plan,     // שם הפלאן
      success_url:  `${origin}/payment/success?plan=${plan}`,
      cancel_url:   `${origin}/payment/cancel`,
    }

    const res = await fetch(PAYPLUS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': JSON.stringify({
          api_key: process.env.PAYPLUS_API_KEY,
          secret_key: process.env.PAYPLUS_SECRET,
        }),
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok || data.results?.status !== '1') {
      console.error('[PayPlus checkout]', data)
      return NextResponse.json({ error: 'שגיאה ביצירת דף תשלום' }, { status: 500 })
    }

    return NextResponse.json({ paymentUrl: data.data?.payment_page_link })
  } catch (err) {
    console.error('[/api/payplus/checkout]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
