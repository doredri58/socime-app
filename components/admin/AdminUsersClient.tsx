'use client'
import React, { useState, useMemo } from 'react'

/* ── tokens ── */
const ACCENT = '#3B82EF', GREEN = '#10B981', RED = '#EF4444', YELLOW = '#F59E0B', PURPLE = '#8B5CF6'
const BG = 'rgba(255,255,255,0.03)', BD = 'rgba(255,255,255,0.07)'

interface User {
  id: string; email: string; name: string | null; role: string
  tier: string | null; token_balance: number | null; status: string
  created_at: string; last_login_at: string | null
  business_name: string | null; company_id: string | null; phone: string | null
}

function ago(iso: string | null) {
  if (!iso) return '—'
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (h < 1) return 'עכשיו'; if (h < 24) return `${h}ש'`; return `${Math.floor(h/24)}י'`
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500,
      padding: '10px 20px', borderRadius: 10, backdropFilter: 'blur(20px)',
      background: ok ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12, fontWeight: 700 }}>
      <i className={`ti ${ok ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ color: ok ? GREEN : RED }} />
      {msg}
    </div>
  )
}

const TIER_COLOR: Record<string, string> = { free: 'rgba(255,255,255,0.3)', basic: ACCENT, pro: PURPLE }
const ROLE_COLOR: Record<string, string> = { founder: '#FBBF24', admin: PURPLE, editor: ACCENT, user: 'rgba(255,255,255,0.3)' }

export default function AdminUsersClient({ users: initial }: { users: User[] }) {
  const [users, setUsers]     = useState(initial)
  const [search, setSearch]   = useState('')
  const [tier, setTier]       = useState('all')
  const [status, setStatus]   = useState('all')
  const [busy, setBusy]       = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVals, setEditVals] = useState<Partial<User>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [expandId, setExpandId] = useState<string | null>(null)

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

  const filtered = useMemo(() => users.filter(u => {
    if (tier !== 'all' && (u.tier ?? 'free') !== tier) return false
    if (status !== 'all' && u.status !== status) return false
    const q = search.toLowerCase()
    if (!q) return true
    return [u.email, u.name, u.id, u.business_name, u.company_id, u.phone].join(' ').toLowerCase().includes(q)
  }), [users, tier, status, search])

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, ...body }),
    })
    setBusy(null); return res.ok
  }

  async function saveEdit(u: User) {
    const updates: Record<string, unknown> = {}
    if (editVals.tier         !== undefined) updates.tier = editVals.tier
    if (editVals.role         !== undefined) updates.role = editVals.role
    if (editVals.token_balance !== undefined) updates.tokenBalance = editVals.token_balance
    const ok = await patch(u.id, updates)
    if (ok) { setUsers(p => p.map(x => x.id === u.id ? { ...x, ...editVals } : x)); setEditing(null) }
    showToast(ok ? 'משתמש עודכן ✓' : 'שגיאה בעדכון', ok)
  }

  async function toggleSuspend(u: User) {
    const ns = u.status === 'suspended' ? 'active' : 'suspended'
    const ok = await patch(u.id, { status: ns })
    if (ok) setUsers(p => p.map(x => x.id === u.id ? { ...x, status: ns } : x))
    showToast(ok ? (ns === 'suspended' ? `${u.name ?? u.email} הושעה` : 'שוחרר') : 'שגיאה', ok)
  }

  async function impersonate(id: string) {
    setBusy(id)
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    })
    setBusy(null)
    if (!res.ok) { showToast('שגיאה בהתחברות', false); return }
    const { magicLink, targetName } = await res.json()
    showToast(`מתחבר כ-${targetName ?? '...'}`, true)
    /* Magic link swaps the session then redirects to /dashboard */
    window.location.href = magicLink
  }

  function exportCsv() {
    const rows = [['ID','Email','Name','Tier','Role','Tokens','Status','Created'].join(',')]
    for (const u of filtered) rows.push([u.id, u.email, u.name ?? '', u.tier ?? 'free', u.role, u.token_balance ?? 0, u.status, u.created_at].join(','))
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }))
    a.download = 'socime-users.csv'; a.click()
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(u => u.id)))
  }

  return (
    <div style={{ direction: 'rtl' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>ניהול לקוחות — CRM</h1>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{users.length} משתמשים רשומים</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCsv} style={{ padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: GREEN,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-download" /> ייצוא CSV
          </button>
        </div>
      </div>

      {/* filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="שם, אימייל, ח.פ, טלפון..."
            style={{ padding: '7px 32px 7px 12px', borderRadius: 9, fontSize: 12, outline: 'none', direction: 'rtl', width: 240,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
        </div>
        {['all','free','basic','pro'].map(t => (
          <button key={t} onClick={() => setTier(t)} style={{ padding: '5px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: tier === t ? 'rgba(59,130,239,0.12)' : 'transparent',
            border: `1px solid ${tier === t ? 'rgba(59,130,239,0.35)' : 'rgba(255,255,255,0.07)'}`,
            color: tier === t ? ACCENT : 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const }}>
            {t === 'all' ? 'הכל' : t}
          </button>
        ))}
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)' }} />
        {['all','active','suspended'].map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: '5px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: status === s ? (s === 'suspended' ? 'rgba(239,68,68,0.10)' : 'rgba(16,185,129,0.08)') : 'transparent',
            border: `1px solid ${status === s ? (s === 'suspended' ? 'rgba(239,68,68,0.28)' : 'rgba(16,185,129,0.22)') : 'rgba(255,255,255,0.07)'}`,
            color: status === s ? (s === 'suspended' ? RED : GREEN) : 'rgba(255,255,255,0.3)' }}>
            {s === 'all' ? 'כל הסטטוסים' : s === 'active' ? 'פעיל' : 'מושעה'}
          </button>
        ))}
        <div style={{ marginRight: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          {selected.size > 0 && `${selected.size} נבחרו`}
        </div>
      </div>

      {/* table */}
      <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${BD}` }}>
                <th style={{ padding: '9px 12px', width: 36 }}>
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} style={{ accentColor: ACCENT }} />
                </th>
                {['#','שם ועסק','אימייל','מסלול','תפקיד','טוקנים','כניסה','סטטוס','פעולות'].map(c => (
                  <th key={c} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, fontSize: 10,
                    color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)' }}>אין תוצאות</td></tr>
              )}
              {filtered.map((u, i) => {
                const isBusy = busy === u.id
                const suspended = u.status === 'suspended'
                const isEditing = editing === u.id
                const expanded = expandId === u.id
                return (
                  <React.Fragment key={u.id}>
                    <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`,
                      background: suspended ? 'rgba(239,68,68,0.03)' : 'transparent',
                      opacity: suspended ? 0.7 : 1 }}>
                      {/* checkbox */}
                      <td style={{ padding: '8px 12px' }}>
                        <input type="checkbox" checked={selected.has(u.id)}
                          onChange={() => setSelected(p => { const n = new Set(p); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n })}
                          style={{ accentColor: ACCENT }} />
                      </td>
                      {/* index + expand */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button onClick={() => setExpandId(p => p === u.id ? null : u.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              fontSize: 12, fontWeight: 700, color: '#fff', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <i className={`ti ${expanded ? 'ti-chevron-down' : 'ti-chevron-left'}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }} />
                            {u.name ?? <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                          </button>
                          {u.business_name && (
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', paddingRight: 18 }}>
                              <i className="ti ti-building" style={{ fontSize: 9, marginLeft: 3 }} />{u.business_name}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* email */}
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.45)', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      </td>
                      {/* tier */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <select value={editVals.tier ?? u.tier ?? 'free'}
                            onChange={e => setEditVals(p => ({ ...p, tier: e.target.value }))}
                            style={{ padding: '3px 6px', borderRadius: 6, fontSize: 11, background: '#0A1020',
                              border: '1px solid rgba(59,130,239,0.3)', color: '#fff', cursor: 'pointer' }}>
                            {['free','basic','pro'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                            color: TIER_COLOR[u.tier ?? 'free'] ?? 'rgba(255,255,255,0.3)',
                            background: `${TIER_COLOR[u.tier ?? 'free']}18`,
                            border: `1px solid ${TIER_COLOR[u.tier ?? 'free']}28`,
                            textTransform: 'uppercase' as const }}>
                            {u.tier ?? 'free'}
                          </span>
                        )}
                      </td>
                      {/* role */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        {isEditing && u.role !== 'founder' ? (
                          <select value={editVals.role ?? u.role}
                            onChange={e => setEditVals(p => ({ ...p, role: e.target.value }))}
                            style={{ padding: '3px 6px', borderRadius: 6, fontSize: 11, background: '#0A1020',
                              border: '1px solid rgba(59,130,239,0.3)', color: '#fff', cursor: 'pointer' }}>
                            {['user','editor','admin'].map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 800, color: ROLE_COLOR[u.role] ?? 'rgba(255,255,255,0.3)' }}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      {/* tokens */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <input type="number" defaultValue={u.token_balance ?? 0}
                            onChange={e => setEditVals(p => ({ ...p, token_balance: Number(e.target.value) }))}
                            style={{ width: 70, padding: '3px 6px', borderRadius: 6, fontSize: 11, background: '#0A1020',
                              border: '1px solid rgba(59,130,239,0.3)', color: '#fff', direction: 'ltr', outline: 'none' }} />
                        ) : (
                          <span style={{ fontFamily: 'monospace', fontWeight: 700,
                            color: (u.token_balance ?? 0) < 10 ? RED : (u.token_balance ?? 0) < 50 ? YELLOW : GREEN }}>
                            {(u.token_balance ?? 0).toLocaleString()}
                          </span>
                        )}
                      </td>
                      {/* last login */}
                      <td style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}>
                        {ago(u.last_login_at)}
                      </td>
                      {/* status */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: suspended ? RED : GREEN,
                            boxShadow: `0 0 5px ${suspended ? RED : GREEN}` }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: suspended ? 'rgba(239,68,68,0.8)' : 'rgba(16,185,129,0.8)' }}>
                            {suspended ? 'מושעה' : 'פעיל'}
                          </span>
                        </div>
                      </td>
                      {/* actions */}
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(u)} disabled={isBusy} style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: GREEN }}>
                                {isBusy ? '...' : '✓ שמור'}
                              </button>
                              <button onClick={() => setEditing(null)} style={{ padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                                fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              {/* impersonate */}
                              <button title="התחבר כמשתמש" onClick={() => impersonate(u.id)} disabled={isBusy} style={{
                                width: 28, height: 28, borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(59,130,239,0.2)',
                                background: 'rgba(59,130,239,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ti ti-user-check" style={{ fontSize: 13, color: ACCENT }} />
                              </button>
                              {/* edit */}
                              <button title="ערוך" onClick={() => { setEditing(u.id); setEditVals({}) }} style={{
                                width: 28, height: 28, borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(245,158,11,0.2)',
                                background: 'rgba(245,158,11,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ti ti-edit" style={{ fontSize: 13, color: YELLOW }} />
                              </button>
                              {/* suspend */}
                              <button title={suspended ? 'שחרר' : 'חסום'} onClick={() => toggleSuspend(u)} disabled={isBusy} style={{
                                width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
                                border: `1px solid ${suspended ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                background: suspended ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className={`ti ${suspended ? 'ti-lock-open' : 'ti-ban'}`}
                                  style={{ fontSize: 13, color: suspended ? GREEN : RED }} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* expanded details row */}
                    {expanded && (
                      <tr>
                        <td colSpan={10} style={{ padding: '0 12px 12px 12px', background: 'rgba(59,130,239,0.03)', borderBottom: `1px solid ${BD}` }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, paddingTop: 10 }}>
                            {[
                              { label: 'User ID', val: u.id, mono: true },
                              { label: 'נרשם', val: new Date(u.created_at).toLocaleDateString('he-IL') },
                              { label: 'טלפון', val: u.phone ?? '—' },
                              { label: 'ח.פ', val: u.company_id ?? '—', mono: true },
                            ].map(f => (
                              <div key={f.label} style={{ padding: '8px 10px', borderRadius: 8,
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const,
                                  letterSpacing: '0.07em', marginBottom: 4 }}>{f.label}</div>
                                <div style={{ fontSize: 11, color: '#fff', fontFamily: f.mono ? 'monospace' : 'inherit',
                                  wordBreak: 'break-all', lineHeight: 1.4 }}>{f.val}</div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* footer summary */}
        <div style={{ padding: '9px 14px', borderTop: `1px solid ${BD}`,
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { l: 'סה״כ', v: users.length, c: 'rgba(255,255,255,0.4)' },
            { l: 'פעיל', v: users.filter(u => u.status !== 'suspended').length, c: GREEN },
            { l: 'מושעה', v: users.filter(u => u.status === 'suspended').length, c: RED },
            { l: 'Pro', v: users.filter(u => u.tier === 'pro').length, c: PURPLE },
            { l: 'Basic', v: users.filter(u => u.tier === 'basic').length, c: ACCENT },
            { l: 'Free', v: users.filter(u => !u.tier || u.tier === 'free').length, c: 'rgba(255,255,255,0.3)' },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{s.l}:</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: s.c, fontFamily: 'monospace' }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast {...toast} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
