import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

// GET /api/auth/callback
// Supabase OAuth (Google) redirects here with ?code=... after consent.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const user = data.user
  const db = createServiceClient()

  // First OAuth login — create the users row (email signups get it in /api/auth/register)
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existing) {
    await db.from('users').insert({
      id:    user.id,
      email: user.email,
      name:  user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'משתמש',
      plan:  'free',
      token_balance: 30,
    })

    return NextResponse.redirect(`${origin}/onboarding?uid=${user.id}`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
