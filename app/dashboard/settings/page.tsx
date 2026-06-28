'use client'
import { useState, useEffect } from 'react'

const PURPLE = '#9850FF'
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.13)',
  borderRadius: 20,
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="neon-card" style={{ ...GLASS, padding: '24px 28px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(152,80,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ fontSize: 17, color: PURPLE }} />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 13, color: '#fff',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          outline: 'none', direction: 'rtl', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      padding: '12px 24px', borderRadius: 14, zIndex: 99,
      background: ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
      border: `1px solid ${ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
      color: ok ? '#34D399' : '#F87171',
      fontSize: 13, fontWeight: 600, backdropFilter: 'blur(12px)',
    }}>
      {ok ? '✓' : '✗'} {msg}
    </div>
  )
}

export default function SettingsPage() {
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [email, setEmail]     = useState('')
  const [dob, setDob]         = useState('')
  const [curPw, setCurPw]     = useState('')
  const [newPw, setNewPw]     = useState('')
  const [confPw, setConfPw]   = useState('')
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [danger, setDanger]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/account/profile').then(r => r.json()).then(d => {
      if (d.profile) {
        setName(d.profile.name ?? '')
        setEmail(d.profile.email ?? '')
      }
    })
  }, [])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function saveDetails() {
    if (!name.trim()) return showToast('שם לא יכול להיות ריק', false)
    setLoading(true)
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setLoading(false)
    showToast(res.ok ? 'פרטים עודכנו בהצלחה' : 'שגיאה בשמירה', res.ok)
  }

  async function changePassword() {
    if (!curPw || !newPw) return showToast('מלא את כל השדות', false)
    if (newPw !== confPw) return showToast('הסיסמאות אינן תואמות', false)
    if (newPw.length < 8) return showToast('הסיסמה חייבת לפחות 8 תווים', false)
    setLoading(true)
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
    })
    setLoading(false)
    if (res.ok) { setCurPw(''); setNewPw(''); setConfPw('') }
    showToast(res.ok ? 'סיסמה שונתה בהצלחה' : 'שגיאה — בדוק את הסיסמה הנוכחית', res.ok)
  }

  async function exportData() {
    const res = await fetch('/api/account/profile')
    const data = await res.json()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'socime-data.json'; a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteAccount() {
    setLoading(true)
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) { window.location.href = '/' }
    else { setLoading(false); showToast('שגיאה במחיקת החשבון', false) }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {toast && <Toast {...toast} />}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>הגדרות חשבון</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>נהל את פרטי החשבון, הסיסמה והנתונים שלך</p>
      </div>

      {/* Personal */}
      <Section title="פרטים אישיים" icon="ti-user">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="שם מלא" value={name} onChange={setName} placeholder="השם שלך" />
          <Field label="טלפון" type="tel" value={phone} onChange={setPhone} placeholder="05X-XXXXXXX" />
          <Field label="אימייל" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="תאריך לידה" type="date" value={dob} onChange={setDob} />
        </div>
        <button onClick={saveDetails} disabled={loading} style={{
          marginTop: 8, padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
          background: `linear-gradient(135deg, ${PURPLE}, #BE56FF)`,
          color: '#fff', fontSize: 13, fontWeight: 700, border: 'none',
          boxShadow: '0 4px 18px rgba(152,80,255,0.35)',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'שומר...' : 'שמור שינויים'}
        </button>
      </Section>

      {/* Password */}
      <Section title="שינוי סיסמה" icon="ti-lock">
        <div style={{ maxWidth: 400 }}>
          <Field label="סיסמה נוכחית" type="password" value={curPw} onChange={setCurPw} placeholder="••••••••" />
          <Field label="סיסמה חדשה" type="password" value={newPw} onChange={setNewPw} placeholder="מינימום 8 תווים" />
          <Field label="אימות סיסמה חדשה" type="password" value={confPw} onChange={setConfPw} placeholder="••••••••" />
          <button onClick={changePassword} disabled={loading} style={{
            marginTop: 4, padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(152,80,255,0.2)', border: '1px solid rgba(152,80,255,0.35)',
            color: '#BE56FF', fontSize: 13, fontWeight: 700,
          }}>
            עדכן סיסמה
          </button>
        </div>
      </Section>

      {/* Export */}
      <Section title="ייצוא נתונים" icon="ti-download">
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.7 }}>
          הורד עותק של כל הנתונים שלך בפורמט JSON.
        </p>
        <button onClick={exportData} style={{
          padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <i className="ti ti-download" style={{ fontSize: 15 }} />
          הורד את הנתונים שלי
        </button>
      </Section>

      {/* Danger */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px 28px', border: '1px solid rgba(248,113,113,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 17, color: '#F87171' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F87171', margin: 0 }}>אזור מסוכן</h2>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.7 }}>
          מחיקת החשבון היא פעולה בלתי הפיכה. כל הנתונים יימחקו לצמיתות.
        </p>
        {!danger ? (
          <button onClick={() => setDanger(true)} style={{
            padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(248,113,113,0.3)',
            color: '#F87171', fontSize: 13, fontWeight: 600,
          }}>
            מחק חשבון לצמיתות
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>בטוח?</span>
            <button onClick={deleteAccount} disabled={loading} style={{
              padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
              background: '#F87171', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
              {loading ? 'מוחק...' : 'כן, מחק לצמיתות'}
            </button>
            <button onClick={() => setDanger(false)} style={{
              padding: '10px 24px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600,
            }}>
              ביטול
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
