'use client'
import { useEffect, useState } from 'react'

interface ConnectedPlatform {
  platform: string
  scopes: string[]
  expires_at: string | null
  created_at: string
}

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',  icon: '🔵', color: '#1877F2', desc: 'פוסטים לדף עסקי' },
  { id: 'instagram', label: 'Instagram', icon: '🟣', color: '#E1306C', desc: 'פוסטים ורילס' },
]

export default function SocialConnect() {
  const [connected, setConnected] = useState<ConnectedPlatform[]>([])
  const [loading, setLoading]   = useState(true)
  const [working, setWorking]   = useState<string | null>(null)
  const [testToken, setTestToken] = useState('')
  const [addFor, setAddFor]     = useState<string | null>(null)
  const [error, setError]       = useState('')

  useEffect(() => { fetchStatus() }, [])

  async function fetchStatus() {
    setLoading(true)
    const res = await fetch('/api/social/connect')
    const data = await res.json()
    setConnected(data.connected ?? [])
    setLoading(false)
  }

  function isConnected(platform: string) {
    return connected.some(c => c.platform === platform)
  }

  function connectedAt(platform: string) {
    const c = connected.find(p => p.platform === platform)
    return c ? new Date(c.created_at).toLocaleDateString('he-IL') : null
  }

  async function connect() {
    if (!addFor || !testToken.trim()) return
    setWorking(addFor); setError('')
    const res = await fetch('/api/social/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: addFor, oauthToken: testToken.trim() }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'שגיאה')
    } else {
      setTestToken(''); setAddFor(null)
      await fetchStatus()
    }
    setWorking(null)
  }

  async function disconnect(platform: string) {
    setWorking(platform)
    await fetch('/api/social/disconnect', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    })
    await fetchStatus()
    setWorking(null)
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-light)' }}>טוען...</div>

  return (
    <div className="max-w-lg">
      {PLATFORMS.map(p => {
        const ok = isConnected(p.id)
        return (
          <div key={p.id} className="bg-white rounded-2xl p-5 mb-4" style={{ border: '1px solid var(--purple-border)' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: ok ? '#dcfce7' : '#f5f5f5' }}>
                {p.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: 'var(--text-dark)' }}>{p.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-light)' }}>
                  {ok ? `מחובר מ-${connectedAt(p.id)}` : p.desc}
                </div>
              </div>
              <div className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: ok ? '#dcfce7' : '#fafafa', color: ok ? '#16a34a' : 'var(--text-light)',
                         border: `1px solid ${ok ? '#86efac' : 'rgba(0,0,0,0.08)'}` }}>
                {ok ? '✓ מחובר' : 'לא מחובר'}
              </div>
            </div>

            {ok ? (
              <button onClick={() => disconnect(p.id)} disabled={working === p.id}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                {working === p.id ? '...' : '🔌 נתק'}
              </button>
            ) : addFor === p.id ? (
              <div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-light)' }}>
                  הדבק את ה-Access Token מ-Meta Developer Console:
                </div>
                <input value={testToken} onChange={e => setTestToken(e.target.value)}
                  placeholder="EAABx..."
                  className="w-full text-xs p-2.5 rounded-xl mb-2 font-mono"
                  style={{ border: '1px solid var(--purple-border)', outline: 'none' }} />
                {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
                <div className="flex gap-2">
                  <button onClick={connect} disabled={working === p.id || !testToken}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))' }}>
                    {working === p.id ? '...' : 'שמור'}
                  </button>
                  <button onClick={() => { setAddFor(null); setTestToken(''); setError('') }}
                    className="px-4 py-2 rounded-xl text-sm"
                    style={{ background: '#fafafa', color: 'var(--text-mid)', border: '1px solid rgba(0,0,0,0.08)' }}>
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setAddFor(p.id); setError('') }}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`, boxShadow: `0 4px 14px ${p.color}44` }}>
                🔗 חבר {p.label}
              </button>
            )}
          </div>
        )
      })}

      <div className="text-xs p-4 rounded-xl mt-2" style={{ background: 'var(--purple-soft)', color: 'var(--text-mid)' }}>
        🔐 הטוקנים מוצפנים ב-AES-256-GCM ומאוחסנים בצורה מאובטחת. לעולם לא נשמרים בגלוי.
      </div>
    </div>
  )
}
