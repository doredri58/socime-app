import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { encrypt } from '@/lib/crypto'

// GET /api/social/oauth/linkedin/callback
// LinkedIn redirects here with ?code=... after user grants permissions.
export async function GET(req: NextRequest) {
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectUri = `${siteUrl}/api/social/oauth/linkedin/callback`
  const { searchParams } = new URL(req.url)

  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${siteUrl}/dashboard/settings?tab=social&error=linkedin_denied`)
  }

  let userId: string
  try {
    userId = JSON.parse(Buffer.from(state, 'base64url').toString()).userId
  } catch {
    return NextResponse.redirect(`${siteUrl}/dashboard/settings?tab=social&error=invalid_state`)
  }

  try {
    // Step 1: Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description ?? 'Failed to get LinkedIn token')
    }
    const accessToken: string = tokenData.access_token
    const expiresIn:   number = tokenData.expires_in ?? 5184000

    // Step 2: Get the member's person URN (needed to post on their behalf)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profile = await profileRes.json()

    // sub = the member ID, used to build the URN
    const memberId  = profile.sub as string
    const personUrn = `urn:li:person:${memberId}`
    const name      = [profile.given_name, profile.family_name].filter(Boolean).join(' ')

    const db = createServiceClient()
    await db.from('social_tokens').upsert({
      user_id:               userId,
      platform:              'linkedin',
      encrypted_oauth_token: encrypt(accessToken),
      scopes:                ['openid', 'profile', 'w_member_social'],
      expires_at:            new Date(Date.now() + expiresIn * 1000).toISOString(),
      extra_data:            { person_urn: personUrn, name },
    }, { onConflict: 'user_id,platform' })

    return NextResponse.redirect(`${siteUrl}/dashboard/settings?tab=social&connected=linkedin`)
  } catch (err) {
    console.error('[linkedin/callback]', err)
    return NextResponse.redirect(`${siteUrl}/dashboard/settings?tab=social&error=linkedin_failed`)
  }
}
