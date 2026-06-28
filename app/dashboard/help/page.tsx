const GLASS = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 20 } as const

const FAQS = [
  { q: 'איך אני יוצר פוסט עם AI?', a: 'עבור לסטודיו יצירה, תאר את הפוסט שאתה רוצה בשדה הטקסט ולחץ "צור קסם". ה-AI יכתוב פוסט מותאם לעסק שלך.' },
  { q: 'מה זה טוקנים?', a: 'טוקנים הם יחידות הקרדיט שמשמשות לכל יצירת תוכן. כל פוסט עולה כמות מסוימת של טוקנים בהתאם לאורכו ומורכבותו.' },
  { q: 'איך אני מחבר את הפייסבוק/אינסטגרם שלי?', a: 'עבור ל"רשתות חברתיות" בסיידבר ולחץ "חבר" ליד הרשת הרצויה. תצטרך לאשר הרשאות בחשבון שלך.' },
  { q: 'האם אפשר לתזמן פוסטים מראש?', a: 'כן! לאחר יצירת פוסט ניתן לקבוע תאריך ושעה לפרסום. הפוסט יפורסם אוטומטית בזמן שקבעת.' },
  { q: 'מה קורה אם נגמרו לי הטוקנים?', a: 'ניתן לרכוש טוקנים נוספים בכל עת דרך "מצב חשבון". תוכנית Pro כוללת כמות גדולה יותר מדי חודש.' },
  { q: 'איך אני משנה את הסיסמה שלי?', a: 'עבור להגדרות > שינוי סיסמה, הזן את הסיסמה הנוכחית ואת החדשה ולחץ "עדכן סיסמה".' },
]

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>מרכז עזרה</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>שאלות נפוצות ומידע על מצב החשבון</p>
      </div>

      {/* FAQ */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(152,80,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-help-circle" style={{ fontSize: 17, color: '#9850FF' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>שאלות נפוצות</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((faq, i) => (
            <details key={i} style={{ borderRadius: 12, overflow: 'hidden' }}>
              <summary style={{
                padding: '13px 16px', cursor: 'pointer', listStyle: 'none',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {faq.q}
                <i className="ti ti-chevron-down" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              </summary>
              <div style={{
                padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.7, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none',
                borderRadius: '0 0 12px 12px',
              }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Account status */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-shield-check" style={{ fontSize: 17, color: '#34D399' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>מצב תקינות החשבון</h2>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
          borderRadius: 14, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#34D399' }}>החשבון תקין — אין הפרות</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>לא נמצאו הפרות מדיניות בחשבון שלך</div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-mail" style={{ fontSize: 17, color: '#60A5FA' }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>צור קשר</h2>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.7 }}>
          לא מצאת תשובה? צוות התמיכה שלנו זמין 24/7.
        </p>
        <a href="mailto:support@socime.co.il" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 12,
          background: 'rgba(59,130,239,0.15)', border: '1px solid rgba(59,130,239,0.3)',
          color: '#60A5FA', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          <i className="ti ti-mail" style={{ fontSize: 15 }} />
          support@socime.co.il
        </a>
      </div>
    </div>
  )
}
