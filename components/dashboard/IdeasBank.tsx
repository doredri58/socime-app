'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/dashboard/UpgradeModal'
import Teleprompter from '@/components/dashboard/Teleprompter'

/* ── design tokens ────────────────────────────────────────────────────── */
const PURPLE  = '#B030F5'
const PURPLE2 = '#CE7BFF'
const BLUE    = '#F72D93'
const GREEN   = '#34D399'
const YELLOW  = '#FBBF24'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20,
}

/* ── types ────────────────────────────────────────────────────────────── */
type Tab        = 'posts' | 'video'
type CategoryId = 'all' | 'sales' | 'behind' | 'tips' | 'events' | 'viral'

interface PostIdea {
  id: string; title: string; description: string; why: string
  category: CategoryId; personalized?: boolean; emoji: string
}

interface VideoIdea {
  id: string; title: string; concept: string; hook: string
  direction: string; script: string; category: CategoryId
  personalized?: boolean; emoji: string
}

interface Props {
  userName: string; tier: string; tokenBalance: number
  businessName: string; businessType: string
}

/* ── static idea data ─────────────────────────────────────────────────── */
const POST_IDEAS: PostIdea[] = [
  { id: 'p1', personalized: true, emoji: '🎯', category: 'tips',
    title: 'הסוד שהלקוחות שלנו לא ידעו לבקש',
    description: 'שתף טיפ פנימי שרק הלקוחות הכי נאמנים שלך מכירים.',
    why: 'יוצר תחושת אקסקלוסיביות ומגביר נאמנות — קהל מרגיש "מועדפים".' },
  { id: 'p2', personalized: true, emoji: '📸', category: 'behind',
    title: 'יום אופייני — מה קורה מאחורי הקלעים?',
    description: 'תצלום/סרטון קצר של שגרת העבודה האמיתית שלך.',
    why: 'אנשים קונים מאנשים. אותנטיות מייצרת אמון גבוה פי 3 מפרסום ישיר.' },
  { id: 'p3', personalized: true, emoji: '🏆', category: 'sales',
    title: 'Case Study: לקוח אחד, תוצאה אחת מדהימה',
    description: 'ספר סיפור הצלחה ספציפי עם מספרים אמיתיים.',
    why: 'Social proof עם נתונים קונקרטיים ממיר פי 4 יותר מהמלצה כללית.' },
  { id: 'p4', emoji: '💥', category: 'sales',
    title: '48 שעות בלבד — מבצע ברק',
    description: 'צור תחושת דחיפות עם מבצע מוגבל בזמן.',
    why: 'FOMO (fear of missing out) מגביר המרות ב-40% בממוצע.' },
  { id: 'p5', emoji: '🎁', category: 'sales',
    title: 'הפתעה לעוקבים הנאמנים ביותר',
    description: 'הכרז על מתנה/הנחה ייחודית לעוקבים בלבד.',
    why: 'מתגמל קהל קיים ומעודד שיתוף אורגני בין חברים.' },
  { id: 'p6', emoji: '❓', category: 'sales',
    title: '"כמה עולה?" — שאלות נפוצות על המחיר',
    description: 'ענה בפומבי על השאלה הנפוצה ביותר על התמחור.',
    why: 'מסיר חסם פסיכולוגי ראשי — שקיפות מחיר מגדילה אמון ופניות.' },
  { id: 'p7', emoji: '🔧', category: 'behind',
    title: 'כך נוצר המוצר שלנו — מהרעיון לגמר',
    description: 'הצג את תהליך היצירה/ייצור בצורה ויזואלית.',
    why: 'תוכן "מאחורי הקלעים" מקבל 30% יותר מעורבות מפוסטים שיווקיים.' },
  { id: 'p8', emoji: '🤝', category: 'behind',
    title: 'הצוות שלנו — הפנים מאחורי המותג',
    description: 'הצג חבר צוות ואת הסיפור שלו בעסק.',
    why: 'הומניזציה של מותג מגבירה חיבור רגשי ונאמנות לטווח ארוך.' },
  { id: 'p9', emoji: '💡', category: 'tips',
    title: '5 טעויות שכולם עושים (ואיך להימנע)',
    description: 'רשימת טעויות נפוצות בתחום שלך עם פתרונות.',
    why: 'תוכן "טעויות" מייצר זדהות ומציב אותך כסמכות מקצועית.' },
  { id: 'p10', emoji: '📋', category: 'tips',
    title: "הצ'קליסט שכל לקוח צריך לפני...",
    description: "תן ערך מיידי עם צ'קליסט שניתן לשמור.",
    why: 'תוכן שניתן לשמור מקבל שיעור bookmarks גבוה פי 5 מפוסט רגיל.' },
  { id: 'p11', emoji: '🔥', category: 'tips',
    title: 'הטיפ שאף אחד לא מדבר עליו',
    description: 'שתף insight לא שגרתי שרק מומחה בתחום יודע.',
    why: 'תוכן קאונטר-אינטואיטיבי מגביר שיתופים ב-60%.' },
  { id: 'p12', emoji: '🎉', category: 'events',
    title: 'ראש השנה מתקרב — תוכן חגיגי לקהל',
    description: 'ברכת חג מקצועית בשילוב ערך רלוונטי לעונה.',
    why: 'פוסטים חגיגיים מייצרים engagement רגשי גבוה ומחזקים קשר אישי.' },
  { id: 'p13', emoji: '📅', category: 'events',
    title: 'יום הולדת לעסק — X שנים של...',
    description: 'חגוג אבן דרך עסקית עם נתונים ותובנות.',
    why: 'אבני דרך מייצרות authenticity ומעודדות תגובות ברכה.' },
  { id: 'p14', emoji: '🚀', category: 'viral',
    title: 'זה הטרנד שמשתלט על הפיד כרגע',
    description: 'התאם את הטרנד הוויראלי הנוכחי לתחום שלך.',
    why: 'תוכן שרוכב על טרנד מקבל 10x חשיפה אורגנית תוך 24 שעות.' },
  { id: 'p15', emoji: '🎯', category: 'viral',
    title: 'הסאונד הזה שובר את האינסטגרם — הגרסה שלנו',
    description: 'השתמש ב-trending audio ויצור גרסה עסקית.',
    why: 'Instagram מקדם תוכן עם trending audio פי 7 יותר.' },
]

const VIDEO_IDEAS: VideoIdea[] = [
  { id: 'v1', personalized: true, emoji: '🎬', category: 'tips',
    title: '3 טעויות נפוצות שעסקים עושים',
    concept: 'חשיפת 3 טעויות קריטיות שמונעות מעסקים לצמוח',
    hook: '90% מהעסקים עושים את הטעות הזאת — ואני הייתי אחד מהם.',
    direction: 'צילום סלפי בהליכה. זום-אין מהיר בכל "טעות". טקסט על המסך עם מספר הטעות.',
    script: 'טעות ראשונה: לא לדעת מי הלקוח האידיאלי. טעות שנייה: לדבר על מוצרים במקום על תוצאות. טעות שלישית: להמתין לפרפקט לפני שמתחילים.' },
  { id: 'v2', personalized: true, emoji: '✨', category: 'behind',
    title: 'יום בחיים שלי',
    concept: 'Vlog קצר של 24 שעות בחיי העסק',
    hook: 'רוצה לראות איך נראה יום טיפוסי? הנה האמת ללא פילטרים.',
    direction: 'מעברים מהירים. מוזיקת רקע אנרגטית. כיתוב של השעה בכל קטע. סגנון "day in my life".',
    script: 'בוקר 7:00 — בדיקת הודעות. 9:00 — פגישה עם לקוח. 12:00 — עבודה. 18:00 — סיכום יום.' },
  { id: 'v3', personalized: true, emoji: '💰', category: 'sales',
    title: 'כמה אני מרוויח? (שקיפות מלאה)',
    concept: 'חשיפת מספרים אמיתיים — בונה אמון עצום',
    hook: 'אף אחד לא מדבר על זה — אז אני אדבר. הכנסות אמיתיות, הוצאות אמיתיות.',
    direction: 'ישיבה מול מצלמה, טון אישי. גרפיקה פשוטה עם המספרים.',
    script: 'החודש הכנסנו X שקל. ההוצאות היו Y. הרווח הנקי Z. מה שלמדתי: [תובנה מפתיעה].' },
  { id: 'v4', emoji: '⚡', category: 'tips',
    title: 'הטריק שחוסך לי 3 שעות ביום',
    concept: 'productivity hack ספציפי ורלוונטי',
    hook: 'אם אתה עדיין עושה את זה ידנית, אתה מבזבז את הזמן הכי יקר שלך.',
    direction: 'Screen recording + קמרה. מעבר מהיר בין לפני לאחרי. דמו חי.',
    script: 'הבעיה: [תאר כאב הזמן]. הפתרון: [הצג את הכלי]. התוצאה: חסכתי X שעות ביום.' },
  { id: 'v5', emoji: '🧠', category: 'tips',
    title: 'מה שלמדתי אחרי 100 לקוחות',
    concept: 'distilled wisdom — patterns from experience',
    hook: 'אחרי 100 לקוחות, שמתי לב לדפוס אחד שחוזר על עצמו.',
    direction: 'Talking head, רקע נקי. B-roll של עבודה. סגנון mentor.',
    script: 'לקוחות מצליחים עושים 3 דברים שמרביתם לא עושים: [1], [2], [3].' },
  { id: 'v6', emoji: '🎁', category: 'sales',
    title: 'מה מקבלים בפועל כשעובדים איתי',
    concept: 'unboxing-style של החוויה עם העסק שלך',
    hook: 'לפני שאתה מחליט — הנה בדיוק מה קורה מהרגע הראשון.',
    direction: 'Walk-through של התהליך. Screen share של תוצרים. Testimonial.',
    script: 'שלב 1: שיחת היכרות. שלב 2: תוכנית אישית. שלב 3: ביצוע. שלב 4: תוצאות.' },
  { id: 'v7', emoji: '🎊', category: 'events',
    title: 'חגגנו X שנים — כך זה התחיל',
    concept: 'Origin story עם נגיעה של נוסטלגיה',
    hook: 'לפני X שנים, פתחתי את העסק הזה מהסלון של הבית.',
    direction: 'תמונות ישנות + חדשות. מעבר זמן ויזואלי. רגשי ואותנטי.',
    script: 'ההתחלה: [סיפור]. הנקודת שבירה: [ניצחון]. היום: [מצב נוכחי]. לאן: [חזון].' },
  { id: 'v8', emoji: '🔥', category: 'viral',
    title: 'POV: הלקוח שלי גילה את...',
    concept: 'POV format שהולך ויראלי — ממשיקות לחוויית לקוח',
    hook: 'POV: גיליתם ש[ההבטחה המרכזית של העסק שלך].',
    direction: 'Aesthetic b-roll. כיתוב מינימליסטי. Trending audio. ידיים ומוצר בלבד.',
    script: 'ויזואל 1: הבעיה. ויזואל 2: הפתרון. ויזואל 3: התוצאה. Overlay text, ללא דיבור.' },
]

const CATEGORIES: { id: CategoryId; label: string; icon: string; pro?: boolean }[] = [
  { id: 'all',    label: 'הכל',              icon: 'ti-layout-grid' },
  { id: 'sales',  label: 'מכירות ומבצעים',   icon: 'ti-tag' },
  { id: 'behind', label: 'מאחורי הקלעים',    icon: 'ti-movie' },
  { id: 'tips',   label: 'טיפים וערך',       icon: 'ti-bulb' },
  { id: 'events', label: 'אירועים ומועדים',   icon: 'ti-calendar-event' },
  { id: 'viral',  label: 'טרנדים ויראליים',   icon: 'ti-flame', pro: true },
]

/* ── reusable bookmark button ─────────────────────────────────────────── */
function BookmarkBtn({ saved, onToggle }: { saved: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} title={saved ? 'הסר שמירה' : 'שמור רעיון'} style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
      background: saved ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${saved ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.10)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
    }}>
      <i className={`ti ${saved ? 'ti-bookmark-filled' : 'ti-bookmark'}`}
        style={{ fontSize: 15, color: saved ? YELLOW : 'rgba(255,255,255,0.4)' }} />
    </button>
  )
}

/* ── post idea card ───────────────────────────────────────────────────── */
function PostCard({ idea, saved, onSave, onGenerate, personalized }: {
  idea: PostIdea; saved: boolean; onSave: () => void
  onGenerate: () => void; personalized?: boolean
}) {
  return (
    <div className="neon-card" style={{
      ...GLASS, padding: '22px', display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box',
      border: personalized ? '1px solid rgba(176,48,245,0.28)' : '1px solid rgba(255,255,255,0.09)',
      background: personalized ? 'rgba(176,48,245,0.07)' : 'rgba(255,255,255,0.05)',
    }}>
      {personalized && (
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(176,48,245,0.14)', filter: 'blur(30px)', pointerEvents: 'none' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{idea.emoji}</div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.45 }}>{idea.title}</h3>
      </div>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', margin: 0, lineHeight: 1.7 }}>{idea.description}</p>

      {/* why it works pill */}
      <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(247,45,147,0.08)',
        border: '1px solid rgba(247,45,147,0.16)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <i className="ti ti-brain" style={{ fontSize: 14, color: BLUE, flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.48)', margin: 0, lineHeight: 1.65 }}>
          <strong style={{ color: 'rgba(247,45,147,0.8)', fontWeight: 700 }}>למה זה עובד: </strong>
          {idea.why}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
        <button onClick={onGenerate} style={{
          flex: 1, padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
          border: 'none', color: '#fff', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          boxShadow: '0 4px 16px rgba(176,48,245,0.3)', transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(-1px)'; b.style.boxShadow = '0 6px 22px rgba(176,48,245,0.45)' }}
        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = '0 4px 16px rgba(176,48,245,0.3)' }}
        >
          <i className="ti ti-sparkles" style={{ fontSize: 13 }} /> צור פוסט מזה
        </button>
        <BookmarkBtn saved={saved} onToggle={onSave} />
      </div>
    </div>
  )
}

/* ── video / storyboard card ──────────────────────────────────────────── */
function VideoCard({ idea, saved, onSave, onSend, onPrompt, personalized }: {
  idea: VideoIdea; saved: boolean; onSave: () => void
  onSend: () => void; onPrompt: () => void; personalized?: boolean
}) {
  return (
    <div className="neon-card" style={{
      ...GLASS, padding: '22px', display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box',
      border: personalized ? '1px solid rgba(251,191,36,0.22)' : '1px solid rgba(255,255,255,0.09)',
      background: personalized ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.04)',
    }}>
      {personalized && (
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(251,191,36,0.08)', filter: 'blur(30px)', pointerEvents: 'none' }} />
      )}

      {/* card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {idea.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.22)',
            color: '#F87171', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
            <i className="ti ti-video" style={{ fontSize: 10 }} />Reel / TikTok
          </span>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.4 }}>{idea.title}</h3>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: '3px 0 0' }}>{idea.concept}</p>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

      {/* storyboard — 3 color-coded sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, flex: 1 }}>

        {/* hook — red */}
        <div style={{ borderRadius: 14, padding: '12px 14px',
          background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(248,113,113,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-bolt" style={{ fontSize: 11, color: '#F87171' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#F87171', letterSpacing: '0.06em' }}>
              הוק • 0–3 שניות
            </span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
            margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            "{idea.hook}"
          </p>
        </div>

        {/* direction — blue */}
        <div style={{ borderRadius: 14, padding: '12px 14px',
          background: 'rgba(247,45,147,0.07)', border: '1px solid rgba(247,45,147,0.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(247,45,147,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-camera" style={{ fontSize: 11, color: BLUE }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: BLUE, letterSpacing: '0.06em' }}>
              הוראות בימוי וצילום
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)',
            margin: 0, lineHeight: 1.65, fontStyle: 'italic' }}>
            {idea.direction}
          </p>
        </div>

        {/* script — green */}
        <div style={{ borderRadius: 14, padding: '12px 14px',
          background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(52,211,153,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-microphone" style={{ fontSize: 11, color: GREEN }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: GREEN, letterSpacing: '0.06em' }}>
              תסריט / אודיו
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', margin: 0, lineHeight: 1.7 }}>
            {idea.script}
          </p>
        </div>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onSend} style={{
          flex: 1, padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
          background: 'linear-gradient(135deg, #F87171, #EF4444)',
          border: 'none', color: '#fff', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          boxShadow: '0 4px 16px rgba(248,113,113,0.28)', transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
        >
          <i className="ti ti-send" style={{ fontSize: 13 }} /> שלח לסטודיו ליצירה
        </button>
        <button onClick={onPrompt} title="פתח פרומפטר" style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
          background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
        }}>
          <i className="ti ti-microphone-2" style={{ fontSize: 15, color: GREEN }} />
        </button>
        <BookmarkBtn saved={saved} onToggle={onSave} />
      </div>
    </div>
  )
}

/* ── section header ───────────────────────────────────────────────────── */
function SectionHeader({ icon, iconBg, iconColor, title, subtitle, count }: {
  icon: string; iconBg: string; iconColor: string
  title: string; subtitle?: string; count?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg,
          border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ fontSize: 14, color: iconColor }} />
        </div>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>{subtitle}</p>}
        </div>
      </div>
      {count !== undefined && (
        <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 999,
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)',
          border: '1px solid rgba(255,255,255,0.09)' }}>
          {count}
        </span>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
      <i className="ti ti-mood-empty" style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
      <div style={{ fontSize: 14 }}>אין רעיונות בקטגוריה זו</div>
    </div>
  )
}

/* ── main export ──────────────────────────────────────────────────────── */
export default function IdeasBank({ userName, tier, businessName }: Props) {
  const router = useRouter()
  const isPro  = tier !== 'free'   // כל מסלול בתשלום (basic/pro/agency)

  const [tab,         setTab]         = useState<Tab>('posts')
  const [category,    setCategory]    = useState<CategoryId>('all')
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set())
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [promptIdea,  setPromptIdea]  = useState<VideoIdea | null>(null)

  function toggleSave(id: string) {
    setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function generatePost(idea: PostIdea) {
    const prompt = encodeURIComponent(`כתוב פוסט על: ${idea.title}\n${idea.description}`)
    router.push(`/dashboard/create?prompt=${prompt}`)
  }

  function sendToStudio(idea: VideoIdea) {
    const prompt = encodeURIComponent(`צור תסריט וידאו:\nכותרת: ${idea.title}\nהוק: ${idea.hook}\nתסריט: ${idea.script}`)
    router.push(`/dashboard/create?prompt=${prompt}`)
  }

  const postIdeas  = useMemo(() => POST_IDEAS.filter(i => category === 'all' || i.category === category), [category])
  const videoIdeas = useMemo(() => VIDEO_IDEAS.filter(i => category === 'all' || i.category === category), [category])

  const personalizedPosts  = postIdeas.filter(i => i.personalized)
  const standardPosts      = postIdeas.filter(i => !i.personalized)
  const personalizedVideos = videoIdeas.filter(i => i.personalized)
  const standardVideos     = videoIdeas.filter(i => !i.personalized)

  const firstName = userName ? userName.split(' ')[0] : ''

  return (
    <div style={{ direction: 'rtl', paddingBottom: 60 }}>

      {/* ── page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          בנק רעיונות
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          רעיונות מותאמים ל{businessName || 'העסק שלך'} — לחץ ליצירת תוכן מיידי
        </p>
      </div>

      {/* ── main tab toggle ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16,
        padding: 4, gap: 4, marginBottom: 20, width: 'fit-content' }}>
        {([
          { id: 'posts' as Tab, label: 'רעיונות לפוסטים',                  icon: 'ti-photo' },
          { id: 'video' as Tab, label: 'תסריטי וידאו (Reels / TikTok)',    icon: 'ti-video' },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 22px', borderRadius: 13, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: tab === t.id ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'transparent',
            border: 'none', color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.38)',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: tab === t.id ? '0 4px 16px rgba(176,48,245,0.35)' : 'none',
            transition: 'all 0.2s',
          }}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} />{t.label}
          </button>
        ))}
      </div>

      {/* ── category filter chips ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {CATEGORIES.map(cat => {
          const active  = category === cat.id
          const blocked = !!cat.pro && !isPro
          return (
            <button key={cat.id}
              onClick={() => blocked ? setShowUpgrade(true) : setCategory(cat.id)}
              style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: active
                  ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`
                  : blocked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                border: active ? 'none'
                  : blocked ? '1px solid rgba(176,48,245,0.2)' : '1px solid rgba(255,255,255,0.10)',
                color: active ? '#fff' : blocked ? PURPLE2 : 'rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.18s',
                boxShadow: active ? '0 3px 12px rgba(176,48,245,0.3)' : 'none',
              }}>
              <i className={`ti ${cat.icon}`} style={{ fontSize: 12 }} />
              {cat.label}
              {blocked && <i className="ti ti-lock" style={{ fontSize: 10, opacity: 0.7 }} />}
            </button>
          )
        })}
      </div>

      {/* ═══════════════ POSTS TAB ═══════════════════════════════════════ */}
      {tab === 'posts' && (
        <>
          {personalizedPosts.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeader
                icon="ti-sparkles" iconBg="rgba(176,48,245,0.15)" iconColor={PURPLE2}
                title={`הותאם במיוחד בשבילך${firstName ? `, ${firstName}` : ''}`}
                subtitle="על סמך פרופיל העסק שלך"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'stretch' }}>
                {personalizedPosts.map(idea => (
                  <PostCard key={idea.id} idea={idea} personalized
                    saved={savedIds.has(idea.id)} onSave={() => toggleSave(idea.id)}
                    onGenerate={() => generatePost(idea)} />
                ))}
              </div>
            </section>
          )}

          {standardPosts.length > 0 && (
            <section>
              <SectionHeader
                icon="ti-layout-grid" iconBg="rgba(255,255,255,0.06)" iconColor="rgba(255,255,255,0.4)"
                title={category === 'all' ? 'כל הרעיונות' : (CATEGORIES.find(c => c.id === category)?.label ?? '')}
                count={standardPosts.length}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'stretch' }}>
                {standardPosts.map(idea => (
                  <PostCard key={idea.id} idea={idea}
                    saved={savedIds.has(idea.id)} onSave={() => toggleSave(idea.id)}
                    onGenerate={() => generatePost(idea)} />
                ))}
              </div>
            </section>
          )}

          {postIdeas.length === 0 && <EmptyState />}
        </>
      )}

      {/* ═══════════════ VIDEO TAB ═══════════════════════════════════════ */}
      {tab === 'video' && (
        <>
          {personalizedVideos.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeader
                icon="ti-video" iconBg="rgba(248,113,113,0.12)" iconColor="#F87171"
                title={`תסריטים מותאמים${firstName ? ` לך, ${firstName}` : ''}`}
                subtitle="כל תסריט מוכן להפקה — פשוט לחץ שלח לסטודיו"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'stretch' }}>
                {personalizedVideos.map(idea => (
                  <VideoCard key={idea.id} idea={idea} personalized
                    saved={savedIds.has(idea.id)} onSave={() => toggleSave(idea.id)}
                    onSend={() => sendToStudio(idea)} onPrompt={() => setPromptIdea(idea)} />
                ))}
              </div>
            </section>
          )}

          {standardVideos.length > 0 && (
            <section>
              <SectionHeader
                icon="ti-layout-grid" iconBg="rgba(255,255,255,0.06)" iconColor="rgba(255,255,255,0.4)"
                title={category === 'all' ? 'כל תסריטי הוידאו' : (CATEGORIES.find(c => c.id === category)?.label ?? '')}
                count={standardVideos.length}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'stretch' }}>
                {standardVideos.map(idea => (
                  <VideoCard key={idea.id} idea={idea}
                    saved={savedIds.has(idea.id)} onSave={() => toggleSave(idea.id)}
                    onSend={() => sendToStudio(idea)} onPrompt={() => setPromptIdea(idea)} />
                ))}
              </div>
            </section>
          )}

          {videoIdeas.length === 0 && <EmptyState />}
        </>
      )}

      {/* ── saved ideas floating pill ── */}
      {savedIds.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 22px',
          borderRadius: 999, background: 'rgba(16,9,44,0.94)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 50, pointerEvents: 'none',
        }}>
          <i className="ti ti-bookmark-filled" style={{ fontSize: 16, color: YELLOW }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{savedIds.size} רעיונות שמורים</span>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} trigger="generic" />}
      {promptIdea && (
        <Teleprompter
          title={promptIdea.title}
          text={`${promptIdea.hook}\n\n${promptIdea.script}`}
          onClose={() => setPromptIdea(null)}
        />
      )}
    </div>
  )
}
