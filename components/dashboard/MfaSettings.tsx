'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'

const PURPLE2 = '#BE56FE'
const GREEN   = '#0A7159'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
}

type FactorLite = { id: string; status: string; factor_type: string }

/**
 * Real TOTP (authenticator-app) MFA management — enroll, verify, remove.
 * Uses Supabase MFA. Admin/founder accounts are REQUIRED to have this active
 * to reach the admin panel (enforced server-side in lib/admin.ts).
 */
export default function MfaSettings({ showToast }: { showToast: (m: string, ok: boolean) => void }) {
  const supabase = createClient()

  const [phase, setPhase]   = useState<'loading' | 'none' | 'enrolling' | 'active'>('loading')
  const [busy, setBusy]     = useState(false)
  const [qr, setQr]         = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode]     = useState('')

  /* determine current status */
  const refresh = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) { setPhase('none'); return }
    const all = (data?.all ?? []) as FactorLite[]
    const verified = all.find(f => f.factor_type === 'totp' && f.status === 'verified')
    setPhase(verified ? 'active' : 'none')
  }, [supabase])

  useEffect(() => { void refresh() }, [refresh])

  /* start enrollment — clears any stale unverified factors first */
  async function startEnroll() {
    setBusy(true)
    try {
      const { data: list } = await supabase.auth.mfa.listFactors()
      const stale = ((list?.all ?? []) as FactorLite[]).filter(f => f.factor_type === 'totp' && f.status !== 'verified')
      for (const f of stale) await supabase.auth.mfa.unenroll({ factorId: f.id })

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error || !data) { showToast(error?.message ?? 'שגיאה בהפעלת MFA', false); return }
      setFactorId(data.id)
      setQr(data.totp.qr_code)
      setSecret(data.totp.secret)
      setCode('')
      setPhase('enrolling')
    } finally { setBusy(false) }
  }

  /* verify the 6-digit code to finish enrollment (also steps session up to AAL2) */
  async function verify() {
    if (!factorId || code.replace(/\D/g, '').length !== 6) { showToast('הזינו קוד בן 6 ספרות', false); return }
    setBusy(true)
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
      if (chErr || !ch) { showToast('שגיאה — נסו שוב', false); return }
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.replace(/\D/g, '') })
      if (error) { showToast('קוד שגוי — בדקו את האפליקציה ונסו שוב', false); return }
      setQr(null); setSecret(null); setFactorId(null); setCode('')
      setPhase('active')
      showToast('אימות דו-שלבי הופעל בהצלחה ✓', true)
    } finally { setBusy(false) }
  }

  /* remove MFA (requires the session to be AAL2 — i.e. recently verified) */
  async function remove() {
    setBusy(true)
    try {
      const { data } = await supabase.auth.mfa.listFactors()
      const totp = ((data?.all ?? []) as FactorLite[]).filter(f => f.factor_type === 'totp')
      let removed = false
      for (const f of totp) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id })
        if (!error) removed = true
      }
      if (removed) { setPhase('none'); showToast('אימות דו-שלבי הוסר', true) }
      else showToast('כדי להסיר צריך לאמת קוד קודם (התנתקו והתחברו מחדש)', false)
    } finally { setBusy(false) }
  }

  const active = phase === 'active'

  return (
    <div className="neon-card" style={{ ...GLASS, padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12,
            background: active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${active ? 'rgba(52,211,153,0.28)' : 'rgba(255,255,255,0.10)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
            <i className="ti ti-shield-lock" style={{ fontSize: 20, color: active ? GREEN : 'rgba(255,255,255,0.35)' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              אימות דו-שלבי (MFA)
              {active && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)', color: GREEN }}>
                  פעיל
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3, lineHeight: 1.6 }}>
              אפליקציית Authenticator (Google Authenticator / Authy) — קוד חד-פעמי בכל כניסה
            </div>
          </div>
        </div>

        {phase === 'none' && (
          <button onClick={startEnroll} disabled={busy} style={btnPrimary(busy)}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> הפעל
          </button>
        )}
        {active && (
          <button onClick={remove} disabled={busy} style={btnDanger(busy)}>
            <i className="ti ti-trash" style={{ fontSize: 13 }} /> הסר
          </button>
        )}
      </div>

      {/* enrollment: QR + secret + code */}
      {phase === 'enrolling' && qr && (
        <div style={{ marginTop: 18, padding: '18px', borderRadius: 14,
          background: 'rgba(150,86,254,0.06)', border: '1px solid rgba(150,86,254,0.2)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 14 }}>
            1. סרקו את קוד ה-QR באפליקציית Authenticator.<br />
            2. הזינו את הקוד בן 6 הספרות שמופיע באפליקציה.
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', padding: 10, borderRadius: 12, flexShrink: 0 }}>
              {/* qr_code is an SVG data URI — allowed by CSP img-src data: */}
              <img src={qr} alt="MFA QR" width={150} height={150} style={{ display: 'block' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {secret && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>או הזינו ידנית:</div>
                  <code style={{ fontSize: 12, color: PURPLE2, background: 'rgba(0,0,0,0.25)', padding: '6px 10px',
                    borderRadius: 8, wordBreak: 'break-all', direction: 'ltr', display: 'inline-block' }}>{secret}</code>
                </div>
              )}
              <input
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" inputMode="numeric" maxLength={6}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 20, fontWeight: 800,
                  letterSpacing: '0.4em', textAlign: 'center', color: '#fff', direction: 'ltr',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={verify} disabled={busy} style={{ ...btnPrimary(busy), flex: 1, justifyContent: 'center' }}>
                  {busy ? 'מאמת...' : 'אמת והפעל'}
                </button>
                <button onClick={() => { setPhase('none'); setQr(null); setCode('') }} disabled={busy}
                  style={{ padding: '10px 16px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {active && (
        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12,
          background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
          fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
          <i className="ti ti-info-circle" style={{ color: GREEN, marginLeft: 6 }} />
          הגישה לאזור הניהול מוגנת ב-MFA. שמרו את אפליקציית ה-Authenticator בטוחה — היא נדרשת בכל כניסה לניהול.
        </div>
      )}
    </div>
  )
}

function btnPrimary(busy: boolean): React.CSSProperties {
  return { padding: '10px 20px', borderRadius: 12, cursor: busy ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700,
    background: 'rgba(150,86,254,0.15)', border: '1px solid rgba(150,86,254,0.3)', color: PURPLE2,
    display: 'inline-flex', alignItems: 'center', gap: 7, opacity: busy ? 0.6 : 1, flexShrink: 0 }
}
function btnDanger(busy: boolean): React.CSSProperties {
  return { padding: '10px 20px', borderRadius: 12, cursor: busy ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700,
    background: 'rgba(204,31,31,0.12)', border: '1px solid rgba(204,31,31,0.3)', color: '#F87171',
    display: 'inline-flex', alignItems: 'center', gap: 7, opacity: busy ? 0.6 : 1, flexShrink: 0 }
}
