'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/dashboard/UpgradeModal'
import Teleprompter from '@/components/dashboard/Teleprompter'

/* ── design tokens ────────────────────────────────────────────────────── */
const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'
const BLUE    = '#3B82EF'
const GREEN   = '#0A7159'
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

// A ready-to-publish post generated for the business: full body + hashtags,
// not a concept. `title`/`emoji` are just for the card header.
export interface PostIdea {
  id: string; emoji: string; title: string; category: CategoryId
  text: string; hashtags: string
}

/** The shape of an AI-generated ready post cached on the business profile. */
export type PostIdeaSeed = PostIdea

interface VideoIdea {
  id: string; title: string; concept: string; hook: string
  direction: string; script: string; category: CategoryId
  personalized?: boolean; emoji: string
}

interface Props {
  userName: string; tier: string; tokenBalance: number
  businessName: string; businessType: string
  hasBusiness: boolean
  initialPostIdeas: PostIdeaSeed[]
}

/* ── static idea data ─────────────────────────────────────────────────────
   Posts are AI-generated per business (see /api/ideas/generate). Video ideas
   are still a static library — personalising them is phase 2. */

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
    concept: 'unboxing-style של החוויה עם העסק שלכם',
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

/* ── ready-post card ──────────────────────────────────────────────────────
   Shows a full, publish-ready post (body + hashtags). "העלה לתזמון" hands it to
   the studio already written — no generation, no extra tokens. */
function PostCard({ idea, saved, onSave, onSend }: {
  idea: PostIdea; saved: boolean; onSave: () => void; onSend: () => void
}) {
  const tags = idea.hashtags ? idea.hashtags.split(/\s+/).filter(Boolean) : []
  return (
    <div className="neon-card" style={{
      ...GLASS, padding: '22px', display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative', overflow: 'hidden', height: '100%', boxSizing: 'border-box',
      border: '1px solid rgba(150,86,254,0.28)', background: 'rgba(150,86,254,0.07)',
    }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        borderRadius: '50%', background: 'rgba(150,86,254,0.14)', filter: 'blur(30px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{idea.emoji}</div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.45 }}>{idea.title}</h3>
      </div>

      {/* the actual post body */}
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{idea.text}</p>

      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.slice(0, 7).map((t, i) => (
            <span key={i} style={{ fontSize: 11, color: BLUE, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
        <button onClick={onSend} style={{
          flex: 1, padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
          border: 'none', color: '#fff', fontSize: 12, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          boxShadow: '0 4px 16px rgba(150,86,254,0.3)', transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translateY(-1px)'; b.style.boxShadow = '0 6px 22px rgba(150,86,254,0.45)' }}
        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = '0 4px 16px rgba(150,86,254,0.3)' }}
        >
          <i className="ti ti-calendar-plus" style={{ fontSize: 13 }} /> העלה לתזמון
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
            color: '#CC1F1F', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
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
              <i className="ti ti-bolt" style={{ fontSize: 11, color: '#CC1F1F' }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#CC1F1F', letterSpacing: '0.06em' }}>
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
          background: 'rgba(59,130,239,0.07)', border: '1px solid rgba(59,130,239,0.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(59,130,239,0.18)',
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
          background: 'linear-gradient(135deg, #CC1F1F, #EF4444)',
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
export default function IdeasBank({ tier, hasBusiness, initialPostIdeas }: Props) {
  const router = useRouter()
  const isPro  = tier !== 'free'   // כל מסלול בתשלום (basic/pro/agency)

  const [tab,         setTab]         = useState<Tab>('posts')
  const [category,    setCategory]    = useState<CategoryId>('all')
  const [savedIds,    setSavedIds]    = useState<Set<string>>(new Set())
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [promptIdea,  setPromptIdea]  = useState<VideoIdea | null>(null)

  // A batch of ready-to-publish posts, generated on demand (20 tokens) and
  // seeded from the server-side cache. User-triggered only — no auto-generation.
  // The batch persists until the user regenerates or sends every post to the
  // studio. Video ideas stay the static VIDEO_IDEAS library (phase 2).
  const [posts,      setPosts]      = useState<PostIdea[]>(initialPostIdeas)
  const [genLoading, setGenLoading] = useState(false)
  const [genError,   setGenError]   = useState('')

  // `force` skips the "you'll discard the current batch" confirm — used when the
  // bank is already empty (nothing to lose).
  async function generateBatch(force = false) {
    if (genLoading) return
    if (!force && posts.length > 0) {
      const ok = window.confirm(`יצירת רעיונות חדשים תעלה 20 טוקנים ותחליף את ${posts.length} הפוסטים הנוכחיים. להמשיך?`)
      if (!ok) return
    }
    setGenLoading(true); setGenError('')
    try {
      const res = await fetch('/api/ideas/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        if (data.insufficientTokens) setShowUpgrade(true)
        else setGenError(data.error ?? 'שגיאה ביצירת פוסטים')
        return
      }
      setPosts(data.posts as PostIdea[])
    } catch {
      setGenError('שגיאת רשת — נסו שוב')
    } finally {
      setGenLoading(false)
    }
  }

  function toggleSave(id: string) {
    setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // "Implement": hand the ready post to the studio (prefilled, no regeneration)
  // and drop it from the batch server-side so it doesn't reappear on return.
  function sendPost(idea: PostIdea) {
    setPosts(prev => prev.filter(p => p.id !== idea.id))
    fetch('/api/ideas/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idea.id }),
    }).catch(() => {})
    const q = new URLSearchParams({ text: idea.text, hashtags: idea.hashtags })
    router.push(`/dashboard/create?${q.toString()}`)
  }

  function sendToStudio(idea: VideoIdea) {
    const prompt = encodeURIComponent(`צור תסריט וידאו:\nכותרת: ${idea.title}\nהוק: ${idea.hook}\nתסריט: ${idea.script}`)
    router.push(`/dashboard/create?prompt=${prompt}`)
  }

  const postIdeas  = useMemo(() => posts.filter(i => category === 'all' || i.category === category), [posts, category])
  const videoIdeas = useMemo(() => VIDEO_IDEAS.filter(i => category === 'all' || i.category === category), [category])

  const personalizedVideos = videoIdeas.filter(i => i.personalized)
  const standardVideos     = videoIdeas.filter(i => !i.personalized)


  return (
    <div style={{ direction: 'rtl', paddingBottom: 60 }}>

      {/* ── page header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
          בנק רעיונות
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          6 פוסטים מוכנים לעסק שלכם ב-20 טוקנים — שולחים לתזמון והם נעלמים מהבנק
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
            boxShadow: tab === t.id ? '0 4px 16px rgba(150,86,254,0.35)' : 'none',
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
                  : blocked ? '1px solid rgba(150,86,254,0.2)' : '1px solid rgba(255,255,255,0.10)',
                color: active ? '#fff' : blocked ? PURPLE2 : 'rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.18s',
                boxShadow: active ? '0 3px 12px rgba(150,86,254,0.3)' : 'none',
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
          {/* header row: title + regenerate (only when a batch exists) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
            <SectionHeader
              icon="ti-sparkles" iconBg="rgba(150,86,254,0.15)" iconColor={PURPLE2}
              title="פוסטים מוכנים לעסק שלכם"
              subtitle="נכתבו על סמך פרופיל העסק — מוכנים לתזמון ופרסום"
            />
            {hasBusiness && posts.length > 0 && (
              <button
                onClick={() => generateBatch()}
                disabled={genLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 999, cursor: genLoading ? 'wait' : 'pointer',
                  background: 'rgba(150,86,254,0.12)', border: '1px solid rgba(150,86,254,0.3)',
                  color: PURPLE2, fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-rubik),sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                {genLoading
                  ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(190,86,254,0.3)', borderTop: `2px solid ${PURPLE2}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> כותבת…</>
                  : <><i className="ti ti-refresh" style={{ fontSize: 14 }} /> 6 חדשים · 20 טוקנים</>}
              </button>
            )}
          </div>

          {/* no business yet → can't personalise */}
          {!hasBusiness && (
            <div style={{ textAlign: 'center', padding: '54px 20px', color: 'rgba(255,255,255,0.4)' }}>
              <i className="ti ti-building-store" style={{ fontSize: 38, display: 'block', marginBottom: 12, color: PURPLE2 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>קודם נכיר את העסק</div>
              <div style={{ fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>כדי לקבל פוסטים מותאמים באמת, השלימו את פרופיל העסק.</div>
              <button onClick={() => router.push('/dashboard/business')} style={{
                padding: '10px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, color: '#fff',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-rubik),sans-serif',
              }}>למילוי פרופיל העסק</button>
            </div>
          )}

          {/* generating a batch */}
          {hasBusiness && genLoading && postIdeas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '54px 20px', color: 'rgba(255,255,255,0.45)' }}>
              <span style={{ width: 30, height: 30, border: '3px solid rgba(190,86,254,0.25)', borderTop: `3px solid ${PURPLE2}`, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite', marginBottom: 14 }} />
              <div style={{ fontSize: 14 }}>כותבת 6 פוסטים מותאמים לעסק שלכם…</div>
            </div>
          )}

          {/* empty batch → the big generate CTA (business set, nothing generated/all sent) */}
          {hasBusiness && !genLoading && posts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <i className="ti ti-sparkles" style={{ fontSize: 40, display: 'block', marginBottom: 14, color: PURPLE2 }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>6 פוסטים מוכנים בלחיצה</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 4, lineHeight: 1.6 }}>
                מותאמים לעסק שלכם, כתובים ומוכנים לתזמון.
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginBottom: 20 }}>
                6 פוסטים ב-20 טוקנים — במקום 30 בסטודיו.
              </div>
              {genError && <div style={{ fontSize: 12.5, color: '#F87171', marginBottom: 14 }}>{genError}</div>}
              <button onClick={() => generateBatch(true)} style={{
                padding: '13px 30px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, color: '#fff',
                fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-rubik),sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 6px 22px rgba(150,86,254,0.4)',
              }}>
                <i className="ti ti-wand" style={{ fontSize: 16 }} /> צרו לי 6 פוסטים
              </button>
            </div>
          )}

          {/* the ready posts */}
          {postIdeas.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'stretch' }}>
              {postIdeas.map(idea => (
                <PostCard key={idea.id} idea={idea}
                  saved={savedIds.has(idea.id)} onSave={() => toggleSave(idea.id)}
                  onSend={() => sendPost(idea)} />
              ))}
            </div>
          )}

          {/* batch exists but this category filter is empty */}
          {hasBusiness && !genLoading && posts.length > 0 && postIdeas.length === 0 && <EmptyState />}
        </>
      )}

      {/* ═══════════════ VIDEO TAB ═══════════════════════════════════════ */}
      {tab === 'video' && (
        <>
          {personalizedVideos.length > 0 && (
            <section style={{ marginBottom: 36 }}>
              <SectionHeader
                icon="ti-video" iconBg="rgba(248,113,113,0.12)" iconColor="#CC1F1F"
                title="תסריטים מומלצים להתחלה"
                subtitle="כל תסריט מוכן להפקה — פשוט לחצו שלח לסטודיו"
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

      {/* spin keyframe is not global (see CreateStudio) — declare it locally */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
