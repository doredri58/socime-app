'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/dashboard/UpgradeModal'

/* ── design tokens ────────────────────────────────────────────────────── */
const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const GREEN   = '#34D399'
const RED     = '#F87171'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 13, color: '#fff',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
  outline: 'none', direction: 'rtl', boxSizing: 'border-box', transition: 'border-color 0.2s',
}

/* ── tab definitions ─────────────────────────────────────────────────── */
type TabId = 'profile' | 'security' | 'notifications' | 'team' | 'privacy'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'profile',       label: 'פרופיל אישי',        icon: 'ti-user-circle'     },
  { id: 'security',      label: 'אבטחה והתחברות',     icon: 'ti-shield-lock'     },
  { id: 'notifications', label: 'התראות',              icon: 'ti-bell'            },
  { id: 'team',          label: 'ניהול צוות',          icon: 'ti-users-group'     },
  { id: 'privacy',       label: 'פרטיות ונתונים',     icon: 'ti-lock-exclamation'},
]

/* ── reusable field ──────────────────────────────────────────────────── */
function Field({ label, type = 'text', value, onChange, placeholder, readOnly }: {
  label: string; type?: string; value: string; onChange?: (v: string) => void
  placeholder?: string; readOnly?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{label}</label>
      <input
        type={type} value={value} readOnly={readOnly}
        placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...INPUT, borderColor: focused ? `${PURPLE}80` : 'rgba(255,255,255,0.10)',
          boxShadow: focused ? '0 0 0 3px rgba(152,80,255,0.10)' : 'none',
          opacity: readOnly ? 0.6 : 1, cursor: readOnly ? 'default' : 'text',
        }}
      />
    </div>
  )
}

/* ── toggle switch ───────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 999, cursor: 'pointer', flexShrink: 0,
      background: on ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(255,255,255,0.12)',
      border: `1px solid ${on ? 'rgba(152,80,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
      position: 'relative', transition: 'all 0.25s',
      boxShadow: on ? '0 0 12px rgba(152,80,255,0.35)' : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.25s, right 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        ...(on ? { right: 3 } : { left: 3 }),
      }} />
    </div>
  )
}

/* ── toggle row ──────────────────────────────────────────────────────── */
function ToggleRow({ icon, iconColor, iconBg, label, sub, on, onChange }: {
  icon: string; iconColor: string; iconBg: string
  label: string; sub?: string; on: boolean; onChange: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg,
          border: `1px solid ${iconColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 16, color: iconColor }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

/* ── save button ─────────────────────────────────────────────────────── */
function SaveBtn({ onClick, loading, label = 'שמור שינויים' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      padding: '11px 26px', borderRadius: 13, cursor: loading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 800,
      background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff',
      display: 'inline-flex', alignItems: 'center', gap: 8,
      boxShadow: '0 4px 18px rgba(152,80,255,0.35)', opacity: loading ? 0.75 : 1, transition: 'all 0.2s',
    }}>
      {loading
        ? <><Spinner />שומר...</>
        : <><i className="ti ti-device-floppy" style={{ fontSize: 15 }} />{label}</>
      }
    </button>
  )
}

function Spinner() {
  return <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
}

/* ── toast ───────────────────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
      padding: '12px 24px', borderRadius: 999, backdropFilter: 'blur(20px)', pointerEvents: 'none',
      background: ok ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)',
      border: `1px solid ${ok ? 'rgba(52,211,153,0.32)' : 'rgba(248,113,113,0.32)'}`,
      display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <i className={`ti ${ok ? 'ti-circle-check' : 'ti-alert-circle'}`}
        style={{ fontSize: 16, color: ok ? GREEN : RED }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{msg}</span>
    </div>
  )
}

/* ── dummy session data ──────────────────────────────────────────────── */
const SESSIONS = [
  { device: 'MacBook Pro 16"', location: 'תל אביב, ישראל', icon: 'ti-device-laptop', current: true,  time: 'פעיל עכשיו'      },
  { device: 'iPhone 15 Pro',  location: 'רמת גן, ישראל',  icon: 'ti-device-mobile',  current: false, time: 'לפני שעה'         },
  { device: 'Chrome / Windows', location: 'חיפה, ישראל',  icon: 'ti-brand-chrome',   current: false, time: 'אתמול, 18:42'    },
]

const TIMEZONES = [
  'Asia/Jerusalem (UTC+3)',
  'Europe/London (UTC+0)',
  'America/New_York (UTC-5)',
  'America/Los_Angeles (UTC-8)',
  'Europe/Berlin (UTC+1)',
  'Asia/Dubai (UTC+4)',
]

/* ════════════════════════════════════════════════════════════════════════
   TAB PANELS
════════════════════════════════════════════════════════════════════════ */

/* Tab 1 — Personal Profile */
function ProfileTab({ showToast }: { showToast: (m: string, ok: boolean) => void }) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [timezone, setTimezone] = useState(TIMEZONES[0])
  const [loading,  setLoading]  = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const [avatar,   setAvatar]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/account/profile').then(r => r.json()).then(d => {
      if (d.profile) { setName(d.profile.name ?? ''); setEmail(d.profile.email ?? '') }
    })
  }, [])

  async function save() {
    if (!name.trim()) return showToast('שם לא יכול להיות ריק', false)
    setLoading(true)
    const res = await fetch('/api/account/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setLoading(false)
    showToast(res.ok ? 'הפרופיל עודכן בהצלחה ✓' : 'שגיאה בשמירה', res.ok)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => avatarRef.current?.click()}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
            background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(152,80,255,0.35)',
            boxShadow: '0 0 20px rgba(152,80,255,0.3)',
          }}>
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{name.charAt(0) || '?'}</span>
            }
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(13,8,41,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            <i className="ti ti-camera" style={{ fontSize: 11, color: '#0D0829' }} />
          </div>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) setAvatar(URL.createObjectURL(f)) }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{name || 'שמך כאן'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>לחץ על התמונה לשינוי</div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

      {/* fields grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="שם מלא"      value={name}     onChange={setName}     placeholder="שמך המלא" />
        <Field label="אימייל אישי" value={email}    readOnly              placeholder="your@email.com" />
        <Field label="תפקיד"       value={jobTitle} onChange={setJobTitle} placeholder="בעלים, מנהל שיווק..." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
            אזור זמן (Timezone)
          </label>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{
            ...INPUT, appearance: 'none', WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center',
            paddingLeft: 32,
          }}>
            {TIMEZONES.map(tz => <option key={tz} value={tz} style={{ background: '#160C3D', color: '#fff' }}>{tz}</option>)}
          </select>
        </div>
      </div>

      <div style={{ paddingTop: 4 }}>
        <SaveBtn onClick={save} loading={loading} />
      </div>
    </div>
  )
}

/* Tab 2 — Security */
function SecurityTab({ showToast }: { showToast: (m: string, ok: boolean) => void }) {
  const [curPw,  setCurPw]  = useState('')
  const [newPw,  setNewPw]  = useState('')
  const [confPw, setConfPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [twoFA,  setTwoFA]  = useState(false)

  async function changePassword() {
    if (!curPw || !newPw) return showToast('מלא את כל השדות', false)
    if (newPw !== confPw)  return showToast('הסיסמאות אינן תואמות', false)
    if (newPw.length < 8)  return showToast('סיסמה חייבת לפחות 8 תווים', false)
    setLoading(true)
    const res = await fetch('/api/account/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    })
    setLoading(false)
    if (res.ok) { setCurPw(''); setNewPw(''); setConfPw('') }
    showToast(res.ok ? 'סיסמה שונתה בהצלחה ✓' : 'שגיאה — בדוק את הסיסמה הנוכחית', res.ok)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* password */}
      <div className="neon-card" style={{ ...GLASS, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(152,80,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-lock" style={{ fontSize: 15, color: PURPLE2 }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>שינוי סיסמה</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>בחר סיסמה חזקה עם לפחות 8 תווים</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="סיסמה נוכחית"     type="password" value={curPw}  onChange={setCurPw}  placeholder="••••••••" />
          <Field label="סיסמה חדשה"       type="password" value={newPw}  onChange={setNewPw}  placeholder="מינימום 8 תווים" />
          <Field label="אימות סיסמה חדשה" type="password" value={confPw} onChange={setConfPw} placeholder="••••••••" />
        </div>
        <button onClick={changePassword} disabled={loading} style={{
          padding: '10px 22px', borderRadius: 12, cursor: loading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700,
          background: 'rgba(152,80,255,0.15)', border: '1px solid rgba(152,80,255,0.3)', color: PURPLE2,
          display: 'inline-flex', alignItems: 'center', gap: 7, opacity: loading ? 0.7 : 1,
        }}>
          {loading ? <><Spinner />מעדכן...</> : <><i className="ti ti-refresh" style={{ fontSize: 13 }} />עדכן סיסמה</>}
        </button>
      </div>

      {/* 2FA */}
      <div className="neon-card" style={{ ...GLASS, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12,
              background: twoFA ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${twoFA ? 'rgba(52,211,153,0.28)' : 'rgba(255,255,255,0.10)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              <i className="ti ti-shield-check" style={{ fontSize: 20, color: twoFA ? GREEN : 'rgba(255,255,255,0.35)', transition: 'color 0.3s' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                אימות דו-שלבי (2FA)
                {twoFA && (
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)', color: GREEN }}>
                    פעיל
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 3, lineHeight: 1.6 }}>
                שכבת הגנה נוספת — קוד חד-פעמי בכל כניסה
              </div>
            </div>
          </div>
          <Toggle on={twoFA} onChange={() => { setTwoFA(p => !p); showToast(twoFA ? '2FA כובה' : '2FA הופעל ✓', true) }} />
        </div>
        {twoFA && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12,
            background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
            fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            <i className="ti ti-info-circle" style={{ color: GREEN, marginLeft: 6 }} />
            קוד אימות ישלח לאימייל שלך בכל כניסה. הגדרת authenticator app בקרוב.
          </div>
        )}
      </div>

      {/* active sessions */}
      <div className="neon-card" style={{ ...GLASS, padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59,130,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-devices" style={{ fontSize: 15, color: '#60A5FA' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>מכשירים פעילים</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{SESSIONS.length} חיבורים פעילים</div>
            </div>
          </div>
          <button onClick={() => showToast('התנתקת מכל המכשירים ✓', true)} style={{
            padding: '7px 14px', borderRadius: 11, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)',
            color: RED, display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <i className="ti ti-logout" style={{ fontSize: 12 }} /> התנתק מכל המכשירים
          </button>
        </div>

        {SESSIONS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: i < SESSIONS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: s.current ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${s.current ? 'rgba(52,211,153,0.22)' : 'rgba(255,255,255,0.09)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 17, color: s.current ? GREEN : 'rgba(255,255,255,0.4)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 7 }}>
                {s.device}
                {s.current && (
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999,
                    background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: GREEN }}>
                    המכשיר הנוכחי
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                <i className="ti ti-map-pin" style={{ fontSize: 10, marginLeft: 3 }} />{s.location} · {s.time}
              </div>
            </div>
            {!s.current && (
              <button onClick={() => showToast('ההתנתקות בוצעה ✓', true)} style={{
                padding: '5px 12px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: 'transparent', border: '1px solid rgba(248,113,113,0.22)', color: 'rgba(248,113,113,0.7)',
              }}>
                נתק
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Tab 3 — Notifications */
function NotificationsTab() {
  const [notifs, setNotifs] = useState({
    publishing:  true,
    lowTokens:   true,
    sysUpdates:  false,
    weeklyReport: true,
    aiSuggestions: true,
  })
  const toggle = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }))

  return (
    <div className="neon-card" style={{ ...GLASS, padding: '22px' }}>
      <div style={{ marginBottom: 4 }}>
        <ToggleRow icon="ti-send"          iconColor="#60A5FA"  iconBg="rgba(59,130,239,0.12)"
          label="התראות על פרסום פוסטים" sub="קבל התראה כשפוסט פורסם בהצלחה"
          on={notifs.publishing} onChange={() => toggle('publishing')} />
        <ToggleRow icon="ti-coins"         iconColor="#FBBF24"  iconBg="rgba(251,191,36,0.10)"
          label="התראות על סיום טוקנים"  sub="קבל התראה כשנותרו פחות מ-20 טוקנים"
          on={notifs.lowTokens} onChange={() => toggle('lowTokens')} />
        <ToggleRow icon="ti-bell-ringing"  iconColor={PURPLE2}  iconBg="rgba(152,80,255,0.12)"
          label="עדכוני מערכת מ-SociMe"   sub="חדשות, שיפורים ותחזוקות מתוכננות"
          on={notifs.sysUpdates} onChange={() => toggle('sysUpdates')} />
        <ToggleRow icon="ti-chart-bar"     iconColor={GREEN}    iconBg="rgba(52,211,153,0.10)"
          label="דוח שבועי"               sub="סיכום ביצועים שבועי כל יום ראשון"
          on={notifs.weeklyReport} onChange={() => toggle('weeklyReport')} />
        <ToggleRow icon="ti-sparkles"      iconColor="#F87171"  iconBg="rgba(248,113,113,0.10)"
          label="הצעות AI חכמות"          sub="כשה-AI מזהה הזדמנות לתוכן מנצח"
          on={notifs.aiSuggestions} onChange={() => toggle('aiSuggestions')} />
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7 }}>
        <i className="ti ti-mail" style={{ marginLeft: 6 }} />
        כל ההתראות נשלחות לאימייל שלך. ניתן לנהל העדפות push notifications מהגדרות הדפדפן.
      </div>
    </div>
  )
}

/* Tab 4 — Team */
function TeamTab({ plan, showToast, onUpgrade }: { plan: string; showToast: (m: string, ok: boolean) => void; onUpgrade: () => void }) {
  const isPro = ['pro', 'agency'].includes(plan)
  const [inviteEmail, setInviteEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor'>('editor')
  const [members, setMembers] = useState([
    { name: 'דוד לוי',   email: 'david@example.com',  role: 'admin',  avatar: 'ד' },
    { name: 'שרה כהן',   email: 'sarah@example.com',  role: 'editor', avatar: 'ש' },
  ])

  function sendInvite() {
    if (!inviteEmail.trim()) return showToast('הזן כתובת אימייל', false)
    showToast(`הזמנה נשלחה ל-${inviteEmail} ✓`, true)
    setInviteEmail('')
  }

  function removeMember(email: string) {
    setMembers(m => m.filter(x => x.email !== email))
    showToast('חבר הצוות הוסר', true)
  }

  if (!isPro) return (
    <div className="neon-card" style={{ ...GLASS, padding: '40px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(152,80,255,0.15)',
        border: '1px solid rgba(152,80,255,0.28)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 16px' }}>
        <i className="ti ti-lock" style={{ fontSize: 26, color: PURPLE2 }} />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>ניהול צוות זמין בPro</h3>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 24px', lineHeight: 1.8 }}>
        שדרג לPro כדי להזמין חברי צוות, להגדיר הרשאות<br />ולעבוד יחד על תוכן המדיה החברתית
      </p>
      <button onClick={onUpgrade} style={{
        padding: '12px 28px', borderRadius: 14, cursor: 'pointer', fontSize: 13, fontWeight: 800,
        background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff',
        display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 18px rgba(152,80,255,0.35)',
      }}>
        <i className="ti ti-crown" style={{ fontSize: 15, color: '#FBBF24' }} /> שדרג לPro
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* invite */}
      <div className="neon-card" style={{ ...GLASS, padding: '22px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>הזמן חבר צוות</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 16 }}>
          ישלח אימייל הזמנה עם לינק גישה ל-SociMe
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com" type="email"
            style={{ ...INPUT, flex: 1, direction: 'ltr' }} />
          <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'editor')} style={{
            ...INPUT, width: 130, flexShrink: 0, direction: 'rtl',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'left 10px center', paddingLeft: 28,
          }}>
            <option value="editor" style={{ background: '#160C3D' }}>עורך</option>
            <option value="admin"  style={{ background: '#160C3D' }}>מנהל</option>
          </select>
          <button onClick={sendInvite} style={{
            padding: '11px 20px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800,
            background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff',
            whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 3px 12px rgba(152,80,255,0.3)',
          }}>
            <i className="ti ti-send" style={{ fontSize: 13 }} /> שלח הזמנה
          </button>
        </div>
      </div>

      {/* members list */}
      <div className="neon-card" style={{ ...GLASS, padding: '22px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 16 }}>
          חברי הצוות ({members.length})
        </div>
        {members.map((m, i) => (
          <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#fff' }}>
              {m.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{m.email}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
              background: m.role === 'admin' ? 'rgba(152,80,255,0.12)' : 'rgba(59,130,239,0.10)',
              border: `1px solid ${m.role === 'admin' ? 'rgba(152,80,255,0.28)' : 'rgba(59,130,239,0.22)'}`,
              color: m.role === 'admin' ? PURPLE2 : '#60A5FA' }}>
              {m.role === 'admin' ? 'מנהל' : 'עורך'}
            </span>
            <button onClick={() => removeMember(m.email)} style={{
              width: 32, height: 32, borderRadius: 9, cursor: 'pointer',
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-trash" style={{ fontSize: 14, color: RED }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Tab 5 — Privacy & Danger */
function PrivacyTab({ showToast }: { showToast: (m: string, ok: boolean) => void }) {
  const [danger, setDanger] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  function exportData() {
    fetch('/api/account/profile').then(r => r.json()).then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a'); a.href = url; a.download = 'socime-data.json'; a.click()
      URL.revokeObjectURL(url)
      showToast('הנתונים הורדו בהצלחה ✓', true)
    })
  }

  async function deleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) { window.location.href = '/' }
    else { setDeleting(false); showToast('שגיאה במחיקת החשבון', false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* export data */}
      <div style={{ ...GLASS, padding: '22px', borderRadius: 20, border: '1px solid rgba(59,130,239,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
              <i className="ti ti-download" style={{ fontSize: 16, color: '#60A5FA' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>הורדת נתונים</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.75 }}>
              קבל עותק של כל הנתונים שלך: פוסטים, הגדרות ופרופיל<br />הקובץ יורד בפורמט JSON
            </p>
          </div>
          <button onClick={exportData} style={{
            padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            background: 'rgba(59,130,239,0.12)', border: '1px solid rgba(59,130,239,0.28)',
            color: '#60A5FA', display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
          }}>
            <i className="ti ti-file-download" style={{ fontSize: 14 }} /> הורד את הנתונים שלי
          </button>
        </div>
      </div>

      {/* danger zone */}
      <div style={{
        padding: '22px', borderRadius: 20,
        background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.22)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(248,113,113,0.14)',
            border: '1px solid rgba(248,113,113,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: RED }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: RED }}>אזור סכנה</div>
            <div style={{ fontSize: 11, color: 'rgba(248,113,113,0.55)', marginTop: 1 }}>פעולות בלתי הפיכות — נא לקרוא בעיון</div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(248,113,113,0.15)', marginBottom: 18 }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
              מחיקת חשבון לצמיתות
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.8 }}>
              פעולה זו תמחק לצמיתות את כל הנתונים שלך כולל:<br />
              פוסטים, טיוטות, לוח שנה, הגדרות ופרטי חשבון.<br />
              <strong style={{ color: 'rgba(248,113,113,0.8)' }}>לא ניתן לשחזר לאחר המחיקה.</strong>
            </p>
          </div>

          {!danger ? (
            <button onClick={() => setDanger(true)} style={{
              padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
              background: 'transparent', border: '1px solid rgba(248,113,113,0.35)',
              color: RED, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7,
            }}>
              <i className="ti ti-trash-x" style={{ fontSize: 14 }} /> מחק חשבון לצמיתות
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: RED, textAlign: 'center' }}>
                האם אתה בטוח לחלוטין?
              </div>
              <button onClick={deleteAccount} disabled={deleting} style={{
                padding: '10px 20px', borderRadius: 12, cursor: deleting ? 'wait' : 'pointer', fontSize: 12, fontWeight: 800,
                background: '#EF4444', border: 'none', color: '#fff', opacity: deleting ? 0.7 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
              }}>
                {deleting ? <><Spinner />מוחק...</> : <><i className="ti ti-trash-x" style={{ fontSize: 13 }} />כן, מחק הכל</>}
              </button>
              <button onClick={() => setDanger(false)} style={{
                padding: '8px', borderRadius: 11, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.55)',
              }}>
                ביטול
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   ROOT PAGE
════════════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeTab, setActiveTab]   = useState<TabId>('profile')
  const [toast,     setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [plan,      setPlan]        = useState('free')
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    fetch('/api/account/profile').then(r => r.json()).then(d => {
      if (d.profile?.tier) setPlan(d.profile.tier)
    })
  }, [])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const activeTabMeta = TABS.find(t => t.id === activeTab)!

  return (
    <div style={{ direction: 'rtl' }}>

      {/* ── page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          הגדרות חשבון
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          ניהול פרופיל, אבטחה, התראות וכל ההגדרות במקום אחד
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── vertical settings sidebar ── */}
        <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4,
          position: 'sticky', top: 24 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            const isDanger = tab.id === 'privacy'
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                width: '100%', padding: '11px 14px', borderRadius: 13, cursor: 'pointer', textAlign: 'right',
                background: active
                  ? isDanger ? 'rgba(248,113,113,0.10)' : 'rgba(152,80,255,0.15)'
                  : 'transparent',
                border: active
                  ? `1px solid ${isDanger ? 'rgba(248,113,113,0.25)' : 'rgba(152,80,255,0.3)'}`
                  : '1px solid transparent',
                color: active
                  ? isDanger ? RED : '#fff'
                  : 'rgba(255,255,255,0.45)',
                fontSize: 13, fontWeight: active ? 700 : 500,
                display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.18s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                <i className={`ti ${tab.icon}`} style={{
                  fontSize: 16, flexShrink: 0,
                  color: active ? (isDanger ? RED : PURPLE2) : 'rgba(255,255,255,0.3)',
                }} />
                {tab.label}
                {active && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: isDanger ? RED : PURPLE2, marginRight: 'auto' }} />
                )}
              </button>
            )
          })}

          {/* divider + plan chip */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 4px' }} />
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(152,80,255,0.08)',
            border: '1px solid rgba(152,80,255,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-crown" style={{ fontSize: 14, color: '#FBBF24' }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: PURPLE2 }}>
                {plan === 'agency' ? 'Agency Plan' : plan === 'pro' ? 'Pro Plan' : plan === 'basic' ? 'Basic Plan' : 'Free Plan'}
              </div>
              {!['pro', 'agency'].includes(plan) && (
                <div onClick={() => setShowUpgrade(true)} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', textDecoration: 'underline', marginTop: 1 }}>
                  שדרג עכשיו
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── main content area ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* content tab header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10,
              background: activeTab === 'privacy' ? 'rgba(248,113,113,0.12)' : 'rgba(152,80,255,0.15)',
              border: `1px solid ${activeTab === 'privacy' ? 'rgba(248,113,113,0.25)' : 'rgba(152,80,255,0.28)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${activeTabMeta.icon}`}
                style={{ fontSize: 16, color: activeTab === 'privacy' ? RED : PURPLE2 }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>{activeTabMeta.label}</h2>
            </div>
          </div>

          {activeTab === 'profile'       && <ProfileTab       showToast={showToast} />}
          {activeTab === 'security'      && <SecurityTab      showToast={showToast} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'team'          && <TeamTab plan={plan} showToast={showToast} onUpgrade={() => setShowUpgrade(true)} />}
          {activeTab === 'privacy'       && <PrivacyTab       showToast={showToast} />}
        </div>
      </div>

      {toast && <Toast {...toast} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} trigger="generic" />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
