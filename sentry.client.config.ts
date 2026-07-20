import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from '@/lib/sentryScrub'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  sendDefaultPii: false,     // never attach IP / cookies / headers automatically
  beforeSend: scrubEvent,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,       // never capture on-screen text
      maskAllInputs: true,     // never capture form field values
      blockAllMedia: true,     // never capture images/media
      networkDetailAllowUrls: [], // never record request/response bodies
    }),
  ],
})
