import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// Security headers applied to every response.
//
// NOTE ON CSP: we deliberately do NOT set `default-src` or resource directives
// (script-src/style-src/connect-src/img-src). The app uses inline styles
// throughout and Next's hydration injects inline scripts, so a resource-locking
// CSP requires a tested nonce rollout (tracked as a follow-up). Because there is
// no `default-src`, the directives we DO set are the only ones enforced — the
// high-value, zero-breakage ones that stop clickjacking, plugin/object injection
// and <base>/form-action hijacking without touching resource loading.
const CSP = [
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://api.payplus.co.il https://restapi.payplus.co.il",
  'upgrade-insecure-requests',
].join('; ')

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
  { key: 'Content-Security-Policy', value: CSP },
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
