'use client'
import { useState } from 'react'

interface ImageGeneratorProps {
  userId: string
}

export default function ImageGenerator({ userId }: ImageGeneratorProps) {
  const [prompt, setPrompt]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [imageUrl, setImageUrl]   = useState('')
  const [quotaInfo, setQuotaInfo] = useState<{ used: number; quota: number } | null>(null)

  async function handleGenerate() {
    if (prompt.trim().length < 3) return
    setLoading(true)
    setError('')
    setImageUrl('')

    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, prompt }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      if (data.quota != null) setQuotaInfo({ used: data.used, quota: data.quota })
      return
    }

    setImageUrl(data.imageUrl)
    setQuotaInfo({ used: data.used, quota: data.quota })
  }

  return (
    <div className="bg-white rounded-3xl p-8 glow-card" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-xl font-extrabold" style={{ color: '#1A1A2E' }}>יצירת תמונה 🍌</div>
          <div className="text-sm" style={{ color: '#8888A8' }}>תמונות AI לפוסטים שלך · Nano Banana</div>
        </div>
        {quotaInfo && (
          <div className="text-center px-3 py-2 rounded-2xl"
            style={{ background: 'var(--purple-soft)', border: '1px solid rgba(161,70,255,0.18)' }}>
            <div className="text-base font-black" style={{ color: 'var(--purple)' }}>
              {quotaInfo.quota - quotaInfo.used}
            </div>
            <div className="text-[10px]" style={{ color: '#8888A8' }}>נותרו החודש</div>
          </div>
        )}
      </div>

      <textarea
        value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="תאר את התמונה: כוס קפה על שולחן עץ בבוקר, אור רך, סגנון מינימליסטי..."
        rows={3}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none mb-3"
        style={{ background: '#FAFAFE', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E', lineHeight: 1.7 }}
        onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)' }}
      />

      {error && (
        <div className="p-3 rounded-xl mb-3 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || prompt.trim().length < 3}
        className="w-full py-3 rounded-2xl text-white font-bold transition-all"
        style={{
          background: 'linear-gradient(135deg,var(--purple),#7c3aed)',
          boxShadow: '0 4px 18px rgba(161,70,255,0.3)',
          opacity: loading || prompt.trim().length < 3 ? 0.6 : 1,
        }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            יוצר תמונה...
          </span>
        ) : 'צור תמונה ✨'}
      </button>

      {imageUrl && (
        <div className="mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="תמונה שנוצרה"
            className="w-full rounded-2xl"
            style={{ border: '1px solid rgba(161,70,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }} />
          <div className="flex gap-2 mt-3">
            <a href={imageUrl} download target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all"
              style={{ background: '#FAFAFE', color: 'var(--purple)', border: '1.5px solid rgba(161,70,255,0.2)' }}>
              הורד תמונה
            </a>
            <button onClick={() => { setImageUrl(''); setPrompt('') }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#FAFAFE', color: '#4A4A6A', border: '1.5px solid rgba(161,70,255,0.12)' }}>
              צור עוד אחת
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
