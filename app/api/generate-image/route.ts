import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase'
import { getQuotaForTier } from '@/lib/image-quota'
import { checkTokenBalance, deductTokens } from '@/lib/tokens'
import { enforce, limiters } from '@/lib/ratelimit'

const BUCKET = 'generated-images'

export async function POST(req: NextRequest) {
  try {
    // Session auth — never trust a userId from the body
    const supabase = await createServerSupabaseClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'נדרשת התחברות' }, { status: 401 })
    }
    const userId = sessionUser.id

    // 10 תמונות לדקה למשתמש — יצירת תמונה יקרה משמעותית
    const limited = await enforce(limiters.aiImage, userId, 'יותר מדי בקשות תמונה. המתינו רגע ונסו שוב.')
    if (limited) return limited

    const { prompt } = await req.json()
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

    // 1b. בדיקת יתרת טוקנים
    const tokenCheck = await checkTokenBalance(userId, 'generate_image')
    if (!tokenCheck.ok) {
      return NextResponse.json(
        { error: `אין מספיק טוקנים (נדרש ${tokenCheck.required}, נותר ${tokenCheck.balance})`, insufficientTokens: true },
        { status: 402 }
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

    // 4. עדכון מונה + ניכוי טוקנים + לוג שימוש
    await Promise.all([
      db.from('users').update({ image_count_this_month: used + 1 }).eq('id', userId),
      db.from('image_usage_log').insert({ user_id: userId }),
      deductTokens(userId, 'generate_image'),
    ])

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
