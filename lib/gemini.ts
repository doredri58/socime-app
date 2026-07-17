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
// extraContext (optional) is appended to the system prompt — used to inject the
// active business's tone / audience / address / hours while keeping the JSON rules.
export async function generatePost(businessDesc: string, extraContext = '') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const systemContext = SYSTEM_PROMPT + extraContext

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

/* ── Personalised post-idea bank ──────────────────────────────────────────────
   Generates a batch of publish-ready posts for one business — not concepts.
   Each item is a finished post (full body + hashtags) the user can send
   straight to the studio and schedule, plus a short title/emoji for the card
   and a category for filtering. Grounded in the business's own systemPrompt. */
export interface GeneratedReadyPost {
  emoji: string
  title: string
  text: string
  hashtags: string
  category: 'sales' | 'behind' | 'tips' | 'events' | 'viral'
}

const IDEA_CATEGORIES = ['sales', 'behind', 'tips', 'events', 'viral'] as const

export async function generateReadyPosts(systemPrompt: string): Promise<GeneratedReadyPost[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const instruction = `${systemPrompt}

צור 6 פוסטים מוכנים לפרסום ברשתות חברתיות, מותאמים ספציפית לעסק הזה — לא גנריים. כל פוסט צריך לנבוע ממה שאתה יודע על העסק: התחום, קהל היעד, הערך הייחודי והטון. תגוון בין הפוסטים (מכירה, מאחורי הקלעים, טיפ, אירוע/עונה, טרנד).

לכל פוסט החזר:
- emoji: אימוג'י אחד שמתאים
- title: כותרת קצרה לכרטיס (עד 6 מילים)
- text: גוף הפוסט המלא, מוכן לפרסום — פתיח מושך, 2-3 משפטים, וקריאה לפעולה. עברית בלבד, בלי כוכביות או markdown
- hashtags: שורת 5-7 האשטאגים רלוונטיים, מופרדים ברווח
- category: אחת בלבד — ${IDEA_CATEGORIES.join(', ')} (sales=מכירה/מבצע, behind=מאחורי הקלעים, tips=טיפ/ערך, events=חג/אירוע/עונה, viral=טרנד)

החזר JSON בלבד: { "posts": [ { "emoji": "...", "title": "...", "text": "...", "hashtags": "...", "category": "..." } ] }`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: instruction }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 2600,
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

  const parsed = JSON.parse(jsonMatch[0]) as { posts?: unknown }
  if (!Array.isArray(parsed.posts)) return []

  // Keep only complete posts (must have a body) and clamp category so a
  // hallucinated value can't break the UI's filter.
  return parsed.posts.flatMap((raw): GeneratedReadyPost[] => {
    if (!raw || typeof raw !== 'object') return []
    const o = raw as Record<string, unknown>
    const text = typeof o.text === 'string' ? o.text.trim() : ''
    if (!text) return []
    const category = (IDEA_CATEGORIES as readonly string[]).includes(o.category as string)
      ? (o.category as GeneratedReadyPost['category'])
      : 'tips'
    return [{
      emoji: typeof o.emoji === 'string' && o.emoji.trim() ? o.emoji.trim() : '💡',
      title: typeof o.title === 'string' && o.title.trim() ? o.title.trim() : text.slice(0, 40),
      text,
      hashtags: typeof o.hashtags === 'string' ? o.hashtags.trim() : '',
      category,
    }]
  })
}

/* ── Personalised video-idea bank (phase 2) ───────────────────────────────────
   Same idea as generateReadyPosts, but for short-form video (Reels / TikTok):
   each item is a ready-to-shoot script — a hook, a shot direction, and the
   spoken script — grounded in the business's own systemPrompt. */
export interface GeneratedReadyVideo {
  emoji: string
  title: string
  concept: string
  hook: string
  direction: string
  script: string
  category: 'sales' | 'behind' | 'tips' | 'events' | 'viral'
}

export async function generateReadyVideos(systemPrompt: string): Promise<GeneratedReadyVideo[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const instruction = `${systemPrompt}

צור 6 רעיונות לסרטוני וידאו קצרים (Reels / TikTok), מותאמים ספציפית לעסק הזה — לא גנריים. כל רעיון צריך לנבוע ממה שאתה יודע על העסק: התחום, קהל היעד, הערך הייחודי והטון. תגוון בין הרעיונות (מכירה, מאחורי הקלעים, טיפ, אירוע/עונה, טרנד).

לכל סרטון החזר:
- emoji: אימוג'י אחד שמתאים
- title: כותרת קצרה לכרטיס (עד 6 מילים)
- concept: משפט אחד שמסביר את הרעיון של הסרטון
- hook: משפט הפתיחה של הסרטון — מה שנאמר ב-3 השניות הראשונות כדי לעצור גלילה
- direction: הנחיית צילום קצרה — איך לצלם (זווית, מעברים, טקסט על המסך)
- script: התסריט המדובר המלא, מוכן להקראה מול המצלמה. עברית בלבד, בלי markdown
- category: אחת בלבד — ${IDEA_CATEGORIES.join(', ')} (sales=מכירה/מבצע, behind=מאחורי הקלעים, tips=טיפ/ערך, events=חג/אירוע/עונה, viral=טרנד)

החזר JSON בלבד: { "videos": [ { "emoji": "...", "title": "...", "concept": "...", "hook": "...", "direction": "...", "script": "...", "category": "..." } ] }`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: instruction }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 2800,
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

  const parsed = JSON.parse(jsonMatch[0]) as { videos?: unknown }
  if (!Array.isArray(parsed.videos)) return []

  // A video is only usable with a script; drop any without one, and clamp
  // category to the allowed set.
  return parsed.videos.flatMap((raw): GeneratedReadyVideo[] => {
    if (!raw || typeof raw !== 'object') return []
    const o = raw as Record<string, unknown>
    const script = typeof o.script === 'string' ? o.script.trim() : ''
    const title = typeof o.title === 'string' ? o.title.trim() : ''
    if (!script || !title) return []
    const category = (IDEA_CATEGORIES as readonly string[]).includes(o.category as string)
      ? (o.category as GeneratedReadyVideo['category'])
      : 'tips'
    return [{
      emoji: typeof o.emoji === 'string' && o.emoji.trim() ? o.emoji.trim() : '🎬',
      title,
      concept: typeof o.concept === 'string' ? o.concept.trim() : '',
      hook: typeof o.hook === 'string' ? o.hook.trim() : '',
      direction: typeof o.direction === 'string' ? o.direction.trim() : '',
      script,
      category,
    }]
  })
}
