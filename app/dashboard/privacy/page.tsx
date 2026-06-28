import Link from 'next/link'

const GLASS = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 20 } as const

const ACTIONS = [
  { icon: 'ti-download',   color: '#60A5FA', label: 'הורד את הנתונים שלי',      desc: 'קבל עותק של כל המידע שנאגר אצלנו עליך' },
  { icon: 'ti-eye-off',    color: '#A78BFA', label: 'בקש הגבלת עיבוד',          desc: 'הגבל את האופן שבו אנו מעבדים את המידע שלך' },
  { icon: 'ti-trash',      color: '#F87171', label: 'מחק את כל הנתונים שלי',    desc: 'הסר לצמיתות את כל המידע האישי שלך מהמערכת' },
  { icon: 'ti-mail',       color: '#34D399', label: 'פנה אל ממונה הפרטיות',     desc: 'שלח בקשה ישירות לצוות הפרטיות שלנו' },
]

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>מרכז הפרטיות</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>שלוט במידע שלך ובהגדרות הפרטיות</p>
      </div>

      {/* Info collected */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(152,80,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-database" style={{ fontSize: 17, color: '#9850FF' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>מידע שאנו אוספים</h2>
        </div>
        {[
          { label: 'פרטי חשבון', desc: 'שם, אימייל, מספר טלפון' },
          { label: 'נתוני שימוש', desc: 'פוסטים שנוצרו, היסטוריית תזמונים, צריכת טוקנים' },
          { label: 'פרטי עסק', desc: 'שם עסק, תיאור, קהל יעד, שעות פעילות' },
          { label: 'חיבורי רשתות', desc: 'אסימוני גישה לפייסבוק/אינסטגרם (מוצפנים)' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{item.label}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.desc}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-shield-check" style={{ fontSize: 17, color: '#34D399' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>פעולות פרטיות</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ACTIONS.map(a => (
            <button key={a.label} style={{
              padding: '16px', borderRadius: 14, textAlign: 'right', cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <i className={`ti ${a.icon}`} style={{ fontSize: 20, color: a.color }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{a.label}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.7 }}>
        לפרטים נוספים ראה את{' '}
        <Link href="/dashboard/terms" style={{ color: '#9850FF', textDecoration: 'none' }}>מדיניות הפרטיות המלאה שלנו</Link>
      </div>
    </div>
  )
}
