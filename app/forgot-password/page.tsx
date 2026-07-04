'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [focused, setFocused] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message.toLowerCase().includes('invalid')
        ? 'כתובת המייל אינה תקינה'
        : error.message.toLowerCase().includes('rate')
          ? 'נשלחו יותר מדי בקשות — נסה שוב בעוד מספר דקות'
          : 'שגיאה בשליחת המייל — נסה שוב')
      return
    }
    setSent(true)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, direction: 'rtl', fontFamily: 'var(--font-space), sans-serif',
      background: `radial-gradient(ellipse at 20% 10%, rgba(190,86,255,.35) 0%, transparent 55%),
                   radial-gradient(ellipse at 80% 90%, rgba(59,130,239,.25) 0%, transparent 50%),
                   linear-gradient(160deg, #0D0829 0%, #160C3D 50%, #0F1654 100%)`,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, borderRadius: 24, padding: '40px 36px',
        background: '#FFFFFF', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
      }}>
        {/* logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden' }}>
            <Image src="/logo.png" alt="SociMe" width={34} height={34} style={{ objectFit: 'cover' }} />
          </div>
          <span className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
            Soci<span style={{ color: PURPLE }}>Me</span>
          </span>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-mail-check" style={{ fontSize: 26, color: '#10B981' }} />
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>בדוק את המייל שלך</h1>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: '0 0 24px' }}>
              אם קיים חשבון עבור <strong style={{ color: '#374151' }}>{email}</strong>,
              שלחנו אליו קישור לאיפוס הסיסמה. הקישור תקף לשעה.
            </p>
            <Link href="/login" style={{ fontSize: 13, color: PURPLE, fontWeight: 700, textDecoration: 'none' }}>
              ← חזרה להתחברות
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>שכחת סיסמה?</h1>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: '0 0 24px' }}>
              הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                כתובת אימייל
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                placeholder="you@example.com" required dir="ltr"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, boxSizing: 'border-box',
                  border: `1.5px solid ${focused ? PURPLE : '#E5E7EB'}`,
                  background: focused ? '#FAFBFF' : '#F9FAFB',
                  color: '#111827', fontSize: 14, outline: 'none', textAlign: 'left',
                  boxShadow: focused ? '0 0 0 3px rgba(152,80,255,0.12)' : 'none',
                  transition: 'all .2s', marginBottom: 14,
                }}
              />

              {error && <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 12px' }}>{error}</p>}

              <button type="submit" disabled={loading || !email.trim()} style={{
                width: '100%', padding: '13px', borderRadius: 12, cursor: loading ? 'wait' : 'pointer',
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                opacity: loading || !email.trim() ? 0.7 : 1,
                boxShadow: '0 6px 20px rgba(152,80,255,0.35)',
              }}>
                {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link href="/login" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
                נזכרת בסיסמה? <span style={{ color: PURPLE, fontWeight: 700 }}>התחבר</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
