import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// GET /api/social/oauth/linkedin
// Redirects the user to LinkedIn's OAuth consent screen.
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const clientId  = process.env.LINKEDIN_CLIENT_ID!
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectUri = `${siteUrl}/api/social/oauth/linkedin/callback`

  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64url')

  const url = new URL('https://www.linkedin.com/oauth/v2/authorization')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id',     clientId)
  url.searchParams.set('redirect_uri',  redirectUri)
  // openid + profile = get person URN; w_member_social = post on behalf of member
  url.searchParams.set('scope',         'openid profile w_member_social')
  url.searchParams.set('state',         state)

  return NextResponse.redirect(url.toString())
}
