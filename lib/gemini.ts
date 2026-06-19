import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `אתה מומחה שיווק דיגיטלי ישראלי.
תפקידך: לכתוב פוסטים לרשתות חברתיות בעברית עבור עסקים קטנים.

כללים:
- כתוב בעברית בלבד
- טון: חם, אנושי, מקצועי
- כלול: פתיח מושך, גוף קצר (2-3 משפטים), CTA ברור
- הוסף שורה נפרדת של 5-7 האשטאגים רלוונטיים
- אל תכלול כוכביות או סימני markdown
- ענה ב-JSON בלבד בפורמט: { "text": "...", "hashtags": "..." }`

export async function generatePost(businessDesc: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nכתוב פוסט לעסק הבא: ${businessDesc}` }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 400 },
  })

  const raw = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(raw) as { text: string; hashtags: string }

  const usage = result.response.usageMetadata
  const inputTokens = usage?.promptTokenCount ?? 0
  const outputTokens = usage?.candidatesTokenCount ?? 0
  // Gemini 1.5 Flash pricing: $0.075/1M input, $0.30/1M output
  const costUsd = (inputTokens * 0.000000075) + (outputTokens * 0.0000003)

  return {
    text: parsed.text,
    hashtags: parsed.hashtags,
    tokensUsed: inputTokens + outputTokens,
    costUsd,
  }
}
