'use client'
import { useState } from 'react'
import Link from 'next/link'

const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const GREEN   = '#34D399'
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
}

const SECTIONS = [
  {
    icon: 'ti-database',
    color: '#60A5FA',
    title: 'מה אנו אוספים',
    items: [
      { label: 'פרטי זיהוי', desc: 'שם, כתובת מייל, תמונת פרופיל (אופציונלי)' },
      { label: 'פרטי עסק', desc: 'שם העסק, תיאור, קהל יעד שהזנתם' },
      { label: 'תוכן שנוצר', desc: 'טיוטות ופוסטים שיצרתם עם ה-AI' },
      { label: 'נתוני שימוש', desc: 'דפים שבקרתם, זמן שימוש, פעולות שביצעתם' },
      { label: 'נתוני תשלום', desc: 'רק אישור עסקה — פרטי כרטיס אשראי אינם נשמרים אצלנו' },
    ],
  },
  {
    icon: 'ti-eye',
    color: '#A78BFA',
    title: 'איך אנו משתמשים במידע',
    items: [
      { label: 'שיפור תוצאות AI', desc: 'התאמת הצעות התוכן לעסק שלכם' },
      { label: 'ניהול חשבון', desc: 'אימות, חיוב, תמיכה טכנית' },
      { label: 'שיפור המוצר', desc: 'ניתוח תבניות שימוש כדי לשפר פיצ\'רים' },
      { label: 'אבטחה', desc: 'זיהוי פעילות חשודה והגנה על חשבונכם' },
    ],
  },
  {
    icon: 'ti-share',
    color: '#F472B6',
    title: 'שיתוף מידע',
    items: [
      { label: 'לא מוכרים מידע', desc: 'אנחנו לעולם לא מוכרים את הנתונים שלכם לצדדים שלישיים' },
      { label: 'ספקי שירות', desc: 'Supabase (מסד נתונים), Google Gemini (מנוע ה-AI), Cloudinary (מדיה), PayPlus (סליקת תשלומים)' },
      { label: 'דרישות חוקיות', desc: 'רק כאשר מחויבים על פי חוק ישראלי' },
    ],
  },
  {
    icon: 'ti-shield-lock',
    color: GREEN,
    title: 'אבטחת מידע',
    items: [
      { label: 'הצפנה', desc: 'כל הנתונים מוצפנים בשכבת ה-DB ובתקשורת (HTTPS/TLS)' },
      { label: 'גישה מוגבלת', desc: 'רק עובדים מורשים יכולים לגשת לנתונים, בהתאם לצורך' },
      { label: 'אחסון בישראל/EU', desc: 'הנתונים מאוחסנים בשרתים תואמי GDPR' },
      { label: 'גיבויים יומיים', desc: 'גיבוי אוטומטי מלא כל 24 שעות' },
    ],
  },
]

const RIGHTS = [
  { icon: 'ti-eye', label: 'זכות עיון', desc: 'לקבל עותק של כל המידע שנשמר אצלנו' },
  { icon: 'ti-pencil', label: 'זכות תיקון', desc: 'לתקן מידע שגוי בפרופיל שלכם' },
  { icon: 'ti-trash', label: 'זכות מחיקה', desc: 'למחוק את החשבון וכל הנתונים תוך 30 יום' },
  { icon: 'ti-download', label: 'זכות ניידות', desc: 'לקבל את הנתונים שלכם בפורמט JSON' },
  { icon: 'ti-ban', label: 'זכות התנגדות', desc: 'להגביל עיבוד נתונים לצרכים שיווקיים' },
]

export default function PrivacyPage() {
  const [openSection, setOpenSection] = useState<number | null>(null)
  const [exportRequested, setExportRequested] = useState(false)

  function handleExport() {
    setExportRequested(true)
    setTimeout(() => setExportRequested(false), 3000)
  }

  return (
    <div style={{ direction: 'rtl', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 15, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08))',
            border: '1px solid rgba(52,211,153,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-shield-check" style={{ fontSize: 22, color: GREEN }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>מרכז הפרטיות</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
              מדיניות פרטיות · עדכון אחרון: ינואר 2026
            </p>
          </div>
        </div>
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
          fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
        }}>
          <i className="ti ti-info-circle" style={{ color: GREEN, marginLeft: 6 }} />
          הפרטיות שלכם חשובה לנו. SociMe מחויבת לשמירה על נתוניכם בהתאם לחוק הגנת הפרטיות הישראלי ו-GDPR.
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
        {SECTIONS.map((sec, i) => (
          <div key={i} style={{
            ...GLASS, overflow: 'hidden',
            border: openSection === i ? '1px solid rgba(152,80,255,0.25)' : '1px solid rgba(255,255,255,0.09)',
            transition: 'border-color 0.2s',
          }}>
            <button
              onClick={() => setOpenSection(openSection === i ? null : i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'right',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${sec.color}18`, border: `1px solid ${sec.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`ti ${sec.icon}`} style={{ fontSize: 17, color: sec.color }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1 }}>{sec.title}</span>
              <i className={`ti ${openSection === i ? 'ti-chevron-up' : 'ti-chevron-down'}`}
                style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)' }} />
            </button>
            {openSection === i && (
              <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {sec.items.map((item, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '10px 0',
                    borderBottom: j < sec.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}>
                    <i className="ti ti-check" style={{ color: sec.color, fontSize: 14, marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Your Rights */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 14 }}>הזכויות שלכם</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginBottom: 32 }}>
        {RIGHTS.map((r, i) => (
          <div key={i} style={{ ...GLASS, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <i className={`ti ${r.icon}`} style={{ fontSize: 18, color: PURPLE2, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{r.label}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 14 }}>פעולות פרטיות</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        <div style={{ ...GLASS, padding: '20px' }}>
          <i className="ti ti-download" style={{ fontSize: 22, color: '#60A5FA', marginBottom: 10, display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 5 }}>ייצוא נתונים</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5 }}>
            קבלו עותק מלא של כל הנתונים שלכם בפורמט JSON תוך 24 שעות למייל.
          </div>
          <button
            onClick={handleExport}
            disabled={exportRequested}
            style={{
              padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              cursor: exportRequested ? 'default' : 'pointer',
              background: exportRequested ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)',
              color: exportRequested ? GREEN : '#60A5FA',
              border: exportRequested ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(96,165,250,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {exportRequested ? '✓ הבקשה נשלחה' : 'בקש ייצוא'}
          </button>
        </div>
        <div style={{ ...GLASS, padding: '20px' }}>
          <i className="ti ti-trash" style={{ fontSize: 22, color: '#F87171', marginBottom: 10, display: 'block' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 5 }}>מחיקת חשבון</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14, lineHeight: 1.5 }}>
            מחיקה קבועה של החשבון וכל הנתונים תוך 30 יום. פעולה בלתי הפיכה.
          </div>
          <Link href="/dashboard/settings?tab=privacy" style={{
            display: 'inline-block', padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: 'rgba(248,113,113,0.1)', color: '#F87171',
            border: '1px solid rgba(248,113,113,0.25)', textDecoration: 'none',
          }}>
            עבור להגדרות
          </Link>
        </div>
      </div>

      {/* Contact */}
      <div style={{ ...GLASS, padding: '22px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <i className="ti ti-mail" style={{ fontSize: 24, color: PURPLE2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>שאלות בנושא פרטיות?</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>פנו לממונה הפרטיות שלנו בכל שאלה</div>
        </div>
        <a href="mailto:privacy@socime.io" style={{
          padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
          color: '#fff', textDecoration: 'none', flexShrink: 0,
          boxShadow: '0 4px 14px rgba(152,80,255,0.35)',
        }}>
          privacy@socime.io
        </a>
      </div>
    </div>
  )
}
