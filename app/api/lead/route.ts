import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

/* ── in-memory rate limiter: max 5 leads per IP per hour ── */
const ipMap = new Map<string, { count: number; resetAt: number }>()
const MAX_PER_HOUR = 5
const WINDOW_MS = 60 * 60 * 1000

function allow(ip: string): boolean {
  const now = Date.now()
  const e = ipMap.get(ip)
  if (!e || now > e.resetAt) { ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS }); return true }
  if (e.count >= MAX_PER_HOUR) return false
  e.count++
  return true
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/**
 * Best-effort transactional send via Resend. Returns true if the email was
 * accepted. No-ops (returns false) when RESEND_API_KEY isn't configured, so
 * the lead is still captured either way.
 */
async function sendPostEmail(to: string, post: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const from = process.env.LEAD_FROM_EMAIL ?? 'SociMe <hello@socime.co.il>'

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;background:#1C0F2B;color:#fff;padding:32px;border-radius:16px;max-width:560px;margin:0 auto">
      <h2 style="color:#CE7BFF;margin:0 0 16px">הפוסט שלכם מוכן ✨</h2>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.7;margin:0 0 20px">
        הנה הפוסט המלא ש-SociMe יצרה עבורכם. רוצים עוד כאלה על אוטומט?
      </p>
      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(206,123,255,0.3);border-radius:12px;padding:20px;font-size:15px;line-height:1.8;white-space:pre-wrap">${
        post.replace(/</g, '&lt;')
      }</div>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://socime.co.il'}/login?mode=register"
         style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#B030F5,#CE7BFF);color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:700">
        התחילו בחינם ←
      </a>
    </div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: 'הפוסט שלכם מ-SociMe מוכן ✨', html }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
    if (!allow(ip)) {
      return NextResponse.json({ error: 'יותר מדי בקשות. נסו שוב מאוחר יותר.' }, { status: 429 })
    }

    const { email, painPoint, post } = await req.json() as {
      email?: string; painPoint?: string; post?: string
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ error: 'כתובת מייל לא תקינה' }, { status: 400 })
    }

    const db = createServiceClient()

    // Send first (best-effort) so we can record whether it went out.
    const emailed = await sendPostEmail(email.trim(), (post ?? '').trim())

    // Always capture the lead — this is the point of the funnel.
    const { error } = await db.from('leads').insert({
      email:          email.trim(),
      pain_point:     (painPoint ?? '').slice(0, 500) || null,
      generated_post: (post ?? '').slice(0, 4000) || null,
      source:         'bait_demo',
      emailed,
    })
    if (error) {
      console.error('[/api/lead] insert', error)
      return NextResponse.json({ error: 'שגיאה בשמירה' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, emailed })
  } catch (err) {
    console.error('[/api/lead]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
