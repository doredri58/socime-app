import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { publishToFacebook, publishToInstagram } from '@/lib/meta'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const { postId, text, platform } = await req.json() as {
    postId: string
    text: string
    platform: string[]
  }

  const db = createServiceClient()
  const results: Record<string, string> = {}
  const errors: string[] = []

  if (platform.includes('facebook')) {
    try {
      results.facebook = await publishToFacebook(text)
    } catch (e) {
      errors.push(`Facebook: ${(e as Error).message}`)
    }
  }

  if (platform.includes('instagram')) {
    try {
      results.instagram = await publishToInstagram(text)
    } catch (e) {
      errors.push(`Instagram: ${(e as Error).message}`)
    }
  }

  const status = errors.length === 0 ? 'published' : 'failed'
  const metaPostId = Object.values(results).join(',') || null

  await db.from('scheduler').update({
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
    meta_post_id: metaPostId,
    error_message: errors.join(' | ') || null,
  }).eq('id', postId).eq('user_id', user.id)

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(' | '), results }, { status: 207 })
  }

  return NextResponse.json({ success: true, results })
}
