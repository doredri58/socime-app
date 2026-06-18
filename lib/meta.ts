const BASE = 'https://graph.facebook.com/v19.0'
const TOKEN = process.env.META_ACCESS_TOKEN!
const PAGE_ID = process.env.META_PAGE_ID!
const IG_ID = process.env.META_IG_ACCOUNT_ID!

export async function publishToFacebook(text: string) {
  const res = await fetch(`${BASE}/${PAGE_ID}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, access_token: TOKEN }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Meta Facebook error')
  return data.id as string
}

export async function publishToInstagram(text: string) {
  // Step 1: create media container
  const createRes = await fetch(`${BASE}/${IG_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption: text, media_type: 'TEXT', access_token: TOKEN }),
  })
  const created = await createRes.json()
  if (!createRes.ok) throw new Error(created.error?.message ?? 'Meta IG create error')

  // Step 2: publish container
  const publishRes = await fetch(`${BASE}/${IG_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: created.id, access_token: TOKEN }),
  })
  const published = await publishRes.json()
  if (!publishRes.ok) throw new Error(published.error?.message ?? 'Meta IG publish error')
  return published.id as string
}
