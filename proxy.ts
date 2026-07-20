import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/* ── CSP ──────────────────────────────────────────────────────────────────
   Two regimes:
   • Dashboard/admin (authenticated, already dynamically rendered) get a STRICT
     nonce-based CSP — the real XSS defence. script-src is locked to a per-request
     nonce + strict-dynamic; no 'unsafe-inline' scripts can run.
   • Public pages (landing, legal, login) get a static-friendly CSP with no nonce,
     so they stay statically rendered and CDN-cached.
   style-src keeps 'unsafe-inline' because the app uses inline style={{}} attributes
   throughout, which a nonce cannot cover.
────────────────────────────────────────────────────────────────────────── */

// Origins the browser legitimately talks to (kept narrow on purpose).
function supabaseOrigins(): { http: string; ws: string } {
  try {
    const o = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin
    return { http: o, ws: o.replace(/^https:/, 'wss:') }
  } catch {
    return { http: '', ws: '' }
  }
}

function dashboardCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  const sb = supabaseOrigins()
  return [
    `default-src 'self'`,
    // strict script policy — nonce + strict-dynamic; unsafe-eval only in dev (React debug)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // inline styles are unavoidable (style={{}}); tabler icons css is on jsdelivr
    `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
    `img-src 'self' blob: data: https://res.cloudinary.com`,
    `font-src 'self' data: https://cdn.jsdelivr.net`,
    `connect-src 'self' ${sb.http} ${sb.ws} https://api.cloudinary.com https://*.sentry.io`.replace(/\s+/g, ' ').trim(),
    `media-src 'self' blob: https://res.cloudinary.com`,
    `worker-src 'self' blob:`,
    `frame-src 'self' https://*.payplus.co.il`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://*.payplus.co.il`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

// Static-friendly CSP for public pages: no nonce, no script/style restriction,
// but still blocks clickjacking, object/base/form hijacking.
const PUBLIC_CSP = [
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self' https://api.payplus.co.il https://restapi.payplus.co.il`,
  `upgrade-insecure-requests`,
].join('; ')

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAppPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const isApi     = pathname.startsWith('/api')

  // Per-request nonce for the strict CSP on authenticated app pages. Next reads
  // the nonce out of the request's Content-Security-Policy header during SSR and
  // stamps it onto its own <script> tags automatically.
  const nonce = isAppPage ? Buffer.from(crypto.randomUUID()).toString('base64') : ''
  const csp   = isAppPage ? dashboardCsp(nonce) : PUBLIC_CSP

  const requestHeaders = new Headers(request.headers)
  if (isAppPage) {
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', csp)
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // הגנה על dashboard ו-admin
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // הגנה על onboarding — חייב להיות מחובר
  if (pathname.startsWith('/onboarding') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // אם כבר מחובר — אל תציג את דף הלוגין
  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // משתמש מחובר שנכנס לדף הבית — ישר לדשבורד, בלי לעבור שוב דרך הנחיתה.
  // מילוט: ?home=1 מאפשר לראות את דף הנחיתה גם כשמחוברים.
  if (pathname === '/' && user && !request.nextUrl.searchParams.has('home')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Content-Security-Policy: strict (nonce) on app pages, static-safe elsewhere.
  // API responses (JSON) don't need a CSP.
  if (!isApi) response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
