'use client'
import { useState } from 'react'

type Tone = 'funny' | 'serious' | 'professional' | 'warm'

interface Profile {
  business_name?: string
  raw_description?: string
  tone_of_voice?: Tone
  phone?: string
  address?: string
  operating_hours?: string
  parsed_system_prompt?: string
}

interface Props {
  userId: string
  initialProfile: Profile | null
}

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: 'warm',         label: 'חם ואישי',   emoji: '🤝' },
  { value: 'professional', label: 'מקצועי',      emoji: '💼' },
  { value: 'funny',        label: 'הומוריסטי',  emoji: '😄' },
  { value: 'serious',      label: 'רציני',       emoji: '🎯' },
]

export default function BusinessProfileEditor({ userId, initialProfile }: Props) {
  const [businessName, setBusinessName]     = useState(initialProfile?.business_name ?? '')
  const [rawDescription, setRawDescription] = useState(initialProfile?.raw_description ?? '')
  const [toneOfVoice, setToneOfVoice]       = useState<Tone>(initialProfile?.tone_of_voice ?? 'warm')
  const [phone, setPhone]                   = useState(initialProfile?.phone ?? '')
  const [address, setAddress]               = useState(initialProfile?.address ?? '')
  const [operatingHours, setOperatingHours] = useState(initialProfile?.operating_hours ?? '')
  const [systemPrompt, setSystemPrompt]     = useState(initialProfile?.parsed_system_prompt ?? '')

  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, businessName, rawDescription, toneOfVoice,
          phone:          phone || undefined,
          address:        address || undefined,
          operatingHours: operatingHours || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSystemPrompt(data.parsedSystemPrompt)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { background: '#FAFAFE', border: '1.5px solid var(--purple-border)', color: 'var(--text-dark)' }

  return (
    <div className="bg-white rounded-3xl p-7" style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.03)' }}>
      {error && (
        <div className="p-3 rounded-xl mb-4 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>שם העסק</label>
          <input value={businessName} onChange={e => setBusinessName(e.target.value)}
            placeholder="מספרת דוד..."
            className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={inputStyle}
            onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.15)' }} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>תיאור העסק</label>
          <textarea value={rawDescription} onChange={e => setRawDescription(e.target.value)}
            rows={4} placeholder="מה אתם עושים? מי הלקוחות? מה מייחד אתכם?"
            className="px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
            style={{ ...inputStyle, lineHeight: 1.7 }}
            onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.15)' }} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>טון הכתיבה</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONES.map(t => (
              <button key={t.value} onClick={() => setToneOfVoice(t.value)}
                className="p-3 rounded-xl text-center transition-all"
                style={{
                  background: toneOfVoice === t.value ? 'var(--purple-soft)' : '#FAFAFE',
                  border:     toneOfVoice === t.value ? '2px solid var(--purple)' : '1.5px solid var(--purple-border)',
                }}>
                <div className="text-xl mb-0.5">{t.emoji}</div>
                <div className="text-xs font-bold" style={{ color: 'var(--text-dark)' }}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="טלפון"
            className="px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="כתובת"
            className="px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
          <input value={operatingHours} onChange={e => setOperatingHours(e.target.value)} placeholder="שעות פעילות"
            className="px-4 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
        </div>

        {systemPrompt && (
          <div className="p-4 rounded-2xl text-sm leading-relaxed"
            style={{ background: 'var(--purple-soft)', border: '1px solid var(--purple-border)', color: 'var(--text-mid)' }}>
            <div className="text-xs font-bold mb-2" style={{ color: 'var(--purple)' }}>הפרופיל שה-AI יצר:</div>
            {systemPrompt}
          </div>
        )}

        <button onClick={handleSave} disabled={loading || !businessName.trim() || !rawDescription.trim()}
          className="w-full py-3 rounded-2xl text-white font-bold transition-all"
          style={{
            background: saved ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,var(--purple),var(--purple-deep))',
            boxShadow: '0 4px 18px rgba(161,70,255,0.25)',
            opacity: loading || !businessName.trim() || !rawDescription.trim() ? 0.6 : 1,
          }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              שומר ומעדכן AI...
            </span>
          ) : saved ? '✓ נשמר בהצלחה' : 'שמור שינויים'}
        </button>
      </div>
    </div>
  )
}
