import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkTokenBalance, deductTokens } from '@/lib/tokens'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const TONE_MAP: Record<string, string> = {
  funny:        'הומוריסטי, קליל ומצחיק — גורם לאנשים לחייך',
  serious:      'רציני, עמוק ואמין — מוביל מחשבה',
  professional: 'מקצועי, נקי ועסקי — משדר אמינות',
  warm:         'חם, אישי ואנושי — כאילו חבר כותב',
  direct:       'ישיר וחותך — הולך לעניין, ללא עטיפות',
  educational:  'חינוכי ומעשיר — מלמד ומוסיף ערך',
  marketing:    'סופר-שיווקי — מניע לפעולה, ממוקד המרה',
  friendly:     'בגובה העיניים — שיחה אנושית, לא שיווקית',
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId, businessName, rawDescription,
      toneOfVoice, targetAudience,
      phone, address, operatingHours,
    } = await req.json()

    if (!userId || !businessName || !rawDescription) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }

    const tokenCheck = await checkTokenBalance(userId, 'onboarding')
    if (!tokenCheck.ok) {
      return NextResponse.json(
        { error: `אין מספיק טוקנים (נדרש ${tokenCheck.required}, נותר ${tokenCheck.balance})`, insufficientTokens: true },
        { status: 402 }
      )
    }

    const toneLabel = TONE_MAP[toneOfVoice] ?? 'טבעי ואותנטי'

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `אתה עוזר AI שמייצר system prompts לכתיבת פוסטים לרשתות חברתיות.

פרטי העסק:
- שם: ${businessName}
- תיאור: ${rawDescription}
- טון דיבור: ${toneLabel}
${targetAudience ? `- קהל יעד: ${targetAudience}` : ''}
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

    const db = createServiceClient()

    // Target the ACTIVE business (multi-business aware): users.active_business_id
    // → else the user's first business → else create a new one.
    const { data: u } = await db.from('users').select('active_business_id').eq('id', userId).single()
    let targetId = (u?.active_business_id as string | null) ?? null
    if (!targetId) {
      const { data: first } = await db
        .from('business_profiles').select('id')
        .eq('user_id', userId).order('created_at', { ascending: true }).limit(1).maybeSingle()
      targetId = first?.id ?? null
    }

    // Append target audience to description so it's stored without needing a new column
    const fullDescription = targetAudience
      ? `${rawDescription}\n\nקהל יעד: ${targetAudience}`
      : rawDescription

    const payload = {
      user_id:              userId,
      business_name:        businessName,
      raw_description:      fullDescription,
      parsed_system_prompt: parsedSystemPrompt,
      tone_of_voice:        toneOfVoice ?? 'professional',
      phone:                phone ?? null,
      address:              address ?? null,
      operating_hours:      operatingHours ?? null,
      updated_at:           new Date().toISOString(),
    }

    let error
    if (targetId) {
      ({ error } = await db.from('business_profiles').update(payload).eq('id', targetId).eq('user_id', userId))
    } else {
      const ins = await db.from('business_profiles').insert(payload).select('id').single()
      error = ins.error
      if (ins.data?.id) await db.from('users').update({ active_business_id: ins.data.id }).eq('id', userId)
    }

    if (error) throw error

    await deductTokens(userId, 'onboarding')

    return NextResponse.json({ parsedSystemPrompt })
  } catch (err: unknown) {
    console.error('[/api/onboarding]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
