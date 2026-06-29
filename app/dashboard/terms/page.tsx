import Link from 'next/link'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
}

const SECTIONS = [
  {
    num: '1',
    title: 'קבלת התנאים',
    body: 'בשימוש בשירות SociMe ("השירות") אתם מסכימים לתנאי שימוש אלה ("התנאים"). אם אינכם מסכימים לתנאים, אנא הימנעו משימוש בשירות. SociMe שומרת לעצמה את הזכות לעדכן תנאים אלה בכל עת עם הודעה מראש של 14 יום.',
  },
  {
    num: '2',
    title: 'השירות',
    body: 'SociMe היא פלטפורמה לניהול רשתות חברתיות המשתמשת בבינה מלאכותית (AI) לייצור תוכן. השירות כולל: יצירת פוסטים, תמונות ווידאו באמצעות AI; ניהול ותזמון פרסומים; ניתוח ביצועים; וניהול קהילה. חלק מהפיצ׳רים זמינים אך ורק למשתמשים בתשלום.',
  },
  {
    num: '3',
    title: 'חשבון משתמש',
    body: 'אתם אחראים לשמירת סודיות פרטי ההתחברות לחשבון שלכם. כל פעילות המתבצעת תחת חשבונכם היא באחריותכם. עליכם להיות בני 18 לפחות לשימוש בשירות. SociMe שומרת לעצמה את הזכות לסגור חשבונות המפרים תנאים אלה.',
  },
  {
    num: '4',
    title: 'תוכן משתמש',
    body: 'אתם שומרים על בעלות התוכן שאתם יוצרים. בשימוש בשירות אתם מעניקים ל-SociMe רישיון מוגבל לאחסון ועיבוד התוכן לצורך מתן השירות. אתם מצהירים שהתוכן שאתם מפרסמים אינו מפר זכויות יוצרים, אינו פוגעני ואינו מפר חוק.',
  },
  {
    num: '5',
    title: 'שימוש מותר',
    body: 'מותר: שימוש לצרכים עסקיים לגיטימיים, שיתוף תוכן מקורי, ניהול עמודים שבבעלותכם. אסור: spam, תוכן פוגעני, הטרדה, הפצת מידע כוזב, פרסום ללא הסכמה, הפרת תנאי שירות של הפלטפורמות (פייסבוק, אינסטגרם, לינקדאין). הפרת הכללים עלולה לגרור השעיית חשבון.',
  },
  {
    num: '6',
    title: 'תשלום וביטול',
    body: 'חיוב חודשי מתבצע בתחילת כל תקופת חיוב. ביטול מינוי אפשרי בכל עת; השירות יישאר פעיל עד סוף תקופת החיוב ששולמה. אין החזרי כספים חלקיים. שינוי מסלול כלפי מעלה מיידי; כלפי מטה בתחילת החיוב הבא. SociMe שומרת לעצמה את הזכות לשנות מחירים עם הודעה של 30 יום.',
  },
  {
    num: '7',
    title: 'קניין רוחני',
    body: 'SociMe ולוגו שלה, ממשק המשתמש, האלגוריתמים והקוד הם קניין בלעדי של SociMe. אין להעתיק, לשכפל, לפרסם מחדש, להנדס לאחור או לאחזר את קוד המקור של השירות. תוכן שנוצר על ידי ה-AI בעזרת prompt שלכם שייך לכם.',
  },
  {
    num: '8',
    title: 'הגבלת אחריות',
    body: 'השירות מסופק "כפי שהוא" (as-is). SociMe אינה אחראית לנזקים עקיפים, תוצאתיים, מקריים או עונשיים הנובעים משימוש בשירות. האחריות המקסימלית של SociMe לא תעלה על סכום החיוב החודשי האחרון שלכם. SociMe אינה אחראית לתוכן שתפרסמו ברשתות החברתיות.',
  },
  {
    num: '9',
    title: 'שינויים בשירות',
    body: 'SociMe שומרת לעצמה את הזכות לשנות, להשהות או להפסיק כל חלק מהשירות בכל עת. שינויים מהותיים יוודעו 14 יום מראש. SociMe לא תישא באחריות לכל הפסד כתוצאה מהפסקת השירות.',
  },
  {
    num: '10',
    title: 'דין וסמכות שיפוטית',
    body: 'תנאים אלה כפופים לדיני מדינת ישראל. כל סכסוך יידון בבתי המשפט המוסמכים בתל אביב–יפו. ניסיון ליישב מחלוקת בהליך גישור מוסכם יקדים כל הליך משפטי.',
  },
]

export default function TermsPage() {
  return (
    <div style={{ direction: 'rtl', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 15, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(152,80,255,0.2), rgba(190,86,255,0.08))',
            border: '1px solid rgba(152,80,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ti ti-file-description" style={{ fontSize: 22, color: '#BE56FF' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>תנאי שימוש ומדיניות</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
              עדכון אחרון: ינואר 2026 · גרסה 2.1
            </p>
          </div>
        </div>
        <div style={{
          padding: '14px 18px', borderRadius: 14,
          background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)',
          fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6,
        }}>
          <i className="ti ti-alert-triangle" style={{ color: '#FBBF24', marginLeft: 6 }} />
          מסמך זה מהווה הסכם משפטי מחייב בין המשתמש לבין SociMe. אנא קראו בעיון לפני השימוש בשירות.
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ ...GLASS, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
          תוכן עניינים
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px' }}>
          {SECTIONS.map(s => (
            <a key={s.num} href={`#sec-${s.num}`} style={{
              fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ color: '#9850FF', fontWeight: 700 }}>{s.num}.</span>
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
        {SECTIONS.map(s => (
          <div key={s.num} id={`sec-${s.num}`} style={{ ...GLASS, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 900, color: '#9850FF',
                background: 'rgba(152,80,255,0.15)', border: '1px solid rgba(152,80,255,0.3)',
                padding: '2px 8px', borderRadius: 6,
              }}>
                סעיף {s.num}
              </span>
              <h2 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{s.title}</h2>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, margin: 0 }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ ...GLASS, padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>שאלות משפטיות?</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>פנו למחלקה המשפטית שלנו</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/dashboard/privacy" style={{
            padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <i className="ti ti-shield-check" style={{ fontSize: 14 }} />
            מדיניות פרטיות
          </Link>
          <a href="mailto:legal@socime.io" style={{
            padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            background: 'linear-gradient(135deg, #9850FF, #BE56FF)',
            color: '#fff', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(152,80,255,0.35)',
          }}>
            <i className="ti ti-mail" style={{ fontSize: 14 }} />
            legal@socime.io
          </a>
        </div>
      </div>
    </div>
  )
}
