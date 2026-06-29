import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

/* ── in-memory rate limiter: max 3 requests per IP per hour ── */
const ipMap = new Map<string, { count: number; resetAt: number }>()
const MAX_REQUESTS = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) return false

  entry.count++
  return true
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const DEMO_PROMPT = `אתה מומחה שיווק דיגיטלי ישראלי.
כתוב פוסט אחד קצר ומושך לפייסבוק בעברית בנוגע לכאב הלקוח שצוין.
הפוסט צריך להיות מזדהה, אנושי, עם hook חזק, ועד 180 מילים.
אל תכלול כוכביות או סימני markdown.
ענה ב-JSON בלבד: { "post": "..." }`

export async function POST(req: NextRequest) {
  try {
    /* ── rate limit by IP ── */
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'הגעת למגבלת הניסיונות. נסה שוב בעוד שעה.' },
        { status: 429 }
      )
    }

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
      generationConfig: { temperature: 0.85, maxOutputTokens: 350 },
    })

    const raw = result.response.text().trim()
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')

    const parsed = JSON.parse(raw) as { post: string }

    return NextResponse.json({ post: parsed.post })
  } catch (err: unknown) {
    console.error('[/api/demo-generate]', err)
    const message = err instanceof Error ? err.message : 'שגיאה פנימית'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
