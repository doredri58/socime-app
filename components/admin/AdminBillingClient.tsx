'use client'
import React, { useState } from 'react'

const ACCENT = '#3B82EF', GREEN = '#10B981', RED = '#EF4444', YELLOW = '#F59E0B', PURPLE = '#8B5CF6'
const BG = 'rgba(255,255,255,0.03)', BD = 'rgba(255,255,255,0.07)'
const CARD: React.CSSProperties = { background: BG, border: `1px solid ${BD}`, borderRadius: 14, padding: '18px 20px' }

interface Txn { id: string; user_id: string; amount_paid_ils: number | null; tokens_granted: number | null; created_at: string; status: string | null }
interface Props {
  txns: Txn[]
  userMap: Record<string, { email: string; name: string | null }>
  tierCount: { free: number; basic: number; pro: number }
  mrr: number; totalRevenue: number
  monthlyRev: { month: string; total: number }[]
}

function KpiCard({ icon, iconColor, iconBg, label, value, sub }: {
  icon: string; iconColor: string; iconBg: string; label: string; value: string | number; sub: string
}) {
  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{value}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{sub}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, border: `1px solid ${iconColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 17, color: iconColor }} />
        </div>
      </div>
    </div>
  )
}

/* mini bar chart using pure SVG */
function BarChart({ data }: { data: { month: string; total: number }[] }) {
  const max = Math.max(...data.map(d => d.total), 1)
  const W = 480, H = 80, barW = Math.floor((W - (data.length - 1) * 6) / Math.max(data.length, 1))
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} />
          <stop offset="100%" stopColor={PURPLE} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const bH = Math.max(Math.round((d.total / max) * H), 4)
        const x  = i * (barW + 6)
        const label = d.month.slice(5) // MM
        return (
          <g key={d.month}>
            <rect x={x} y={H - bH} width={barW} height={bH} rx={4} fill="url(#barGrad)" opacity={0.85} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="monospace">{label}</text>
            <text x={x + barW / 2} y={H - bH - 4} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="monospace">
              {d.total > 0 ? `₪${d.total}` : ''}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* donut-ish plan distribution using SVG */
function PlanDonut({ tierCount }: { tierCount: { free: number; basic: number; pro: number } }) {
  const total = tierCount.free + tierCount.basic + tierCount.pro || 1
  const segs = [
    { label: 'Free',  val: tierCount.free,  color: 'rgba(255,255,255,0.2)' },
    { label: 'Basic', val: tierCount.basic, color: ACCENT   },
    { label: 'Pro',   val: tierCount.pro,   color: PURPLE   },
  ]
  const R = 52, cx = 70, cy = 70, stroke = 18
  let cumAngle = -90
  const arcs = segs.map(s => {
    const pct = s.val / total
    const angle = pct * 360
    const startRad = (cumAngle * Math.PI) / 180
    const endRad   = ((cumAngle + angle) * Math.PI) / 180
    cumAngle += angle
    const x1 = cx + R * Math.cos(startRad), y1 = cy + R * Math.sin(startRad)
    const x2 = cx + R * Math.cos(endRad),   y2 = cy + R * Math.sin(endRad)
    const large = angle > 180 ? 1 : 0
    return { ...s, pct, path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}` }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 140 140" style={{ width: 120, flexShrink: 0 }}>
        {arcs.map(a => a.pct > 0 && (
          <path key={a.label} d={a.path} fill="none" stroke={a.color} strokeWidth={stroke} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={900} fontFamily="monospace">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>משתמשים</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segs.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 36 }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{s.val}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>({Math.round(s.val / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminBillingClient({ txns, userMap, tierCount, mrr, totalRevenue, monthlyRev }: Props) {
  const [search, setSearch] = useState('')
  const filtered = txns.filter(t => {
    if (!search) return true
    const u = userMap[t.user_id] ?? {}
    return [u.email ?? '', u.name ?? '', t.id].join(' ').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>ניהול מינויים וחיובים</h1>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{txns.length} עסקאות · Billing & Stripe</div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard icon="ti-trending-up"    iconColor={GREEN}  iconBg="rgba(16,185,129,0.10)" label="MRR חודשי"      value={`₪${mrr.toLocaleString()}`}         sub="הכנסה חוזרת חודשית" />
        <KpiCard icon="ti-currency-shekel" iconColor={ACCENT} iconBg="rgba(59,130,239,0.10)"  label="הכנסות כולל"   value={`₪${totalRevenue.toLocaleString()}`} sub="כל הזמנים" />
        <KpiCard icon="ti-diamond"        iconColor={PURPLE} iconBg="rgba(139,92,246,0.10)"  label="משלמים פעילים" value={tierCount.basic + tierCount.pro}      sub={`Basic ${tierCount.basic} · Pro ${tierCount.pro}`} />
        <KpiCard icon="ti-receipt"        iconColor={YELLOW} iconBg="rgba(245,158,11,0.10)"  label="עסקאות"        value={txns.length}                          sub="PayPlus transactions" />
      </div>

      {/* charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, marginBottom: 20 }}>
        {/* bar chart */}
        <div style={CARD}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 16 }}>הכנסות לפי חודש (6 חודשים אחרונים)</div>
          {monthlyRev.length > 0
            ? <BarChart data={monthlyRev} />
            : <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center', padding: 24 }}>אין נתונים</div>
          }
        </div>
        {/* plan donut */}
        <div style={{ ...CARD, minWidth: 260 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: 16 }}>התפלגות מסלולים</div>
          <PlanDonut tierCount={tierCount} />
          {/* ARPU */}
          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 3 }}>ARPU (ממוצע הכנסה למשתמש)</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: YELLOW, fontFamily: 'monospace' }}>
              ₪{((tierCount.basic * 79 + tierCount.pro * 149) / Math.max(tierCount.basic + tierCount.pro, 1)).toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* transactions table */}
      <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>היסטוריית עסקאות</div>
          <div style={{ position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש לפי משתמש..."
              style={{ padding: '6px 30px 6px 10px', borderRadius: 8, fontSize: 11, outline: 'none', direction: 'rtl', width: 200,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${BD}` }}>
                {['תאריך','משתמש','סכום','טוקנים','סטטוס'].map(c => (
                  <th key={c} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, fontSize: 10,
                    color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.2)' }}>אין תוצאות</td></tr>
              )}
              {filtered.map((t, i) => {
                const u = userMap[t.user_id]
                const ok = !t.status || t.status === 'completed' || t.status === 'success'
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '8px 14px', maxWidth: 220 }}>
                      <div style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u?.name ?? '—'}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u?.email ?? t.user_id.slice(0, 12) + '...'}
                      </div>
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'monospace', fontWeight: 800,
                      color: GREEN, whiteSpace: 'nowrap', fontSize: 13 }}>
                      ₪{(t.amount_paid_ils ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 14px', fontFamily: 'monospace', color: ACCENT, whiteSpace: 'nowrap' }}>
                      +{(t.tokens_granted ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '2px 8px', borderRadius: 6,
                        background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: ok ? GREEN : RED }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: ok ? GREEN : RED }}>
                          {t.status ?? 'completed'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
