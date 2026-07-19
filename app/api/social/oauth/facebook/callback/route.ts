import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { encrypt } from '@/lib/crypto'

const BASE = 'https://graph.facebook.com/v19.0'

// GET /api/social/oauth/facebook/callback
// Facebook redirects here with ?code=... after user grants permissions.
export async function GET(req: NextRequest) {
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectUri = `${siteUrl}/api/social/oauth/facebook/callback`
  const { searchParams } = new URL(req.url)

  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // CSRF: the state param must match the nonce we stored in the httpOnly cookie.
  const cookieState = req.cookies.get('fb_oauth_state')?.value
  if (error || !code || !state || !cookieState || state !== cookieState) {
    const res = NextResponse.redirect(`${siteUrl}/dashboard/social?error=facebook_denied`)
    res.cookies.delete('fb_oauth_state')
    return res
  }

  // userId comes from the authenticated session, never from the state param.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const res = NextResponse.redirect(`${siteUrl}/login`)
    res.cookies.delete('fb_oauth_state')
    return res
  }
  const userId = user.id

  try {
    // Step 1: Exchange code for short-lived user access token
    const tokenRes = await fetch(
      `${BASE}/oauth/access_token?` + new URLSearchParams({
        client_id:     process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri:  redirectUri,
        code,
      })
    )
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('[facebook/callback] Short-lived token exchange failed. Response:', JSON.stringify(tokenData, null, 2))
      throw new Error(tokenData.error?.message ?? 'Failed to get short-lived token')
    }
    const shortToken: string = tokenData.access_token

    // Step 2: Exchange for long-lived token (60-day expiry)
    const longRes = await fetch(
      `${BASE}/oauth/access_token?` + new URLSearchParams({
        grant_type:        'fb_exchange_token',
        client_id:         process.env.META_APP_ID!,
        client_secret:     process.env.META_APP_SECRET!,
        fb_exchange_token: shortToken,
      })
    )
    const longData = await longRes.json()
    if (!longRes.ok) {
      console.error('[facebook/callback] Long-lived token exchange failed. Response:', JSON.stringify(longData, null, 2))
    }
    const longToken: string = longData.access_token ?? shortToken
    const expiresIn: number = longData.expires_in ?? 5184000 // 60 days default

    // Step 3: Get the managed pages and pick the first one
    const pagesRes = await fetch(
      `${BASE}/me/accounts?access_token=${longToken}&fields=id,name,access_token`
    )
    const pagesData = await pagesRes.json()
    if (!pagesRes.ok) {
      console.error('[facebook/callback] Get pages failed. Status:', pagesRes.status, 'Response:', JSON.stringify(pagesData, null, 2))
      throw new Error(pagesData.error?.message ?? 'Failed to get pages')
    }
    const page = pagesData.data?.[0]
    if (!page) {
      console.warn('[facebook/callback] User has no Facebook Pages or didn\'t grant access to any page.')
    }

    // Use page token if available (never expires), else use long-lived user token
    const finalToken: string = page?.access_token ?? longToken
    const pageId: string | undefined = page?.id

    const db = createServiceClient()
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Store Facebook token
    await db.from('social_tokens').upsert({
      user_id:               userId,
      platform:              'facebook',
      encrypted_oauth_token: encrypt(finalToken),
      scopes:                ['pages_manage_posts', 'pages_read_engagement'],
      expires_at:            page ? null : expiresAt, // page tokens don't expire
      extra_data:            pageId ? { page_id: pageId, page_name: page.name } : null,
    }, { onConflict: 'user_id,platform' })

    // If we have IG account linked to this page, fetch and store Instagram token too
    if (pageId) {
      const igRes = await fetch(
        `${BASE}/${pageId}?fields=instagram_business_account&access_token=${finalToken}`
      )
      const igData = await igRes.json()
      if (!igRes.ok) {
        console.error('[facebook/callback] Instagram lookup failed. Status:', igRes.status, 'Response:', JSON.stringify(igData, null, 2))
      }
      const igId = igData.instagram_business_account?.id

      if (igId) {
        await db.from('social_tokens').upsert({
          user_id:               userId,
          platform:              'instagram',
          encrypted_oauth_token: encrypt(finalToken),
          scopes:                ['instagram_basic', 'instagram_content_publish'],
          expires_at:            null,
          extra_data:            { ig_account_id: igId, page_id: pageId },
        }, { onConflict: 'user_id,platform' })
      } else {
        console.warn('[facebook/callback] Page does not have a linked Instagram Business Account. Page ID:', pageId)
      }
    }

    const res = NextResponse.redirect(`${siteUrl}/dashboard/social?connected=facebook`)
    res.cookies.delete('fb_oauth_state')
    return res
  } catch (err) {
    console.error('[facebook/callback]', err)
    const res = NextResponse.redirect(`${siteUrl}/dashboard/social?error=facebook_failed`)
    res.cookies.delete('fb_oauth_state')
    return res
  }
}
