const GLASS = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 20 } as const

const DOCS = [
  {
    icon: 'ti-file-text', color: '#9850FF',
    title: 'תנאי שימוש',
    updated: 'עודכן: ינואר 2026',
    points: [
      'SociMe מספקת שירות ליצירת תוכן אוטומטי עבור עסקים.',
      'המשתמש אחראי לתוכן שנוצר ומפורסם דרך הפלטפורמה.',
      'אין להשתמש בשירות ליצירת תוכן פוגעני, מטעה או בלתי חוקי.',
      'SociMe שומרת לעצמה את הזכות להשעות חשבונות שמפרים את התנאים.',
      'השירות מסופק "כפי שהוא" ללא אחריות מוחלטת לזמינות.',
    ],
  },
  {
    icon: 'ti-shield', color: '#60A5FA',
    title: 'מדיניות פרטיות',
    updated: 'עודכן: ינואר 2026',
    points: [
      'אנו אוספים מידע הכרחי בלבד לצורך מתן השירות.',
      'המידע שלך לעולם לא יימכר לצדדים שלישיים.',
      'כל הנתונים מאוחסנים בשרתים מאובטחים עם הצפנה מלאה.',
      'יש לך זכות לעיין, לתקן ולמחוק את המידע שלך בכל עת.',
      'אנו משתמשים בעוגיות לחווית משתמש טובה יותר בלבד.',
    ],
  },
  {
    icon: 'ti-copyright', color: '#34D399',
    title: 'מדיניות קניין רוחני',
    updated: 'עודכן: ינואר 2026',
    points: [
      'התוכן שנוצר על ידי ה-AI שייך למשתמש שיצר אותו.',
      'לוגו SociMe וכל הממשקים מוגנים בזכויות יוצרים.',
      'אין להעתיק, לשכפל או להפיץ חלקים מהפלטפורמה ללא אישור.',
      'המשתמש מעניק ל-SociMe רישיון שימוש לצורך שיפור השירות בלבד.',
      'דיווח על הפרות: legal@socime.co.il',
    ],
  },
]

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>תנאים ומדיניות</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>המסמכים המשפטיים המסדירים את השימוש ב-SociMe</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DOCS.map(doc => (
          <div key={doc.title} className="neon-card" style={{ ...GLASS, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${doc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${doc.icon}`} style={{ fontSize: 17, color: doc.color }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{doc.title}</h2>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{doc.updated}</span>
                </div>
              </div>
              <button style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: `${doc.color}15`, border: `1px solid ${doc.color}30`, color: doc.color,
              }}>
                הורד PDF
              </button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {doc.points.map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  <span style={{ color: doc.color, flexShrink: 0, marginTop: 2 }}>•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.7 }}>
        שאלות משפטיות? פנה אלינו בכתובת{' '}
        <a href="mailto:legal@socime.co.il" style={{ color: '#9850FF', textDecoration: 'none' }}>legal@socime.co.il</a>
      </div>
    </div>
  )
}
