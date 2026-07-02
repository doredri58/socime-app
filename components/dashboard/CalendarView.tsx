'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/dashboard/UpgradeModal'

// ─── constants ────────────────────────────────────────────────────────────────
const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const BLUE    = '#3B82EF'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 20,
}

const HE_DAYS  = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const HE_DAYS_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']

const PLATFORM_META: Record<string, { icon: string; color: string; label: string }> = {
  facebook:  { icon: 'ti-brand-facebook',  color: '#1877F2', label: 'פייסבוק' },
  instagram: { icon: 'ti-brand-instagram', color: '#E1306C', label: 'אינסטגרם' },
  tiktok:    { icon: 'ti-brand-tiktok',    color: '#ff0050', label: 'טיקטוק' },
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:            { label: 'טיוטה',        color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', dot: '#94A3B8' },
  scheduled:        { label: 'מתוזמן',       color: '#34D399', bg: 'rgba(52,211,153,0.15)',  dot: '#34D399' },
  pending_approval: { label: 'ממתין',        color: '#FBBF24', bg: 'rgba(251,191,36,0.15)',  dot: '#FBBF24' },
  queued:           { label: 'בתור',         color: PURPLE2,   bg: 'rgba(190,86,255,0.15)',  dot: PURPLE2  },
  published:        { label: 'פורסם',        color: '#60A5FA', bg: 'rgba(96,165,250,0.15)',  dot: '#60A5FA' },
  failed:           { label: 'נכשל',         color: '#F87171', bg: 'rgba(248,113,113,0.15)', dot: '#F87171' },
  paused:           { label: 'מושהה',        color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', dot: '#94A3B8' },
}

// ─── types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string
  content_text: string | null
  hashtags: string | null
  platform: string[] | null
  status: string
  scheduled_at: string | null
  created_at: string
  payload_url: string | null
  content_type: string | null
}

interface Props {
  posts: Post[]
  userId: string
  draftText?: string
  draftPlatform?: string
}

type ViewMode = 'month' | 'week'

// ─── helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function getWeekStart(d: Date) {
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.getFullYear(), d.getMonth(), diff)
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PostCard({ post, compact = false }: { post: Post; compact?: boolean }) {
  const s = STATUS_META[post.status] ?? STATUS_META.draft
  const platforms = post.platform ?? []
  const snippet = (post.content_text ?? '').slice(0, compact ? 40 : 80)

  return (
    <div style={{
      padding: compact ? '5px 8px' : '8px 10px',
      borderRadius: 10,
      background: s.bg,
      border: `1px solid ${s.dot}30`,
      marginBottom: 4,
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px ${s.dot}25` }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '' }}
    >
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: compact ? 2 : 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
        {!compact && post.scheduled_at && (
          <span style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{formatTime(post.scheduled_at)}</span>
        )}
        <div style={{ display: 'flex', gap: 3, marginRight: 'auto' }}>
          {platforms.slice(0, 2).map(p => {
            const pm = PLATFORM_META[p]
            return pm ? <i key={p} className={`ti ${pm.icon}`} style={{ fontSize: 10, color: pm.color }} /> : null
          })}
        </div>
      </div>
      {/* snippet */}
      {snippet && (
        <div style={{ fontSize: compact ? 9 : 10, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, direction: 'rtl' }}>
          {snippet}{(post.content_text ?? '').length > (compact ? 40 : 80) ? '...' : ''}
        </div>
      )}
      {!compact && (
        <div style={{ marginTop: 4, fontSize: 9, color: s.color, fontWeight: 700 }}>{s.label}</div>
      )}
    </div>
  )
}

function PostDetail({ post, onClose, onStatusChange }: {
  post: Post; onClose: () => void
  onStatusChange: (id: string, status: string) => Promise<void>
}) {
  const s   = STATUS_META[post.status] ?? STATUS_META.draft
  const plats = post.platform ?? []
  const [busy, setBusy] = useState(false)

  // pausable = still waiting to go out; paused = currently held back from the cron queue
  const isPausable = ['queued', 'pending_approval', 'scheduled'].includes(post.status)
  const isPaused    = post.status === 'paused'

  async function togglePause() {
    setBusy(true)
    await onStatusChange(post.id, isPaused ? 'queued' : 'paused')
    setBusy(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 420, ...GLASS, borderRadius: 24, padding: 28, direction: 'rtl',
        background: 'rgba(22,12,61,0.97)',
      }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</span>
            </div>
            {post.scheduled_at && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <i className="ti ti-calendar" style={{ marginLeft: 5 }} />
                {formatDate(post.scheduled_at)} בשעה {formatTime(post.scheduled_at)}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* platforms */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {plats.map(p => {
            const pm = PLATFORM_META[p]
            return pm ? (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: `${pm.color}18`, border: `1px solid ${pm.color}33` }}>
                <i className={`ti ${pm.icon}`} style={{ fontSize: 13, color: pm.color }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: pm.color }}>{pm.label}</span>
              </div>
            ) : null
          })}
        </div>

        {/* content */}
        <div style={{
          padding: '14px', borderRadius: 14,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 13, color: '#fff', lineHeight: 1.75, direction: 'rtl',
          marginBottom: 14, maxHeight: 200, overflowY: 'auto',
          whiteSpace: 'pre-wrap',
        }}>
          {post.content_text || '(אין תוכן)'}
        </div>

        {/* hashtags */}
        {post.hashtags && (
          <div style={{ fontSize: 12, color: PURPLE2, marginBottom: 16, lineHeight: 1.6, direction: 'ltr' }}>
            {post.hashtags}
          </div>
        )}

        {/* pause / resume — only for posts still waiting to go out */}
        {(isPausable || isPaused) && (
          <button onClick={togglePause} disabled={busy} style={{
            width: '100%', padding: '10px', borderRadius: 12, marginBottom: 8,
            cursor: busy ? 'wait' : 'pointer',
            background: isPaused ? 'rgba(52,211,153,0.14)' : 'rgba(251,191,36,0.14)',
            border: `1px solid ${isPaused ? 'rgba(52,211,153,0.35)' : 'rgba(251,191,36,0.35)'}`,
            color: isPaused ? '#34D399' : '#FBBF24', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s',
          }}>
            <i className={`ti ${isPaused ? 'ti-player-play' : 'ti-player-pause'}`} style={{ fontSize: 14 }} />
            {busy ? 'מעדכן...' : isPaused ? 'המשך תזמון' : 'השהה תזמון'}
          </button>
        )}

        {/* actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <i className="ti ti-pencil" style={{ fontSize: 14 }} />
            ערוך
          </button>
          <button style={{
            flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
            background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
            border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(152,80,255,0.35)',
          }}>
            <i className="ti ti-send" style={{ fontSize: 14 }} />
            פרסם עכשיו
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Schedule modal ───────────────────────────────────────────────────────────
function ScheduleModal({ date, draftText, draftPlatform, userId, onClose, onSaved }: {
  date: Date; draftText?: string; draftPlatform?: string
  userId: string; onClose: () => void; onSaved: () => void
}) {
  const [text, setText]         = useState(draftText ?? '')
  const [platform, setPlatform] = useState<string[]>(draftPlatform ? [draftPlatform] : ['facebook'])
  const [time, setTime]         = useState('10:00')
  const [saving, setSaving]     = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

  function togglePlat(p: string) {
    setPlatform(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function save() {
    if (!text.trim()) return
    setSaving(true)
    const scheduled_at = `${dateStr}T${time}:00`
    await fetch('/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentText: text, platform, scheduled_at, status: 'scheduled' }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 440, ...GLASS, borderRadius: 24, padding: 28, direction: 'rtl',
        background: 'rgba(22,12,61,0.97)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>תזמן פוסט</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* platform */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>רשתות חברתיות</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(PLATFORM_META).map(([id, pm]) => (
              <button key={id} onClick={() => togglePlat(id)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: platform.includes(id) ? `${pm.color}20` : 'transparent',
                border: `1px solid ${platform.includes(id) ? pm.color : 'rgba(255,255,255,0.1)'}`,
                color: platform.includes(id) ? pm.color : 'rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              }}>
                <i className={`ti ${pm.icon}`} style={{ fontSize: 13 }} />
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* time */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>שעת פרסום</div>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13, color: '#fff', direction: 'ltr',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
          }} />
        </div>

        {/* text */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>תוכן הפוסט</div>
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={5}
            placeholder="כתוב את הפוסט שלך כאן..."
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 14, fontSize: 13, color: '#fff',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              outline: 'none', resize: 'none', direction: 'rtl', lineHeight: 1.7, fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* smart schedule Pro button */}
        <button onClick={() => setShowUpgrade(true)} style={{
          width: '100%', marginBottom: 10, padding: '11px 16px', borderRadius: 14, cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(190,86,255,0.12), rgba(59,130,239,0.12))',
          border: '1px solid rgba(190,86,255,0.3)',
          color: PURPLE2, fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className="ti ti-brain" style={{ fontSize: 16 }} />
          תזמון חכם ב-AI
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginRight: 2 }}>מזהה שעות שיא</span>
          <span style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: 'rgba(152,80,255,0.2)', border: '1px solid rgba(152,80,255,0.35)', color: PURPLE2, fontSize: 10, fontWeight: 800 }}>
            <i className="ti ti-lock" style={{ fontSize: 10 }} /> Pro
          </span>
        </button>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
          }}>ביטול</button>
          <button onClick={save} disabled={saving || !text.trim() || !platform.length} style={{
            flex: 2, padding: '11px', borderRadius: 12, cursor: 'pointer',
            background: text.trim() ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(152,80,255,0.2)',
            border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
            boxShadow: text.trim() ? '0 4px 18px rgba(152,80,255,0.4)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: !text.trim() ? 0.5 : 1,
          }}>
            {saving
              ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              : <><i className="ti ti-calendar-plus" style={{ fontSize: 15 }} /> תזמן פוסט</>
            }
          </button>
        </div>

        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} trigger="smart_schedule" />}
      </div>
    </div>
  )
}

// ─── Monthly grid ─────────────────────────────────────────────────────────────
function MonthGrid({ year, month, postsByDay, onDayClick, onPostClick, today }: {
  year: number; month: number
  postsByDay: Map<string, Post[]>
  onDayClick: (d: Date) => void
  onPostClick: (p: Post) => void
  today: Date
}) {
  const firstDay  = getFirstDayOfMonth(year, month)
  const daysCount = getDaysInMonth(year, month)
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysCount }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {HE_DAYS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', padding: '6px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} style={{ minHeight: 100, borderRadius: 14, background: 'rgba(255,255,255,0.015)' }} />

          const cellDate = new Date(year, month, day)
          const key = `${year}-${month}-${day}`
          const dayPosts = postsByDay.get(key) ?? []
          const isToday = isSameDay(cellDate, today)
          const isPast  = cellDate < today && !isToday

          return (
            <div
              key={idx}
              onClick={() => onDayClick(cellDate)}
              style={{
                minHeight: 110, borderRadius: 14, padding: '8px 8px 6px',
                background: isToday ? 'rgba(152,80,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: isToday ? `1px solid rgba(152,80,255,0.35)` : '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                opacity: isPast ? 0.55 : 1,
              }}
              onMouseEnter={e => {
                if (!isToday) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.055)'
                const plus = e.currentTarget.querySelector('.plus-icon') as HTMLElement
                if (plus && dayPosts.length === 0) plus.style.opacity = '1'
              }}
              onMouseLeave={e => {
                if (!isToday) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                const plus = e.currentTarget.querySelector('.plus-icon') as HTMLElement
                if (plus) plus.style.opacity = '0'
              }}
            >
              {/* day number */}
              <div style={{
                fontSize: 12, fontWeight: isToday ? 800 : 600, marginBottom: 5,
                color: isToday ? PURPLE2 : 'rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {isToday && <div style={{ width: 6, height: 6, borderRadius: '50%', background: PURPLE2 }} />}
                {day}
              </div>

              {/* post cards — show max 2, then "+N more" */}
              {dayPosts.slice(0, 2).map(p => (
                <div key={p.id} onClick={e => { e.stopPropagation(); onPostClick(p) }}>
                  <PostCard post={p} compact />
                </div>
              ))}
              {dayPosts.length > 2 && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 2 }}>
                  +{dayPosts.length - 2} נוספים
                </div>
              )}

              {/* hover + icon */}
              {dayPosts.length === 0 && (
                <div className="plus-icon" style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(152,80,255,0.2)', border: '1px dashed rgba(152,80,255,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: PURPLE2, fontSize: 16,
                  }}>+</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Weekly grid ──────────────────────────────────────────────────────────────
function WeekGrid({ weekStart, postsByDay, onDayClick, onPostClick, today }: {
  weekStart: Date; postsByDay: Map<string, Post[]>
  onDayClick: (d: Date) => void; onPostClick: (p: Post) => void; today: Date
}) {
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {days.map((d, i) => {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        const dayPosts = postsByDay.get(key) ?? []
        const isToday = isSameDay(d, today)
        const isPast  = d < today && !isToday

        return (
          <div key={i} style={{ opacity: isPast ? 0.6 : 1 }}>
            {/* day header */}
            <div style={{
              textAlign: 'center', padding: '8px 4px 10px',
              borderBottom: `2px solid ${isToday ? PURPLE : 'rgba(255,255,255,0.06)'}`,
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{HE_DAYS_FULL[d.getDay()]}</div>
              <div style={{
                fontSize: 20, fontWeight: 800,
                color: isToday ? PURPLE2 : 'rgba(255,255,255,0.75)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%',
                background: isToday ? 'rgba(152,80,255,0.15)' : 'transparent',
              }}>{d.getDate()}</div>
            </div>

            {/* posts */}
            <div>
              {dayPosts.map(p => (
                <div key={p.id} onClick={() => onPostClick(p)}>
                  <PostCard post={p} compact={false} />
                </div>
              ))}
              <button
                onClick={() => onDayClick(d)}
                style={{
                  width: '100%', padding: '7px', borderRadius: 10, cursor: 'pointer', marginTop: 4,
                  background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.2)', fontSize: 13, transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `rgba(152,80,255,0.35)`
                  ;(e.currentTarget as HTMLButtonElement).style.color = PURPLE2
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(152,80,255,0.06)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function CalendarView({ posts, userId, draftText, draftPlatform }: Props) {
  const router = useRouter()
  const today  = new Date()

  const [view, setView]             = useState<ViewMode>('month')
  const [curYear, setCurYear]       = useState(today.getFullYear())
  const [curMonth, setCurMonth]     = useState(today.getMonth())
  const [weekStart, setWeekStart]   = useState(() => getWeekStart(today))
  const [filterPlatform, setFilterPlatform] = useState<string[]>([])
  const [filterStatus, setFilterStatus]     = useState<string[]>([])
  const [selectedPost, setSelectedPost]     = useState<Post | null>(null)
  const [scheduleDate, setScheduleDate]     = useState<Date | null>(null)
  const [allPosts, setAllPosts]     = useState<Post[]>(posts)

  // open schedule modal for draft if coming from create page
  useEffect(() => {
    if (draftText) setScheduleDate(today)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // filter posts
  const filteredPosts = useMemo(() => {
    return allPosts.filter(p => {
      if (filterPlatform.length && !(p.platform ?? []).some(pl => filterPlatform.includes(pl))) return false
      if (filterStatus.length && !filterStatus.includes(p.status)) return false
      return true
    })
  }, [allPosts, filterPlatform, filterStatus])

  // group posts by day key
  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>()
    filteredPosts.forEach(p => {
      const d = p.scheduled_at ? new Date(p.scheduled_at) : new Date(p.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      map.set(key, [...(map.get(key) ?? []), p])
    })
    return map
  }, [filteredPosts])

  // nav
  function prevMonth() { if (curMonth === 0) { setCurYear(y => y-1); setCurMonth(11) } else setCurMonth(m => m-1) }
  function nextMonth() { if (curMonth === 11) { setCurYear(y => y+1); setCurMonth(0) } else setCurMonth(m => m+1) }
  function prevWeek()  { setWeekStart(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()-7)) }
  function nextWeek()  { setWeekStart(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()+7)) }
  function goToday()   { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); setWeekStart(getWeekStart(today)) }

  function toggleFilter(arr: string[], setArr: (v: string[]) => void, val: string) {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  // Pause holds a post back from the cron queue (cron only picks up status='queued');
  // resume puts it back in queue so it fires on its next due check.
  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/scheduler/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) return
    setAllPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    setSelectedPost(prev => (prev && prev.id === id) ? { ...prev, status } : prev)
  }

  const weekEndDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
  const scheduledCount = allPosts.filter(p => p.status === 'scheduled' || p.status === 'queued').length
  const draftCount     = allPosts.filter(p => p.status === 'draft').length

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', direction: 'rtl', overflow: 'hidden' }}>

      {/* ── Right sidebar: filters ── */}
      <div style={{
        width: 220, flexShrink: 0, padding: '24px 0 24px 16px',
        borderLeft: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
      }}>
        {/* stats */}
        <div style={{ marginBottom: 24 }}>
          {[
            { label: 'מתוזמנים', val: scheduledCount, color: '#34D399' },
            { label: 'טיוטות',   val: draftCount,     color: '#94A3B8' },
            { label: 'סה"כ',     val: allPosts.length, color: PURPLE2  },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 14px', borderRadius: 12, marginBottom: 6,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>

        {/* platform filter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', marginBottom: 10 }}>פלטפורמה</div>
          {Object.entries(PLATFORM_META).map(([id, pm]) => (
            <button key={id} onClick={() => toggleFilter(filterPlatform, setFilterPlatform, id)} style={{
              width: '100%', padding: '8px 12px', borderRadius: 12, marginBottom: 5, cursor: 'pointer',
              background: filterPlatform.includes(id) ? `${pm.color}18` : 'transparent',
              border: `1px solid ${filterPlatform.includes(id) ? pm.color + '55' : 'rgba(255,255,255,0.08)'}`,
              color: filterPlatform.includes(id) ? pm.color : 'rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
              transition: 'all 0.15s', textAlign: 'right',
            }}>
              <i className={`ti ${pm.icon}`} style={{ fontSize: 14 }} />
              {pm.label}
              {filterPlatform.includes(id) && <i className="ti ti-check" style={{ fontSize: 12, marginRight: 'auto' }} />}
            </button>
          ))}
        </div>

        {/* status filter */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', marginBottom: 10 }}>סטטוס</div>
          {(['scheduled', 'draft', 'published', 'pending_approval', 'paused'] as const).map(st => {
            const s = STATUS_META[st]
            return (
              <button key={st} onClick={() => toggleFilter(filterStatus, setFilterStatus, st)} style={{
                width: '100%', padding: '8px 12px', borderRadius: 12, marginBottom: 5, cursor: 'pointer',
                background: filterStatus.includes(st) ? s.bg : 'transparent',
                border: `1px solid ${filterStatus.includes(st) ? s.dot + '55' : 'rgba(255,255,255,0.08)'}`,
                color: filterStatus.includes(st) ? s.color : 'rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
                transition: 'all 0.15s', textAlign: 'right',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                {s.label}
                {filterStatus.includes(st) && <i className="ti ti-check" style={{ fontSize: 12, marginRight: 'auto' }} />}
              </button>
            )
          })}
        </div>

        {(filterPlatform.length || filterStatus.length) > 0 && (
          <button onClick={() => { setFilterPlatform([]); setFilterStatus([]) }} style={{
            width: '100%', marginTop: 14, padding: '7px', borderRadius: 12, cursor: 'pointer',
            background: 'transparent', border: '1px dashed rgba(248,113,113,0.3)',
            color: '#F87171', fontSize: 11, fontWeight: 600,
          }}>
            נקה סינון
          </button>
        )}
      </div>

      {/* ── Main calendar area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 24px 0', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>

          {/* Month/week title */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={view === 'month' ? prevMonth : prevWeek} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-chevron-right" style={{ fontSize: 14 }} />
            </button>
            <div style={{ textAlign: 'center', minWidth: 160 }}>
              {view === 'month' ? (
                <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
                  {HE_MONTHS[curMonth]} {curYear}
                </span>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {weekStart.getDate()} – {weekEndDate.getDate()} {HE_MONTHS[weekEndDate.getMonth()]} {weekEndDate.getFullYear()}
                </span>
              )}
            </div>
            <button onClick={view === 'month' ? nextMonth : nextWeek} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-chevron-left" style={{ fontSize: 14 }} />
            </button>
            <button onClick={goToday} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              היום
            </button>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 3 }}>
            {(['month', 'week'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '6px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: view === v ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'transparent',
                border: 'none', color: view === v ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: view === v ? '0 2px 8px rgba(152,80,255,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                {v === 'month' ? 'תצוגה חודשית' : 'תצוגה שבועית'}
              </button>
            ))}
          </div>

          {/* CTA */}
          <button onClick={() => router.push('/dashboard/create')} style={{
            padding: '9px 20px', borderRadius: 14, cursor: 'pointer',
            background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
            border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
            boxShadow: '0 4px 18px rgba(152,80,255,0.4)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <i className="ti ti-plus" style={{ fontSize: 15 }} />
            יצירת פוסט חדש
          </button>
        </div>

        {/* ── Grid ── */}
        <div className="neon-card" style={{ ...GLASS, flex: 1, padding: 16, overflowY: 'auto' }}>
          {view === 'month'
            ? <MonthGrid year={curYear} month={curMonth} postsByDay={postsByDay} onDayClick={setScheduleDate} onPostClick={setSelectedPost} today={today} />
            : <WeekGrid weekStart={weekStart} postsByDay={postsByDay} onDayClick={setScheduleDate} onPostClick={setSelectedPost} today={today} />
          }
        </div>
      </div>

      {/* ── Modals ── */}
      {selectedPost && (
        <PostDetail post={selectedPost} onClose={() => setSelectedPost(null)} onStatusChange={handleStatusChange} />
      )}
      {scheduleDate && (
        <ScheduleModal
          date={scheduleDate}
          draftText={draftText}
          draftPlatform={draftPlatform}
          userId={userId}
          onClose={() => setScheduleDate(null)}
          onSaved={() => {
            setScheduleDate(null)
            router.refresh()
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
