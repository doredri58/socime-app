import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini'
import { createServiceClient } from '@/lib/supabase'
import { getQuotaForTier } from '@/lib/image-quota'

const BUCKET = 'generated-images'

export async function POST(req: NextRequest) {
  try {
    const { userId, prompt } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'נדרשת התחברות' }, { status: 401 })
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'תיאור התמונה קצר מדי' }, { status: 400 })
    }

    const db = createServiceClient()

    // 1. בדיקת מכסה — שלוף tier + ספירה נוכחית
    const { data: user, error: userErr } = await db
      .from('users')
      .select('tier, image_count_this_month')
      .eq('id', userId)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
    }

    const quota = getQuotaForTier(user.tier)
    const used  = user.image_count_this_month ?? 0

    if (used >= quota) {
      return NextResponse.json(
        { error: `הגעת למכסת התמונות החודשית (${quota}). שדרג את החבילה למכסה גדולה יותר.`, quotaExceeded: true, quota, used },
        { status: 403 }
      )
    }

    // 2. יצירת התמונה דרך Gemini (Nano Banana)
    const dataUrl = await generateImage(prompt.trim())

    // 3. המרה ל-buffer והעלאה ל-Supabase Storage
    const base64    = dataUrl.split(',')[1]
    const mimeType  = dataUrl.match(/^data:(image\/\w+);/)?.[1] ?? 'image/png'
    const ext       = mimeType.split('/')[1]
    const buffer    = Buffer.from(base64, 'base64')
    const fileName  = `${userId}/${Date.now()}.${ext}`

    const { error: uploadErr } = await db.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: mimeType, upsert: false })

    if (uploadErr) {
      console.error('[generate-image upload]', uploadErr)
      return NextResponse.json({ error: 'שגיאה בשמירת התמונה' }, { status: 500 })
    }

    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(fileName)
    const imageUrl = pub.publicUrl

    // 4. עדכון מונה + לוג שימוש
    await db.from('users')
      .update({ image_count_this_month: used + 1 })
      .eq('id', userId)

    await db.from('image_usage_log').insert({ user_id: userId })

    return NextResponse.json({
      imageUrl,
      used:      used + 1,
      quota,
      remaining: quota - used - 1,
    })
  } catch (err: unknown) {
    console.error('[/api/generate-image]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
