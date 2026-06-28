'use client'
import { useState } from 'react'
import Onboarding from '@/components/Onboarding'
import { createClient } from '@/lib/supabase-browser'

interface PaywallFormProps {
  draftPost: { text: string; hashtags: string } | null
  onBack: () => void
  initialMode?: 'register' | 'login'
}

const CARD: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #EDE9FE',
  borderRadius: 24,
  padding: '32px',
  boxShadow: '0 8px 40px rgba(109,40,217,0.08), 0 2px 12px rgba(0,0,0,0.05)',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '1.5px solid #E5E7EB',
  background: '#FAFAFA',
  color: '#111827',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  boxSizing: 'border-box',
}

export default function PaywallForm({ draftPost, onBack, initialMode = 'register' }: PaywallFormProps) {
  const [mode, setMode]               = useState<'register' | 'login'>(initialMode)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [newUserId, setNewUserId]     = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [forgotMode, setForgotMode]   = useState(false)
  const [resetSent, setResetSent]     = useState(false)

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  async function handleGoogleLogin() {
    setError('')
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (oauthError) setError(oauthError.message)
    } catch {
      setError('שגיאה בחיבור ל-Google — נסה עם אימייל')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, draftPost }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setNewUserId(data.userId ?? null)
    setShowOnboarding(true)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    window.location.href = '/dashboard'
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('הכנס אימייל'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setResetSent(true)
  }

  function handleOnboardingComplete() {
    window.location.href = '/dashboard'
  }

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#7C3AED'
    e.target.style.boxShadow = '0 0 0 3px rgba(109,40,217,0.08)'
    e.target.style.background = '#FFFFFF'
  }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E5E7EB'
    e.target.style.boxShadow = 'none'
    e.target.style.background = '#FAFAFA'
  }

  if (forgotMode) {
    if (resetSent) {
      return (
        <div style={CARD}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: '#EDE9FE', fontSize: 28 }}>
              📬
            </div>
            <div className="text-lg font-black mb-2" style={{ color: '#111827' }}>מייל נשלח!</div>
            <div className="text-sm mb-6" style={{ color: '#6B7280' }}>
              בדוק את תיבת הדואר שלך ולחץ על הקישור לאיפוס הסיסמא.
            </div>
            <button onClick={() => { setForgotMode(false); setResetSent(false) }}
              className="text-sm font-semibold" style={{ color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>
              חזרה להתחברות
            </button>
          </div>
        </div>
      )
    }
    return (
      <div style={CARD}>
        <h2 className="text-xl font-extrabold text-center mb-1" style={{ color: '#111827' }}>שכחתי סיסמא</h2>
        <p className="text-sm text-center mb-5" style={{ color: '#6B7280' }}>
          נשלח אליך מייל עם קישור לאיפוס
        </p>
        {error && (
          <div className="p-3 rounded-xl mb-4 text-sm"
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="האימייל שלך" dir="ltr" style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold transition-all cursor-pointer"
            style={{
              background: '#7C3AED', border: 'none',
              opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
            }}>
            {loading ? 'שולח...' : 'שלח מייל איפוס'}
          </button>
          <button type="button" onClick={() => { setForgotMode(false); setError('') }}
            className="text-sm font-semibold text-center"
            style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
            חזרה להתחברות
          </button>
        </form>
      </div>
    )
  }

  if (showOnboarding && newUserId) {
    return <Onboarding userId={newUserId} onComplete={handleOnboardingComplete} />
  }

  return (
    <div style={CARD}>
      <h2 className="text-xl font-extrabold text-center mb-1" style={{ color: '#111827' }}>
        {mode === 'register' ? 'הצטרף ל-SociMe' : 'התחבר לחשבון'}
      </h2>
      <p className="text-sm text-center mb-5" style={{ color: '#6B7280' }}>
        {mode === 'register' ? 'הפוסט שלך שמור ויפורסם מיד לאחר ההרשמה ✨' : 'ברוך שובך!'}
      </p>

      {draftPost && mode === 'register' && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          הפוסט שלך ממתין לך
        </div>
      )}

      {mode === 'register' && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
          <span>✓</span>
          <span>הצטרפות חינמית — שדרוג לחבילה בכל עת</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl mb-4 text-sm"
          style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
          {error}
        </div>
      )}

      {/* Google */}
      <button type="button" onClick={handleGoogleLogin}
        className="w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-3 mb-3"
        style={{
          background: '#FFFFFF', border: '1.5px solid #E5E7EB', color: '#374151',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = '#F9FAFB'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#D1D5DB'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = '#FFFFFF'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'
        }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        המשך עם Google
      </button>

      <div className="flex items-center gap-2 mb-4" style={{ color: '#D1D5DB', fontSize: '0.75rem' }}>
        <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
        <span style={{ color: '#9CA3AF' }}>או עם אימייל</span>
        <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
      </div>

      <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="flex flex-col gap-3">
        {mode === 'register' && (
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            placeholder="שם מלא" dir="rtl" style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
        )}
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@business.co.il" dir="ltr" style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" dir="ltr" style={INPUT} onFocus={inputFocus} onBlur={inputBlur} />

        {mode === 'login' && (
          <button type="button" onClick={() => { setForgotMode(true); setError('') }}
            className="text-xs text-right font-semibold"
            style={{ color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>
            שכחתי סיסמא
          </button>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all cursor-pointer"
          style={{
            background: '#7C3AED',
            boxShadow: '0 4px 16px rgba(109,40,217,0.25)',
            border: 'none',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.background = '#6D28D9')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#7C3AED')}>
          {loading ? 'מעבד...' : mode === 'register' ? 'הרשמה חינמית' : 'התחבר'}
        </button>

        <button type="button"
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer"
          style={{
            background: '#F5F3FF', color: '#7C3AED',
            border: '1px solid #DDD6FE', fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#EDE9FE')}
          onMouseLeave={e => (e.currentTarget.style.background = '#F5F3FF')}>
          {mode === 'register' ? 'יש לי כבר חשבון — התחבר' : 'הרשמה חדשה'}
        </button>
      </form>

      <div className="text-center text-xs mt-4" style={{ color: '#9CA3AF' }}>
        ההרשמה חינמית · שדרוג לפי בחירה · ביטול בכל עת
      </div>
      <div className="text-center text-xs mt-2" style={{ color: '#D1D5DB' }}>
        Powered by <span style={{ fontWeight: 600, color: '#7C3AED' }}>EDRI GROUP</span>
      </div>
    </div>
  )
}
