import 'server-only'
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/* ════════════════════════════════════════════════════════════════════════
   Rate limiting מבוזר (Upstash Redis).

   למה: ה-limiter הקודם היה `Map` בזיכרון — הוא לא עובד ב-Vercel serverless,
   כי לכל instance/cold-start יש Map משלו שמתאפס, כך שההגבלה הייתה חסרת ערך.
   Redis משותף בין כל ה-instances ולכן ההגבלה אמיתית.

   fail-open: אם אין credentials של Upstash, ה-limiter הוא null וההגבלה מדולגת.
   כך dev ופרודקשן ממשיכים לעבוד עד שמגדירים את המפתחות.
════════════════════════════════════════════════════════════════════════ */

const url   = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

// חשוב: ה-placeholders ב-.env (YOUR_...) הם מחרוזות אמיתיות ולכן "truthy" —
// בלי הבדיקה הזו היינו בונים Redis עם URL לא חוקי וקורסים בזמן ריצה.
const configured = !!url && !!token && url.startsWith('https://') && !token.startsWith('YOUR_')
const redis = configured ? new Redis({ url: url!, token: token! }) : null

/** האם ההגבלה פעילה בפועל (יש Upstash מוגדר). */
export const rateLimitEnabled = redis !== null

export const limiters = {
  // אנונימי / לפי IP
  register: redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '15 m'), prefix: 'socime:register' }) : null,
  login:    redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '15 m'), prefix: 'socime:login'    }) : null,
  lead:     redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5,  '1 h'),  prefix: 'socime:lead'     }) : null,
  demo:     redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3,  '1 h'),  prefix: 'socime:demo'     }) : null,
  // מחובר / לפי userId — הגנה על עלויות Gemini
  aiText:   redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'),  prefix: 'socime:ai-text'  }) : null,
  aiImage:  redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'),  prefix: 'socime:ai-image' }) : null,
}

type Limiter = Ratelimit | null

/**
 * אוכף הגבלה למפתח נתון (IP או userId).
 * מחזיר NextResponse 429 אם חרג, או null אם מותר להמשיך.
 */
export async function enforce(
  limiter: Limiter,
  key: string,
  message = 'יותר מדי בקשות. נסו שוב מאוחר יותר.'
): Promise<NextResponse | null> {
  if (!limiter) return null   // Upstash לא מוגדר → מדלגים

  try {
    const { success, reset } = await limiter.limit(key)
    if (success) return null

    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    return NextResponse.json(
      { error: message },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  } catch (err) {
    // Redis לא זמין → fail-open. עדיף לתת לבקשה לעבור מאשר להפיל את ה-endpoint.
    console.error('[ratelimit] Redis error — allowing request', err)
    return null
  }
}

/** ה-IP של הלקוח (ב-Vercel מגיע ב-x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
