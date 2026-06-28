import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('id, email, name, role, plan, tier, token_balance, created_at')
    .eq('id', user.id)
    .single()

  const { data: txns } = await db
    .from('transactions')
    .select('amount_paid_ils, tokens_granted, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({ profile, transactions: txns ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { name } = await req.json()
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'שם לא תקין' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('users').update({ name: name.trim() }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
