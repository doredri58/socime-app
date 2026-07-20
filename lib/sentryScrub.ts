import type { ErrorEvent, EventHint } from '@sentry/nextjs'

// beforeSend hook — strips PII/secrets from Sentry events before they leave the
// device. We handle sensitive data, so we drop cookies, auth headers, query
// strings (may carry tokens/codes) and reduce the user context to an id only.
export function scrubEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request) {
    delete event.request.cookies
    const h = event.request.headers as Record<string, unknown> | undefined
    if (h) { delete h['authorization']; delete h['Authorization']; delete h['cookie']; delete h['Cookie'] }
    if (event.request.query_string) event.request.query_string = '[stripped]'
    if (typeof event.request.url === 'string') event.request.url = event.request.url.split('?')[0]
  }
  // keep only a stable id for correlation — drop email / ip_address
  if (event.user) event.user = event.user.id ? { id: event.user.id } : {}
  return event
}
