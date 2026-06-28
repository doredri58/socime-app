import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id, action } = await req.json()
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })
  }

  const db = createServiceClient()

  // וידוא שהפוסט שייך למשתמש ובסטטוס הנכון
  const { data: post } = await db
    .from('scheduler')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!post) return NextResponse.json({ error: 'פוסט לא נמצא' }, { status: 404 })
  if (post.status !== 'pending_approval') {
    return NextResponse.json({ error: 'הפוסט אינו ממתין לאישור' }, { status: 409 })
  }

  const newStatus = action === 'approve' ? 'queued' : 'draft'
  const { error } = await db
    .from('scheduler')
    .update({ status: newStatus })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status: newStatus })
}
