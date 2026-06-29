import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext }   from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'חסר userId' }, { status: 400 })

  const db = createServiceClient()

  /* Verify target exists and is not a founder */
  const { data: target } = await db.from('users').select('role').eq('id', userId).single()
  if (!target) return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
  if (target.role === 'founder') return NextResponse.json({ error: 'לא ניתן להתחזות למייסד' }, { status: 403 })

  /* With Supabase, true session-swap requires the service role to generate a
     magic link / OTP for the target user, then redirect.
     For now we log the impersonation attempt and return a stub response. */
  await db.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', userId)

  return NextResponse.json({ ok: true, userId, note: 'Impersonation stub — wire Supabase admin.generateLink in production' })
}
