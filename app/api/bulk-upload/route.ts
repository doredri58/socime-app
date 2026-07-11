import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'שגיאה בקריאת הנתונים' }, { status: 400 })
  }

  const files = formData.getAll('files') as File[]
  const captionsRaw = formData.get('captions') as string | null
  let captions: string[] = []
  try { captions = captionsRaw ? JSON.parse(captionsRaw) : [] } catch { /* ignore */ }

  if (!files.length) return NextResponse.json({ error: 'לא נבחרו קבצים' }, { status: 400 })
  if (files.length > 20) return NextResponse.json({ error: 'מקסימום 20 קבצים בבת אחת' }, { status: 400 })

  const db = createServiceClient()
  const results: Array<{ name: string; id?: string; url?: string; error?: string }> = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const caption = captions[i] ?? ''
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${Date.now()}_${i}_${safeName}`

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await db.storage
      .from('user-media')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      results.push({ name: file.name, error: uploadError.message })
      continue
    }

    const { data: { publicUrl } } = db.storage.from('user-media').getPublicUrl(path)
    const contentType = file.type.startsWith('video/') ? 'video' : 'image'

    const { data: row, error: dbError } = await db
      .from('scheduler')
      .insert({
        user_id:      user.id,
        content_text: caption,
        content_type: contentType,
        source:       'uploaded',
        payload_url:  publicUrl,
        caption,
        platform:     ['instagram'],
        // 'pending' אינו ערך חוקי ב-CHECK constraint → כל insert נכשל.
        // קובץ שהועלה אך טרם תוזמן = 'draft' (המשתמש יתזמן אותו אח"כ).
        status:       'draft',
      })
      .select('id')
      .single()

    if (dbError) {
      results.push({ name: file.name, error: dbError.message })
    } else {
      results.push({ name: file.name, id: row.id, url: publicUrl })
    }
  }

  const created = results.filter(r => !r.error).length
  return NextResponse.json({ created, total: files.length, results })
}
