import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getActiveBusiness } from '@/lib/business'
import QuickCreate from '@/components/dashboard/QuickCreate'

/* ── helpers ───────────────────────────────────────────────── */

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

// Time-of-day greeting, computed in Israel time regardless of server timezone
function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jerusalem' })
      .format(new Date())
  )
  if (hour >= 5 && hour < 12)  return 'בוקר טוב'
  if (hour >= 12 && hour < 17) return 'צהריים טובים'
  if (hour >= 17 && hour < 22) return 'ערב טוב'
  return 'לילה טוב'
}

function getWeekDays() {
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  sunday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

// Brand colours at full strength — the old pastels were picked for a dark
// background and wash out on the light theme.
const PLATFORM_COLOR: Record<string, string> = {
  facebook:  '#1877F2',
  instagram: '#E1306C',
  tiktok:    '#111111',
  both:      '#E1306C',
}

/* ── light-theme tokens (explicit: translucent-white values would be
      rewritten by the light-mode transform rules in globals.css) ── */
const INK      = '#253A53'
const INK_MID  = '#5B5878'
const INK_LOW  = '#6B6790'
const INK_DIM  = '#A79FC4'
const PURPLE   = '#9656FE'
const PURPLE2  = '#BE56FE'
const PURPLE_T = '#7C3FD6'   // purple that stays readable as text on light

/* Stat tiles: colour encodes STATE, never identity. A tile stays slate unless
   its value means something the user should act on. */
const STAT_TONE = {
  neutral: { value: INK,       chip: 'rgba(150,86,254,0.12)', icon: PURPLE_T },
  warn:    { value: '#8A6207', chip: 'rgba(232,165,25,0.16)', icon: '#8A6207' },
  ok:      { value: '#0A7159', chip: 'rgba(22,185,153,0.14)', icon: '#0A7159' },
} as const

/* ── Week rhythm ────────────────────────────────────────────────
   Each day is a vertical time lane rather than a date box, so the week
   reads as a broadcast schedule: when you publish, and where the gaps are. */
const RAIL_FROM    = 8    // 08:00 → top of the rail
const RAIL_TO      = 23   // 23:00 → bottom
const RAIL_H       = 150
const GOLDEN_FROM  = 18   // peak-engagement window
const GOLDEN_TO    = 21
const SUGGEST_HOUR = 19   // where the "+" lands on an empty day

/** Vertical position (0–100%) of an hour on the rail. */
function railPct(hour: number) {
  return Math.min(100, Math.max(0, ((hour - RAIL_FROM) / (RAIL_TO - RAIL_FROM)) * 100))
}

/** Fractional hour of a date in Israel time, regardless of server timezone.
    Vercel runs UTC: using getHours() here would place posts 3h off from the
    "now" line and from the time printed on the chip. */
function israelHourOf(d: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Jerusalem',
  }).formatToParts(d)
  const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0)
  const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0)
  return h + m / 60
}

const israelHourNow = () => israelHourOf(new Date())

/* ── page ───────────────────────────────────────────────────── */

export default async function DashboardHome() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const weekDays = getWeekDays()
  const weekStart = weekDays[0].toISOString()
  const weekEndDate = new Date(weekDays[6])
  weekEndDate.setHours(23, 59, 59, 999)

  const business = await getActiveBusiness(user.id)
  const [
    { data: profile },
    { data: weekPosts },
    { count: queueCount },
    { data: socialConnections },
  ] = await Promise.all([
    db.from('users').select('name, tier, token_balance, image_count_this_month').eq('id', user.id).single(),
    db.from('scheduler')
      .select('id, content_text, platform, scheduled_at, status')
      .eq('user_id', user.id)
      .gte('scheduled_at', weekStart)
      .lte('scheduled_at', weekEndDate.toISOString())
      .order('scheduled_at', { ascending: true }),
    db.from('scheduler').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    db.from('social_tokens').select('platform').eq('user_id', user.id).limit(5),
  ])

  const userName  = profile?.name ?? 'משתמש'
  const tokens    = profile?.token_balance ?? 0
  const today     = new Date()
  const todayIdx  = today.getDay()

  type Post = { id: string; content_text: string; platform: string; scheduled_at: string; status: string }
  const posts = (weekPosts ?? []) as Post[]

  // Group posts by day-of-week index
  const postsByDay: Record<number, Post[]> = {}
  posts.forEach(p => {
    const d = new Date(p.scheduled_at)
    const idx = d.getDay()
    if (!postsByDay[idx]) postsByDay[idx] = []
    postsByDay[idx].push(p)
  })

  const connectedPlatforms = (socialConnections ?? []).map(c => c.platform)
  const hasConnections = connectedPlatforms.length > 0

  // Week-rhythm state. `now` is server-rendered, so it advances on refresh.
  const nowHour  = israelHourNow()
  const nowOnRail = nowHour >= RAIL_FROM && nowHour <= RAIL_TO
  // Consistency is the whole game in social — surface the gaps, not just the count.
  const emptyDays = weekDays.filter((d, i) => {
    const isTodayCol = i === todayIdx
    const isPastCol  = d < today && !isTodayCol
    return !isPastCol && (postsByDay[i] ?? []).length === 0
  }).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          {getGreeting()}, {userName}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          {business?.business_name
            ? `מנהלים את ${business.business_name} — ${queueCount ?? 0} פוסטים בתור`
            : 'בואו נתחיל — הגדירו את תיק העסק שלכם'}
        </p>
      </div>

      {/* ══ SECTION 1: Week Calendar ══ */}
      <section className="neon-card" style={{
        borderRadius: 24,
        padding: '24px 28px',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.13)',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: '0 0 5px', letterSpacing: '-0.3px' }}>
              השבוע שלכם בסושיאל
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: INK_LOW }}>
              <span>
                {posts.length > 0
                  ? <><b style={{ color: INK_MID, fontWeight: 700 }}>{posts.length} פוסטים</b> מתוזמנים</>
                  : 'אין פוסטים מתוזמנים השבוע'}
              </span>
              {/* Only worth flagging gaps once there IS a rhythm to break —
                  on an empty week "no posts scheduled" already says it. */}
              {posts.length > 0 && emptyDays > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 9px', borderRadius: 999,
                  background: 'rgba(232,165,25,0.14)',
                  border: '1px solid rgba(232,165,25,0.30)',
                  color: '#8A6207', fontSize: 11, fontWeight: 700,
                }}>
                  ● {emptyDays === 1 ? 'יום ריק אחד' : `${emptyDays} ימים ריקים`}
                </span>
              )}
            </div>
          </div>
          <Link href="/dashboard/queue" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '7px 16px', borderRadius: 999,
            background: 'rgba(150,86,254,0.12)',
            border: '1px solid rgba(150,86,254,0.28)',
            color: PURPLE_T, fontSize: 12, fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 13 }} />
            ניהול לוח שנה
          </Link>
        </div>

        {/* Week rhythm: a time axis + 7 vertical day lanes */}
        <div style={{ display: 'grid', gridTemplateColumns: '34px repeat(7, 1fr)', gap: 8 }}>

          {/* Time axis — gives the rails their meaning */}
          <div style={{ paddingTop: 52 }}>
            <div style={{ position: 'relative', height: RAIL_H }}>
              {[8, 13, 18, 23].map(h => (
                <span key={h} style={{
                  position: 'absolute', insetInlineEnd: 0, top: `${railPct(h)}%`,
                  transform: 'translateY(-50%)',
                  fontSize: 9, fontWeight: 600, color: INK_DIM, whiteSpace: 'nowrap',
                }}>
                  {String(h).padStart(2, '0')}:00
                </span>
              ))}
            </div>
          </div>

          {weekDays.map((day, idx) => {
            const isToday = idx === todayIdx
            const dayPosts = postsByDay[idx] ?? []
            const isPast = day < today && !isToday

            return (
              <div key={idx} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                opacity: isPast ? 0.45 : 1,
              }}>
                {/* Day name */}
                <span style={{
                  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.4px',
                  color: isToday ? PURPLE_T : INK_LOW,
                }}>
                  {DAYS_HE[idx]}
                </span>

                {/* Date */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: isToday ? 800 : 600,
                  background: isToday ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'transparent',
                  color: isToday ? '#fff' : INK_MID,
                  boxShadow: isToday ? '0 2px 12px rgba(150,86,254,0.55)' : 'none',
                }}>
                  {day.getDate()}
                </div>

                {/* ── The rail ── */}
                <div style={{
                  position: 'relative', width: '100%', height: RAIL_H,
                  borderRadius: 12, overflow: 'hidden',
                  background: isToday
                    ? 'linear-gradient(180deg, rgba(150,86,254,0.10), rgba(59,130,239,0.07))'
                    : 'rgba(120,90,200,0.07)',
                  border: `1px solid ${isToday ? 'rgba(150,86,254,0.34)' : 'rgba(120,90,200,0.13)'}`,
                }}>
                  {/* hour ticks */}
                  {[13, 18].map(h => (
                    <div key={h} style={{
                      position: 'absolute', insetInline: 0, top: `${railPct(h)}%`,
                      height: 1, background: 'rgba(120,90,200,0.10)',
                    }} />
                  ))}

                  {/* golden window — peak engagement */}
                  <div style={{
                    position: 'absolute', insetInline: 0,
                    top: `${railPct(GOLDEN_FROM)}%`,
                    height: `${railPct(GOLDEN_TO) - railPct(GOLDEN_FROM)}%`,
                    background: 'linear-gradient(180deg, rgba(232,165,25,0.22), rgba(232,165,25,0.06))',
                    borderTop: '1px dashed rgba(232,165,25,0.55)',
                    pointerEvents: 'none',
                  }} />

                  {/* now line — the thing that makes the card feel alive.
                      data-keep-color: it's a 2px bar, so the light-theme
                      "thin divider" rule would otherwise repaint it a faint
                      hairline and it would all but disappear. */}
                  {isToday && nowOnRail && (
                    <div data-keep-color style={{
                      position: 'absolute', insetInline: 0, top: `${railPct(nowHour)}%`,
                      height: 2, background: PURPLE, zIndex: 3,
                    }}>
                      <span style={{
                        position: 'absolute', insetInlineEnd: -1, top: -3,
                        width: 8, height: 8, borderRadius: '50%', background: PURPLE,
                        boxShadow: '0 0 0 3px rgba(150,86,254,0.22)',
                      }} />
                    </div>
                  )}

                  {/* posts, placed at their actual hour */}
                  {dayPosts.map(p => {
                    const d = new Date(p.scheduled_at)
                    const c = PLATFORM_COLOR[p.platform] ?? PURPLE2
                    return (
                      <div key={p.id} title={p.content_text?.slice(0, 80)} style={{
                        position: 'absolute', insetInline: 3, zIndex: 2,
                        top: `${railPct(israelHourOf(d))}%`,
                        transform: 'translateY(-50%)',
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 5px', borderRadius: 7,
                        background: '#ffffff', border: `1px solid ${c}59`,
                        boxShadow: '0 3px 10px rgba(84,60,150,0.16)',
                        fontSize: 9, fontWeight: 700, color: INK,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
                        {d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })}
                      </div>
                    )
                  })}

                  {/* empty future day → suggest the golden hour, not a bare plus */}
                  {dayPosts.length === 0 && !isPast && (
                    <Link
                      href="/dashboard/create"
                      aria-label={`תזמון פוסט ליום ${DAYS_HE[idx]} בשעת הזהב`}
                      style={{
                        position: 'absolute', insetInline: 3, zIndex: 2,
                        top: `${railPct(SUGGEST_HOUR)}%`, transform: 'translateY(-50%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        padding: '4px 5px', borderRadius: 8,
                        border: '1px dashed rgba(150,86,254,0.55)',
                        background: 'rgba(255,255,255,0.8)',
                        color: PURPLE_T, fontSize: 9, fontWeight: 700, textDecoration: 'none',
                      }}>
                      + <span style={{ opacity: 0.9 }}>{SUGGEST_HOUR}:00</span>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend — the golden band means nothing without it */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          marginTop: 16, paddingTop: 14,
          borderTop: '1px solid rgba(120,90,200,0.14)',
          fontSize: 11, color: INK_LOW,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 18, height: 8, borderRadius: 3,
              background: 'linear-gradient(90deg, rgba(232,165,25,0.35), rgba(232,165,25,0.12))',
              border: '1px dashed rgba(232,165,25,0.5)',
            }} />
            שעת זהב — שיא המעורבות
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 18, height: 2, borderRadius: 2, background: PURPLE }} />
            עכשיו
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 18, height: 8, borderRadius: 3,
              background: '#ffffff', border: '1px solid rgba(225,48,108,0.35)',
            }} />
            פוסט מתוזמן לפי שעה
          </span>
        </div>
      </section>

      {/* ══ SECTION 2: Quick Create ══ */}
      <QuickCreate />

      {/* ══ SECTION 3: Bottom Row ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* RIGHT: Social Connections */}
        <div className="neon-card" style={{
          borderRadius: 24,
          padding: '24px 28px',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.13)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            חיבור לרשתות
          </h3>
          {/* With nothing connected this card is the single thing blocking the
              product from working — say that plainly instead of a soft nudge. */}
          <p style={{ fontSize: 12, color: hasConnections ? INK_LOW : '#8A6207', fontWeight: hasConnections ? 400 : 600, margin: '0 0 20px' }}>
            {hasConnections
              ? 'הרשתות המחוברות שלכם'
              : 'בלי רשת מחוברת SociMe לא יכולה לפרסם — חברו אחת כדי להתחיל'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'facebook',  label: 'Facebook',  icon: 'ti-brand-facebook'  },
              { id: 'instagram', label: 'Instagram', icon: 'ti-brand-instagram' },
              { id: 'tiktok',    label: 'TikTok',    icon: 'ti-brand-tiktok'    },
            ].map(net => {
              const connected = connectedPlatforms.includes(net.id)
              const c = PLATFORM_COLOR[net.id]
              return (
                <div key={net.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14,
                  background: connected ? `${c}0F` : 'rgba(120,90,200,0.06)',
                  border: `1px solid ${connected ? `${c}3D` : 'rgba(120,90,200,0.13)'}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: connected ? `${c}1A` : 'rgba(255,255,255,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${connected ? `${c}40` : 'rgba(120,90,200,0.14)'}`,
                  }}>
                    <i className={`ti ${net.icon}`} style={{ fontSize: 17, color: connected ? c : INK_DIM }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>
                      {net.label}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: connected ? '#0A7159' : INK_LOW }}>
                      {connected ? 'מחובר' : 'לא מחובר'}
                    </div>
                  </div>
                  {/* Disconnected → a real, confident action, not a ghost pill. */}
                  <Link href="/dashboard/social" style={connected ? {
                    padding: '5px 14px', borderRadius: 999,
                    background: 'rgba(22,185,153,0.12)',
                    border: '1px solid rgba(22,185,153,0.30)',
                    color: '#0A7159', fontSize: 11, fontWeight: 700,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  } : {
                    padding: '6px 18px', borderRadius: 999,
                    background: '#3B82EF', border: '1px solid #3B82EF',
                    color: '#ffffff', fontSize: 11.5, fontWeight: 700,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(59,130,239,0.35)',
                  }}>
                    {connected ? 'מחובר ✓' : 'חברו'}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* LEFT: Quick Stats */}
        <div className="neon-card" style={{
          borderRadius: 24,
          padding: '24px 28px',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.13)',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: INK, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            מצב החשבון
          </h3>
          {/* Was "פעילות 7 הימים האחרונים" — but three of the four tiles are
              not 7-day activity (queue, token balance, connection status). */}
          <p style={{ fontSize: 12, color: INK_LOW, margin: '0 0 20px' }}>
            תוכן, טוקנים וחיבורים במבט אחד
          </p>

          {/* Stats grid.
              Colour here is STATE, not decoration — the old version gave each
              tile its own hue (gold/purple/green/blue), which made a rainbow
              that said nothing and let a 6-digit token balance shout loudest.
              Numbers are slate by default; a tile only takes colour when its
              value actually means something. */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {([
              { label: 'פוסטים בתור',   value: queueCount ?? 0,           icon: 'ti-calendar-event', suffix: '',   tone: 'neutral' },
              { label: 'פוסטים השבוע',  value: posts.length,              icon: 'ti-chart-bar',      suffix: '',   tone: 'neutral' },
              // 0 connected networks is blocking: nothing can publish. Say so.
              { label: 'רשתות מחוברות', value: connectedPlatforms.length, icon: 'ti-plug-connected', suffix: '/3', tone: connectedPlatforms.length === 0 ? 'warn' : 'ok' },
              { label: 'טוקנים נותרו',  value: tokens,                    icon: 'ti-coins',          suffix: '',   tone: tokens < 50 ? 'warn' : 'neutral' },
            ] as { label: string; value: number; icon: string; suffix: string; tone: 'neutral' | 'warn' | 'ok' }[]).map(stat => {
              const tone = STAT_TONE[stat.tone]
              return (
                <div key={stat.label} style={{
                  padding: '14px 16px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: tone.chip,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`ti ${stat.icon}`} style={{ fontSize: 13, color: tone.icon }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: INK_LOW, fontWeight: 500 }}>
                      {stat.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 26, fontWeight: 800, color: tone.value,
                    letterSpacing: '-1px', lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {stat.value.toLocaleString('he-IL')}
                    <span style={{ fontSize: 13, fontWeight: 500, color: INK_DIM }}>{stat.suffix}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mini bar chart — posts per day this week */}
          <div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>פוסטים לפי יום</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 44, marginTop: 10 }}>
              {weekDays.map((_, idx) => {
                const count = (postsByDay[idx] ?? []).length
                const maxCount = Math.max(...weekDays.map((__, i) => (postsByDay[i] ?? []).length), 1)
                const heightPct = count === 0 ? 6 : Math.max((count / maxCount) * 100, 15)
                const isToday = idx === todayIdx
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', borderRadius: 4,
                      height: `${heightPct}%`,
                      background: isToday
                        ? 'linear-gradient(180deg, #9656FE, #BE56FE)'
                        : count > 0 ? 'rgba(150,86,254,0.35)' : 'rgba(255,255,255,0.06)',
                      transition: 'height 0.3s ease',
                      minHeight: 3,
                    }} />
                    <span style={{ fontSize: 8, color: isToday ? '#BE56FE' : 'rgba(255,255,255,0.25)' }}>
                      {DAYS_HE[idx].charAt(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
