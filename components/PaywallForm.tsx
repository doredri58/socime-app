'use client'
import { useState } from 'react'

interface PaywallFormProps {
  draftPost: { text: string; hashtags: string } | null
  onBack: () => void
}

export default function PaywallForm({ draftPost, onBack }: PaywallFormProps) {
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
    setSuccess(true)
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
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 glow-card text-center">
        <div className="text-4xl mb-4">🎉</div>
        <div className="text-xl font-bold mb-2" style={{ color: '#1A1A2E' }}>ברוך הבא ל-SociMe!</div>
        <div className="text-sm mb-6" style={{ color: '#4A4A6A' }}>
          {draftPost ? 'הפוסט שלך נשמר כטיוטה וממתין לך בדשבורד.' : 'החשבון שלך פעיל.'}
        </div>
        <div className="text-xs" style={{ color: '#8888A8' }}>(Demo — Stripe לא מחויב)</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-8 glow-card">
      <h2 className="text-xl font-extrabold text-center mb-1" style={{ color: '#1A1A2E' }}>
        {mode === 'register' ? 'הצטרף ל-SociMe' : 'התחבר לחשבון'}
      </h2>
      <p className="text-sm text-center mb-5" style={{ color: '#4A4A6A' }}>
        {mode === 'register' ? 'הפוסט שלך נשמר כטיוטה ויתפרסם מיד לאחר הרשמה ✨' : 'ברוך שובך!'}
      </p>

      {draftPost && mode === 'register' && (
        <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-medium" style={{ background: 'var(--purple-soft)', border: '1px solid rgba(161,70,255,0.18)', color: 'var(--purple)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          הפוסט שלך נשמר כטיוטה וממתין לך
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl mb-4 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
      )}

      <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="flex flex-col gap-3">
        {mode === 'register' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#4A4A6A' }}>שם מלא</label>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="דור דוד אדרי" dir="rtl"
              className="px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }}
              onFocus={e => { e.target.style.borderColor = 'var(--purple)'; e.target.style.boxShadow = '0 0 0 3px rgba(161,70,255,0.12)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)'; e.target.style.boxShadow = '' }}
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: '#4A4A6A' }}>אימייל</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@business.co.il" dir="ltr"
            className="px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }}
            onFocus={e => { e.target.style.borderColor = 'var(--purple)'; e.target.style.boxShadow = '0 0 0 3px rgba(161,70,255,0.12)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)'; e.target.style.boxShadow = '' }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: '#4A4A6A' }}>סיסמה</label>
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" dir="ltr"
            className="px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }}
            onFocus={e => { e.target.style.borderColor = 'var(--purple)'; e.target.style.boxShadow = '0 0 0 3px rgba(161,70,255,0.12)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)'; e.target.style.boxShadow = '' }}
          />
        </div>

        {mode === 'register' && (
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--purple-soft)', border: '1.5px solid rgba(161,70,255,0.18)' }}>
            <div>
              <div className="text-sm font-bold" style={{ color: '#1A1A2E' }}>SociMe Pro</div>
              <div className="text-xs" style={{ color: '#4A4A6A' }}>200 טוקנים · פרסום ישיר ל-Meta</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black" style={{ color: 'var(--purple)' }}>₪49</div>
              <div className="text-xs" style={{ color: '#8888A8' }}>/חודש</div>
            </div>
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-full text-white font-bold text-base transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg,var(--purple),var(--purple-light))',
            boxShadow: '0 4px 18px rgba(161,70,255,0.38)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'מעבד...' : mode === 'register' ? 'הרשמה + תשלום דרך Stripe' : 'התחבר'}
        </button>

        <div className="flex items-center gap-2 my-1" style={{ color: '#8888A8', fontSize: '0.8rem' }}>
          <div className="flex-1 h-px" style={{ background: 'rgba(161,70,255,0.18)' }}></div>
          <span>או</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(161,70,255,0.18)' }}></div>
        </div>

        <button
          type="button"
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}
          className="w-full py-3 rounded-full font-bold text-base transition-all cursor-pointer"
          style={{ background: '#FAFAFA', color: '#1A1A2E', border: '1.5px solid rgba(161,70,255,0.18)' }}
        >
          {mode === 'register' ? 'יש לי כבר חשבון — התחבר' : 'הרשמה חדשה'}
        </button>

        <div className="text-center text-xs" style={{ color: '#8888A8' }}>
          רוצה יותר טוקנים? <span className="cursor-pointer font-semibold" style={{ color: 'var(--purple)' }}>טעינת ארנק</span>
        </div>
      </form>
    </div>
  )
}
