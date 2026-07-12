'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/dashboard/UpgradeModal'

// ─── constants ────────────────────────────────────────────────────────────────
const PURPLE  = '#B030F5'
const PURPLE2 = '#CE7BFF'
const BLUE    = '#F72D93'
const GREEN   = '#34D399'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 20,
}

const PLATFORM_META: Record<string, { icon: string; color: string; label: string }> = {
  facebook:  { icon: 'ti-brand-facebook',  color: '#1877F2', label: 'Facebook'  },
  instagram: { icon: 'ti-brand-instagram', color: '#E1306C', label: 'Instagram' },
  tiktok:    { icon: 'ti-brand-tiktok',    color: '#ff0050', label: 'TikTok'    },
}

// ─── types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string
  content_text: string | null
  platform: string[] | null
  status: string
  scheduled_at: string | null
  created_at: string
  hashtags: string | null
}

interface Props {
  posts: Post[]
  userName: string
  tier: string
  tokenBalance: number
}

// ─── SVG area chart ───────────────────────────────────────────────────────────
function AreaChart({ data, color }: { data: number[]; color: string }) {
  const W = 800, H = 180, PAD = 20
  const max  = Math.max(...data, 1)
  const step = (W - PAD * 2) / (data.length - 1)

  const pts = data.map((v, i) => ({
    x: PAD + i * step,
    y: PAD + (1 - v / max) * (H - PAD * 2),
  }))

  const linePath  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath  = `${linePath} L${pts[pts.length - 1].x},${H - PAD} L${PAD},${H - PAD} Z`
  const gradId    = `grad-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 180 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => {
        const y = PAD + (1 - f) * (H - PAD * 2)
        return (
          <line key={f} x1={PAD} y1={y} x2={W - PAD} y2={y}
            stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        )
      })}

      {/* area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

      {/* dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={color}
          stroke="rgba(28,15,43,0.9)" strokeWidth="2" />
      ))}
    </svg>
  )
}

// ─── mini sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 80, H = 32
  const max  = Math.max(...data, 1)
  const step = W / (data.length - 1)
  const pts  = data.map((v, i) => `${i * step},${H - (v / max) * H}`)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: 32 }}>
      <defs>
        <linearGradient id={`sp${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, delta, deltaPositive, sparkData, accentColor, suffix = '' }: {
  icon: string; label: string; value: string; sub?: string
  delta?: string; deltaPositive?: boolean; sparkData?: number[]
  accentColor: string; suffix?: string
}) {
  return (
    <div className="neon-card" style={{
      ...GLASS, padding: '22px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* glow corner */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${accentColor}18`, filter: 'blur(20px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: `${accentColor}18`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ fontSize: 18, color: accentColor }} />
        </div>
        {sparkData && <Sparkline data={sparkData} color={accentColor} />}
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginRight: 3 }}>{suffix}</span>
      </div>

      {(delta || sub) && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          {delta && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: deltaPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
              color: deltaPositive ? GREEN : '#F87171',
              border: `1px solid ${deltaPositive ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <i className={`ti ${deltaPositive ? 'ti-trending-up' : 'ti-trending-down'}`} style={{ fontSize: 11 }} />
              {delta}
            </span>
          )}
          {sub && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ─── leaderboard row ──────────────────────────────────────────────────────────
function LeaderRow({ post, rank, onDuplicate }: { post: Post; rank: number; onDuplicate: (p: Post) => void }) {
  const plats  = post.platform ?? ['facebook']
  const pm     = PLATFORM_META[plats[0]] ?? PLATFORM_META.facebook
  const snippet = (post.content_text ?? '').slice(0, 90)

  const rankColors = ['#FBBF24', '#94A3B8', '#CD7C3D']
  const rankColor  = rankColors[rank - 1] ?? 'rgba(255,255,255,0.2)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 20px', borderRadius: 16, marginBottom: 8,
      background: rank === 1 ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)',
      border: rank === 1 ? '1px solid rgba(251,191,36,0.18)' : '1px solid rgba(255,255,255,0.07)',
      transition: 'all 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.055)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = rank === 1 ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)' }}
    >
      {/* rank */}
      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `${rankColor}18`, border: `1px solid ${rankColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: rankColor }}>
        {rank}
      </div>

      {/* platform icon */}
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${pm.color}18`, border: `1px solid ${pm.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`ti ${pm.icon}`} style={{ fontSize: 18, color: pm.color }} />
      </div>

      {/* text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, direction: 'rtl', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {snippet || '(אין תוכן)'}
          {(post.content_text ?? '').length > 90 ? '...' : ''}
        </div>
      </div>

      {/* CTA */}
      <button onClick={() => onDuplicate(post)} style={{
        flexShrink: 0, padding: '8px 16px', borderRadius: 12, cursor: 'pointer',
        background: 'rgba(176,48,245,0.12)', border: '1px solid rgba(176,48,245,0.28)',
        color: PURPLE2, fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
      }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(176,48,245,0.22)'; b.style.boxShadow = '0 4px 14px rgba(176,48,245,0.25)' }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(176,48,245,0.12)'; b.style.boxShadow = '' }}
      >
        <i className="ti ti-copy" style={{ fontSize: 13 }} />
        שכפל הצלחה
      </button>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ posts, userName, tier, tokenBalance }: Props) {
  const router = useRouter()
  const [chartFilter, setChartFilter] = useState<'all' | 'facebook' | 'instagram' | 'tiktok'>('all')
  const [insightIndex, setInsightIndex] = useState(0)
  const [showUpgrade, setShowUpgrade]   = useState(false)
  const isPro = tier !== 'free'   // כל מסלול בתשלום (basic/pro/agency)

  // ── derive real stats from posts ──
  const publishedPosts = posts.filter(p => p.status === 'published')
  const scheduledPosts = posts.filter(p => p.status === 'scheduled' || p.status === 'queued')
  const draftPosts     = posts.filter(p => p.status === 'draft')
  const totalPosts     = posts.length

  // group by week for chart (last 8 weeks), optionally filtered by platform
  const weeklyFor = (platform: string | null) => {
    const weeks: number[] = Array(8).fill(0)
    posts.forEach(p => {
      if (platform && !(p.platform ?? []).includes(platform)) return
      const d    = new Date(p.created_at)
      const diff = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 60 * 60 * 1000))
      if (diff >= 0 && diff < 8) weeks[7 - diff]++
    })
    return weeks
  }
  const weeklyData = useMemo(() => weeklyFor(null), [posts])         // eslint-disable-line react-hooks/exhaustive-deps
  const chartData  = useMemo(
    () => chartFilter === 'all' ? weeklyData : weeklyFor(chartFilter),
    [chartFilter, weeklyData]                                        // eslint-disable-line react-hooks/exhaustive-deps
  )
  const chartColor = chartFilter === 'all' ? PURPLE : PLATFORM_META[chartFilter]?.color ?? PURPLE

  // real week-over-week delta (posts created this week vs last week)
  const thisWeek = weeklyData[7] ?? 0
  const lastWeek = weeklyData[6] ?? 0
  const weekDelta = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null

  // top posts for leaderboard
  const topPosts = useMemo(() => [...posts].slice(0, 5), [posts])

  // Insights — real numbers from the user's own data only
  const insights = useMemo(() => {
    const hi = userName ? `היי ${userName.split(' ')[0]}, ` : ''
    if (totalPosts === 0) {
      return [`${hi}עדיין אין נתונים לניתוח — צור את הפוסט הראשון שלך והתובנות יופיעו כאן.`]
    }
    const list = [
      `${hi}נוצרו עד כה ${totalPosts} פוסטים: ${publishedPosts.length} פורסמו, ${scheduledPosts.length} מתוזמנים ו-${draftPosts.length} טיוטות.`,
      `השבוע נוצרו ${thisWeek} פוסטים${lastWeek > 0 ? ` (לעומת ${lastWeek} בשבוע שעבר)` : ''}. טיפ: עקביות של 3-4 פוסטים בשבוע היא המפתח לצמיחה.`,
    ]
    if (draftPosts.length > 0) {
      list.push(`יש לך ${draftPosts.length} טיוטות שמחכות — קפוץ ללוח התזמון כדי לשגר אותן.`)
    }
    return list
  }, [userName, totalPosts, publishedPosts.length, scheduledPosts.length, draftPosts.length, thisWeek, lastWeek])

  function handleDuplicate(post: Post) {
    const prompt = encodeURIComponent(`כתוב וריאציה מוצלחת של הפוסט הזה:\n${post.content_text?.slice(0, 200) ?? ''}`)
    router.push(`/dashboard/create?prompt=${prompt}`)
  }

  const weekLabels = ['8 שבועות', '7', '6', '5', '4', '3', '2', 'השבוע']

  return (
    <div style={{ direction: 'rtl', paddingBottom: 48 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>ניתוחים סטטיסטים</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>מבט מלא על הביצועים, המגמות והתובנות של העסק שלך</p>
        </div>

        {/* Export PDF CTA */}
        <button onClick={() => !isPro && setShowUpgrade(true)} style={{
          padding: '10px 20px', borderRadius: 14, cursor: 'pointer',
          background: isPro ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(255,255,255,0.07)',
          border: isPro ? 'none' : '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: isPro ? '0 4px 18px rgba(176,48,245,0.35)' : 'none',
        }}>
          <i className="ti ti-file-download" style={{ fontSize: 16 }} />
          הפקת דוח ללקוח (PDF)
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: isPro ? 'rgba(255,255,255,0.15)' : 'rgba(176,48,245,0.2)', border: isPro ? 'none' : '1px solid rgba(176,48,245,0.35)', fontSize: 10, fontWeight: 800, color: isPro ? '#fff' : PURPLE2 }}>
            {isPro ? '' : <i className="ti ti-lock" style={{ fontSize: 10 }} />}
            {isPro ? 'Enterprise' : 'Enterprise'}
          </span>
        </button>
      </div>

      {/* ── AI Insights Banner ── */}
      <div style={{
        borderRadius: 20, padding: '20px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(176,48,245,0.14) 0%, rgba(247,45,147,0.10) 50%, rgba(206,123,255,0.08) 100%)',
        border: '1px solid rgba(176,48,245,0.28)',
      }}>
        {/* animated glow blobs */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(176,48,245,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(247,45,147,0.12)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, position: 'relative' }}>
          {/* brain icon */}
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(176,48,245,0.2)', border: '1px solid rgba(176,48,245,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-brain" style={{ fontSize: 22, color: PURPLE2 }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: PURPLE2 }}>המוח של SociMe מנתח</span>
              <i className="ti ti-sparkles" style={{ fontSize: 14, color: '#FBBF24' }} />
              <div style={{ display: 'flex', gap: 3, marginRight: 'auto' }}>
                {insights.map((_, i) => (
                  <button key={i} onClick={() => setInsightIndex(i)} style={{
                    width: i === insightIndex ? 16 : 6, height: 6, borderRadius: 999,
                    background: i === insightIndex ? PURPLE2 : 'rgba(255,255,255,0.2)',
                    border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                    padding: 0,
                  }} />
                ))}
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.75 }}>
              {insights[Math.min(insightIndex, insights.length - 1)]}
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards — real data only ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPICard
          icon="ti-file-text"
          label="סה&quot;כ פוסטים"
          value={totalPosts.toLocaleString()}
          delta={weekDelta !== null ? `${weekDelta >= 0 ? '+' : ''}${weekDelta}%` : undefined}
          deltaPositive={weekDelta !== null ? weekDelta >= 0 : undefined}
          sub="מאז ההצטרפות"
          sparkData={totalPosts > 0 ? weeklyData : undefined}
          accentColor={PURPLE2}
        />
        <KPICard
          icon="ti-check"
          label="פורסמו"
          value={publishedPosts.length.toLocaleString()}
          sub="פוסטים באוויר"
          accentColor={GREEN}
        />
        <KPICard
          icon="ti-clock"
          label="מתוזמנים"
          value={scheduledPosts.length.toLocaleString()}
          sub="ממתינים לפרסום"
          accentColor="#FBBF24"
        />
        <KPICard
          icon="ti-coins"
          label="טוקנים נותרו"
          value={tokenBalance.toLocaleString()}
          sub="ביתרה הנוכחית"
          accentColor="#60A5FA"
        />
      </div>

      {/* ── Main chart + Platform breakdown side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 20 }}>

        {/* Area chart */}
        <div className="neon-card" style={{ ...GLASS, padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>מגמת צמיחה</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>פוסטים שנוצרו ב-8 השבועות האחרונים</p>
            </div>

            {/* platform filter tabs */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: 3, gap: 2 }}>
              {(['all', 'facebook', 'instagram', 'tiktok'] as const).map(f => {
                const active = chartFilter === f
                const pm     = f === 'all' ? null : PLATFORM_META[f]
                return (
                  <button key={f} onClick={() => setChartFilter(f)} style={{
                    padding: '5px 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: active ? (pm ? `${pm.color}22` : `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`) : 'transparent',
                    border: active && pm ? `1px solid ${pm.color}44` : 'none',
                    color: active ? (pm ? pm.color : '#fff') : 'rgba(255,255,255,0.38)',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {pm && <i className={`ti ${pm.icon}`} style={{ fontSize: 12 }} />}
                    {f === 'all' ? 'הכל' : pm?.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* chart area */}
          <div style={{ position: 'relative' }}>
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', right: -4, top: 0, bottom: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'right', pointerEvents: 'none' }}>
              {[Math.max(...chartData), Math.round(Math.max(...chartData) * 0.75), Math.round(Math.max(...chartData) * 0.5), Math.round(Math.max(...chartData) * 0.25), 0].map(v => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <div style={{ marginRight: 20 }}>
              <AreaChart data={chartData} color={chartColor} />
            </div>

            {/* X-axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginRight: 20, marginTop: 6 }}>
              {weekLabels.map(l => (
                <span key={l} style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Platform breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="neon-card" style={{ ...GLASS, padding: '20px', flex: 1 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>חלוקה לפי פלטפורמה</h3>
            {(['facebook', 'instagram', 'tiktok'] as const).map(plat => {
              const pm  = PLATFORM_META[plat]
              const cnt = posts.filter(p => (p.platform ?? []).includes(plat)).length
              const pct = totalPosts > 0 ? Math.round((cnt / totalPosts) * 100) : 0
              return (
                <div key={plat} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <i className={`ti ${pm.icon}`} style={{ fontSize: 14, color: pm.color }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{pm.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pm.color, transition: 'width 0.6s ease', boxShadow: `0 0 8px ${pm.color}50` }} />
                  </div>
                </div>
              )
            })}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' }} />

            {/* quick stats */}
            {[
              { label: 'פוסטים שפורסמו', val: publishedPosts.length, icon: 'ti-check', color: GREEN },
              { label: 'פוסטים מתוזמנים', val: scheduledPosts.length, icon: 'ti-clock', color: '#60A5FA' },
              { label: 'טיוטות', val: posts.filter(p => p.status === 'draft').length, icon: 'ti-file', color: '#94A3B8' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 13, color: s.color }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* token usage card */}
          <div className="neon-card" style={{ ...GLASS, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <i className="ti ti-coins" style={{ fontSize: 16, color: PURPLE2 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>ניצול טוקנים</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
              {tokenBalance.toLocaleString()}
              <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.35)', marginRight: 5 }}>נותרו</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                width: `${Math.min(100, (tokenBalance / 300) * 100)}%`,
                height: '100%', borderRadius: 999,
                background: tokenBalance > 100 ? `linear-gradient(90deg, ${PURPLE}, ${PURPLE2})` : 'linear-gradient(90deg, #FBBF24, #F87171)',
                transition: 'width 0.6s',
              }} />
            </div>
            <button onClick={() => setShowUpgrade(true)} style={{
              width: '100%', padding: '8px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(176,48,245,0.12)', border: '1px solid rgba(176,48,245,0.25)',
              color: PURPLE2, fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <i className="ti ti-plus" style={{ fontSize: 12 }} /> רכוש טוקנים נוספים
            </button>
          </div>
        </div>
      </div>

      {/* ── Leaderboard ── */}
      <div className="neon-card" style={{ ...GLASS, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-clock-hour-4" style={{ fontSize: 17, color: '#FBBF24' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>הפוסטים האחרונים שלך</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0 }}>לחץ "שכפל" ו-AI יכתוב וריאציה חדשה</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/queue')} style={{
            padding: '7px 16px', borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <i className="ti ti-list" style={{ fontSize: 13 }} /> כל הפוסטים
          </button>
        </div>

        {topPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)' }}>
            <i className="ti ti-chart-bar" style={{ fontSize: 36, display: 'block', marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>אין פוסטים עדיין — צור פוסט ראשון כדי לראות נתונים</div>
            <button onClick={() => router.push('/dashboard/create')} style={{
              marginTop: 14, padding: '9px 22px', borderRadius: 14, cursor: 'pointer',
              background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
              צור פוסט ראשון
            </button>
          </div>
        ) : (
          topPosts.map((p, i) => (
            <LeaderRow key={p.id} post={p} rank={i + 1} onDuplicate={handleDuplicate} />
          ))
        )}

        {/* demo rows if no real posts */}
        {topPosts.length === 0 && (
          <div style={{ marginTop: 8, padding: '12px 20px', borderRadius: 14, background: 'rgba(176,48,245,0.06)', border: '1px dashed rgba(176,48,245,0.2)', fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
            הנתונים יופיעו כאן לאחר פרסום הפוסטים הראשונים
          </div>
        )}
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} trigger="tokens_empty" />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
