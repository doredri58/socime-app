import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkTokenBalance, deductTokens } from '@/lib/tokens'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const TONE_MAP: Record<string, string> = {
  professional: 'מקצועי, נקי ועסקי — משדר אמינות',
  warm:         'חם, אישי ואנושי — כאילו חבר כותב',
  funny:        'הומוריסטי, קליל ומצחיק — גורם לאנשים לחייך',
  serious:      'רציני, עמוק ואמין — מוביל מחשבה',
  direct:       'ישיר וחותך — הולך לעניין, ללא עטיפות',
  inspiring:    'מעורר השראה — מרגש ומניע לפעולה',
  casual:       "קז'ואל ויומיומי — בגובה העיניים, נינוח",
}

export async function POST(req: NextRequest) {
  try {
    // Session auth — never trust a userId from the body
    const supabase = await createServerSupabaseClient()
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'נדרשת התחברות' }, { status: 401 })
    }
    const userId = sessionUser.id

    const {
      businessName, rawDescription,
      toneOfVoice, targetAudience,
      phone, address, operatingHours,
      companyId, website, instagram, facebook, linkedin, tiktok, uniqueValue,
    } = await req.json()

    if (!businessName || !rawDescription) {
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
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        // @ts-expect-error thinkingConfig accepted by the API, not yet typed in this SDK
        thinkingConfig: { thinkingBudget: 0 },
      },
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

    const payload = {
      user_id:              userId,
      business_name:        businessName,
      raw_description:      rawDescription,
      parsed_system_prompt: parsedSystemPrompt,
      tone_of_voice:        toneOfVoice ?? 'professional',
      phone:                phone ?? null,
      address:              address ?? null,
      operating_hours:      operatingHours ?? null,
      target_audience:      targetAudience ?? null,
      company_id:           companyId ?? null,
      website:              website ?? null,
      instagram:            instagram ?? null,
      facebook:             facebook ?? null,
      linkedin:             linkedin ?? null,
      tiktok:               tiktok ?? null,
      unique_value:         uniqueValue ?? null,
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
