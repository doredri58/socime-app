import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from('saved_ideas')
    .select('id, idea_text, category')
    .eq('user_id', user.id)
    .eq('liked', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const ideas = (data ?? []).map(r => ({ id: r.id, text: r.idea_text, category: r.category }))
  return NextResponse.json({ ideas })
}
