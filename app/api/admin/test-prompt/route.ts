import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

// POST /api/admin/test-prompt
// Body: { key: string, content: string, model?: string }
// Returns: { output: string, latency_ms: number, tokens_used: number }
export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  const body = await req.json()
  const content: string = body?.content
  const model: string   = body?.model ?? 'gemini-2.5-flash'

  if (!content) {
    return NextResponse.json({ error: 'חסר content' }, { status: 400 })
  }

  // Only Gemini models are supported — the app uses @google/generative-ai
  // Other model names (claude-*, gpt-*) fall through to a descriptive error
  if (!model.startsWith('gemini')) {
    return NextResponse.json({
      output: `[מודל ${model} אינו מחובר בסביבה זו — רק Gemini זמין כעת]`,
      latency_ms: 0,
      tokens_used: 0,
    })
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const genModel = genAI.getGenerativeModel({ model })

  const testMessage = 'בדיקת פרומפט: אנא הגב בקצרה'

  const t0 = Date.now()
  let result
  try {
    result = await genModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${content}\n\n${testMessage}` }],
        },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Gemini error: ${msg}` }, { status: 502 })
  }

  const latency_ms = Date.now() - t0
  const output     = result.response.text().trim()
  const usage      = result.response.usageMetadata
  const tokens_used = (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0)

  return NextResponse.json({ output, latency_ms, tokens_used })
}
