'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-browser'

const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'
const BLUE    = '#3B82EF'

const inputStyle = (focused: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px 44px 12px 16px', borderRadius: 12,
  border: `1.5px solid ${focused ? PURPLE : '#E5E7EB'}`,
  background: focused ? '#FAFBFF' : '#F9FAFB',
  color: '#111827', fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-rubik), sans-serif',
  boxShadow: focused ? `0 0 0 3px rgba(150,86,254,0.12)` : 'none',
  transition: 'all .2s',
  direction: 'rtl',
})

function EyeIcon({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} tabIndex={-1} style={{
      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF',
      display: 'flex', alignItems: 'center',
    }}>
      {show
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      }
    </button>
  )
}

function LoginInner() {
  const params = useSearchParams()
  const [mode, setMode] = useState<'login'|'register'>(
    params.get('mode') === 'register' ? 'register' : 'login'
  )
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const [focusName, setFocusName]       = useState(false)
  const [focusEmail, setFocusEmail]     = useState(false)
  const [focusPass, setFocusPass]       = useState(false)

  const supabase = createClient()

  async function handleGoogle() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'register') {
        // Use the server route: it creates an auto-confirmed user AND signs it
        // in (session cookie), so onboarding works immediately. Client
        // supabase.auth.signUp would return session:null when email
        // confirmation is enabled, stranding the new user without a session.
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'שגיאה בהרשמה')
        window.location.href = `/onboarding?uid=${data.userId}`
        return
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/dashboard'
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה, נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'var(--font-rubik), sans-serif',
      direction: 'rtl',
    }}>
      {/* ══ LEFT — Visual ══ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px',
        background: `radial-gradient(ellipse at 20% 10%, rgba(255,255,255,.28) 0%, transparent 55%),
                     radial-gradient(ellipse at 80% 90%, rgba(59,130,239,.55) 0%, transparent 55%),
                     linear-gradient(150deg, #9656FE 0%, #7C5CF0 45%, #3B82EF 100%)`,
        position: 'relative', overflow: 'hidden',
      }} className="hidden md:flex">

        {/* Glow blobs */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(150,86,254,.2) 0%, transparent 70%)`, top: -100, right: -100, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, rgba(59,130,239,.15) 0%, transparent 70%)`, bottom: -80, left: -80, pointerEvents: 'none' }} />

        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden' }}>
            <Image src="/logo.png" alt="SociMe" width={36} height={36} style={{ objectFit: 'cover' }} />
          </div>
          <span className="font-arimo" style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Soci<span style={{ color: PURPLE2 }}>Me</span>
          </span>
        </a>

        {/* Main copy */}
        <div style={{ zIndex: 1 }}>
          <h1 className="font-arimo" style={{
            fontSize: 'clamp(2rem,3.5vw,3rem)', fontWeight: 700,
            color: '#fff', lineHeight: 1.15, letterSpacing: '-1.5px', margin: '0 0 20px',
          }}>
            יום העבודה הראשון שלה<br />
            <span style={{ color: PURPLE2 }}>מתחיל עכשיו.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.62)', lineHeight: 1.8, margin: '0 0 40px', maxWidth: 380 }}>
            ספרו לה על העסק — ומשם היא כותבת, מעצבת, מתזמנת ומפרסמת. אתם רק מאשרים.
          </p>

          {/* Trust elements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Notification card */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', borderRadius: 16,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.14)',
              maxWidth: 320,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🚀</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>פוסט חדש פורסם</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>12 לייקים · 3 תגובות · עכשיו</div>
              </div>
            </div>

            {/* Trust badge — honest, no fabricated ratings */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              padding: '12px 18px', borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: 320,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ti ti-shield-check" style={{ fontSize: 18, color: '#0A7159' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>ללא כרטיס אשראי</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>התחלה חינם · ביטול בכל עת</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer quote */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', zIndex: 1 }}>
          © 2025 SociMe · <span style={{ color: PURPLE2, fontWeight: 700 }}>EDRI GROUP</span>
        </div>
      </div>

      {/* ══ RIGHT — Form ══ */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 56px',
        background: '#FFFFFF',
        overflowY: 'auto',
      }}>
        {/* Mobile logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 36 }} className="md:hidden">
          <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden' }}>
            <Image src="/logo.png" alt="SociMe" width={32} height={32} style={{ objectFit: 'cover' }} />
          </div>
          <span className="font-arimo" style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
            Soci<span style={{ color: PURPLE }}>Me</span>
          </span>
        </a>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex', background: '#F3F4F6', borderRadius: 14,
          padding: 4, marginBottom: 32,
        }}>
          {(['register','login'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
              flex: 1, padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#111827' : '#9CA3AF',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all .2s', fontFamily: 'var(--font-rubik), sans-serif',
            }}>
              {m === 'register' ? 'הרשמה' : 'התחברות'}
            </button>
          ))}
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h2 className="font-arimo" style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            {mode === 'register' ? 'בואו נקלוט אותה.' : 'ברוכים השבים 👋'}
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            {mode === 'register'
              ? 'ללא כרטיס אשראי · ביטול בכל עת'
              : 'התחברו לחשבון SociMe שלכם'}
          </p>
        </div>

        {/* Google SSO */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff',
          cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          transition: 'all .2s', fontFamily: 'var(--font-rubik), sans-serif',
          marginBottom: 20,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          המשך עם Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
          <span style={{ fontSize: 12, color: '#D1D5DB', fontWeight: 600 }}>או</span>
          <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>שם מלא</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  onFocus={() => setFocusName(true)} onBlur={() => setFocusName(false)}
                  placeholder="ישראל ישראלי" required
                  style={inputStyle(focusName)}
                />
                <i className="ti ti-user" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 16, pointerEvents: 'none' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {mode === 'register' ? 'אימייל / אימייל חברה' : 'אימייל'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusEmail(true)} onBlur={() => setFocusEmail(false)}
                placeholder="you@company.com" required
                style={inputStyle(focusEmail)}
              />
              <i className="ti ti-mail" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 16, pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>סיסמה</label>
              {mode === 'login' && (
                <a href="/forgot-password" style={{ fontSize: 12, color: PURPLE, textDecoration: 'none', fontWeight: 600 }}>שכחת סיסמה?</a>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusPass(true)} onBlur={() => setFocusPass(false)}
                placeholder="לפחות 8 תווים" required minLength={6}
                style={inputStyle(focusPass)}
              />
              <i className="ti ti-lock" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 16, pointerEvents: 'none' }} />
              <EyeIcon show={showPass} onClick={() => setShowPass(v => !v)} />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #86EFAC', fontSize: 13, color: '#16A34A' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none',
            background: loading ? '#9CA3AF' : `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : `0 4px 20px rgba(150,86,254,0.4)`,
            transition: 'all .2s', fontFamily: 'var(--font-rubik), sans-serif',
            marginTop: 4,
          }}>
            {loading ? '...' : mode === 'register' ? 'יצירת חשבון' : 'כניסה למערכת'}
          </button>
        </form>

        {/* Switch mode */}
        <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 24, marginBottom: 0 }}>
          {mode === 'register' ? 'כבר יש לכם חשבון? ' : 'עדיין אין לכם חשבון? '}
          <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif' }}>
            {mode === 'register' ? 'התחברו כאן' : 'הירשמו בחינם'}
          </button>
        </p>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#D1D5DB', marginTop: 28 }}>
          בהרשמה אתם מסכימים ל<a href="#" style={{ color: BLUE, textDecoration: 'none' }}>תנאי השימוש</a> ו<a href="#" style={{ color: BLUE, textDecoration: 'none' }}>מדיניות הפרטיות</a>
        </p>
      </div>

      <style>{`
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
