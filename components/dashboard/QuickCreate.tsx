'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PURPLE = '#9850FF'
const PURPLE2 = '#BE56FF'

export default function QuickCreate() {
  const [prompt, setPrompt] = useState('')
  const router = useRouter()

  function handleGenerate() {
    if (!prompt.trim()) return
    router.push(`/dashboard/create?prompt=${encodeURIComponent(prompt.trim())}`)
  }

  return (
    <section className="neon-card" style={{
      borderRadius: 24,
      padding: '28px 32px',
      background: 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.13)',
      marginBottom: 16,
    }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{
          fontSize: 17, fontWeight: 800, color: '#fff',
          margin: '0 0 4px', letterSpacing: '-0.3px',
        }}>
          ✨ יצירה מהירה
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          תאר את הפוסט שאתה רוצה — ה-AI יכתוב אותו בשבילך
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <div style={{
          flex: 1, position: 'relative',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(152,80,255,0.25)',
          display: 'flex', alignItems: 'center',
          padding: '0 16px',
          transition: 'border-color 0.2s',
        }}>
          <i className="ti ti-message-circle-2" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', marginLeft: 10, flexShrink: 0 }} />
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="על מה נדבר היום בפיד? (למשל: פוסט על השקת מוצר חדש)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              color: '#fff',
              padding: '18px 0',
              direction: 'rtl',
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 28px',
            borderRadius: 16,
            background: prompt.trim()
              ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`
              : 'rgba(255,255,255,0.07)',
            color: prompt.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 14, fontWeight: 700,
            border: 'none', cursor: prompt.trim() ? 'pointer' : 'default',
            boxShadow: prompt.trim() ? '0 4px 20px rgba(152,80,255,0.4)' : 'none',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}>
          <i className="ti ti-sparkles" style={{ fontSize: 16 }} />
          צור קסם
        </button>
      </div>

      {/* Quick topic chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {['פוסט השראה', 'מבצע מיוחד', 'טיפ מקצועי', 'הכרות עם הצוות', 'לפני ואחרי'].map(chip => (
          <button key={chip} onClick={() => setPrompt(chip)} style={{
            padding: '5px 14px', borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11, fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            {chip}
          </button>
        ))}
      </div>
    </section>
  )
}
