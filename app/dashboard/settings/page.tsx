'use client'
import { useState } from 'react'

const PURPLE = '#9850FF'
const GLASS = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 20 } as const

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

function Field({ label, type = 'text', placeholder, defaultValue }: { label: string; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} defaultValue={defaultValue} placeholder={placeholder} style={{
        width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 13, color: '#fff',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
        outline: 'none', direction: 'rtl', boxSizing: 'border-box',
      }} />
    </div>
  )
}

export default function SettingsPage() {
  const [danger, setDanger] = useState(false)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>הגדרות חשבון</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>נהל את פרטי החשבון, הסיסמה והנתונים שלך</p>
      </div>

      {/* Personal details */}
      <Section title="פרטים אישיים" icon="ti-user">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="שם מלא" placeholder="השם שלך" />
          <Field label="מספר טלפון" type="tel" placeholder="05X-XXXXXXX" />
          <Field label="כתובת אימייל" type="email" placeholder="you@example.com" />
          <Field label="תאריך לידה" type="date" />
        </div>
        <button style={{
          marginTop: 8, padding: '10px 24px', borderRadius: 12,
          background: `linear-gradient(135deg, ${PURPLE}, #BE56FF)`,
          color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(152,80,255,0.35)',
        }}>
          שמור שינויים
        </button>
      </Section>

      {/* Change password */}
      <Section title="שינוי סיסמה" icon="ti-lock">
        <div style={{ maxWidth: 400 }}>
          <Field label="סיסמה נוכחית" type="password" placeholder="••••••••" />
          <Field label="סיסמה חדשה" type="password" placeholder="••••••••" />
          <Field label="אימות סיסמה חדשה" type="password" placeholder="••••••••" />
          <button style={{
            marginTop: 4, padding: '10px 24px', borderRadius: 12,
            background: 'rgba(152,80,255,0.2)', border: '1px solid rgba(152,80,255,0.35)',
            color: '#BE56FF', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            עדכן סיסמה
          </button>
        </div>
      </Section>

      {/* Data */}
      <Section title="ייצוא נתונים" icon="ti-download">
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.7 }}>
          הורד עותק של כל הנתונים שלך — פוסטים, הגדרות עסק ופרטי חשבון — בפורמט JSON.
        </p>
        <button style={{
          padding: '10px 24px', borderRadius: 12,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <i className="ti ti-download" style={{ fontSize: 15 }} />
          הורד את הנתונים שלי
        </button>
      </Section>

      {/* Danger zone */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px 28px', border: '1px solid rgba(248,113,113,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 17, color: '#F87171' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F87171', margin: 0 }}>אזור מסוכן</h2>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.7 }}>
          מחיקת החשבון היא פעולה בלתי הפיכה. כל הנתונים, הפוסטים וההגדרות יימחקו לצמיתות.
        </p>
        {!danger ? (
          <button onClick={() => setDanger(true)} style={{
            padding: '10px 24px', borderRadius: 12,
            background: 'transparent', border: '1px solid rgba(248,113,113,0.3)',
            color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            מחק חשבון לצמיתות
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              padding: '10px 24px', borderRadius: 12,
              background: '#F87171', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              כן, מחק לצמיתות
            </button>
            <button onClick={() => setDanger(false)} style={{
              padding: '10px 24px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              ביטול
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
