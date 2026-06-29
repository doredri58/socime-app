import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { createServerSupabaseClient } from '@/lib/supabase'
import { deductTokens } from '@/lib/tokens'

export const runtime = 'nodejs'

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
})

interface RenderOptions {
  smartTrim?: boolean
  subtitleSrtUrl?: string
  musicTrack?: string
  subtitleStyle?: string
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { public_id?: string; options?: RenderOptions }
  const { public_id, options = {} } = body

  if (!public_id) {
    return NextResponse.json({ error: 'public_id required' }, { status: 400 })
  }

  // Build transformation chain
  type TransformationItem = {
    effect?: string
    overlay?: string
    flags?: string
    format?: string
    quality?: string | number
  }

  const transformations: TransformationItem[] = []

  // Smart trim: AI content-aware trim
  if (options.smartTrim) {
    transformations.push({ effect: 'trim' })
  }

  // Music overlay (placeholder — Cloudinary built-in sample)
  if (options.musicTrack) {
    transformations.push({
      overlay: 'video:sample',
      flags: 'splice',
    })
    // TODO: replace 'video:sample' with an actual uploaded music track public_id
  }

  // Output format
  transformations.push({ format: 'mp4', quality: 'auto' })

  // Generate URL using Cloudinary SDK
  const output_url = cloudinary.url(public_id, {
    resource_type: 'video',
    transformation: transformations,
    sign_url: true,
  })

  // Deduct render tokens
  await deductTokens(user.id, 'video_render')

  return NextResponse.json({ output_url })
}
