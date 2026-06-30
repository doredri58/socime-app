import { GoogleGenerativeAI } from '@google/generative-ai'

/* ════════════════════════════════════════════════════════════════════════
   SociMe — Pro-Tier AI Agents (Gemini)
   3 production agents, all returning STRICT JSON for the React UI cards:
     1. runCompetitorAnalyst   — סוכן ריגול מתחרים
     2. runAdCopywriter        — סוכן ממומן
     3. runMultiPlatformAdapter — סוכן אומני-צ'אנל
   JSON keys are exactly as the frontend schema expects (English).
   Generated CONTENT is Hebrew (Israeli SMB audience).
════════════════════════════════════════════════════════════════════════ */

/* ── Client + model config ──────────────────────────────────────────── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PRIMARY_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODEL = 'gemini-2.0-flash'

// gemini-2.5-flash pricing — $/token (input, output)
const PRICE_IN = 0.000000075
const PRICE_OUT = 0.0000003

/* ── Typed result wrapper (shared by every agent) ───────────────────── */
export interface AgentResult<T> {
  data: T
  model: string
  tokensUsed: number
  costUsd: number
}

/* ── Custom error so callers / API routes can branch cleanly ────────── */
export class AgentError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'AgentError'
  }
}

/* ════════════════════════════════════════════════════════════════════════
   Core helper — single JSON call with strict mime-type, retry + fallback
   Tries: primary → primary (retry) → fallback model. Throws AgentError.
════════════════════════════════════════════════════════════════════════ */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Strip stray code fences / prose and parse the first {...} block. */
function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new AgentError(`המודל לא החזיר JSON תקין: ${cleaned.slice(0, 120)}`)
  try {
    return JSON.parse(match[0]) as T
  } catch (err) {
    throw new AgentError('כשל בפענוח ה-JSON מ-Gemini', err)
  }
}

async function generateJson<T>(opts: {
  system: string
  user: string
  temperature?: number
  maxOutputTokens?: number
}): Promise<AgentResult<T>> {
  const { system, user, temperature = 0.7, maxOutputTokens = 1024 } = opts

  // primary (1st), primary (retry), fallback model
  const attempts: string[] = [PRIMARY_MODEL, PRIMARY_MODEL, FALLBACK_MODEL]
  let lastError: unknown

  for (let i = 0; i < attempts.length; i++) {
    const modelName = attempts[i]
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${system}\n\n---\nקלט:\n${user}` }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json', // ← strict JSON output
        },
      })

      const data = parseJson<T>(result.response.text().trim())

      const usage = result.response.usageMetadata
      const inTok = usage?.promptTokenCount ?? 0
      const outTok = usage?.candidatesTokenCount ?? 0

      return {
        data,
        model: modelName,
        tokensUsed: inTok + outTok,
        costUsd: inTok * PRICE_IN + outTok * PRICE_OUT,
      }
    } catch (err) {
      lastError = err
      if (i < attempts.length - 1) await sleep(400 * (i + 1)) // small backoff
    }
  }

  throw new AgentError('כל הניסיונות מול Gemini נכשלו', lastError)
}

/** Hard-trim a string to a max char length on a word boundary (Google ad limits). */
function clampChars(value: string, max: number): string {
  const s = value.trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()
}

/* ════════════════════════════════════════════════════════════════════════
   AGENT 1 — Competitor Analyst (סוכן ריגול מתחרים)
════════════════════════════════════════════════════════════════════════ */
export interface CompetitorPost {
  competitor?: string
  description: string
  metrics?: { likes?: number; comments?: number; shares?: number; views?: number }
}

export interface CompetitorAnalysis {
  analysis_summary: string
  top_performing_topics: string[]
  actionable_counter_strategy: string[]
}

const COMPETITOR_SYSTEM = `אתה אנליסט שיווקי חד, ציני וקר-רוח — "סוכן ריגול מתחרים" של SociMe.
המשימה שלך: לפרק את האסטרטגיה של המתחרים, לזהות מה באמת מניע אצלם engagement, ולבנות ללקוח אסטרטגיית-נגד שתשאיר אותם מאחור.

עקרונות עבודה:
- התבסס על נתונים בלבד (מדדי ה-engagement שסופקו) — לא על תחושות בטן.
- זהה דפוסים: אילו נושאים, פורמטים והוקים חוזרים בפוסטים עם הביצועים הגבוהים ביותר.
- היה ביקורתי וחסר רחמים: אתר את נקודות התורפה של המתחרים שאפשר לנצל.
- כל המלצה חייבת להיות אקשנבילית — צעד שאפשר לבצע מחר בבוקר.
- כתוב בעברית עסקית, חדה ותכליתית. בלי קלישאות וסיסמאות.

החזר JSON בלבד, בדיוק במבנה הבא:
{
  "analysis_summary": "פסקה אחת (3-5 משפטים) עם התובנה המרכזית",
  "top_performing_topics": ["3-6 נושאים/זוויות שמושכים הכי הרבה engagement"],
  "actionable_counter_strategy": ["4-6 צעדים קונקרטיים ללקוח"]
}`

/**
 * Analyzes scraped competitor posts and returns a counter-strategy.
 * @param competitors array of competitor posts + engagement metrics (scraping assumed done).
 */
export async function runCompetitorAnalyst(
  competitors: CompetitorPost[],
): Promise<AgentResult<CompetitorAnalysis>> {
  if (!Array.isArray(competitors) || competitors.length === 0) {
    throw new AgentError('runCompetitorAnalyst: נדרש מערך פוסטים של מתחרים')
  }

  const user = `להלן ${competitors.length} פוסטים שנאספו מפרופילי המתחרים, כולל מדדי engagement:\n` +
    JSON.stringify(competitors, null, 2)

  const res = await generateJson<CompetitorAnalysis>({
    system: COMPETITOR_SYSTEM,
    user,
    temperature: 0.6,
    maxOutputTokens: 1200,
  })

  // shape-guard
  res.data.top_performing_topics ??= []
  res.data.actionable_counter_strategy ??= []
  return res
}

/* ════════════════════════════════════════════════════════════════════════
   AGENT 2 — Direct-Response Ad Copywriter (סוכן ממומן)
════════════════════════════════════════════════════════════════════════ */
export interface AdCopyInput {
  niche: string          // תחום העסק
  audience: string       // קהל יעד
  offer: string          // המוצר / ההצעה הספציפית
}

export interface AdCopy {
  facebook_ad: { primary_text: string; headline: string; hook: string }
  google_ad: { headlines_max_30_chars: string[]; descriptions_max_90_chars: string[] }
}

const AD_COPY_SYSTEM = `אתה קופירייטר תגובה-ישירה ברמה עולמית — שילוב של דייוויד אוגלבי עם media buyer מודרני. אתה "הסוכן הממומן" של SociMe.
המשימה: לכתוב קופי אגרסיבי וממיר למודעות ממומנות בפייסבוק ובגוגל.

כללי ברזל:
- פתח ב-hook חזק / pattern interrupt שעוצר את הגלילה כבר ב-3 המילים הראשונות.
- דבר אל הכאב והרצון של קהל היעד — לא על פיצ'רים יבשים.
- לכל מודעה חייב להיות CTA חד וברור.
- פייסבוק: primary_text משכנע (2-4 משפטים), headline קצר ומכה, ו-hook נפרד וחזק.
- גוגל: כל כותרת עד 30 תווים, כל תיאור עד 90 תווים. ספור תווים בקפדנות — חריגה תיפסל ע"י גוגל.
- כתוב בעברית שיווקית ומדויקת.

החזר JSON בלבד, בדיוק במבנה הבא:
{
  "facebook_ad": { "primary_text": "...", "headline": "...", "hook": "..." },
  "google_ad": {
    "headlines_max_30_chars": ["3 כותרות, כל אחת עד 30 תווים"],
    "descriptions_max_90_chars": ["2 תיאורים, כל אחד עד 90 תווים"]
  }
}`

/** Generates aggressive Facebook + Google ad copy. */
export async function runAdCopywriter(input: AdCopyInput): Promise<AgentResult<AdCopy>> {
  if (!input?.niche || !input?.audience || !input?.offer) {
    throw new AgentError('runAdCopywriter: נדרשים niche, audience ו-offer')
  }

  const user =
    `תחום העסק: ${input.niche}\n` +
    `קהל יעד: ${input.audience}\n` +
    `המוצר / ההצעה: ${input.offer}`

  const res = await generateJson<AdCopy>({
    system: AD_COPY_SYSTEM,
    user,
    temperature: 0.85,
    maxOutputTokens: 900,
  })

  // Enforce Google ad character limits as a hard safety net.
  const g = res.data.google_ad
  if (g) {
    g.headlines_max_30_chars = (g.headlines_max_30_chars ?? []).map(h => clampChars(h, 30))
    g.descriptions_max_90_chars = (g.descriptions_max_90_chars ?? []).map(d => clampChars(d, 90))
  }
  return res
}

/* ════════════════════════════════════════════════════════════════════════
   AGENT 3 — Multi-Platform Adapter (סוכן אומני-צ'אנל)
════════════════════════════════════════════════════════════════════════ */
export interface MultiPlatformContent {
  tiktok_caption: string
  linkedin_post: string
  instagram_post: string
  facebook_post: string
}

const ADAPTER_SYSTEM = `אתה מומחה תוכן אומני-צ'אנל — "סוכן הסתגלות הפלטפורמות" של SociMe.
המשימה: לקחת תוכן בסיס אחד ולהתאים אותו ל-4 פורמטים נייטיביים, כך שכל גרסה תרגיש כאילו נכתבה במקור לאותה פלטפורמה — בלי לאבד את המסר המרכזי.

הטון לכל פלטפורמה:
- TikTok: קצר, טרנדי ואנרגטי. אימוג'ים והאשטאגים, שפה צעירה ומיידית.
- LinkedIn: מקצועי ומבוסס-סיפור. שורות קצרות עם רווחים, תובנה עסקית, בלי אימוג'ים מוגזמים.
- Instagram: ויזואלי ואסתטי. ריווח אוורירי, תיאור שמתכתב עם תמונה, תיוגים רלוונטיים.
- Facebook: קהילתי ושיחתי. ארוך יותר, ומסתיים בשאלה שמזמינה תגובות.

כללים: שמור על המסר המרכזי בכל הגרסאות. אל תעתיק את אותו טקסט — שנה טון, אורך ומבנה לכל פלטפורמה. כתוב בעברית.

החזר JSON בלבד, בדיוק במבנה הבא:
{
  "tiktok_caption": "...",
  "linkedin_post": "...",
  "instagram_post": "...",
  "facebook_post": "..."
}`

/** Adapts one base text into 4 platform-native versions. */
export async function runMultiPlatformAdapter(
  baseContent: string,
): Promise<AgentResult<MultiPlatformContent>> {
  if (!baseContent?.trim()) {
    throw new AgentError('runMultiPlatformAdapter: נדרש תוכן בסיס')
  }

  return generateJson<MultiPlatformContent>({
    system: ADAPTER_SYSTEM,
    user: `תוכן הבסיס שיש להתאים:\n"""\n${baseContent.trim()}\n"""`,
    temperature: 0.8,
    maxOutputTokens: 1400,
  })
}
