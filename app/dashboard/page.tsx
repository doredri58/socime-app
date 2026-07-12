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

const PLATFORM_ICON: Record<string, string> = {
  facebook:  'ti-brand-facebook',
  instagram: 'ti-brand-instagram',
  tiktok:    'ti-brand-tiktok',
  both:      'ti-brand-instagram',
}
const PLATFORM_COLOR: Record<string, string> = {
  facebook:  '#60A5FA',
  instagram: '#F9A8D4',
  tiktok:    '#ff0050',
  both:      '#F9A8D4',
}

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

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Greeting ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.4px' }}>
          {getGreeting()}, {userName}
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          {business?.business_name
            ? `מנהל את ${business.business_name} — ${queueCount ?? 0} פוסטים בתור`
            : 'בוא נתחיל — הגדר את תיק העסק שלך'}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.3px' }}>
              השבוע שלכם בסושיאל
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
              {posts.length > 0 ? `${posts.length} פוסטים מתוזמנים השבוע` : 'אין פוסטים מתוזמנים השבוע'}
            </p>
          </div>
          <Link href="/dashboard/queue" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '7px 16px', borderRadius: 999,
            background: 'rgba(176,48,245,0.12)',
            border: '1px solid rgba(176,48,245,0.25)',
            color: '#CE7BFF', fontSize: 12, fontWeight: 600,
            textDecoration: 'none',
          }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 13 }} />
            ניהול לוח שנה
          </Link>
        </div>

        {/* 7-day row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDays.map((day, idx) => {
            const isToday = idx === todayIdx
            const dayPosts = postsByDay[idx] ?? []
            const isPast = day < today && !isToday

            return (
              <div key={idx} style={{
                borderRadius: 16,
                padding: '12px 8px',
                background: isToday
                  ? 'linear-gradient(160deg, rgba(176,48,245,0.2), rgba(206,123,255,0.1))'
                  : 'rgba(255,255,255,0.03)',
                border: isToday
                  ? '1px solid rgba(176,48,245,0.4)'
                  : '1px solid rgba(255,255,255,0.07)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                opacity: isPast ? 0.5 : 1,
                minHeight: 100,
              }}>
                {/* Day name */}
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: isToday ? '#CE7BFF' : 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.5px',
                }}>
                  {DAYS_HE[idx]}
                </span>

                {/* Date number */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: isToday ? '#B030F5' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: isToday ? 800 : 500,
                  color: isToday ? '#fff' : 'rgba(255,255,255,0.7)',
                  boxShadow: isToday ? '0 2px 10px rgba(176,48,245,0.5)' : 'none',
                }}>
                  {day.getDate()}
                </div>

                {/* Posts on this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  {dayPosts.slice(0, 2).map(p => (
                    <div key={p.id} style={{
                      borderRadius: 6,
                      padding: '3px 6px',
                      background: `${PLATFORM_COLOR[p.platform] ?? '#CE7BFF'}18`,
                      border: `1px solid ${PLATFORM_COLOR[p.platform] ?? '#CE7BFF'}30`,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <i className={`ti ${PLATFORM_ICON[p.platform] ?? 'ti-brand-instagram'}`}
                        style={{ fontSize: 9, color: PLATFORM_COLOR[p.platform] ?? '#CE7BFF', flexShrink: 0 }} />
                      <span style={{
                        fontSize: 9, color: 'rgba(255,255,255,0.65)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {new Date(p.scheduled_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  {dayPosts.length > 2 && (
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                      +{dayPosts.length - 2} עוד
                    </span>
                  )}
                  {dayPosts.length === 0 && !isPast && (
                    <Link href="/dashboard/create" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.3)',
                      fontSize: 12, textDecoration: 'none',
                      alignSelf: 'center',
                    }}>
                      +
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
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
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            חיבור לרשתות
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '0 0 20px' }}>
            {hasConnections ? 'הרשתות המחוברות שלך' : 'חבר את הרשתות החברתיות שלך כדי לפרסם אוטומטית'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { id: 'facebook',  label: 'Facebook',  icon: 'ti-brand-facebook',  color: '#60A5FA', bg: 'rgba(96,165,250,0.1)'  },
              { id: 'instagram', label: 'Instagram', icon: 'ti-brand-instagram', color: '#F9A8D4', bg: 'rgba(249,168,212,0.1)' },
              { id: 'tiktok',    label: 'TikTok',     icon: 'ti-brand-tiktok',    color: '#ff0050', bg: 'rgba(255,0,80,0.08)'   },
            ].map(net => {
              const connected = connectedPlatforms.includes(net.id)
              return (
                <div key={net.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14,
                  background: connected ? net.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${connected ? net.color + '30' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: connected ? net.bg : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${connected ? net.color + '40' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    <i className={`ti ${net.icon}`} style={{ fontSize: 17, color: connected ? net.color : 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: connected ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                      {net.label}
                    </div>
                    <div style={{ fontSize: 11, color: connected ? net.color : 'rgba(255,255,255,0.3)' }}>
                      {connected ? 'מחובר' : 'לא מחובר'}
                    </div>
                  </div>
                  <Link href="/dashboard/social" style={{
                    padding: '5px 14px', borderRadius: 999,
                    background: connected ? 'rgba(52,211,153,0.12)' : 'rgba(176,48,245,0.15)',
                    border: `1px solid ${connected ? 'rgba(52,211,153,0.25)' : 'rgba(176,48,245,0.3)'}`,
                    color: connected ? '#34D399' : '#CE7BFF',
                    fontSize: 11, fontWeight: 600, textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                    {connected ? 'מחובר ✓' : 'חבר'}
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
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            ביצועים מהירים
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '0 0 20px' }}>
            פעילות 7 הימים האחרונים
          </p>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'פוסטים בתור',    value: queueCount ?? 0, icon: 'ti-calendar-event', color: '#CE7BFF', suffix: '' },
              { label: 'טוקנים נותרו',   value: tokens,          icon: 'ti-coins',          color: '#FCD34D', suffix: '' },
              { label: 'פוסטים השבוע',   value: posts.length,    icon: 'ti-chart-bar',      color: '#34D399', suffix: '' },
              { label: 'רשתות מחוברות',  value: connectedPlatforms.length, icon: 'ti-brand-instagram', color: '#60A5FA', suffix: '/3' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '14px 16px', borderRadius: 16,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `${stat.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={`ti ${stat.icon}`} style={{ fontSize: 13, color: stat.color }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    {stat.label}
                  </span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, letterSpacing: '-1px', lineHeight: 1 }}>
                  {stat.value.toLocaleString('he-IL')}<span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>{stat.suffix}</span>
                </div>
              </div>
            ))}
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
                        ? 'linear-gradient(180deg, #B030F5, #CE7BFF)'
                        : count > 0 ? 'rgba(176,48,245,0.35)' : 'rgba(255,255,255,0.06)',
                      transition: 'height 0.3s ease',
                      minHeight: 3,
                    }} />
                    <span style={{ fontSize: 8, color: isToday ? '#CE7BFF' : 'rgba(255,255,255,0.25)' }}>
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
