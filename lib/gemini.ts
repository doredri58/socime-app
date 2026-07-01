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

// Text generation — gemini-2.5-flash
export async function generatePost(businessDesc: string, systemPromptOverride?: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const systemContext = systemPromptOverride ?? SYSTEM_PROMPT

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${systemContext}\n\nכתוב פוסט לעסק הבא: ${businessDesc}` }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 500,
      // gemini-2.5-flash is a thinking model; disable thinking so the token
      // budget goes to output, not internal reasoning (else it truncates).
      // @ts-expect-error thinkingConfig is accepted by the API but not yet typed in this SDK
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  const rawText = result.response.text().trim()
  // Strip markdown code fences and any leading/trailing noise
  const raw = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  // Find first { ... } block in case model adds prose around the JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Gemini לא החזיר JSON תקין: ${raw.slice(0, 100)}`)
  const parsed = JSON.parse(jsonMatch[0]) as { text: string; hashtags: string }

  const usage = result.response.usageMetadata
  const inputTokens = usage?.promptTokenCount ?? 0
  const outputTokens = usage?.candidatesTokenCount ?? 0
  // gemini-2.5-flash pricing: $0.075/1M input, $0.30/1M output
  const costUsd = (inputTokens * 0.000000075) + (outputTokens * 0.0000003)

  return {
    text: parsed.text,
    hashtags: parsed.hashtags,
    tokensUsed: inputTokens + outputTokens,
    costUsd,
  }
}

// Image generation — gemini-2.0-flash-exp (Nano Banana)
export async function generateImage(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `צור תמונה: ${prompt}` }] }],
    generationConfig: {
      // @ts-expect-error — responseModalities is supported but not yet in types
      responseModalities: ['IMAGE', 'TEXT'],
    },
  })

  for (const part of result.response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.mimeType?.startsWith('image/')) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
    }
  }

  throw new Error('לא הוחזרה תמונה מ-Gemini')
}

// Ideas generation — batch of 10
export async function generateIdeas(
  category: 'value' | 'marketing' | 'vibe',
  systemPrompt: string
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const categoryMap = {
    value: 'ערך ותוכן מקצועי',
    marketing: 'שיווק ומכירות',
    vibe: 'אווירה ואישיות העסק',
  }

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nצור 10 רעיונות לפוסטים בקטגוריה: ${categoryMap[category]}.\nהחזר JSON בלבד: { "ideas": ["...", "...", ...] }` }],
    }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 800,
      // @ts-expect-error thinkingConfig accepted by the API, not yet typed in this SDK
      thinkingConfig: { thinkingBudget: 0 },
    },
  })

  const rawText = result.response.text().trim()
  const raw = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return []
  const parsed = JSON.parse(jsonMatch[0]) as { ideas: string[] }
  return Array.isArray(parsed.ideas) ? parsed.ideas : []
}
