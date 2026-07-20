import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// Static security headers applied to every response. The Content-Security-Policy
// is NOT set here — it is request-specific (a per-request nonce on app pages) and
// therefore lives in proxy.ts, which sets a strict nonce CSP on /dashboard and
// /admin and a static-friendly CSP on public pages.
const securityHeaders = [
  // Force HTTPS for 2 years, incl. subdomains, eligible for the HSTS preload list.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Anti-clickjacking (belt-and-suspenders with CSP frame-ancestors).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak full URLs to third parties.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable powerful browser features the app doesn't use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
})
