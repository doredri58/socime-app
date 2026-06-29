import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const GRAPH_BASE = 'https://graph.facebook.com/v19.0'

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { commentId, pageId: _pageId, pageAccessToken, message, platform: _platform } =
    await req.json() as {
      commentId: string
      pageId: string
      pageAccessToken: string
      message: string
      platform: 'facebook' | 'instagram'
    }

  if (!commentId || !pageAccessToken || !message) {
    return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 })
  }

  // 2. POST reply to Graph API
  const res = await fetch(`${GRAPH_BASE}/${commentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: pageAccessToken }),
  })

  const data = await res.json()

  if (!res.ok) {
    const err = data?.error
    if (res.status === 401 || err?.code === 190) {
      return NextResponse.json({ error: 'token_expired', platform: 'facebook' }, { status: 401 })
    }
    if (res.status === 429) {
      return NextResponse.json({ error: 'rate_limit' }, { status: 429 })
    }
    return NextResponse.json({ error: err?.message ?? 'Graph API error' }, { status: res.status })
  }

  return NextResponse.json({ success: true, id: data.id as string })
}
