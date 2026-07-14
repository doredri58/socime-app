import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { enforce, limiters, clientIp } from '@/lib/ratelimit'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const DEMO_PROMPT = `אתה מומחה שיווק דיגיטלי ישראלי.
כתוב פוסט אחד קצר ומושך לפייסבוק בעברית בנוגע לכאב הלקוח שצוין.
הפוסט צריך להיות מזדהה, אנושי, עם hook חזק, ועד 180 מילים.
אל תכלול כוכביות או סימני markdown.
ענה ב-JSON בלבד: { "post": "..." }`

export async function POST(req: NextRequest) {
  try {
    /* ── rate limit by IP — 3 לשעה (Upstash, מבוזר) ── */
    const limited = await enforce(limiters.demo, clientIp(req), 'הגעת למגבלת הניסיונות. נסה שוב בעוד שעה.')
    if (limited) return limited

    const { pain_point } = await req.json() as { pain_point?: string }

    if (!pain_point || typeof pain_point !== 'string' || pain_point.trim().length < 3) {
      return NextResponse.json({ error: 'נא להזין תיאור תקין' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${DEMO_PROMPT}\n\nכאב הלקוח: ${pain_point.trim()}` }],
      }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 800,
        responseMimeType: 'application/json', // ← strict JSON output
        // gemini-2.5-flash is a thinking model; disable thinking so the token
        // budget goes to the actual JSON output (not internal reasoning).
        // @ts-expect-error thinkingConfig is accepted by the API but not yet typed in this SDK
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    // Resilient parse: strip any fences and grab the first {...} block.
    const raw = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
    const match = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(match ? match[0] : raw) as { post: string }

    return NextResponse.json({ post: parsed.post })
  } catch (err: unknown) {
    console.error('[/api/demo-generate]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
