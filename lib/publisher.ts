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
}

// פרסום ל-Facebook / Instagram דרך Meta Graph API
export async function publishToMeta(
  row: SchedulerRow,
  token: string
): Promise<{ success: boolean; meta_post_id?: string; error?: string }> {
  const text = row.content_text ?? row.caption ?? ''
  const pageId = process.env.META_PAGE_ID

  if (!pageId) return { success: false, error: 'META_PAGE_ID חסר' }

  try {
    if (row.platform === 'facebook') {
      const body: Record<string, string> = { message: text, access_token: token }
      if (row.payload_url && row.content_type === 'image') body.link = row.payload_url

      const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error?.message ?? 'שגיאת Meta' }
      return { success: true, meta_post_id: data.id }

    } else if (row.platform === 'instagram') {
      const igAccountId = process.env.META_IG_ACCOUNT_ID
      if (!igAccountId) return { success: false, error: 'META_IG_ACCOUNT_ID חסר' }

      if (!row.payload_url) return { success: false, error: 'Instagram דורש תמונה/וידאו' }

      // שלב 1: יצירת container
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: row.payload_url,
          caption: text,
          access_token: token,
        }),
      })
      const container = await containerRes.json()
      if (!containerRes.ok) return { success: false, error: container.error?.message ?? 'שגיאת container' }

      // שלב 2: פרסום
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish`, {
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

export async function processDuePost(row: SchedulerRow): Promise<{ success: boolean; error?: string }> {
  const db = createServiceClient()

  // שליפת token מוצפן
  const { data: tokenRow } = await db
    .from('social_tokens')
    .select('encrypted_oauth_token')
    .eq('user_id', row.user_id)
    .eq('platform', row.platform)
    .single()

  if (!tokenRow) {
    return { success: false, error: `אין token מחובר ל-${row.platform}` }
  }

  let oauthToken: string
  try {
    oauthToken = decrypt(tokenRow.encrypted_oauth_token)
  } catch {
    return { success: false, error: 'שגיאת פענוח token' }
  }

  const result = await publishToMeta(row, oauthToken)

  // עדכון סטטוס בטבלה
  await db.from('scheduler').update({
    status:        result.success ? 'published' : 'failed',
    published_at:  result.success ? new Date().toISOString() : null,
    meta_post_id:  result.meta_post_id ?? null,
  }).eq('id', row.id)

  return result
}
