'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PLANS } from '@/lib/plans'

/* ── design tokens — light theme ─────────────────────────────────────── */
const ACCENT  = '#1A73E8'
const GREEN   = '#0F9E60'
const RED     = '#D93025'
const YELLOW  = '#F9AB00'
const PURPLE  = '#7C3AED'
const BG_CARD = '#FFFFFF'
const BORDER  = '#E2E8F0'
const TEXT    = '#0F172A'
const TEXT_MID = '#475569'
const TEXT_LOW = '#94A3B8'

/* ── types ───────────────────────────────────────────────────────────── */
interface User {
  id: string; email: string; name: string | null; role: string
  tier: string | null; token_balance: number | null
  status: string; created_at: string; last_login_at: string | null
}

interface LiveStats {
  total_users: number
  active_users: number
  paying_users: number
  posts_created: number
  free_users: number
  basic_users: number
  pro_users: number
  agency_users: number
  revenue_mtd: number
  total_revenue: number
  image_count: number
}

interface Props { users: User[]; stats: { totalUsers: number; payingUsers: number; totalRevenue: number; postCount: number; imageCount: number } }

/* ── helpers ─────────────────────────────────────────────────────────── */
function ago(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1)  return 'עכשיו'
  if (h < 24) return `${h}ש' אחורה`
  return `${Math.floor(h / 24)}י' אחורה`
}

/* ── tiny badge ──────────────────────────────────────────────────────── */
function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
      color, background: bg, border: `1px solid ${border}`, whiteSpace: 'nowrap',
      letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
      {label}
    </span>
  )
}

const TIER_BADGE: Record<string, React.ReactElement> = {
  free:  <Badge label="Free"  color="#64748B"  bg="#F1F5F9"               border="#E2E8F0"                />,
  basic: <Badge label="Basic" color={ACCENT}   bg="rgba(26,115,232,0.08)" border="rgba(26,115,232,0.22)" />,
  pro:   <Badge label="Pro"   color={PURPLE}   bg="rgba(124,58,237,0.08)" border="rgba(124,58,237,0.25)" />,
}

/* ── toast ───────────────────────────────────────────────────────────── */
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500,
      padding: '10px 20px', borderRadius: 10,
      background: ok ? GREEN : RED,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    }}>
      <i className={`ti ${ok ? 'ti-circle-check' : 'ti-alert-circle'}`}
        style={{ fontSize: 15, color: '#fff' }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{msg}</span>
    </div>
  )
}

/* ── KPI skeleton ────────────────────────────────────────────────────── */
function KpiSkeleton() {
  return (
    <div style={{ ...BG_CARD_STYLE, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 10, width: 80, borderRadius: 4, background: '#E2E8F0', marginBottom: 12 }} />
          <div style={{ height: 26, width: 60, borderRadius: 4, background: '#E2E8F0', marginBottom: 8 }} />
          <div style={{ height: 10, width: 100, borderRadius: 4, background: '#E2E8F0' }} />
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#E2E8F0' }} />
      </div>
    </div>
  )
}

/* ── KPI card ────────────────────────────────────────────────────────── */
function KpiCard({ icon, iconColor, iconBg, label, value, sub, trend, trendUp }: {
  icon: string; iconColor: string; iconBg: string
  label: string; value: string | number; sub: string; trend?: string; trendUp?: boolean
}) {
  return (
    <div style={{ ...BG_CARD_STYLE, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_LOW,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: TEXT, letterSpacing: '-1px', lineHeight: 1 }}>
            {value}
          </div>
          <div style={{ fontSize: 11, color: TEXT_LOW, marginTop: 6 }}>{sub}</div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: iconBg,
          border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 18, color: iconColor }} />
        </div>
      </div>

      {trend && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className={`ti ${trendUp ? 'ti-trending-up' : 'ti-trending-down'}`}
            style={{ fontSize: 13, color: trendUp ? GREEN : RED }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: trendUp ? GREEN : RED }}>{trend}</span>
        </div>
      )}
    </div>
  )
}

const BG_CARD_STYLE: React.CSSProperties = {
  background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
}

/* ── section header ──────────────────────────────────────────────────── */
function SectionHeader({ icon, title, count, action }: {
  icon: string; title: string; count?: number; action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 14, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(26,115,232,0.08)',
          border: '1px solid rgba(26,115,232,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`ti ${icon}`} style={{ fontSize: 15, color: ACCENT }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 900, color: TEXT, letterSpacing: '-0.3px' }}>{title}</span>
        {count !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            background: 'rgba(26,115,232,0.08)', border: '1px solid rgba(26,115,232,0.18)', color: ACCENT }}>
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

/* ── icon action button ──────────────────────────────────────────────── */
function ActionBtn({ icon, title, color, bg, border, onClick, loading }: {
  icon: string; title: string; color: string; bg: string; border: string
  onClick: () => void; loading?: boolean
}) {
  return (
    <button title={title} onClick={onClick} disabled={loading} style={{
      width: 28, height: 28, borderRadius: 7, cursor: loading ? 'wait' : 'pointer', flexShrink: 0,
      background: bg, border: `1px solid ${border}`, display: 'flex',
      alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
    }}>
      <i className={`ti ${loading ? 'ti-loader' : icon}`}
        style={{ fontSize: 13, color, animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
    </button>
  )
}

/* ── token editor inline ─────────────────────────────────────────────── */
function TokenEditor({ current, onSave }: { current: number; onSave: (v: number) => void }) {
  const [val, setVal] = useState(String(current))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <input type="number" value={val} onChange={e => setVal(e.target.value)}
        style={{ width: 72, padding: '3px 7px', borderRadius: 7, fontSize: 11, fontWeight: 700,
          background: '#F8FAFD', border: `1px solid ${BORDER}`,
          color: TEXT, outline: 'none', direction: 'ltr' }} />
      <button onClick={() => onSave(Number(val))} style={{
        padding: '3px 9px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 800,
        background: 'rgba(26,115,232,0.10)', border: '1px solid rgba(26,115,232,0.25)', color: ACCENT,
      }}>✓</button>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════ */
export default function GodModeDashboard({ users: initial, stats: initialStats }: Props) {
  const [users, setUsers]         = useState(initial)
  const [busy, setBusy]           = useState<string | null>(null)
  const [editTokenId, setEditTokenId] = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  // חותמת זמן יציבה לחישובי DAU — מונע קריאה ל-Date.now() בזמן render.
  const [renderTime] = useState(() => Date.now())

  /* ── live stats fetched from /api/admin/stats ── */
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) return
        const data = await res.json() as LiveStats
        if (!cancelled) setLiveStats(data)
      } catch {
        // silently fall back to server-side stats
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }
    void fetchStats()
    return () => { cancelled = true }
  }, [])

  /* resolve stats: prefer live fetch, fall back to server-rendered props */
  const totalUsers   = liveStats?.total_users   ?? initialStats.totalUsers
  const payingUsers  = liveStats?.paying_users  ?? initialStats.payingUsers
  const totalRevenue = liveStats?.total_revenue ?? initialStats.totalRevenue
  const postCount    = liveStats?.posts_created ?? initialStats.postCount
  const imageCount   = liveStats?.image_count   ?? initialStats.imageCount

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function patchUser(id: string, patch: Record<string, unknown>) {
    setBusy(id)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, ...patch }),
    })
    setBusy(null)
    return res.ok
  }

  async function impersonate(id: string) {
    setBusy(id)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      })
      const data = await res.json().catch(() => ({}))
      // ה-API מחזיר magicLink חד-פעמי — יש לנווט אליו כדי להחליף סשן למשתמש היעד.
      if (res.ok && data.magicLink) {
        window.location.href = data.magicLink
      } else {
        showToast(data.error ?? 'שגיאה בהתחברות כמשתמש', false)
      }
    } catch {
      showToast('שגיאה בהתחברות כמשתמש', false)
    } finally {
      setBusy(null)
    }
  }

  async function toggleSuspend(u: User) {
    const newStatus = u.status === 'suspended' ? 'active' : 'suspended'
    const ok = await patchUser(u.id, { status: newStatus })
    if (ok) {
      setUsers(p => p.map(x => x.id === u.id ? { ...x, status: newStatus } : x))
      showToast(newStatus === 'suspended' ? `${u.name ?? u.email} הושעה` : `${u.name ?? u.email} שוחרר`, ok)
    } else showToast('שגיאה בעדכון הסטטוס', false)
  }

  async function saveTokens(u: User, tokens: number) {
    // ה-API מצפה ל-tokenBalance (camelCase) ומעדכן את עמודת token_balance ב-DB.
    const ok = await patchUser(u.id, { tokenBalance: tokens })
    if (ok) {
      setUsers(p => p.map(x => x.id === u.id ? { ...x, token_balance: tokens } : x))
      setEditTokenId(null)
      showToast(`טוקנים עודכנו ל-${tokens}`, true)
    } else showToast('שגיאה בעדכון טוקנים', false)
  }

  const filtered = users.filter(u => {
    if (tierFilter !== 'all' && (u.tier ?? 'free') !== tierFilter) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (u.email + u.name + u.id).toLowerCase().includes(q)
  })

  /* ── MRR calc: real monthly prices from lib/plans (basic/pro/agency) ── */
  const mrr = users.reduce((s, u) => {
    const t = u.tier
    if (t === 'basic' || t === 'pro' || t === 'agency') return s + PLANS[t].monthly
    return s
  }, 0)

  const dau = users.filter(u => {
    if (!u.last_login_at) return false
    return renderTime - new Date(u.last_login_at).getTime() < 86400000
  }).length

  const conversionPct = Math.round(payingUsers / Math.max(totalUsers, 1) * 100)
  const tokenBurn = imageCount * 50 + postCount * 10
  const avgTokens = Math.round(tokenBurn / Math.max(totalUsers, 1))

  return (
    <div style={{ direction: 'rtl' }}>

      {/* ── page title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: TEXT, margin: '0 0 3px', letterSpacing: '-0.5px' }}>
            פאנל ניהול מערכת
          </h1>
          <div style={{ fontSize: 11, color: TEXT_LOW, fontFamily: 'monospace' }}>
            God Mode · {new Date().toLocaleString('he-IL')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ padding: '6px 12px', borderRadius: 8, background: BG_CARD, border: `1px solid ${BORDER}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            fontSize: 11, color: TEXT_MID, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-users" style={{ fontSize: 13 }} />{users.length} משתמשים
          </div>
          <div style={{ padding: '6px 12px', borderRadius: 8, background: BG_CARD, border: `1px solid ${BORDER}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            fontSize: 11, color: TEXT_MID, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-server" style={{ fontSize: 13 }} />v2.4.1
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 1 — KPI CARDS
      ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {statsLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              icon="ti-currency-shekel" iconColor={GREEN} iconBg="rgba(15,158,96,0.10)"
              label="MRR — הכנסה חודשית"
              value={`₪${mrr.toLocaleString()}`}
              sub={`₪${totalRevenue.toLocaleString()} הכנסות כולל`}
            />
            <KpiCard
              icon="ti-users-group" iconColor={ACCENT} iconBg="rgba(26,115,232,0.10)"
              label="Active Users"
              value={totalUsers}
              sub={`DAU: ${dau} · משלמים: ${payingUsers}`}
              trend={`${conversionPct}% conversion`}
              trendUp={payingUsers > 0}
            />
            <KpiCard
              icon="ti-photo-ai" iconColor={YELLOW} iconBg="rgba(249,171,0,0.10)"
              label="תמונות AI"
              value={imageCount.toLocaleString()}
              sub="נוצרו במנוע Gemini"
            />
            <KpiCard
              icon="ti-flame" iconColor={RED} iconBg="rgba(217,48,37,0.08)"
              label="Token Burn Rate"
              value={tokenBurn.toLocaleString()}
              sub={`${postCount} פוסטים · ${imageCount} תמונות`}
              trend={`ממוצע ${avgTokens} טוקן/משתמש`} trendUp={false}
            />
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          ROW 2 — USERS CRM TABLE
      ═══════════════════════════════════════════ */}
      <div style={{ ...BG_CARD_STYLE, marginBottom: 20, overflow: 'hidden' }}>
        {/* table header bar */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <SectionHeader icon="ti-users" title="ניהול לקוחות" count={filtered.length} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* tier filter */}
            {['all', 'free', 'basic', 'pro'].map(t => (
              <button key={t} onClick={() => setTierFilter(t)} style={{
                padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                border: `1px solid ${tierFilter === t ? 'rgba(26,115,232,0.35)' : BORDER}`,
                background: tierFilter === t ? 'rgba(26,115,232,0.08)' : '#F8FAFD',
                color: tierFilter === t ? ACCENT : TEXT_MID,
                textTransform: 'uppercase',
              }}>
                {t === 'all' ? 'הכל' : t}
              </button>
            ))}
            {/* search */}
            <div style={{ position: 'relative' }}>
              <i className="ti ti-search" style={{ position: 'absolute', right: 9, top: '50%',
                transform: 'translateY(-50%)', fontSize: 12, color: TEXT_LOW, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש..." style={{
                  padding: '5px 28px 5px 10px', borderRadius: 8, fontSize: 11,
                  background: '#F8FAFD', border: `1px solid ${BORDER}`,
                  color: TEXT, outline: 'none', direction: 'rtl', width: 160,
                }} />
            </div>
          </div>
        </div>

        {/* dense data table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['#', 'שם ואימייל', 'מסלול', 'טוקנים', 'כניסה אחרונה', 'סטטוס', 'פעולות'].map(col => (
                  <th key={col} style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, fontSize: 10,
                    color: TEXT_LOW, letterSpacing: '0.06em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap', background: '#F8FAFD' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: TEXT_LOW, fontSize: 12 }}>
                  אין תוצאות
                </td></tr>
              ) : filtered.map((u, i) => {
                const suspended = u.status === 'suspended'
                const isBusy    = busy === u.id
                return (
                  <tr key={u.id} style={{
                    borderBottom: `1px solid ${BORDER}`,
                    background: suspended ? 'rgba(217,48,37,0.03)' : i % 2 === 0 ? '#FFFFFF' : '#F8FAFD',
                    transition: 'background 0.1s',
                    opacity: suspended ? 0.75 : 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,115,232,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = suspended ? 'rgba(217,48,37,0.03)' : i % 2 === 0 ? '#FFFFFF' : '#F8FAFD')}
                  >
                    <td style={{ padding: '9px 14px', color: TEXT_LOW, fontFamily: 'monospace',
                      fontSize: 10, whiteSpace: 'nowrap' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '9px 14px', maxWidth: 220 }}>
                      <div style={{ fontWeight: 700, color: TEXT, marginBottom: 2, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.name ?? <span style={{ color: TEXT_LOW }}>—</span>}
                      </div>
                      <div style={{ color: TEXT_MID, fontFamily: 'monospace', fontSize: 10,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </div>
                    </td>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      {TIER_BADGE[u.tier ?? 'free'] ?? TIER_BADGE.free}
                    </td>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      {editTokenId === u.id ? (
                        <TokenEditor current={u.token_balance ?? 0}
                          onSave={v => saveTokens(u, v)} />
                      ) : (
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                          color: (u.token_balance ?? 0) < 10 ? RED : (u.token_balance ?? 0) < 50 ? YELLOW : GREEN }}>
                          {(u.token_balance ?? 0).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '9px 14px', color: TEXT_MID,
                      fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}>
                      {ago(u.last_login_at)}
                    </td>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: suspended ? RED : GREEN,
                          boxShadow: suspended ? `0 0 5px ${RED}` : `0 0 5px ${GREEN}` }} />
                        <span style={{ fontSize: 11, fontWeight: 700,
                          color: suspended ? RED : GREEN }}>
                          {suspended ? 'מושעה' : 'פעיל'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <ActionBtn
                          icon="ti-user-check" title="התחבר כמשתמש (Impersonate)"
                          color={ACCENT} bg="rgba(26,115,232,0.06)" border="rgba(26,115,232,0.18)"
                          onClick={() => impersonate(u.id)} loading={isBusy}
                        />
                        <ActionBtn
                          icon={editTokenId === u.id ? 'ti-x' : 'ti-coins'}
                          title="ערוך טוקנים"
                          color={YELLOW} bg="rgba(249,171,0,0.08)" border="rgba(249,171,0,0.22)"
                          onClick={() => setEditTokenId(prev => prev === u.id ? null : u.id)}
                        />
                        <ActionBtn
                          icon={suspended ? 'ti-lock-open' : 'ti-ban'}
                          title={suspended ? 'שחרר חסימה' : 'חסום משתמש'}
                          color={suspended ? GREEN : RED}
                          bg={suspended ? 'rgba(15,158,96,0.06)' : 'rgba(217,48,37,0.06)'}
                          border={suspended ? 'rgba(15,158,96,0.18)' : 'rgba(217,48,37,0.18)'}
                          onClick={() => toggleSuspend(u)} loading={isBusy}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* table footer */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', gap: 14, background: '#F8FAFD' }}>
          {[
            { label: 'פעילים',  val: users.filter(u => u.status !== 'suspended').length, color: GREEN  },
            { label: 'מושעים',  val: users.filter(u => u.status === 'suspended').length, color: RED    },
            { label: 'Pro',     val: users.filter(u => u.tier === 'pro').length,         color: PURPLE },
            { label: 'Basic',   val: users.filter(u => u.tier === 'basic').length,       color: ACCENT },
            { label: 'Free',    val: users.filter(u => !u.tier || u.tier === 'free').length, color: TEXT_MID },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, color: TEXT_LOW }}>{s.label}:</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 3 — AI ENGINE
      ═══════════════════════════════════════════ */}
      <div style={{ ...BG_CARD_STYLE, padding: '18px 20px' }}>
        <SectionHeader icon="ti-brain" title="מנוע ה-AI"
          action={
            <Link href="/admin/ai" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8,
              textDecoration: 'none', fontSize: 11, fontWeight: 800,
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.22)',
              color: PURPLE,
            }}>
              <i className="ti ti-edit" style={{ fontSize: 12 }} /> עריכת System Prompts
            </Link>
          }
        />

        <p style={{ fontSize: 12, color: TEXT_MID, lineHeight: 1.6, margin: '0 0 16px' }}>
          כל התוכן מופק על-ידי <strong style={{ color: TEXT }}>Google Gemini&nbsp;2.5&nbsp;Flash</strong>.
          ניתן לערוך את ה-System&nbsp;Prompt של כל מנוע דרך הכפתור למעלה.
        </p>

        {/* real editable engines — no fabricated live status */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['Ideas Engine', 'Post Generator', 'Image AI', 'Onboarding AI'].map(label => (
            <span key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8,
              background: '#F8FAFD', border: `1px solid ${BORDER}`,
              fontSize: 11, fontWeight: 700, color: TEXT_MID,
            }}>
              <i className="ti ti-sparkles" style={{ fontSize: 12, color: PURPLE }} />
              {label}
            </span>
          ))}
        </div>

        {/* real usage metrics from live stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'פוסטים שנוצרו', val: postCount.toLocaleString(),  color: ACCENT },
            { label: 'תמונות שנוצרו', val: imageCount.toLocaleString(), color: PURPLE },
            { label: 'טוקנים שנצרכו', val: tokenBurn.toLocaleString(),  color: GREEN  },
          ].map(m => (
            <div key={m.label} style={{ padding: '10px 12px', borderRadius: 10,
              background: '#F8FAFD', border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
              <div style={{ fontSize: 10, color: TEXT_LOW, marginTop: 3 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast {...toast} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        table tbody tr:hover td { background: rgba(26,115,232,0.04) !important; }
      `}</style>
    </div>
  )
}
