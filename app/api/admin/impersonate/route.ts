import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'חסר userId' }, { status: 400 })

  const db = createServiceClient()

  /* Verify target exists and is not a founder */
  const { data: target } = await db
    .from('users')
    .select('role, email, name')
    .eq('id', userId)
    .single()

  if (!target) return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
  if (target.role === 'founder') {
    return NextResponse.json({ error: 'לא ניתן להתחזות למייסד' }, { status: 403 })
  }

  /* Generate a magic link for the target user via Supabase Admin API.
     The link is single-use and expires after 60 seconds.
     The admin uses it to swap their session to the target user's session. */
  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/dashboard`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[impersonate] generateLink error:', linkError)
    return NextResponse.json({ error: 'שגיאה בייצור קישור כניסה' }, { status: 500 })
  }

  /* Log the impersonation event */
  db.from('token_ledger').insert({
    user_id: ctx.userId,
    tokens_used: 0,
    api_cost_usd: 0,
    action_type: 'admin_impersonate',
  }).then(() => {/* non-fatal */}, () => {/* non-fatal */})

  return NextResponse.json({
    ok: true,
    magicLink: linkData.properties.action_link,
    targetEmail: target.email,
    targetName: target.name,
  })
}
