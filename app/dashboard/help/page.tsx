'use client'
import { useState } from 'react'

const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
}

const CATEGORIES = [
  { id: 'start',    icon: 'ti-rocket',          label: 'התחלה מהירה' },
  { id: 'create',   icon: 'ti-sparkles',         label: 'יצירת תוכן' },
  { id: 'schedule', icon: 'ti-calendar-event',   label: 'תזמון ופרסום' },
  { id: 'account',  icon: 'ti-credit-card',      label: 'חשבון ותשלום' },
  { id: 'ai',       icon: 'ti-brain',            label: 'AI וטוקנים' },
  { id: 'connect',  icon: 'ti-plug-connected',   label: 'חיבור פלטפורמות' },
]

const FAQS: Record<string, { q: string; a: string }[]> = {
  start: [
    { q: 'איך מתחילים להשתמש ב-SociMe?', a: 'לאחר הרשמה, מלאו את פרטי העסק בהגדרות (שם, תיאור, קהל יעד). לאחר מכן חברו את חשבונות הרשתות החברתיות שלכם תחת "הגדרות → חיבורי רשתות". עכשיו אתם מוכנים ליצור את הפוסט הראשון שלכם בסטודיו היצירה.' },
    { q: 'מה ההבדל בין המסלולים?', a: 'מסלול חינמי כולל 100 טוקנים AI לניסיון. מסלול Basic (₪199/חודש) כולל 500 טוקנים. מסלול Pro (₪299/חודש) כולל 1,000 טוקנים, תמיכת עדיפות ועורך וידאו AI. מסלול Agency (₪999/חודש) כולל 2,000 טוקנים וניהול עד 5 עסקים.' },
    { q: 'האם יש ניסיון חינמי?', a: 'כן! כל חשבון חדש מקבל 100 טוקנים AI ויכול לנסות את המוצר ללא הגבלת זמן. אין צורך בכרטיס אשראי להרשמה.' },
    { q: 'איך ממלאים את פרופיל העסק?', a: 'היכנסו ל"הגדרות → פרופיל אישי" והזינו שם עסק, תיאור, קהל יעד ותחום פעילות. ככל שתספקו יותר פרטים, כך ה-AI יוצר תוכן מותאם יותר לעסק שלכם.' },
  ],
  create: [
    { q: 'איך הAI יודע מה לכתוב עבורי?', a: 'ה-AI לומד את פרטי העסק שלכם מהפרופיל (שם, תיאור, קהל יעד). ככל שהפרופיל מפורט יותר, כך הפוסטים יהיו מותאמים יותר. אתם גם יכולים להוסיף הוראות ספציפיות בשדה ה-prompt.' },
    { q: 'כמה טוקנים עולה יצירת פוסט?', a: 'יצירת פוסט טקסט עולה כ-10 טוקנים. יצירת תמונה AI עולה כ-25 טוקנים. עריכת וידאו AI עולה כ-10 טוקנים. מספר הטוקנים המדויק מוצג לפני כל פעולה.' },
    { q: 'האם אפשר לערוך את הפוסט שה-AI יצר?', a: 'בהחלט! לאחר היצירה, הטקסט מופיע בעורך ואתם יכולים לערוך אותו חופשית. תוכלו גם להשתמש בכפתורי "קסם" לקיצור, הפיכה למקצועי יותר, הוספת אמוג\'י ועוד.' },
    { q: 'באיזה פלטפורמות תומך הסטודיו?', a: 'כרגע: פייסבוק, אינסטגרם וטיקטוק. כל פלטפורמה מותאמת עם הגבלות תווים שונות ותצוגה מקדימה ייחודית.' },
    { q: 'איך מייצרים תמונה ב-AI?', a: 'בסטודיו היצירה, לאחר כתיבת הטקסט לחצו על "ייצר תמונה ב-AI". ניתן להוסיף תיאור ספציפי לתמונה הרצויה. משתמשי מסלול חינמי מקבלים 2 ניסיונות, Basic 10, ו-Pro ללא הגבלה.' },
  ],
  schedule: [
    { q: 'איך מתזמנים פוסט?', a: 'לחצו על "תזמן" בסטודיו היצירה. תועברו ללוח השנה שם תוכלו לבחור תאריך ושעה. הפוסט יפורסם אוטומטית בשעה שנקבעה.' },
    { q: 'כמה פוסטים אפשר לתזמן?', a: 'אין הגבלה על מספר הפוסטים המתוזמנים בתור, אך כמות הפרסומים בפועל בחודש תלויה במסלול שלכם.' },
    { q: 'מה קורה אם הפרסום נכשל?', a: 'תקבלו התראה במייל ובמערכת. הפוסט ישמר כ"נכשל" בלוח השנה ותוכלו לנסות שוב בלחיצה אחת.' },
    { q: 'האם אפשר לערוך פוסט מתוזמן?', a: 'כן, לחצו על הפוסט בלוח השנה ובחרו "ערוך". הפוסט יחזור לעורך וניתן לשמור אותו מחדש עם תזמון חדש אם תרצו.' },
  ],
  account: [
    { q: 'איך משדרגים מסלול?', a: 'היכנסו ל"מצב חשבון" בסרגל הצד ולחצו על "שדרג עכשיו". תועברו לדף התשלום המאובטח דרך PayPlus. השדרוג מיידי לאחר אישור התשלום.' },
    { q: 'האם אפשר לבטל מנוי?', a: 'כן, אפשר לבטל בכל עת מ"הגדרות → פרטיות ומחיקה". החיוב יפסק בסוף תקופת החיוב הנוכחית ותוכלו להמשיך להשתמש עד אז.' },
    { q: 'האם הנתונים שלי מאובטחים?', a: 'כן. אנו משתמשים ב-Supabase עם הצפנה מלאה בשכבת ה-DB ו-HTTPS לכל התקשורת. פרטי תשלום מאובטחים על ידי PayPlus ואינם נשמרים בשרתינו.' },
    { q: 'האם ניתן לקבל חשבונית?', a: 'כן, חשבוניות נשלחות אוטומטית למייל לאחר כל חיוב. ניתן גם להוריד אותן מ"מצב חשבון → היסטוריית תשלומים".' },
  ],
  ai: [
    { q: 'מה זה טוקנים?', a: 'טוקנים הם יחידת המדידה לשימוש ב-AI. כל פעולת AI (יצירת פוסט, תמונה, וידאו) צורכת כמות מסוימת של טוקנים. הטוקנים מתחדשים בתחילת כל חודש לפי המסלול שלכם.' },
    { q: 'מה קורה כשנגמרים הטוקנים?', a: 'לא תוכלו לבצע פעולות AI נוספות עד לחידוש החודשי. אתם יכולים לשדרג מסלול בכל עת לקבלת טוקנים נוספים מיידית.' },
    { q: 'על איזה מודל AI המערכת פועלת?', a: 'SociMe משתמשת ב-Google Gemini לכתיבת תוכן ולייצור תמונות. מוצגים מודלים מהדור האחרון בלבד לקבלת התוצאות הטובות ביותר.' },
    { q: 'איך משפרים את איכות התוצאות?', a: 'ספקו prompt מפורט עם הקשר (אירוע, קהל יעד, מטרה), מלאו את פרופיל העסק, ובחרו את סגנון הכתיבה המתאים. ניתן גם להשתמש בכפתורי "קסם" לשיפור הפוסט לאחר היצירה.' },
  ],
  connect: [
    { q: 'איך מחברים חשבון פייסבוק?', a: 'היכנסו ל"הגדרות → חיבורי רשתות חברתיות" ולחצו "התחבר" ליד פייסבוק. תועברו לדף ההתחברות של פייסבוק. בחרו את הדפים שתרצו לנהל ואשרו הרשאות.' },
    { q: 'האם SociMe יכולה לפרסם בשמי?', a: 'כן, לאחר חיבור החשבון SociMe מקבלת הרשאות פרסום. תמיד תראו תצוגה מקדימה לפני כל פרסום. אין פרסום אוטומטי ללא אישורכם, אלא אם תזמנתם מראש.' },
    { q: 'האם אפשר לנתק חשבון?', a: 'כן, בכל עת מ"הגדרות → חיבורי רשתות חברתיות" לחצו "נתק". ניתן גם לבטל הרשאות ישירות בהגדרות של כל פלטפורמה.' },
    { q: 'למה הפרסום לאינסטגרם דורש חשבון Business?', a: 'Meta מאפשרת פרסום אוטומטי דרך API רק לחשבונות Instagram Business או Creator. אם יש לכם חשבון אישי, תוכלו להמיר אותו בחינם בהגדרות אינסטגרם.' },
  ],
}

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState('start')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [search, setSearch] = useState('')

  const faqs = FAQS[activeCategory] ?? []
  const filtered = search.trim()
    ? Object.values(FAQS).flat().filter(f =>
        f.q.includes(search) || f.a.includes(search)
      )
    : faqs

  return (
    <div style={{ direction: 'rtl', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, rgba(150,86,254,0.2), rgba(190,86,254,0.1))',
          border: '1px solid rgba(150,86,254,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ti ti-help-circle" style={{ fontSize: 26, color: PURPLE2 }} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>מרכז עזרה</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', margin: '0 0 24px' }}>
          מצאו תשובות לשאלות הנפוצות ביותר
        </p>
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
          <i className="ti ti-search" style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpenFaq(null) }}
            placeholder="חפשו שאלה..."
            style={{
              width: '100%', padding: '13px 44px 13px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 14, outline: 'none', direction: 'rtl',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: 16,
            }}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>
      </div>

      {!search.trim() && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, justifyContent: 'center' }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setActiveCategory(c.id); setOpenFaq(null) }} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: activeCategory === c.id
                ? 'rgba(150,86,254,0.2)' : 'rgba(255,255,255,0.05)',
              color: activeCategory === c.id ? '#fff' : 'rgba(255,255,255,0.45)',
              boxShadow: activeCategory === c.id
                ? `0 0 0 1px ${PURPLE}55` : '0 0 0 1px rgba(255,255,255,0.08)',
            }}>
              <i className={`ti ${c.icon}`} style={{ fontSize: 14, color: activeCategory === c.id ? PURPLE2 : 'rgba(255,255,255,0.3)' }} />
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* FAQ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            לא נמצאו תוצאות עבור &ldquo;{search}&rdquo;
          </div>
        )}
        {filtered.map((faq, i) => (
          <div key={i} style={{
            ...GLASS, overflow: 'hidden',
            border: openFaq === i ? `1px solid rgba(150,86,254,0.3)` : '1px solid rgba(255,255,255,0.09)',
            transition: 'border-color 0.2s',
          }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '17px 20px', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'right', gap: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', flex: 1 }}>{faq.q}</span>
              <i className={`ti ${openFaq === i ? 'ti-chevron-up' : 'ti-chevron-down'}`}
                style={{ fontSize: 15, color: openFaq === i ? PURPLE2 : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
            </button>
            {openFaq === i && (
              <div style={{
                padding: '0 20px 18px', paddingTop: 14,
                fontSize: 13.5, color: 'rgba(255,255,255,0.62)',
                lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div style={{ ...GLASS, padding: '28px', textAlign: 'center' }}>
        <i className="ti ti-mail" style={{ fontSize: 28, color: PURPLE2, display: 'block', marginBottom: 12 }} />
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>לא מצאתם תשובה?</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 18px' }}>
          צוות התמיכה שלנו זמין ראשון–חמישי, 09:00–18:00
        </p>
        <a href="mailto:support@socime.co.il" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 26px', borderRadius: 12, fontSize: 13, fontWeight: 700,
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
          color: '#fff', textDecoration: 'none',
          boxShadow: '0 4px 18px rgba(150,86,254,0.4)',
        }}>
          <i className="ti ti-send" style={{ fontSize: 15 }} />
          שלחו לנו מייל
        </a>
      </div>
    </div>
  )
}
