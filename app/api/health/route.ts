import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

type HealthResult = {
  status: 'ok' | 'warn' | 'error' | 'configured' | 'missing'
  latency_ms: number
  message?: string
}

async function checkDb(): Promise<HealthResult> {
  const t0 = Date.now()
  try {
    const db = createServiceClient()
    const { error } = await db.from('users').select('id').limit(1)
    const latency_ms = Date.now() - t0
    if (error) return { status: 'error', latency_ms, message: error.message }
    return { status: latency_ms > 1000 ? 'warn' : 'ok', latency_ms }
  } catch (err: unknown) {
    return { status: 'error', latency_ms: Date.now() - t0, message: String(err) }
  }
}

async function checkHttpHead(url: string): Promise<HealthResult> {
  const t0 = Date.now()
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    const latency_ms = Date.now() - t0
    if (res.ok || res.status < 500) {
      return { status: latency_ms > 2000 ? 'warn' : 'ok', latency_ms }
    }
    return { status: 'error', latency_ms, message: `HTTP ${res.status}` }
  } catch (err: unknown) {
    return { status: 'error', latency_ms: Date.now() - t0, message: String(err) }
  }
}

async function checkPayplus(): Promise<HealthResult> {
  const base = process.env.PAYPLUS_API_URL ?? 'https://api.payplus.co.il'
  return checkHttpHead(base)
}

async function checkMedia(): Promise<HealthResult> {
  const t0 = Date.now()
  try {
    cloudinary.config({
      cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
      api_key:     process.env.CLOUDINARY_API_KEY,
      api_secret:  process.env.CLOUDINARY_API_SECRET,
    })
    await cloudinary.api.ping()
    const latency_ms = Date.now() - t0
    return { status: latency_ms > 2000 ? 'warn' : 'ok', latency_ms }
  } catch (err: unknown) {
    return { status: 'error', latency_ms: Date.now() - t0, message: String(err) }
  }
}

async function checkFacebook(): Promise<HealthResult> {
  return checkHttpHead('https://graph.facebook.com/')
}

async function checkLinkedIn(): Promise<HealthResult> {
  return checkHttpHead('https://api.linkedin.com/v2/')
}

async function checkInstagram(): Promise<HealthResult> {
  // Instagram shares the Facebook Graph API infrastructure
  return checkHttpHead('https://graph.facebook.com/')
}

function checkEnvKey(envKey: string): HealthResult {
  const exists = !!(process.env[envKey])
  return {
    status: exists ? 'configured' : 'missing',
    latency_ms: 0,
    message: exists ? undefined : `${envKey} not set`,
  }
}

const SERVICE_CHECKS: Record<string, () => Promise<HealthResult>> = {
  db:             checkDb,
  supabase:       checkDb,
  payplus:        checkPayplus,
  media:          checkMedia,
  cloudinary:     checkMedia,
  fb:             checkFacebook,
  facebook:       checkFacebook,
  li:             checkLinkedIn,
  linkedin:       checkLinkedIn,
  ig:             checkInstagram,
  instagram:      checkInstagram,
  openai:         () => Promise.resolve(checkEnvKey('OPENAI_API_KEY')),
  anthropic:      () => Promise.resolve(checkEnvKey('ANTHROPIC_API_KEY')),
  google_trends:  () => Promise.resolve(checkEnvKey('GOOGLE_TRENDS_API_KEY')),
  tiktok_rss:     () => Promise.resolve(checkEnvKey('TIKTOK_RSS_URL')),
  youtube_rss:    () => Promise.resolve(checkEnvKey('YOUTUBE_API_KEY')),
  serpapi:        () => Promise.resolve(checkEnvKey('SERPAPI_KEY')),
}

// GET /api/health?service=<id>
export async function GET(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  const service = req.nextUrl.searchParams.get('service') ?? ''

  const check = SERVICE_CHECKS[service]
  if (!check) {
    return NextResponse.json(
      { error: `Unknown service: ${service}. Valid: ${Object.keys(SERVICE_CHECKS).join(', ')}` },
      { status: 400 }
    )
  }

  const result = await check()
  return NextResponse.json(result)
}
