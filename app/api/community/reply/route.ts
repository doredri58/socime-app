import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'

const GRAPH_BASE = 'https://graph.facebook.com/v19.0'

// POST — מגיב לתגובה בפייסבוק/אינסטגרם.
// אבטחה: לא סומכים על page-token מהקליינט (היה חשוף בעבר). הטוקן נגזר בשרת
// מהטוקן השמור של המשתמש, ותוך כדי מאומתת בעלות על הדף (pageId חייב להשתייך
// לדפים שהמשתמש מנהל, אחרת 403).
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { commentId, pageId, message, platform } = await req.json() as {
    commentId: string
    pageId: string
    message: string
    platform: 'facebook' | 'instagram'
  }

  if (!commentId || !pageId || !message?.trim()) {
    return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 })
  }

  // הטוקן השמור (המוצפן) של המשתמש
  const db = createServiceClient()
  const { data: tokenRow } = await db
    .from('social_tokens')
    .select('encrypted_oauth_token')
    .eq('user_id', user.id)
    .eq('platform', 'facebook')
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'לא מחובר ל-Facebook' }, { status: 401 })

  let userToken: string
  try {
    userToken = decrypt(tokenRow.encrypted_oauth_token)
  } catch {
    return NextResponse.json({ error: 'token_expired', platform: 'facebook' }, { status: 401 })
  }

  // שלוף את הדפים שהמשתמש מנהל וגזור את ה-page token בשרת + אמת בעלות.
  const pagesRes = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,access_token,instagram_business_account{id}&access_token=${userToken}`
  )
  const pagesData = await pagesRes.json() as {
    data?: Array<{ id: string; access_token: string; instagram_business_account?: { id: string } }>
    error?: { message?: string; code?: number }
  }
  if (!pagesRes.ok) {
    const err = pagesData.error
    if (pagesRes.status === 401 || err?.code === 190) {
      return NextResponse.json({ error: 'token_expired', platform: 'facebook' }, { status: 401 })
    }
    return NextResponse.json({ error: err?.message ?? 'Graph API error' }, { status: pagesRes.status })
  }

  const page = (pagesData.data ?? []).find(
    p => p.id === pageId || p.instagram_business_account?.id === pageId
  )
  if (!page) return NextResponse.json({ error: 'אין הרשאה לדף זה' }, { status: 403 })

  // Facebook: תגובה דרך /{commentId}/comments · Instagram: דרך /{commentId}/replies
  const endpoint = platform === 'instagram' ? 'replies' : 'comments'
  const res = await fetch(`${GRAPH_BASE}/${commentId}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: page.access_token }),
  })

  const data = await res.json()
  if (!res.ok) {
    const err = data?.error
    if (res.status === 401 || err?.code === 190) {
      return NextResponse.json({ error: 'token_expired', platform }, { status: 401 })
    }
    if (res.status === 429) {
      return NextResponse.json({ error: 'rate_limit' }, { status: 429 })
    }
    return NextResponse.json({ error: err?.message ?? 'Graph API error' }, { status: res.status })
  }

  return NextResponse.json({ success: true, id: data.id as string })
}
