import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { text, category } = await req.json()
  if (!text) return NextResponse.json({ error: 'חסר טקסט' }, { status: 400 })

  const db = createServiceClient()
  const { data: idea, error } = await db
    .from('saved_ideas')
    .insert({ user_id: user.id, idea_text: text, category: category ?? null, liked: true })
    .select('id, idea_text, category, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ idea: { id: idea.id, text: idea.idea_text, category: idea.category } })
}
