import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { enforce, limiters, clientIp } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    // 10 ניסיונות ל-15 דק' לכל IP — מונע brute force על סיסמאות
    const limited = await enforce(limiters.login, clientIp(req), 'יותר מדי ניסיונות התחברות. נסו שוב בעוד כמה דקות.')
    if (limited) return limited

    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: 'אימייל או סיסמה שגויים' }, { status: 401 })
    }

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (err) {
    console.error('[/api/auth/login]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
