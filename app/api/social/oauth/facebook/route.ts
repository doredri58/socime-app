import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// GET /api/social/oauth/facebook
// Redirects the user to Facebook's OAuth dialog.
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const appId      = process.env.META_APP_ID!
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const redirectUri = `${siteUrl}/api/social/oauth/facebook/callback`

  // Scopes needed: manage pages + Instagram content publish
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
  ].join(',')

  // Pass userId in state so callback knows who to associate the token with
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64url')

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  url.searchParams.set('client_id',     appId)
  url.searchParams.set('redirect_uri',  redirectUri)
  url.searchParams.set('scope',         scopes)
  url.searchParams.set('state',         state)
  url.searchParams.set('response_type', 'code')

  return NextResponse.redirect(url.toString())
}
