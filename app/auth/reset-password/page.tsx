'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const [ready, setReady]         = useState(false)

  useEffect(() => {
    // Supabase redirects here with a session already set via the email link
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session)
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    if (password.length < 6)  { setError('סיסמא חייבת להכיל לפחות 6 תווים'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => { window.location.href = '/dashboard' }, 2500)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="bg-white rounded-3xl p-10 text-center max-w-sm w-full" style={{ border: '1px solid var(--purple-border)' }}>
          <div className="text-4xl mb-3">✅</div>
          <div className="text-lg font-black mb-1" style={{ color: 'var(--text-dark)' }}>הסיסמא עודכנה!</div>
          <div className="text-sm" style={{ color: 'var(--text-light)' }}>מועבר לדשבורד...</div>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-sm" style={{ color: 'var(--text-light)' }}>טוען...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full" style={{ border: '1px solid var(--purple-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
        <h1 className="text-xl font-extrabold text-center mb-1" style={{ color: 'var(--text-dark)' }}>איפוס סיסמא</h1>
        <p className="text-sm text-center mb-6" style={{ color: 'var(--text-light)' }}>הכנס סיסמא חדשה לחשבונך</p>
        {error && <div className="p-3 rounded-xl mb-4 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>}
        <form onSubmit={handleReset} className="flex flex-col gap-3" dir="rtl">
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="סיסמא חדשה" dir="ltr" minLength={6}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }} />
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="אימות סיסמא" dir="ltr" minLength={6}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#FAFAFA', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }} />
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-full text-white font-bold mt-1"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 4px 14px rgba(161,70,255,0.3)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'מעדכן...' : 'עדכן סיסמא'}
          </button>
        </form>
      </div>
    </div>
  )
}
