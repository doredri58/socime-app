'use client'
import { useEffect, useRef, useState } from 'react'

interface Biz { id: string; name: string }

export default function BusinessSwitcher() {
  const [items, setItems] = useState<Biz[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [limit, setLimit] = useState(1)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/business/list')
      .then(r => r.json())
      .then(d => { if (d.businesses) { setItems(d.businesses); setActiveId(d.activeId); setLimit(d.limit) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  if (items.length === 0) return null

  const active = items.find(b => b.id === activeId) ?? items[0]
  const canAdd = items.length < limit

  async function switchTo(id: string) {
    if (id === activeId) return setOpen(false)
    setBusy(true)
    await fetch('/api/business/switch', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: id }),
    })
    window.location.reload()
  }

  async function addBusiness() {
    const name = window.prompt('שם העסק החדש:')
    if (name === null) return
    setBusy(true)
    const res = await fetch('/api/business/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: name }),
    })
    if (res.ok) { window.location.href = '/dashboard/business'; return }
    const d = await res.json().catch(() => ({}))
    alert(d.error === 'limit_reached' ? 'הגעת למכסת העסקים במסלול שלך.' : 'שגיאה ביצירת העסק.')
    setBusy(false)
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10,
          background: 'var(--dash-token-bg)', border: '1px solid var(--dash-token-border)',
          color: 'var(--dash-token-text)', cursor: 'pointer', fontSize: 12, fontWeight: 700, maxWidth: 200,
        }}
      >
        <i className="ti ti-building-store" style={{ fontSize: 14, color: '#B030F5', flexShrink: 0 }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.name}</span>
        <i className={`ti ti-chevron-down`} style={{ fontSize: 13, flexShrink: 0, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', insetInlineStart: 0, minWidth: 220, zIndex: 60,
          background: 'var(--dash-sidebar-bg)', border: '1px solid var(--dash-sidebar-border)',
          borderRadius: 12, padding: 6, boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1px', color: 'var(--dash-sidebar-label)', padding: '6px 10px' }}>
            העסקים שלי · {items.length}/{limit}
          </div>
          {items.map(b => (
            <button key={b.id} onClick={() => switchTo(b.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 9,
              background: b.id === activeId ? 'var(--dash-sidebar-active-bg)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'start',
              color: 'var(--dash-sidebar-text-active)', fontSize: 13, fontWeight: b.id === activeId ? 700 : 500,
            }}>
              <i className="ti ti-building-store" style={{ fontSize: 14, color: b.id === activeId ? '#B030F5' : 'var(--dash-sidebar-label)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
              {b.id === activeId && <i className="ti ti-check" style={{ fontSize: 14, color: '#B030F5' }} />}
            </button>
          ))}
          {canAdd && (
            <button onClick={addBusiness} disabled={busy} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 9,
              marginTop: 4, borderTop: '1px solid var(--dash-sidebar-border)',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'start',
              color: '#B030F5', fontSize: 13, fontWeight: 700,
            }}>
              <i className="ti ti-plus" style={{ fontSize: 14 }} />
              הוסף עסק
            </button>
          )}
        </div>
      )}
    </div>
  )
}
