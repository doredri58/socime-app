'use client'
import React, { useState, useRef, useEffect } from 'react'

/* ══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════════════ */
const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const BLUE    = '#3B82EF'
const GREEN   = '#34D399'
const RED     = '#F87171'
const YELLOW  = '#FBBF24'
const ORANGE  = '#FB923C'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
}

/* ══════════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════════ */
type Platform  = 'instagram' | 'facebook' | 'linkedin' | 'tiktok'
type Sentiment = 'complaint' | 'lead' | 'question' | 'ai_handled' | 'positive' | 'spam'
type MsgType   = 'user' | 'ai' | 'human'
type Folder    = 'human_required' | 'ai_handled' | 'all'

interface Message {
  id: string
  type: MsgType
  text: string
  time: string
  authorName?: string
  authorAvatar?: string
}

interface Thread {
  id: string
  platform: Platform
  commenterName: string
  commenterAvatar: string
  snippet: string
  timeAgo: string
  sentiment: Sentiment
  folder: Folder
  unread: boolean
  postContext: {
    thumbnail: string
    caption: string
    type: 'image' | 'video' | 'reel'
    likes: number
    comments: number
  }
  messages: Message[]
  aiDrafts: string[]
}

/* ══════════════════════════════════════════════════════════════════════
   STATIC MOCK DATA
══════════════════════════════════════════════════════════════════════ */
const THREADS: Thread[] = [
  {
    id: '1', platform: 'instagram', commenterName: 'Maya Cohen', commenterAvatar: 'מ',
    snippet: 'הי! ראיתי את הפוסט שלכם ואני מאוד מעוניינת לשמוע עוד על השירות...',
    timeAgo: 'לפני 12 דקות', sentiment: 'lead', folder: 'human_required', unread: true,
    postContext: { thumbnail: '', caption: 'הכירו את המוצר החדש שלנו! 🚀 שנה את העסק שלך עם הטכנולוגיה הכי מתקדמת', type: 'image', likes: 342, comments: 28 },
    messages: [
      { id: 'm1', type: 'user', text: 'הי! ראיתי את הפוסט שלכם ואני מאוד מעוניינת לשמוע עוד על השירות. אפשר לקבל פרטים נוספים על המחיר?', time: '14:32', authorName: 'Maya Cohen' },
      { id: 'm2', type: 'ai', text: 'היי Maya! תודה על ההתעניינות 😊 אנחנו שמחים לספר לך שהשירות שלנו מתחיל מ-₪79 לחודש עם 14 ימי ניסיון חינם. יש לך שאלות ספציפיות?', time: '14:33' },
      { id: 'm3', type: 'user', text: 'מעולה! אבל אני צריכה לדעת אם יש תמיכה בעברית ואם ניתן לנהל כמה חשבונות במקביל', time: '14:35', authorName: 'Maya Cohen' },
    ],
    aiDrafts: [
      'כן בטח! אנחנו תומכים בעברית מלאה ומציעים ניהול עד 5 חשבונות במסלול Pro. רוצה לקבוע שיחת הדגמה?',
      'שלחי לנו הודעה פרטית עם הפרטים שלך ונחזור אליך תוך שעה 📞',
    ],
  },
  {
    id: '2', platform: 'facebook', commenterName: 'David Levi', commenterAvatar: 'ד',
    snippet: 'המוצר שלכם גרם לי נזק! ביצעתי תשלום ולא קיבלתי כלום. דורש החזר מיידי',
    timeAgo: 'לפני 28 דקות', sentiment: 'complaint', folder: 'human_required', unread: true,
    postContext: { thumbnail: '', caption: 'שירות לקוחות 24/7 — אנחנו כאן בשבילכם! 💜', type: 'image', likes: 89, comments: 41 },
    messages: [
      { id: 'm1', type: 'user', text: 'המוצר שלכם גרם לי נזק! ביצעתי תשלום ב-12/06 על סך ₪149 ולא קיבלתי שום אישור ולא גישה למערכת. דורש החזר מיידי!', time: '13:58', authorName: 'David Levi' },
      { id: 'm2', type: 'ai', text: 'שלום David, מצטערים מאוד לשמוע על כך. הנושא שלך הועבר לצוות שלנו לטיפול דחוף. מספר ההזמנה שלך?', time: '13:59' },
      { id: 'm3', type: 'user', text: 'הזמנה #TRX-8821. אני מחכה כבר 3 שעות. זה לא מקובל!', time: '14:05', authorName: 'David Levi' },
      { id: 'm4', type: 'human', text: 'David שלום, אני אישית מטפל בעניינך. בדקתי את ההזמנה — קרתה בעיה טכנית. אשיב ב-DM עם הפתרון.', time: '14:18', authorName: 'נועה — תמיכה' },
    ],
    aiDrafts: [
      'David, מצאנו את ההזמנה שלך. ההחזר עובד ויגיע תוך 3-5 ימי עסקים לכרטיס הקרדיט.',
      'נשלח לך אימייל מיידי עם אישור + קוד קופון כפיצוי על אי הנוחות 🙏',
    ],
  },
  {
    id: '3', platform: 'instagram', commenterName: 'Noa Shapiro', commenterAvatar: 'נ',
    snippet: 'וואו! פוסט מדהים! אני משתמשת בשירות שלכם כבר חצי שנה ועושה המלצה לכולם ❤️',
    timeAgo: 'לפני שעה', sentiment: 'positive', folder: 'ai_handled', unread: false,
    postContext: { thumbnail: '', caption: '10,000 לייקים! תודה לקהילה המדהימה שלנו 🎉', type: 'reel', likes: 1204, comments: 183 },
    messages: [
      { id: 'm1', type: 'user', text: 'וואו! פוסט מדהים! אני משתמשת בשירות שלכם כבר חצי שנה ועושה המלצה לכולם ❤️ ממש שינה לי את העסק', time: '13:12', authorName: 'Noa Shapiro' },
      { id: 'm2', type: 'ai', text: 'Noa אהובה! תודה ענקית על המילים החמות 🥹❤️ אנחנו שמחים שאנחנו חלק מהסיפור שלך! מותר לנו לשתף את הביקורת שלך?', time: '13:13' },
      { id: 'm3', type: 'user', text: 'בטח! שתפו בשמחה 😊', time: '13:15', authorName: 'Noa Shapiro' },
    ],
    aiDrafts: ['אחלה! נשלח לך מאחורי הקלעים גם גישה ל-feature חדשה שעדיין לא יצאה 🎁'],
  },
  {
    id: '4', platform: 'linkedin', commenterName: 'Yoav Mizrahi', commenterAvatar: 'י',
    snippet: 'שאלה טכנית — האם הפלטפורמה תומכת ב-API integration עם מערכות CRM כמו Salesforce?',
    timeAgo: 'לפני 2 שעות', sentiment: 'question', folder: 'human_required', unread: true,
    postContext: { thumbnail: '', caption: 'SociMe — הפלטפורמה לניהול מדיה חברתית לעסקים B2B 🚀', type: 'image', likes: 67, comments: 12 },
    messages: [
      { id: 'm1', type: 'user', text: 'שאלה טכנית — האם הפלטפורמה תומכת ב-API integration עם מערכות CRM כמו Salesforce או HubSpot? אנחנו בוחנים כמה פתרונות.', time: '12:21', authorName: 'Yoav Mizrahi' },
      { id: 'm2', type: 'ai', text: 'שלום Yoav! שאלה מצוינת. נכון לעכשיו אנחנו תומכים ב-Zapier integration שמאפשר חיבור ל-1000+ כלים. Salesforce native integration בפיתוח ויצא ב-Q3. אשמח לתאם שיחה עם הצוות הטכני שלנו?', time: '12:23' },
      { id: 'm3', type: 'user', text: 'מעניין. מה הזמנים הריאליים? ואין בעיות עם GDPR?', time: '12:45', authorName: 'Yoav Mizrahi' },
    ],
    aiDrafts: [
      'כן, אנחנו fully GDPR compliant. נשמח לשלוח לך מסמך compliance + roadmap מפורט למייל',
      'אשמח לחבר אותך עם ה-CTO שלנו לשיחת 30 דקות — מתי נוח לך?',
    ],
  },
  {
    id: '5', platform: 'tiktok', commenterName: 'Shira Ben-David', commenterAvatar: 'ש',
    snippet: 'זה באמת עובד?? לא נראה לי אמיתי',
    timeAgo: 'לפני 3 שעות', sentiment: 'question', folder: 'ai_handled', unread: false,
    postContext: { thumbnail: '', caption: 'ראו איך הכפלנו את המעורבות שלנו ב-300% תוך חודש 📈', type: 'reel', likes: 4821, comments: 394 },
    messages: [
      { id: 'm1', type: 'user', text: 'זה באמת עובד?? לא נראה לי אמיתי 🤨', time: '11:30', authorName: 'Shira Ben-David' },
      { id: 'm2', type: 'ai', text: 'היי Shira! אנחנו מבינים את הספקנות 😄 יש לנו 2,000+ עסקים שמשתמשים בנו ומשיגים תוצאות אמיתיות. רוצה לראות case studies?', time: '11:31' },
      { id: 'm3', type: 'user', text: 'אוקיי שלחי 👀', time: '11:33', authorName: 'Shira Ben-David' },
      { id: 'm4', type: 'ai', text: 'שלחתי לך לינק ב-DM עם 5 סיפורי הצלחה מעסקים ישראלים. תראי בעצמך 🚀', time: '11:34' },
    ],
    aiDrafts: ['גם אפשר להירשם לניסיון חינם של 14 יום — אפס סיכון, בלי כרטיס אשראי ✅'],
  },
  {
    id: '6', platform: 'facebook', commenterName: 'Avi Katz', commenterAvatar: 'א',
    snippet: 'ספאם! אני דיווחתי על הפרסום הזה. מפרסמים דברים שגויים ומטעים',
    timeAgo: 'לפני 4 שעות', sentiment: 'spam', folder: 'ai_handled', unread: false,
    postContext: { thumbnail: '', caption: 'בואו לגלות איך SociMe עוזר לעסקים לגדול 🌱', type: 'image', likes: 156, comments: 23 },
    messages: [
      { id: 'm1', type: 'user', text: 'ספאם! אני דיווחתי על הפרסום הזה. מפרסמים דברים שגויים ומטעים!! 😡', time: '10:15', authorName: 'Avi Katz' },
      { id: 'm2', type: 'ai', text: 'שלום Avi, מצטערים שחשת כך. אם יש טענה ספציפית, נשמח לברר ולתקן. אפשר להיות יותר ספציפי?', time: '10:16' },
    ],
    aiDrafts: ['התגובה טופלה אוטומטית ע״י הסוכן. ניתן להסיר את התגובה אם נדרש.'],
  },
]

/* ══════════════════════════════════════════════════════════════════════
   PLATFORM META
══════════════════════════════════════════════════════════════════════ */
const PLATFORM_META: Record<Platform, { icon: string; color: string; label: string }> = {
  instagram: { icon: 'ti-brand-instagram', color: '#E1306C', label: 'Instagram' },
  facebook:  { icon: 'ti-brand-facebook',  color: '#1877F2', label: 'Facebook'  },
  linkedin:  { icon: 'ti-brand-linkedin',  color: '#0A66C2', label: 'LinkedIn'  },
  tiktok:    { icon: 'ti-brand-tiktok',    color: '#010101', label: 'TikTok'    },
}

/* ══════════════════════════════════════════════════════════════════════
   SENTIMENT META
══════════════════════════════════════════════════════════════════════ */
const SENTIMENT_META: Record<Sentiment, { label: string; color: string; bg: string; border: string; icon: string }> = {
  complaint:  { label: 'תלונה',        color: RED,    bg: 'rgba(248,113,113,0.12)',  border: 'rgba(248,113,113,0.28)',  icon: 'ti-alert-circle'   },
  lead:       { label: 'ליד פוטנציאלי', color: GREEN,  bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.28)',   icon: 'ti-star'           },
  question:   { label: 'שאלה',         color: BLUE,   bg: 'rgba(59,130,239,0.12)',   border: 'rgba(59,130,239,0.28)',   icon: 'ti-help-circle'    },
  ai_handled: { label: 'טופל (AI)',     color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', icon: 'ti-robot' },
  positive:   { label: 'חיובי ❤️',     color: YELLOW, bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.28)',   icon: 'ti-heart'          },
  spam:       { label: 'ספאם',         color: ORANGE, bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)',   icon: 'ti-ban'            },
}

/* ══════════════════════════════════════════════════════════════════════
   FOLDER COUNTS
══════════════════════════════════════════════════════════════════════ */
function folderCount(folder: Folder) {
  if (folder === 'all') return THREADS.length
  return THREADS.filter(t => t.folder === folder).length
}
const HUMAN_UNREAD = THREADS.filter(t => t.folder === 'human_required' && t.unread).length

/* ══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════ */

/* Platform badge floating over avatar */
function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform]
  return (
    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16,
      borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', border: '1.5px solid rgba(13,8,41,0.9)', flexShrink: 0 }}>
      <i className={`ti ${m.icon}`} style={{ fontSize: 8, color: '#fff' }} />
    </div>
  )
}

/* User avatar circle */
function Avatar({ name, size = 38, color = PURPLE }: { name: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${color}88)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 900, color: '#fff',
      border: `1.5px solid ${color}44` }}>
      {name.charAt(0)}
    </div>
  )
}

/* Sentiment pill */
function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const m = SENTIMENT_META[sentiment]
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <i className={`ti ${m.icon}`} style={{ fontSize: 9 }} />
      {m.label}
    </span>
  )
}

/* Post type icon */
function PostTypePill({ type }: { type: 'image' | 'video' | 'reel' }) {
  const map = { image: { icon: 'ti-photo', label: 'תמונה' }, video: { icon: 'ti-video', label: 'וידאו' }, reel: { icon: 'ti-brand-instagram', label: 'Reel' } }
  const m = map[type]
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 6,
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.55)',
      display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <i className={`ti ${m.icon}`} style={{ fontSize: 9 }} />{m.label}
    </span>
  )
}

/* Thread message bubble */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser   = msg.type === 'user'
  const isAI     = msg.type === 'ai'
  const isHuman  = msg.type === 'human'

  if (isUser) return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
      <Avatar name={msg.authorName ?? '?'} size={30} color={BLUE} />
      <div style={{ maxWidth: '68%' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 600 }}>
          {msg.authorName} · {msg.time}
        </div>
        <div style={{ padding: '10px 14px', borderRadius: '4px 16px 16px 16px',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)',
          fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.65, direction: 'rtl' }}>
          {msg.text}
        </div>
      </div>
    </div>
  )

  if (isAI) return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <div style={{ maxWidth: '68%' }}>
        <div style={{ fontSize: 10, color: 'rgba(152,80,255,0.7)', marginBottom: 4, fontWeight: 700,
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
          <i className="ti ti-robot" style={{ fontSize: 11 }} /> סוכן AI · {msg.time}
        </div>
        <div style={{ padding: '10px 14px', borderRadius: '16px 4px 16px 16px',
          background: 'linear-gradient(135deg, rgba(152,80,255,0.14), rgba(190,86,255,0.08))',
          border: '1px solid rgba(152,80,255,0.25)',
          fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.65, direction: 'rtl' }}>
          {msg.text}
        </div>
      </div>
      {/* bot avatar */}
      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(152,80,255,0.3), rgba(190,86,255,0.2))',
        border: '1.5px solid rgba(152,80,255,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-robot" style={{ fontSize: 14, color: PURPLE2 }} />
      </div>
    </div>
  )

  /* human reply */
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <div style={{ maxWidth: '68%' }}>
        <div style={{ fontSize: 10, color: 'rgba(52,211,153,0.7)', marginBottom: 4, fontWeight: 700,
          textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
          <i className="ti ti-user-check" style={{ fontSize: 11 }} /> {msg.authorName} · {msg.time}
        </div>
        <div style={{ padding: '10px 14px', borderRadius: '16px 4px 16px 16px',
          background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(52,211,153,0.06))',
          border: '1px solid rgba(52,211,153,0.22)',
          fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.65, direction: 'rtl' }}>
          {msg.text}
        </div>
      </div>
      <Avatar name={msg.authorName ?? '?'} size={30} color={GREEN} />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function CommunityInbox() {
  const [activeThread, setActiveThread]   = useState<Thread>(THREADS[0])
  const [folder, setFolder]              = useState<Folder>('all')
  const [platforms, setPlatforms]        = useState<Set<Platform>>(new Set(['instagram', 'facebook', 'linkedin', 'tiktok']))
  const [replyText, setReplyText]        = useState('')
  const [threads, setThreads]            = useState(THREADS)
  const [sending, setSending]            = useState(false)
  const [searchQuery, setSearchQuery]    = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)

  /* auto-scroll thread to bottom */
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeThread.id, activeThread.messages.length])

  /* filtered inbox list */
  const inboxList = threads.filter(t => {
    if (!platforms.has(t.platform)) return false
    if (folder !== 'all' && t.folder !== folder) return false
    if (searchQuery) return (t.commenterName + t.snippet).toLowerCase().includes(searchQuery.toLowerCase())
    return true
  })

  /* toggle platform filter */
  function togglePlatform(p: Platform) {
    setPlatforms(prev => {
      const n = new Set(prev)
      if (n.has(p)) { if (n.size > 1) n.delete(p) } else n.add(p)
      return n
    })
  }

  /* send reply */
  async function sendReply() {
    if (!replyText.trim()) return
    setSending(true)
    await new Promise(r => setTimeout(r, 600))
    const newMsg: Message = {
      id: `m${Date.now()}`, type: 'human', authorName: 'אתה',
      text: replyText, time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    }
    const updated = { ...activeThread, messages: [...activeThread.messages, newMsg], unread: false }
    setActiveThread(updated)
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t))
    setReplyText('')
    setSending(false)
  }

  /* use AI draft */
  function useDraft(draft: string) { setReplyText(draft) }

  /* mark as handled */
  function markHandled(threadId: string) {
    setThreads(prev => prev.map(t => t.id === threadId
      ? { ...t, folder: 'ai_handled' as Folder, sentiment: 'ai_handled' as Sentiment, unread: false }
      : t))
    if (activeThread.id === threadId) {
      setActiveThread(prev => ({ ...prev, folder: 'ai_handled', sentiment: 'ai_handled' as Sentiment, unread: false }))
    }
  }

  /* col heights: viewport minus topbar (60px) and main padding top (28px) */
  const COL_HEIGHT = 'calc(100vh - 60px - 28px)'

  return (
    /* Break out of main's 28px 32px padding using negative margins */
    <div style={{
      margin: '-28px -32px 0', display: 'flex', direction: 'rtl',
      height: COL_HEIGHT, overflow: 'hidden',
      fontFamily: 'Space Grotesk, sans-serif',
    }}>

      {/* ════════════════════════════════════════════
          COLUMN 1 — FILTERS & FOLDERS (right)
          220px fixed
      ════════════════════════════════════════════ */}
      <aside style={{
        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(13,8,41,0.6)', backdropFilter: 'blur(20px)',
        overflowY: 'auto',
      }}>
        {/* title */}
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-message-2-heart" style={{ fontSize: 14, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>ניהול קהילה</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Unified Inbox · {threads.filter(t => t.unread).length} חדשים</div>
        </div>

        {/* folders */}
        <div style={{ padding: '14px 12px 6px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8, paddingRight: 4 }}>
            תיקיות
          </div>
          {([
            { id: 'human_required', label: 'דרוש מענה אנושי', icon: 'ti-urgent',         danger: true  },
            { id: 'ai_handled',     label: 'טופל ע"י הסוכן',  icon: 'ti-robot',          danger: false },
            { id: 'all',            label: 'כל ההודעות',       icon: 'ti-messages',       danger: false },
          ] as const).map(f => {
            const active = folder === f.id
            const cnt    = folderCount(f.id)
            return (
              <button key={f.id} onClick={() => setFolder(f.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 10, marginBottom: 2, cursor: 'pointer',
                background: active ? 'rgba(152,80,255,0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(152,80,255,0.28)' : 'transparent'}`,
                textAlign: 'right', transition: 'all 0.15s',
              }}>
                <i className={`ti ${f.icon}`} style={{ fontSize: 15, flexShrink: 0,
                  color: active ? PURPLE2 : f.danger ? RED : 'rgba(255,255,255,0.35)' }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                  {f.label}
                </span>
                {/* badge */}
                {f.id === 'human_required' && HUMAN_UNREAD > 0 ? (
                  <span style={{ fontSize: 10, fontWeight: 900, minWidth: 18, height: 18, borderRadius: 999,
                    background: RED, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 8px ${RED}80`, flexShrink: 0 }}>
                    {HUMAN_UNREAD}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                    {cnt}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* platform filters */}
        <div style={{ padding: '14px 12px', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10, paddingRight: 4 }}>
            פלטפורמות
          </div>
          {(Object.entries(PLATFORM_META) as [Platform, typeof PLATFORM_META[Platform]][]).map(([id, meta]) => {
            const active = platforms.has(id)
            const cnt = threads.filter(t => t.platform === id).length
            return (
              <button key={id} onClick={() => togglePlatform(id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, marginBottom: 4, cursor: 'pointer',
                background: active ? `${meta.color}12` : 'transparent',
                border: `1px solid ${active ? `${meta.color}30` : 'transparent'}`,
                textAlign: 'right', transition: 'all 0.15s',
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: active ? meta.color : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s' }}>
                  <i className={`ti ${meta.icon}`} style={{ fontSize: 13, color: active ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                </div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: active ? 700 : 500,
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
                  {meta.label}
                </span>
                {/* custom toggle pill */}
                <div style={{ width: 32, height: 17, borderRadius: 999, position: 'relative',
                  background: active ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(255,255,255,0.10)',
                  border: `1px solid ${active ? 'rgba(152,80,255,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  flexShrink: 0, transition: 'all 0.2s',
                  boxShadow: active ? '0 0 8px rgba(152,80,255,0.3)' : 'none' }}>
                  <div style={{ position: 'absolute', top: 2, width: 11, height: 11, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s, right 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    ...(active ? { right: 2 } : { left: 2 }) }} />
                </div>
              </button>
            )
          })}
        </div>

        {/* quick stats */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { label: 'ממוצע מענה', val: '4 דק\'', color: GREEN   },
            { label: 'לידים היום',  val: '3',      color: YELLOW  },
            { label: 'תלונות',     val: '1',       color: RED     },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.val}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ════════════════════════════════════════════
          COLUMN 2 — INBOX FEED (middle)
          300px fixed
      ════════════════════════════════════════════ */}
      <div style={{
        width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {/* search */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש בהודעות..."
              style={{ width: '100%', padding: '8px 32px 8px 10px', borderRadius: 10, fontSize: 12, outline: 'none',
                direction: 'rtl', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.25)', paddingRight: 2 }}>
            {inboxList.length} שיחות
          </div>
        </div>

        {/* scrollable thread list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {inboxList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              <i className="ti ti-inbox-off" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
              אין הודעות
            </div>
          )}
          {inboxList.map(thread => {
            const pm      = PLATFORM_META[thread.platform]
            const active  = activeThread.id === thread.id
            return (
              <button key={thread.id} onClick={() => setActiveThread(thread)}
                style={{
                  width: '100%', textAlign: 'right', cursor: 'pointer', padding: '12px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: active
                    ? 'linear-gradient(135deg, rgba(152,80,255,0.12), rgba(190,86,255,0.06))'
                    : thread.unread ? 'rgba(255,255,255,0.03)' : 'transparent',
                  borderRight: active ? `3px solid ${PURPLE}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                {/* top row: avatar + name + time */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                  {/* avatar + platform badge */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar name={thread.commenterAvatar} size={36}
                      color={thread.unread && !active ? PURPLE : 'rgba(120,80,180,0.7)'} />
                    <PlatformBadge platform={thread.platform} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: thread.unread ? 800 : 600,
                        color: thread.unread ? '#fff' : 'rgba(255,255,255,0.7)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {thread.commenterName}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {thread.timeAgo.replace('לפני ', '')}
                      </span>
                    </div>
                    {/* snippet */}
                    <p style={{ fontSize: 11, color: thread.unread ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
                      margin: '3px 0 6px', lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                      {thread.snippet}
                    </p>
                    {/* sentiment + unread dot */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <SentimentBadge sentiment={thread.sentiment} />
                      {thread.unread && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PURPLE2,
                          boxShadow: `0 0 6px ${PURPLE2}`, flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          COLUMN 3 — ACTIVE THREAD (left, widest)
      ════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* ── thread top bar ── */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
          background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)' }}>
          {/* avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={activeThread.commenterAvatar} size={38} />
            <PlatformBadge platform={activeThread.platform} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{activeThread.commenterName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className={`ti ${PLATFORM_META[activeThread.platform].icon}`}
                style={{ fontSize: 12, color: PLATFORM_META[activeThread.platform].color }} />
              {PLATFORM_META[activeThread.platform].label} · {activeThread.timeAgo}
            </div>
          </div>
          {/* actions */}
          <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
            {activeThread.folder !== 'ai_handled' && (
              <button onClick={() => markHandled(activeThread.id)} style={{
                padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)', color: GREEN,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <i className="ti ti-check" style={{ fontSize: 12 }} /> סמן כטופל
              </button>
            )}
            <button style={{ width: 34, height: 34, borderRadius: 9, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-dots" style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }} />
            </button>
          </div>
        </div>

        {/* ── main content: thread + context ── */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

          {/* messages area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* scrollable messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeThread.messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={threadEndRef} />
            </div>

            {/* ── reply box ── */}
            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(13,8,41,0.5)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>

              {/* AI draft pills */}
              {activeThread.aiDrafts.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7,
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="ti ti-sparkles" style={{ fontSize: 11, color: PURPLE2 }} />
                    הצעות AI מהירות
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {activeThread.aiDrafts.map((draft, i) => (
                      <button key={i} onClick={() => useDraft(draft)} style={{
                        padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(152,80,255,0.12), rgba(190,86,255,0.08))',
                        border: '1px solid rgba(152,80,255,0.25)', color: PURPLE2,
                        display: 'flex', alignItems: 'center', gap: 6, textAlign: 'right',
                        maxWidth: 280, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        transition: 'all 0.15s',
                      }}>
                        <i className="ti ti-robot" style={{ fontSize: 11, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {draft.length > 55 ? draft.slice(0, 55) + '...' : draft}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* text input row */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) sendReply() }}
                    placeholder={`השב ל-${activeThread.commenterName}...`}
                    rows={2}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 14, fontSize: 13,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                      color: '#fff', outline: 'none', direction: 'rtl', resize: 'none',
                      fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1.6, boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = `${PURPLE}80`)}
                    onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                  />
                  {/* char count */}
                  <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 9,
                    color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                    {replyText.length}
                  </span>
                </div>
                {/* send button */}
                <button onClick={sendReply} disabled={!replyText.trim() || sending} style={{
                  padding: '11px 18px', borderRadius: 14, cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                  background: replyText.trim()
                    ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`
                    : 'rgba(255,255,255,0.06)',
                  border: 'none', color: replyText.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 7, height: 62,
                  boxShadow: replyText.trim() ? '0 4px 16px rgba(152,80,255,0.35)' : 'none',
                  transition: 'all 0.2s', opacity: sending ? 0.7 : 1,
                }}>
                  {sending
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />שולח</>
                    : <><i className="ti ti-send" style={{ fontSize: 15 }} />שלח תגובה</>
                  }
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
                ⌘+Enter לשליחה מהירה
              </div>
            </div>
          </div>

          {/* ── context panel (right side of thread column) ── */}
          <div style={{
            width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
            background: 'rgba(255,255,255,0.01)',
          }}>
            {/* original post */}
            <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                פוסט מקורי
              </div>
              {/* post thumbnail placeholder */}
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 12, marginBottom: 10, overflow: 'hidden',
                background: `linear-gradient(135deg, rgba(152,80,255,0.15), rgba(59,130,239,0.15))`,
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className={`ti ${activeThread.postContext.type === 'reel' ? 'ti-brand-instagram' : 'ti-photo'}`}
                  style={{ fontSize: 28, color: 'rgba(255,255,255,0.15)' }} />
                <PostTypePill type={activeThread.postContext.type} />
              </div>
              {/* caption */}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: '0 0 10px',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {activeThread.postContext.caption}
              </p>
              {/* post stats */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  <i className="ti ti-heart" style={{ fontSize: 11, color: RED }} />
                  {activeThread.postContext.likes.toLocaleString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  <i className="ti ti-message" style={{ fontSize: 11, color: BLUE }} />
                  {activeThread.postContext.comments}
                </div>
              </div>
            </div>

            {/* commenter profile */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                פרופיל מגיב
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Avatar name={activeThread.commenterAvatar} size={30} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{activeThread.commenterName}</div>
                  <div style={{ fontSize: 10, color: PLATFORM_META[activeThread.platform].color,
                    display: 'flex', alignItems: 'center', gap: 3 }}>
                    <i className={`ti ${PLATFORM_META[activeThread.platform].icon}`} style={{ fontSize: 10 }} />
                    {PLATFORM_META[activeThread.platform].label}
                  </div>
                </div>
              </div>
              <SentimentBadge sentiment={activeThread.sentiment} />
            </div>

            {/* thread info */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                סיכום שיחה
              </div>
              {[
                { label: 'הודעות', val: String(activeThread.messages.length), icon: 'ti-messages' },
                { label: 'התחלה',  val: activeThread.timeAgo,                 icon: 'ti-clock'    },
                { label: 'ערוץ',   val: PLATFORM_META[activeThread.platform].label, icon: 'ti-share' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <i className={`ti ${f.icon}`} style={{ fontSize: 10 }} />{f.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar       { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.20); }
      `}</style>
    </div>
  )
}
