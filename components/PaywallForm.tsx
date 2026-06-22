'use client'
import { useState } from 'react'
import Onboarding from '@/components/Onboarding'
import { createClient } from '@/lib/supabase-browser'

interface PaywallFormProps {
  draftPost: { text: string; hashtags: string } | null
  onBack: () => void
  initialMode?: 'register' | 'login'
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
    setLoading(true)
    setError('')
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
    setLoading(true)
    setError('')
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

  // אחרי Onboarding → ישירות לדשבורד (PayPlus יופעל לפני השקה)
  function handleOnboardingComplete() {
    window.location.href = '/dashboard'
  }

  // מסך שכחתי סיסמא
  if (forgotMode) {
    if (resetSent) {
      return (
        <div className="bg-white rounded-3xl p-8 glow-card text-center">
          <div className="text-4xl mb-3">📬</div>
          <div className="text-lg font-black mb-2" style={{ color: '#1A1A2E' }}>מייל נשלח!</div>
          <div className="text-sm mb-5" style={{ color: '#4A4A6A' }}>
            בדוק את תיבת הדואר שלך ולחץ על הקישור לאיפוס הסיסמא.
          </div>
          <button onClick={() => { setForgotMode(false); setResetSent(false) }}
            className="text-sm font-semibold" style={{ color: 'var(--purple)' }}>
            חזרה להתחברות
          </button>
        </div>
      )
    }
    return (
      <div className="bg-white rounded-3xl p-8 glow-card">
        <h2 className="text-xl font-extrabold text-center mb-1" style={{ color: '#1A1A2E' }}>שכחתי סיסמא</h2>
        <p className="text-sm text-center mb-5" style={{ color: '#4A4A6A' }}>נשלח אליך מייל עם קישור לאיפוס</p>
        {error && <div className="p-3 rounded-xl mb-4 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>}
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="האימייל שלך" dir="ltr"
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }} />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-full text-white font-bold"
            style={{ background: 'linear-gradient(135deg,var(--purple),#7c3aed)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'שולח...' : 'שלח מייל איפוס'}
          </button>
          <button type="button" onClick={() => { setForgotMode(false); setError('') }}
            className="text-sm font-semibold text-center" style={{ color: 'var(--text-light)' }}>
            חזרה להתחברות
          </button>
        </form>
      </div>
    )
  }

  if (showOnboarding && newUserId) {
    return (
      <Onboarding
        userId={newUserId}
        onComplete={handleOnboardingComplete}
      />
    )
  }

return (
    <div className="bg-white rounded-3xl p-8 glow-card">
      <h2 className="text-xl font-extrabold text-center mb-1" style={{ color: '#1A1A2E' }}>
        {mode === 'register' ? 'הצטרף ל-SociMe' : 'התחבר לחשבון'}
      </h2>
      <p className="text-sm text-center mb-5" style={{ color: '#4A4A6A' }}>
        {mode === 'register' ? 'הפוסט שלך שמור ויפורסם מיד לאחר ההרשמה ✨' : 'ברוך שובך!'}
      </p>

      {draftPost && mode === 'register' && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: 'var(--purple-soft)', border: '1px solid rgba(161,70,255,0.18)', color: 'var(--purple)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          הפוסט שלך ממתין לך
        </div>
      )}

      {/* תקופת ניסיון */}
      {mode === 'register' && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium"
          style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a' }}>
          <span>✓</span>
          <span>הצטרפות חינמית — שדרוג לחבילה בכל עת</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl mb-4 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
      )}

      {/* Google */}
      <button type="button" onClick={handleGoogleLogin}
        className="w-full py-3 rounded-full font-bold text-base transition-all cursor-pointer flex items-center justify-center gap-3 mb-3"
        style={{ background: '#fff', border: '1.5px solid #e2e2e2', color: '#1A1A2E', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        המשך עם Google
      </button>

      <div className="flex items-center gap-2 mb-3" style={{ color: '#8888A8', fontSize: '0.8rem' }}>
        <div className="flex-1 h-px" style={{ background: 'rgba(161,70,255,0.18)' }}></div>
        <span>או עם אימייל</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(161,70,255,0.18)' }}></div>
      </div>

      <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="flex flex-col gap-3">
        {mode === 'register' && (
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            placeholder="שם מלא" dir="rtl"
            className="px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }}
            onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)' }}
          />
        )}

        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@business.co.il" dir="ltr"
          className="px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }}
          onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)' }}
        />

        <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" dir="ltr"
          className="px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }}
          onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)' }}
        />
        {mode === 'login' && (
          <button type="button" onClick={() => { setForgotMode(true); setError('') }}
            className="text-xs text-right font-semibold" style={{ color: 'var(--purple)' }}>
            שכחתי סיסמא
          </button>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-full text-white font-bold text-base transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg,var(--purple),#7c3aed)',
            boxShadow: '0 4px 18px rgba(161,70,255,0.38)',
            opacity: loading ? 0.7 : 1,
          }}>
          {loading ? 'מעבד...' : mode === 'register' ? 'הרשמה חינמית' : 'התחבר'}
        </button>

        <button type="button"
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}
          className="w-full py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer"
          style={{ background: '#FAFAFA', color: '#4A4A6A', border: '1.5px solid rgba(161,70,255,0.15)' }}>
          {mode === 'register' ? 'יש לי כבר חשבון — התחבר' : 'הרשמה חדשה'}
        </button>
      </form>

      <div className="text-center text-xs mt-3" style={{ color: '#8888A8' }}>
        🔒 ההרשמה חינמית · שדרוג לפי בחירה · ביטול בכל עת
      </div>
      <div className="text-center text-xs mt-2" style={{ color: '#c4b5d4' }}>
        Powered by <span style={{ fontWeight: 600, color: '#9333EA' }}>EDRI GROUP</span>
      </div>
    </div>
  )
}
