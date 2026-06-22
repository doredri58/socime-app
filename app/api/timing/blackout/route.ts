import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from('blackout_periods')
    .select('id, label, start_datetime, end_datetime')
    .eq('user_id', user.id)
    .order('start_datetime', { ascending: true })

  return NextResponse.json({ blackouts: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { label, start_datetime, end_datetime } = await req.json()
  if (!start_datetime || !end_datetime) {
    return NextResponse.json({ error: 'חסרים תאריכים' }, { status: 400 })
  }
  if (new Date(end_datetime) <= new Date(start_datetime)) {
    return NextResponse.json({ error: 'תאריך סיום חייב להיות אחרי תאריך התחלה' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('blackout_periods')
    .insert({ user_id: user.id, label: label || 'חסימה', start_datetime, end_datetime })
    .select('id, label, start_datetime, end_datetime')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ blackout: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'חסר id' }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db
    .from('blackout_periods')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
