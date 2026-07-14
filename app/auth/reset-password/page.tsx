'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'

// User lands here from the reset email. The Supabase browser client exchanges
// the ?code= in the URL for a session automatically; then we let them set a
// new password via auth.updateUser.
export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [ready, setReady]         = useState<'checking' | 'ok' | 'invalid'>('checking')
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const [focus1, setFocus1]       = useState(false)
  const [focus2, setFocus2]       = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Give the client a moment to exchange the recovery code, then check session
    let cancelled = false
    async function check() {
      // exchange ?code= explicitly (covers browsers where detectSessionInUrl already ran too)
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code).catch(() => {})
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!cancelled) setReady(session ? 'ok' : 'invalid')
    }
    check()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('הסיסמה חייבת להכיל לפחות 8 תווים'); return }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('שגיאה בעדכון הסיסמה — נסה שוב'); return }
    setDone(true)
    setTimeout(() => { window.location.href = '/dashboard' }, 2000)
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%', padding: '12px 16px', borderRadius: 12, boxSizing: 'border-box',
    border: `1.5px solid ${focused ? PURPLE : '#E5E7EB'}`,
    background: focused ? '#FAFBFF' : '#F9FAFB',
    color: '#111827', fontSize: 14, outline: 'none', direction: 'ltr', textAlign: 'left',
    boxShadow: focused ? '0 0 0 3px rgba(150,86,254,0.12)' : 'none',
    transition: 'all .2s',
  })

  return (
    <div className="light-page" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, direction: 'rtl', fontFamily: 'var(--font-rubik), sans-serif',
      background: `radial-gradient(ellipse at 20% 10%, rgba(190,86,254,.30) 0%, transparent 55%),
                   radial-gradient(ellipse at 80% 90%, rgba(59,130,239,.26) 0%, transparent 50%),
                   linear-gradient(152deg, #E9DEFB 0%, #DCD6F7 50%, #CCE0FF 100%)`,
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

        {ready === 'checking' ? (
          <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', padding: '20px 0' }}>מאמת את הקישור...</p>
        ) : ready === 'invalid' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-link-off" style={{ fontSize: 26, color: '#DC2626' }} />
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>הקישור אינו תקף</h1>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: '0 0 24px' }}>
              הקישור פג תוקף או שכבר נעשה בו שימוש. בקש קישור חדש.
            </p>
            <Link href="/forgot-password" style={{ fontSize: 13, color: PURPLE, fontWeight: 700, textDecoration: 'none' }}>
              שלח קישור חדש ←
            </Link>
          </div>
        ) : done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-check" style={{ fontSize: 26, color: '#10B981' }} />
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>הסיסמה עודכנה!</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>מעביר אותך לדשבורד...</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>בחר סיסמה חדשה</h1>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: '0 0 24px' }}>
              לפחות 8 תווים. מומלץ לשלב אותיות, מספרים וסימנים.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                סיסמה חדשה
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocus1(true)} onBlur={() => setFocus1(false)}
                required minLength={8} style={{ ...inputStyle(focus1), marginBottom: 14 }}
              />

              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                אימות סיסמה
              </label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onFocus={() => setFocus2(true)} onBlur={() => setFocus2(false)}
                required minLength={8} style={{ ...inputStyle(focus2), marginBottom: 14 }}
              />

              {error && <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 12px' }}>{error}</p>}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: 12, cursor: loading ? 'wait' : 'pointer',
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 6px 20px rgba(150,86,254,0.35)',
              }}>
                {loading ? 'מעדכן...' : 'עדכן סיסמה'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
