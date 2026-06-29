import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { createServerSupabaseClient } from '@/lib/supabase'

export const runtime = 'nodejs'

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
})

export async function POST(_req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = `socime-videos/${user.id}`

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
    resource_type: 'video',
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!)

  return NextResponse.json({
    signature,
    timestamp,
    api_key:     process.env.CLOUDINARY_API_KEY,
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  })
}
