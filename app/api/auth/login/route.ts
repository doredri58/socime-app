import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
    }

    // Update last_login_at
    const db = createServiceClient()
    await db.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id)

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (err: unknown) {
    console.error('[/api/auth/login]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
