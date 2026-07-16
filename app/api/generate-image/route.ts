import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase'
import { checkTokenBalance, deductTokens, TOKEN_COSTS } from '@/lib/tokens'
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

    // Tokens are the only currency. There was a second, per-tier image quota
    // here (lib/image-quota.ts) but it could never bind — at the old price of
    // 25 tokens an image, every paid tier ran out of tokens long before the
    // quota, so it only ever produced a promise we couldn't keep ("100 images"
    // delivering 40). One meter, one limit.
    const { data: user, error: userErr } = await db
      .from('users')
      .select('image_count_this_month, token_balance')
      .eq('id', userId)
      .single()

    if (userErr || !user) {
      return NextResponse.json({ error: 'משתמש לא נמצא' }, { status: 404 })
    }

    // Kept for usage analytics only — it gates nothing.
    const used = user.image_count_this_month ?? 0

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
      used:            used + 1,
      tokensRemaining: Math.max(0, (user.token_balance ?? 0) - TOKEN_COSTS.generate_image),
    })
  } catch (err: unknown) {
    console.error('[/api/generate-image]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
