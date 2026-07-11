import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'

const GRAPH_BASE = 'https://graph.facebook.com/v19.0'

export interface CommentItem {
  id: string
  platform: 'facebook' | 'instagram'
  type: 'comment' | 'message'
  author: string
  text: string
  postPreview: string
  timestamp: string
  pageId: string
}

interface GraphComment {
  id: string
  message: string
  from?: { name: string; id: string }
  created_time: string
}

interface GraphFeedItem {
  id: string
  message?: string
  comments?: { data: GraphComment[] }
}

interface GraphPage {
  id: string
  name: string
  access_token: string
}

async function graphGet<T>(path: string, token: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`${GRAPH_BASE}${path}${sep}access_token=${token}`)
  const json = await res.json()
  if (!res.ok) {
    const err = json?.error
    if (res.status === 401 || err?.code === 190) {
      const e = new Error(err?.message ?? 'Token expired')
      ;(e as Error & { tokenExpired?: boolean }).tokenExpired = true
      throw e
    }
    if (res.status === 429) {
      const e = new Error('rate_limit')
      ;(e as Error & { rateLimit?: boolean }).rateLimit = true
      throw e
    }
    throw new Error(err?.message ?? `Graph API error ${res.status}`)
  }
  return json as T
}

export async function GET() {
  // 1. Auth
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  // 2. Fetch stored social tokens
  const db = createServiceClient()
  const { data: tokens } = await db
    .from('social_tokens')
    .select('platform, encrypted_oauth_token, expires_at')
    .eq('user_id', user.id)
    .in('platform', ['facebook', 'instagram'])

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ items: [], connected: false })
  }

  const fbRow = tokens.find((t: { platform: string }) => t.platform === 'facebook')
  const igRow = tokens.find((t: { platform: string }) => t.platform === 'instagram')

  if (!fbRow) {
    return NextResponse.json({ items: [], connected: false })
  }

  // 3. Decrypt user access token
  let userToken: string
  try {
    userToken = decrypt(fbRow.encrypted_oauth_token)
  } catch {
    return NextResponse.json({ error: 'token_expired', platform: 'facebook' }, { status: 401 })
  }

  const items: CommentItem[] = []

  try {
    // 4a. Get pages the user manages
    const pagesData = await graphGet<{ data: GraphPage[] }>(
      '/me/accounts?fields=id,name,access_token',
      userToken
    )
    const pages: GraphPage[] = pagesData.data ?? []

    // 4b. For each page, fetch recent feed with comments
    for (const page of pages) {
      let feedData: { data: GraphFeedItem[] }
      try {
        feedData = await graphGet<{ data: GraphFeedItem[] }>(
          `/${page.id}/feed?fields=id,message,comments{id,message,from,created_time}&limit=10`,
          page.access_token
        )
      } catch {
        // skip this page if error (e.g. insufficient permissions)
        continue
      }

      for (const post of feedData.data ?? []) {
        for (const comment of post.comments?.data ?? []) {
          items.push({
            id: comment.id,
            platform: 'facebook',
            type: 'comment',
            author: comment.from?.name ?? 'אנונימי',
            text: comment.message,
            postPreview: post.message ?? '',
            timestamp: comment.created_time,
            pageId: page.id,
          })
        }
      }
    }

    // 4c. Instagram comments (if connected and IG account linked to a page)
    if (igRow) {
      let igToken: string
      try {
        igToken = decrypt(igRow.encrypted_oauth_token)
      } catch {
        igToken = userToken
      }

      try {
        const igAccounts = await graphGet<{
          data: Array<{ id: string; instagram_business_account?: { id: string } }>
        }>(
          '/me/accounts?fields=id,instagram_business_account',
          igToken
        )
        for (const acct of igAccounts.data ?? []) {
          const igId = acct.instagram_business_account?.id
          if (!igId) continue

          let igMedia: {
            data: Array<{
              id: string
              caption?: string
              comments?: { data: Array<{ id: string; text: string; username: string; timestamp: string }> }
            }>
          }
          try {
            igMedia = await graphGet(
              `/${igId}/media?fields=id,caption,comments{id,text,username,timestamp}&limit=10`,
              igToken
            )
          } catch {
            continue
          }

          for (const media of igMedia.data ?? []) {
            for (const c of media.comments?.data ?? []) {
              items.push({
                id: c.id,
                platform: 'instagram',
                type: 'comment',
                author: c.username ?? 'אנונימי',
                text: c.text,
                postPreview: media.caption ?? '',
                timestamp: c.timestamp,
                pageId: igId,
              })
            }
          }
        }
      } catch {
        // IG fetch failed — continue without IG data
      }
    }
  } catch (err) {
    const e = err as Error & { tokenExpired?: boolean; rateLimit?: boolean }
    if (e.tokenExpired) {
      return NextResponse.json({ error: 'token_expired', platform: 'facebook' }, { status: 401 })
    }
    if (e.rateLimit) {
      return NextResponse.json({ error: 'rate_limit' }, { status: 429 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  // Sort newest first
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({ items, connected: true })
}
