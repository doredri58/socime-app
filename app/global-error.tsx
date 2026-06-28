'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: 'Heebo, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8f4ff' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>משהו השתבש</h2>
          <p style={{ fontSize: 14, color: '#8888A8', marginBottom: 24 }}>הצוות קיבל התראה ויטפל בבעיה בהקדם.</p>
          <button onClick={reset}
            style={{ padding: '10px 28px', borderRadius: 12, background: '#a146ff', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            נסה שוב
          </button>
        </div>
      </body>
    </html>
  )
}
