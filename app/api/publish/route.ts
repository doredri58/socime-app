import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'
import { publishToMeta, publishToTikTok } from '@/lib/publisher'

// POST /api/publish
// Immediate (non-scheduled) publish to one or more platforms.
// Body: { postId?: string, text: string, platforms: string[], imageUrl?: string }
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { postId, text, platforms, imageUrl } = await req.json() as {
    postId?: string
    text: string
    platforms: string[]
    imageUrl?: string
  }

  if (!text?.trim())      return NextResponse.json({ error: 'אין תוכן לפרסום' }, { status: 400 })
  if (!platforms?.length) return NextResponse.json({ error: 'לא נבחרה פלטפורמה' }, { status: 400 })

  const db = createServiceClient()

  // Fetch all connected tokens for this user in one query
  const { data: tokens } = await db
    .from('social_tokens')
    .select('platform, encrypted_oauth_token, extra_data')
    .eq('user_id', user.id)
    .in('platform', platforms)

  const tokenMap = Object.fromEntries(
    (tokens ?? []).map(t => [t.platform, t])
  )

  const results: Record<string, { success: boolean; postId?: string; error?: string }> = {}

  for (const platform of platforms) {
    const tokenRow = tokenMap[platform]

    if (!tokenRow) {
      results[platform] = { success: false, error: `לא מחובר ל-${platform}` }
      continue
    }

    let oauthToken: string
    try {
      oauthToken = decrypt(tokenRow.encrypted_oauth_token)
    } catch {
      results[platform] = { success: false, error: 'שגיאת פענוח token' }
      continue
    }

    // Build a minimal SchedulerRow for the publisher functions
    const row = {
      id:           postId ?? 'immediate',
      user_id:      user.id,
      content_text: text,
      caption:      text,
      platform,
      payload_url:  imageUrl ?? null,
      content_type: imageUrl ? 'image' : 'text',
      source:       'generated',
    }

    let result: { success: boolean; meta_post_id?: string; error?: string }

    if (platform === 'tiktok') {
      result = await publishToTikTok(row, oauthToken)
    } else {
      // מזהי הדף/IG שהמשתמש חיבר ב-OAuth — כדי לפרסם לחשבון שלו ולא לדף המערכת
      const extra = (tokenRow.extra_data ?? {}) as { page_id?: string; ig_account_id?: string }
      result = await publishToMeta(row, oauthToken, { pageId: extra.page_id, igId: extra.ig_account_id })
    }

    results[platform] = { success: result.success, postId: result.meta_post_id, error: result.error }
  }

  // If a postId was provided, update the scheduler row with the outcome
  if (postId) {
    const anySuccess  = Object.values(results).some(r => r.success)
    const allSuccess  = Object.values(results).every(r => r.success)
    const errorMsgs   = Object.entries(results)
      .filter(([, r]) => !r.success)
      .map(([p, r]) => `${p}: ${r.error}`)
      .join(' | ')
    const postIds     = Object.values(results)
      .filter(r => r.postId)
      .map(r => r.postId)
      .join(',')

    await db.from('scheduler').update({
      status:        allSuccess ? 'published' : anySuccess ? 'published' : 'failed',
      published_at:  anySuccess ? new Date().toISOString() : null,
      meta_post_id:  postIds || null,
      error_message: errorMsgs || null,
    }).eq('id', postId).eq('user_id', user.id)
  }

  const hasErrors = Object.values(results).some(r => !r.success)
  return NextResponse.json(
    { results },
    { status: hasErrors ? 207 : 200 }
  )
}
