import 'server-only'
import { decrypt } from './crypto'
import { createServiceClient } from './supabase'

export interface SchedulerRow {
  id: string
  user_id: string
  content_text: string | null
  caption: string | null
  platform: string
  payload_url: string | null
  content_type: string
  source: string
  attempt_count?: number
}

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 5 * 60 * 1000  // 5 minutes

// ── Facebook / Instagram ───────────────────────────────────────────────────

export async function publishToMeta(
  row: SchedulerRow,
  token: string
): Promise<{ success: boolean; meta_post_id?: string; error?: string }> {
  const text   = row.content_text ?? row.caption ?? ''
  const pageId = process.env.META_PAGE_ID
  const base   = 'https://graph.facebook.com/v19.0'

  if (!pageId) return { success: false, error: 'META_PAGE_ID חסר בסביבה' }

  try {
    if (row.platform === 'facebook') {
      const body: Record<string, string> = { message: text, access_token: token }
      if (row.payload_url && row.content_type === 'image') body.link = row.payload_url

      const res  = await fetch(`${base}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error?.message ?? 'שגיאת Meta' }
      return { success: true, meta_post_id: data.id }

    } else if (row.platform === 'instagram') {
      const igId = process.env.META_IG_ACCOUNT_ID
      if (!igId) return { success: false, error: 'META_IG_ACCOUNT_ID חסר בסביבה' }
      if (!row.payload_url) return { success: false, error: 'Instagram דורש URL של תמונה/וידאו' }

      // Step 1: create media container
      const containerRes = await fetch(`${base}/${igId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: row.payload_url, caption: text, access_token: token }),
      })
      const container = await containerRes.json()
      if (!containerRes.ok) return { success: false, error: container.error?.message ?? 'שגיאת container' }

      // Step 2: publish container
      const publishRes = await fetch(`${base}/${igId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: container.id, access_token: token }),
      })
      const published = await publishRes.json()
      if (!publishRes.ok) return { success: false, error: published.error?.message ?? 'שגיאת פרסום' }
      return { success: true, meta_post_id: published.id }
    }

    return { success: false, error: `פלטפורמה לא נתמכת: ${row.platform}` }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'שגיאה לא ידועה' }
  }
}

// ── TikTok ─────────────────────────────────────────────────────────────────

export async function publishToTikTok(
  row: SchedulerRow,
  token: string
): Promise<{ success: boolean; meta_post_id?: string; error?: string }> {
  const text = row.content_text ?? row.caption ?? ''

  if (!row.payload_url || row.content_type !== 'video') {
    return { success: false, error: 'TikTok דורש קובץ וידאו' }
  }

  try {
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: text,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: row.payload_url,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok || data.error?.code !== 'ok') {
      const msg = data.error?.message ?? 'שגיאת TikTok'
      return { success: false, error: String(msg) }
    }

    return { success: true, meta_post_id: data.data?.publish_id }
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'שגיאה לא ידועה' }
  }
}

// ── Main processor — called by /api/cron/process ───────────────────────────

export async function processDuePost(
  row: SchedulerRow
): Promise<{ success: boolean; error?: string }> {
  const db          = createServiceClient()
  const attemptNum  = (row.attempt_count ?? 0) + 1

  // Fetch the user's encrypted OAuth token for this platform
  const { data: tokenRow } = await db
    .from('social_tokens')
    .select('encrypted_oauth_token, extra_data')
    .eq('user_id', row.user_id)
    .eq('platform', row.platform)
    .single()

  if (!tokenRow) {
    await markFailed(db, row.id, `אין token מחובר ל-${row.platform}`, attemptNum)
    return { success: false, error: `אין token מחובר ל-${row.platform}` }
  }

  let oauthToken: string
  try {
    oauthToken = decrypt(tokenRow.encrypted_oauth_token)
  } catch {
    await markFailed(db, row.id, 'שגיאת פענוח token', attemptNum)
    return { success: false, error: 'שגיאת פענוח token' }
  }

  let result: { success: boolean; meta_post_id?: string; error?: string }

  if (row.platform === 'tiktok') {
    result = await publishToTikTok(row, oauthToken)
  } else {
    result = await publishToMeta(row, oauthToken)
  }

  if (result.success) {
    // Mark as published
    await db.from('scheduler').update({
      status:        'published',
      published_at:  new Date().toISOString(),
      meta_post_id:  result.meta_post_id ?? null,
      error_message: null,
      attempt_count: attemptNum,
    }).eq('id', row.id)
  } else {
    await handleFailure(db, row.id, result.error ?? 'שגיאה לא ידועה', attemptNum)
  }

  return result
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function handleFailure(
  db: ReturnType<typeof createServiceClient>,
  id: string,
  error: string,
  attemptNum: number
) {
  if (attemptNum < MAX_ATTEMPTS) {
    // Schedule retry — exponential back-off: 5m, 10m, 20m
    const delayMs    = RETRY_DELAY_MS * Math.pow(2, attemptNum - 1)
    const retryAt    = new Date(Date.now() + delayMs).toISOString()
    await db.from('scheduler').update({
      status:        'queued',  // back to queued so cron picks it up
      scheduled_at:  retryAt,
      error_message: `ניסיון ${attemptNum} נכשל: ${error}`,
      attempt_count: attemptNum,
      next_retry_at: retryAt,
    }).eq('id', id)
  } else {
    await markFailed(db, id, `נכשל לאחר ${MAX_ATTEMPTS} ניסיונות: ${error}`, attemptNum)
  }
}

async function markFailed(
  db: ReturnType<typeof createServiceClient>,
  id: string,
  error: string,
  attemptNum: number
) {
  await db.from('scheduler').update({
    status:        'failed',
    error_message: error,
    attempt_count: attemptNum,
    next_retry_at: null,
  }).eq('id', id)
}
