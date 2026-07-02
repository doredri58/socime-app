import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()
  const userId = user.id

  // מחיקת כל נתוני המשתמש לפי סדר (FK constraints)
  await db.from('social_tokens').delete().eq('user_id', userId)
  await db.from('token_ledger').delete().eq('user_id', userId)
  await db.from('transactions').delete().eq('user_id', userId)
  await db.from('scheduler').delete().eq('user_id', userId)
  await db.from('image_usage_log').delete().eq('user_id', userId)
  await db.from('saved_ideas').delete().eq('user_id', userId)
  await db.from('notifications').delete().eq('user_id', userId)
  await db.from('push_subscriptions').delete().eq('user_id', userId)
  await db.from('blackout_periods').delete().eq('user_id', userId)
  // business_profiles לפני users — users.active_business_id מפנה אליה (set null)
  await db.from('business_profiles').delete().eq('user_id', userId)
  await db.from('users').delete().eq('id', userId)

  // מחיקת ה-auth user עצמו
  const { error } = await db.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
