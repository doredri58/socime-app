import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { encrypt } from '@/lib/crypto'

// GET /api/social/oauth/tiktok/callback
// TikTok redirects here with ?code=... after user grants permissions.
export async function GET(req: NextRequest) {
  const siteUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectUri = `${siteUrl}/api/social/oauth/tiktok/callback`
  const { searchParams } = new URL(req.url)

  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${siteUrl}/dashboard/social?error=tiktok_denied`)
  }

  let userId: string
  let codeVerifier: string
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = parsed.userId
    codeVerifier = parsed.codeVerifier
  } catch {
    return NextResponse.redirect(`${siteUrl}/dashboard/social?error=invalid_state`)
  }

  try {
    // Step 1: Exchange code for access token (PKCE)
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key:    process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  redirectUri,
        code_verifier: codeVerifier,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description ?? 'Failed to get TikTok token')
    }
    const accessToken: string = tokenData.access_token
    const expiresIn:   number = tokenData.expires_in ?? 86400
    const openId:      string = tokenData.open_id ?? ''

    // Step 2: Get the user's display name
    const profileRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profileData = await profileRes.json()
    const name = profileData?.data?.user?.display_name ?? ''

    const db = createServiceClient()
    await db.from('social_tokens').upsert({
      user_id:               userId,
      platform:              'tiktok',
      encrypted_oauth_token: encrypt(accessToken),
      scopes:                ['user.info.basic', 'video.publish'],
      expires_at:            new Date(Date.now() + expiresIn * 1000).toISOString(),
      extra_data:            { open_id: openId, name },
    }, { onConflict: 'user_id,platform' })

    return NextResponse.redirect(`${siteUrl}/dashboard/social?connected=tiktok`)
  } catch (err) {
    console.error('[tiktok/callback]', err)
    return NextResponse.redirect(`${siteUrl}/dashboard/social?error=tiktok_failed`)
  }
}
