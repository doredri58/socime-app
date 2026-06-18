import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `אתה מומחה שיווק דיגיטלי ישראלי.
תפקידך: לכתוב פוסטים לרשתות חברתיות בעברית עבור עסקים קטנים.

כללים:
- כתוב בעברית בלבד
- טון: חם, אנושי, מקצועי
- כלול: פתיח מושך, גוף קצר (2-3 משפטים), CTA ברור
- הוסף שורה נפרדת של 5-7 האשטאגים רלוונטיים
- אל תכלול כוכביות או סימני markdown
- פורמט JSON בלבד: { "text": "...", "hashtags": "..." }`

export async function generatePost(businessDesc: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `כתוב פוסט לעסק הבא: ${businessDesc}` },
    ],
    temperature: 0.8,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  })

  const usage = completion.usage
  // GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const costUsd =
    ((usage?.prompt_tokens ?? 0) * 0.00000015) +
    ((usage?.completion_tokens ?? 0) * 0.0000006)

  const raw = completion.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw) as { text: string; hashtags: string }

  return {
    text: parsed.text,
    hashtags: parsed.hashtags,
    tokensUsed: usage?.total_tokens ?? 0,
    costUsd,
  }
}

export async function moderateContent(text: string) {
  const result = await openai.moderations.create({ input: text })
  return {
    flagged: result.results[0].flagged,
    categories: result.results[0].categories,
  }
}
