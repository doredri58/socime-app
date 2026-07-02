'use client'
import { useEffect, useState } from 'react'
import UpgradeModal from '@/components/dashboard/UpgradeModal'

const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'

interface ConnectedPlatform {
  platform: string
  scopes: string[]
  expires_at: string | null
  created_at: string
}

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  icon: 'ti-brand-facebook',  color: '#1877F2', bg: 'rgba(24,119,242,0.1)',  border: 'rgba(24,119,242,0.25)',  desc: 'פרסם ישירות לדף העסקי שלך', pro: false },
  { id: 'instagram', label: 'Instagram', icon: 'ti-brand-instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.1)',  border: 'rgba(225,48,108,0.25)',  desc: 'פוסטים, סטוריז ורילס',        pro: false },
  { id: 'tiktok',   label: 'TikTok',    icon: 'ti-brand-tiktok',    color: '#ff0050', bg: 'rgba(255,0,80,0.08)',  border: 'rgba(255,0,80,0.2)',     desc: 'וידאו קצר ותוכן ויראלי',     pro: true  },
]

export default function SocialConnect() {
  const [connected, setConnected]     = useState<ConnectedPlatform[]>([])
  const [loading, setLoading]         = useState(true)
  const [working, setWorking]         = useState<string | null>(null)
  const [tokenInput, setTokenInput]   = useState('')
  const [addFor, setAddFor]           = useState<string | null>(null)
  const [error, setError]             = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    setLoading(true)
    const res  = await fetch('/api/social/connect')
    const data = await res.json()
    setConnected(data.connected ?? [])
    setLoading(false)
  }

  function isConnected(id: string)   { return connected.some(c => c.platform === id) }
  function connectedSince(id: string) {
    const c = connected.find(p => p.platform === id)
    return c ? new Date(c.created_at).toLocaleDateString('he-IL') : null
  }

  async function connect() {
    if (!addFor || !tokenInput.trim()) return
    setWorking(addFor); setError('')
    const res = await fetch('/api/social/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: addFor, oauthToken: tokenInput.trim() }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'שגיאה בחיבור')
    } else {
      setTokenInput(''); setAddFor(null)
      await fetchStatus()
    }
    setWorking(null)
  }

  async function disconnect(platform: string) {
    setWorking(platform)
    await fetch('/api/social/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    await fetchStatus()
    setWorking(null)
  }

  return (
    <>
      {/* status banner */}
      <div style={{
        padding: '12px 18px', borderRadius: 16, marginBottom: 24,
        background: connected.length > 0 ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
        border: `1px solid ${connected.length > 0 ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <i className={`ti ${connected.length > 0 ? 'ti-circle-check' : 'ti-alert-circle'}`}
          style={{ fontSize: 18, color: connected.length > 0 ? '#34D399' : '#FBBF24', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {loading ? 'טוען...' : connected.length > 0
              ? `${connected.length} רשת${connected.length > 1 ? 'ות' : ''} מחוברת${connected.length > 1 ? 'ות' : ''}`
              : 'אין רשתות מחוברות'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {connected.length > 0 ? 'SociMe יכולה לפרסם ישירות לחשבונות שלך' : 'חבר לפחות רשת אחת כדי לפרסם אוטומטית'}
          </div>
        </div>
      </div>

      {/* platform grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {PLATFORMS.map(p => {
          const active  = isConnected(p.id)
          const since   = connectedSince(p.id)
          const busy    = working === p.id
          const editing = addFor === p.id

          return (
            <div key={p.id} className="neon-card" style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: active ? `1px solid ${p.color}45` : '1px solid rgba(255,255,255,0.09)',
              borderRadius: 20, padding: '22px 20px',
              transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
            }}>
              {/* Pro badge */}
              {p.pro && (
                <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(152,80,255,0.2)', border: '1px solid rgba(152,80,255,0.3)' }}>
                  <i className="ti ti-lock" style={{ fontSize: 10, color: PURPLE2 }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: PURPLE2 }}>Pro</span>
                </div>
              )}

              {/* active corner glow */}
              {active && <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderRadius: '0 20px 0 60px', background: `${p.color}15`, pointerEvents: 'none' }} />}

              {/* icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: p.bg, border: `1px solid ${p.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? `0 0 16px ${p.color}30` : 'none',
                }}>
                  <i className={`ti ${p.icon}`} style={{ fontSize: 22, color: p.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{p.desc}</div>
                </div>
              </div>

              {/* status indicator */}
              <div style={{ marginBottom: 14 }}>
                {active ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px rgba(52,211,153,0.5)' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#34D399' }}>מחובר</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>חובר ב-{since}</div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>לא מחובר</span>
                  </div>
                )}
              </div>

              {/* token input */}
              {editing && !p.pro && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    value={tokenInput}
                    onChange={e => setTokenInput(e.target.value)}
                    placeholder={`Access Token של ${p.label}`}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 11, color: '#fff',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      outline: 'none', direction: 'ltr', boxSizing: 'border-box', fontFamily: 'monospace',
                    }}
                  />
                  {error && <div style={{ fontSize: 10, color: '#F87171', marginTop: 4 }}>{error}</div>}
                </div>
              )}

              {/* action button */}
              {p.pro && !active ? (
                <button onClick={() => setShowUpgrade(true)} style={{
                  width: '100%', padding: '9px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(152,80,255,0.12)', border: '1px solid rgba(152,80,255,0.25)',
                  color: PURPLE2, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <i className="ti ti-crown" style={{ fontSize: 13 }} /> שדרג לPro
                </button>
              ) : active ? (
                <button onClick={() => disconnect(p.id)} disabled={busy} style={{
                  width: '100%', padding: '9px', borderRadius: 12, cursor: busy ? 'wait' : 'pointer',
                  background: 'transparent', border: '1px solid rgba(248,113,113,0.25)',
                  color: '#F87171', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: busy ? 0.6 : 1,
                }}>
                  {busy
                    ? <div style={{ width: 12, height: 12, border: '2px solid rgba(248,113,113,0.3)', borderTop: '2px solid #F87171', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <i className="ti ti-unlink" style={{ fontSize: 13 }} />}
                  נתק
                </button>
              ) : editing ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setAddFor(null); setTokenInput(''); setError('') }} style={{ flex: 1, padding: '9px', borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>
                    ביטול
                  </button>
                  <button onClick={connect} disabled={busy || !tokenInput.trim()} style={{
                    flex: 2, padding: '9px', borderRadius: 12, cursor: 'pointer',
                    background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                    border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: !tokenInput.trim() ? 0.5 : 1,
                  }}>
                    {busy
                      ? <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <><i className="ti ti-plug-connected" style={{ fontSize: 13 }} /> חבר</>}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setAddFor(p.id); setError('') }} style={{
                  width: '100%', padding: '9px', borderRadius: 12, cursor: 'pointer',
                  background: p.bg, border: `1px solid ${p.border}`,
                  color: p.color, fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <i className="ti ti-plug-connected" style={{ fontSize: 13 }} /> חבר חשבון
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* info note */}
      <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
        <i className="ti ti-info-circle" style={{ marginLeft: 6, color: PURPLE2 }} />
        לחיבור Facebook / Instagram דרוש Access Token מ-<strong style={{ color: 'rgba(255,255,255,0.5)' }}>Meta for Developers</strong>. את הטוקן ניתן ליצור דרך Graph API Explorer.
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} trigger="generic" />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
