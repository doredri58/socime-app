import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

type Tone = 'funny' | 'serious' | 'professional' | 'warm'

const TONE_MAP: Record<Tone, string> = {
  funny:        'הומוריסטי, קליל ומצחיק — גורם לאנשים לחייך',
  serious:      'רציני, עמוק ואמין — מוביל מחשבה',
  professional: 'מקצועי, נקי ועסקי — משדר אמינות',
  warm:         'חם, אישי ואנושי — כאילו חבר כותב',
}

export async function POST(req: NextRequest) {
  try {
    const { userId, businessName, rawDescription, toneOfVoice, phone, address, operatingHours } =
      await req.json()

    if (!userId || !businessName || !rawDescription || !toneOfVoice) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }

    // יצירת system prompt מותאם אישית עם Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `אתה עוזר AI שמייצר system prompts לכתיבת פוסטים לרשתות חברתיות.

פרטי העסק:
- שם: ${businessName}
- תיאור: ${rawDescription}
- טון: ${TONE_MAP[toneOfVoice as Tone]}
${phone ? `- טלפון: ${phone}` : ''}
${address ? `- כתובת: ${address}` : ''}
${operatingHours ? `- שעות פעילות: ${operatingHours}` : ''}

צור system prompt קצר (4-6 משפטים) בעברית שישמש בסיס לכתיבת כל הפוסטים של העסק הזה.
ה-prompt צריך להגדיר: זהות העסק, קהל יעד, טון הכתיבה, וסגנון ייחודי.
החזר את ה-prompt בלבד, ללא כותרות או הסברים.`
        }],
      }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    })

    const parsedSystemPrompt = result.response.text().trim()

    // שמירה ב-Supabase
    const db = createServiceClient()

    const { error } = await db.from('business_profiles').upsert({
      user_id:              userId,
      business_name:        businessName,
      raw_description:      rawDescription,
      parsed_system_prompt: parsedSystemPrompt,
      tone_of_voice:        toneOfVoice,
      phone:                phone ?? null,
      address:              address ?? null,
      operating_hours:      operatingHours ?? null,
      updated_at:           new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) throw error

    return NextResponse.json({ parsedSystemPrompt })
  } catch (err: unknown) {
    console.error('[/api/onboarding]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
