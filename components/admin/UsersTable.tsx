'use client'
import { useState } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  tier: string | null
  token_balance: number | null
  status: string
  created_at: string
  last_login_at: string | null
  image_count_this_month: number | null
}

const TIERS    = ['free', 'basic', 'pro']
const STATUSES = ['active', 'suspended']
const ROLES    = ['user', 'editor', 'admin']  // 'founder' אינו ניתן להקצאה

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  founder: { label: 'מייסד',  bg: '#1A1A2E', color: '#fff' },
  admin:   { label: 'אדמין',   bg: '#7c3aed', color: '#fff' },
  editor:  { label: 'עורך',    bg: '#ede0ff', color: '#7c3aed' },
  user:    { label: 'משתמש',   bg: '#f3f4f6', color: '#6b7280' },
}

interface Props {
  users: User[]
  currentRole: string
}

export default function UsersTable({ users: initial, currentRole }: Props) {
  const [users, setUsers]       = useState(initial)
  const [busy, setBusy]         = useState<string | null>(null)
  const [tokenEdits, setTokenEdits] = useState<Record<string, string>>({})

  const isFounderViewer = currentRole === 'founder'

  async function updateUser(id: string, patch: Record<string, string | number>) {
    setBusy(id)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, ...patch }),
    })
    setBusy(null)
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...renameKeys(patch) } : u))
      return true
    }
    return false
  }

  // הופך token_balance מ-API patch לשדה במצב המקומי
  function renameKeys(patch: Record<string, string | number>) {
    const out: Partial<User> = {}
    if ('tier' in patch)          out.tier = patch.tier as string
    if ('status' in patch)        out.status = patch.status as string
    if ('role' in patch)          out.role = patch.role as string
    if ('token_balance' in patch) out.token_balance = patch.token_balance as number
    return out
  }

  async function saveTokens(id: string) {
    const raw = tokenEdits[id]
    const n = Number(raw)
    if (!Number.isFinite(n) || n < 0) return
    const ok = await updateUser(id, { tokenBalance: Math.floor(n) })
    if (ok) setTokenEdits(prev => { const c = { ...prev }; delete c[id]; return c })
  }

  const selectStyle = {
    background: '#FAFAFE', border: '1px solid var(--purple-border)',
    borderRadius: 8, padding: '3px 6px', fontSize: 12, color: 'var(--text-dark)', cursor: 'pointer',
  } as const

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--purple-border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 860 }}>
          <thead>
            <tr style={{ background: '#FAFAFE', color: 'var(--text-light)' }}>
              {['משתמש', 'תפקיד', 'חבילה', 'טוקנים', 'תמונות', 'סטטוס', 'הצטרף'].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const roleBadge = ROLE_BADGE[u.role] ?? ROLE_BADGE.user
              const isFounderRow = u.role === 'founder'
              const locked = isFounderRow || busy === u.id
              const tokenEditing = tokenEdits[u.id] !== undefined
              return (
                <tr key={u.id} style={{ borderTop: '1px solid rgba(161,70,255,0.08)', opacity: busy === u.id ? 0.5 : 1 }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: 'var(--text-dark)' }}>{u.name ?? '—'}</div>
                    <div className="text-xs" style={{ color: 'var(--text-light)' }} dir="ltr">{u.email}</div>
                  </td>

                  {/* תפקיד — נערך רק ע"י מייסד, ולא על חשבון מייסד */}
                  <td className="px-4 py-3">
                    {isFounderViewer && !isFounderRow ? (
                      <select value={u.role} disabled={busy === u.id}
                        onChange={e => updateUser(u.id, { role: e.target.value })} style={selectStyle}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_BADGE[r].label}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: roleBadge.bg, color: roleBadge.color }}>{roleBadge.label}</span>
                    )}
                  </td>

                  {/* חבילה */}
                  <td className="px-4 py-3">
                    <select value={u.tier ?? 'free'} disabled={locked}
                      onChange={e => updateUser(u.id, { tier: e.target.value })} style={selectStyle}>
                      {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>

                  {/* טוקנים — נערכים */}
                  <td className="px-4 py-3">
                    {isFounderRow ? (
                      <span className="font-semibold" style={{ color: 'var(--purple)' }}>
                        {(u.token_balance ?? 0).toLocaleString()}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input type="number" min={0}
                          value={tokenEditing ? tokenEdits[u.id] : String(u.token_balance ?? 0)}
                          disabled={busy === u.id}
                          onChange={e => setTokenEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') saveTokens(u.id) }}
                          style={{ ...selectStyle, width: 90, cursor: 'text' }} dir="ltr" />
                        {tokenEditing && Number(tokenEdits[u.id]) !== (u.token_balance ?? 0) && (
                          <button onClick={() => saveTokens(u.id)}
                            className="text-xs font-bold px-2 py-1 rounded-md text-white"
                            style={{ background: 'var(--purple)' }}>✓</button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* תמונות */}
                  <td className="px-4 py-3" style={{ color: 'var(--text-mid)' }}>{u.image_count_this_month ?? 0}</td>

                  {/* סטטוס */}
                  <td className="px-4 py-3">
                    <select value={u.status} disabled={locked}
                      onChange={e => updateUser(u.id, { status: e.target.value })}
                      style={{ ...selectStyle, color: u.status === 'suspended' ? '#dc2626' : '#16a34a' }}>
                      {STATUSES.map(s => <option key={s} value={s}>{s === 'active' ? 'פעיל' : 'מושהה'}</option>)}
                    </select>
                  </td>

                  {/* הצטרף */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-light)' }}>
                    {new Date(u.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
