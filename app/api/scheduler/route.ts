import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

// GET /api/scheduler — list user's posts
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const db = createServiceClient()
  const { data, error } = await db
    .from('scheduler')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data })
}

// POST /api/scheduler — create a new draft
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const { contentText, hashtags, platform, scheduledAt } = await req.json()

  const db = createServiceClient()
  const { data, error } = await db.from('scheduler').insert({
    user_id: user.id,
    content_text: contentText,
    hashtags,
    platform: platform ?? ['facebook'],
    status: scheduledAt ? 'scheduled' : 'draft',
    scheduled_at: scheduledAt ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
