'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'

type FactorLite = { id: string; status: string; factor_type: string }

function VerifyInner() {
  const supabase = createClient()
  const router   = useRouter()
  const params   = useSearchParams()
  const next     = params.get('next') || '/dashboard'

  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode]   = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Already stepped up? go straight through.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (!cancelled && aal?.currentLevel === 'aal2') { window.location.href = next; return }
      const { data } = await supabase.auth.mfa.listFactors()
      const totp = ((data?.all ?? []) as FactorLite[]).find(f => f.factor_type === 'totp' && f.status === 'verified')
      if (cancelled) return
      if (!totp) { window.location.href = '/dashboard/settings?tab=security'; return }
      setFactorId(totp.id)
      setReady(true)
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verify() {
    if (!factorId || code.replace(/\D/g, '').length !== 6) { setError('הזינו קוד בן 6 ספרות'); return }
    setBusy(true); setError('')
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
      if (chErr || !ch) { setError('שגיאה — נסו שוב'); return }
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.replace(/\D/g, '') })
      if (vErr) { setError('קוד שגוי — בדקו את האפליקציה ונסו שוב'); setCode(''); return }
      window.location.href = next
    } finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div style={{ width: '100%', maxWidth: 380, padding: 32, borderRadius: 20,
        background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.09)', textAlign: 'center' }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, margin: '0 auto 16px',
          background: 'rgba(150,86,254,0.15)', border: '1px solid rgba(150,86,254,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ti ti-shield-lock" style={{ fontSize: 26, color: PURPLE2 }} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>אימות דו-שלבי</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 22px', lineHeight: 1.6 }}>
          הזינו את הקוד בן 6 הספרות מאפליקציית ה-Authenticator כדי להיכנס לאזור הניהול.
        </p>

        {ready ? (
          <>
            <input
              value={code} autoFocus
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => { if (e.key === 'Enter') void verify() }}
              placeholder="000000" inputMode="numeric" maxLength={6}
              style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 24, fontWeight: 800,
                letterSpacing: '0.5em', textAlign: 'center', color: '#fff', direction: 'ltr',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none',
                boxSizing: 'border-box', marginBottom: 14 }} />
            {error && (
              <div style={{ fontSize: 12, color: '#F87171', marginBottom: 12 }}>{error}</div>
            )}
            <button onClick={verify} disabled={busy} style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: busy ? 'wait' : 'pointer',
              background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, color: '#fff', fontSize: 15, fontWeight: 800,
              opacity: busy ? 0.7 : 1 }}>
              {busy ? 'מאמת...' : 'אימות'}
            </button>
            <button onClick={() => router.push('/dashboard')} style={{
              marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}>
              חזרה לדשבורד
            </button>
          </>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>טוען...</div>
        )}
      </div>
    </div>
  )
}

export default function VerifyMfaPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  )
}
