'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  body: string | null
  url: string
  icon: string
  read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [open, setOpen]         = useState(false)
  const [items, setItems]       = useState<Notification[]>([])
  const [loading, setLoading]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = items.filter(n => !n.read).length

  useEffect(() => {
    fetchNotifications()
    // poll every 30s
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [])

  // סגור בלחיצה מחוץ ל-dropdown
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications/inbox')
      if (res.ok) {
        const data = await res.json()
        setItems(data.notifications ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id?: string) {
    await fetch('/api/notifications/inbox', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : { all: true }),
    })
    setItems(prev =>
      id ? prev.map(n => n.id === id ? { ...n, read: true } : n)
         : prev.map(n => ({ ...n, read: true }))
    )
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'עכשיו'
    if (m < 60) return `לפני ${m} דק'`
    const h = Math.floor(m / 60)
    if (h < 24) return `לפני ${h} שע'`
    return `לפני ${Math.floor(h / 24)} ימים`
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button onClick={() => { setOpen(o => !o); if (!open) fetchNotifications() }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ background: open ? 'var(--purple-soft)' : 'transparent', border: '1px solid transparent' }}>
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
            style={{ background: 'var(--purple)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-12 right-0 w-80 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{ background: '#fff', border: '1px solid var(--purple-border)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--purple-border)' }}>
            <span className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>
              התראות {unread > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>{unread}</span>}
            </span>
            {unread > 0 && (
              <button onClick={() => markRead()} className="text-xs" style={{ color: 'var(--purple)' }}>
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
            {loading && items.length === 0 ? (
              <div className="p-4 text-center text-sm" style={{ color: 'var(--text-light)' }}>טוען...</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">🔕</div>
                <div className="text-sm" style={{ color: 'var(--text-light)' }}>אין התראות</div>
              </div>
            ) : (
              items.map(n => (
                <Link key={n.id} href={n.url}
                  onClick={() => { markRead(n.id); setOpen(false) }}
                  className="flex gap-3 px-4 py-3 transition-all"
                  style={{
                    background: n.read ? 'transparent' : 'var(--purple-soft)',
                    borderBottom: '1px solid var(--purple-border)',
                  }}>
                  <span className="text-xl mt-0.5 flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-dark)' }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-light)' }}>
                        {n.body}
                      </div>
                    )}
                    <div className="text-[10px] mt-1" style={{ color: 'var(--text-light)' }}>
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--purple)' }} />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
