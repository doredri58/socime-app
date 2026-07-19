import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase'

// GET /api/social/oauth/facebook
// Redirects the user to Facebook's OAuth dialog.
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const appId      = process.env.META_APP_ID!
  const configId   = process.env.META_CONFIG_ID
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectUri = `${siteUrl}/api/social/oauth/facebook/callback`

  // CSRF: random state nonce stored in an httpOnly cookie and validated on
  // callback. userId is NOT carried in state — the callback derives it from the
  // authenticated session, so a forged state can't bind a token to another user.
  const state = crypto.randomBytes(32).toString('base64url')

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id',     appId)
  url.searchParams.set('redirect_uri',  redirectUri)
  url.searchParams.set('state',         state)
  url.searchParams.set('response_type', 'code')

  if (configId) {
    url.searchParams.set('config_id', configId)
    url.searchParams.set('override_default_response_type', 'true')
  } else {
    // Scopes needed for classic OAuth flow
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',')
    url.searchParams.set('scope', scopes)
  }

  const res = NextResponse.redirect(url.toString())
  res.cookies.set('fb_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',   // sent on the top-level GET redirect back from Facebook
    path:     '/',
    maxAge:   600,     // 10 minutes
  })
  return res
}
