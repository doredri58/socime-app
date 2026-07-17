'use client'
import { useEffect, useState } from 'react'

type Status = 'loading' | 'unsupported' | 'denied' | 'granted' | 'default'

export default function NotificationsPanel() {
  const [status, setStatus]     = useState<Status>('loading')
  const [subscribed, setSubscribed] = useState(false)
  const [working, setWorking]   = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported'); return
    }
    setStatus(Notification.permission as Status)
    // register SW
    navigator.serviceWorker.register('/sw.js').catch(() => {})
    // check if already subscribed
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    )
  }, [])

  async function subscribe() {
    setWorking(true); setError('')
    try {
      const permission = await Notification.requestPermission()
      setStatus(permission as Status)
      if (permission !== 'granted') { setWorking(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const json = sub.toJSON()
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      setSubscribed(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    }
    setWorking(false)
  }

  async function unsubscribe() {
    setWorking(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch { /* ignore */ }
    setWorking(false)
  }

  async function sendTest() {
    setTestSent(false)
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'SociMe 🎉', body: 'הודעות Push עובדות בהצלחה!', url: '/dashboard' }),
    })
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const raw = window.atob(base64)
    return new Uint8Array([...raw].map(c => c.charCodeAt(0)))
  }

  return (
    <div className="max-w-lg">
      {/* Status card */}
      <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1px solid var(--purple-border)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: subscribed ? '#dcfce7' : 'var(--purple-soft)' }}>
            {subscribed ? '🔔' : '🔕'}
          </div>
          <div>
            <div className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>
              {subscribed ? 'הודעות Push פעילות' : 'הודעות Push כבויות'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
              {status === 'denied'
                ? 'הרשאה נדחתה — שנה בהגדרות הדפדפן'
                : subscribed
                  ? 'תקבל התראות על פרסומים ועדכונים'
                  : 'לחצו כדי לאפשר התראות בדפדפן'}
            </div>
          </div>
        </div>

        {error && <div className="p-2 rounded-lg mb-3 text-xs text-red-600 bg-red-50">{error}</div>}

        {status === 'unsupported' ? (
          <div className="text-sm p-3 rounded-xl" style={{ background: '#fef3c7', color: '#b45309' }}>
            הדפדפן שלכם אינו תומך ב-Push Notifications. נסו Chrome או Edge.
          </div>
        ) : status === 'denied' ? (
          <div className="text-sm p-3 rounded-xl" style={{ background: '#fee2e2', color: '#dc2626' }}>
            חסמת הרשאות — פתח הגדרות דפדפן ← Privacy & Security ← Notifications ואפשר את האתר
          </div>
        ) : !subscribed ? (
          <button onClick={subscribe} disabled={working}
            className="w-full py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: working ? '#c4b5fd' : 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 4px 14px rgba(161,70,255,0.3)' }}>
            {working ? '⏳ מפעיל...' : '🔔 הפעל התראות Push'}
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={sendTest}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'var(--purple-soft)', color: 'var(--purple)', border: '1px solid var(--purple-border)' }}>
              {testSent ? '✓ נשלח!' : '📤 שלחו הודעת בדיקה'}
            </button>
            <button onClick={unsubscribe} disabled={working}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: '#fafafa', color: 'var(--text-mid)', border: '1px solid rgba(0,0,0,0.08)' }}>
              {working ? '...' : 'כבה'}
            </button>
          </div>
        )}
      </div>

      {/* What triggers notifications */}
      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
        מתי תקבל התראות
      </div>
      {[
        { icon: '📅', label: 'פוסט עומד לפרסום', desc: '15 דקות לפני השעה המתוזמנת' },
        { icon: '✅', label: 'פוסט פורסם בהצלחה', desc: 'אחרי פרסום ברשתות החברתיות' },
        { icon: '❌', label: 'פרסום נכשל', desc: 'כאשר יש בעיה בחיבור לרשת' },
        { icon: '💡', label: 'רעיונות חדשים מוכנים', desc: 'כאשר AI מסיים לגנרל תוכן' },
      ].map(item => (
        <div key={item.label} className="bg-white rounded-xl px-4 py-3 mb-2 flex items-center gap-3"
          style={{ border: '1px solid var(--purple-border)' }}>
          <span className="text-xl">{item.icon}</span>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{item.label}</div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
