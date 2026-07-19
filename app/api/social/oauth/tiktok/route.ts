import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase'

// GET /api/social/oauth/tiktok
// Redirects the user to TikTok's OAuth consent screen (PKCE required by TikTok's v2 API).
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const clientKey    = process.env.TIKTOK_CLIENT_KEY!
  const siteUrl      = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectUri  = `${siteUrl}/api/social/oauth/tiktok/callback`

  const codeVerifier  = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  // CSRF: random state nonce validated on callback via an httpOnly cookie.
  // The PKCE verifier is kept server-side in an httpOnly cookie (never in the
  // URL/state), and userId is derived from the session on callback.
  const state = crypto.randomBytes(32).toString('base64url')

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key',            clientKey)
  url.searchParams.set('response_type',         'code')
  url.searchParams.set('redirect_uri',          redirectUri)
  // user.info.basic = display name; video.publish = post videos on the user's behalf
  url.searchParams.set('scope',                 'user.info.basic,video.publish')
  url.searchParams.set('state',                 state)
  url.searchParams.set('code_challenge',        codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  const res = NextResponse.redirect(url.toString())
  const cookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path:     '/',
    maxAge:   600,
  }
  res.cookies.set('tiktok_oauth_state', state, cookieOpts)
  res.cookies.set('tiktok_code_verifier', codeVerifier, cookieOpts)
  return res
}
