'use client'
import { useState } from 'react'
import Image from 'next/image'

interface OnboardingProps {
  userId: string
  onComplete: () => void
}

type Tone = 'funny' | 'serious' | 'professional' | 'warm'
type Step = 1 | 2 | 3

const TONES: { value: Tone; label: string; emoji: string; desc: string }[] = [
  { value: 'warm',         label: 'חם ואישי',     emoji: '🤝', desc: 'כאילו חבר כותב' },
  { value: 'professional', label: 'מקצועי',        emoji: '💼', desc: 'עסקי ואמין' },
  { value: 'funny',        label: 'הומוריסטי',    emoji: '😄', desc: 'קליל ומצחיק' },
  { value: 'serious',      label: 'רציני',         emoji: '🎯', desc: 'מוביל מחשבה' },
]

export default function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [businessName, setBusinessName]       = useState('')
  const [rawDescription, setRawDescription]   = useState('')
  const [toneOfVoice, setToneOfVoice]         = useState<Tone>('warm')
  const [phone, setPhone]                     = useState('')
  const [address, setAddress]                 = useState('')
  const [operatingHours, setOperatingHours]   = useState('')
  const [systemPrompt, setSystemPrompt]       = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          businessName,
          rawDescription,
          toneOfVoice,
          phone:          phone || undefined,
          address:        address || undefined,
          operatingHours: operatingHours || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSystemPrompt(data.parsedSystemPrompt)
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div className="bg-white rounded-3xl p-8 glow-card" style={{ maxWidth: 560, margin: '0 auto' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Image src="/logo.png" alt="SociMe" width={36} height={36} className="rounded-xl"
          style={{ boxShadow: '0 0 10px rgba(161,70,255,0.25)' }} />
        <div>
          <div className="text-base font-bold" style={{ color: '#1A1A2E' }}>הגדרת תיק עסק</div>
          <div className="text-xs" style={{ color: '#8888A8' }}>שלב {step} מתוך 3</div>
        </div>
        {/* Progress bar */}
        <div className="flex-1 h-1.5 rounded-full mr-2" style={{ background: 'rgba(161,70,255,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg,var(--purple),var(--purple-light))' }} />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl mb-4 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
      )}

      {/* ── שלב 1: פרטי עסק ── */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xl font-extrabold mb-1" style={{ color: '#1A1A2E' }}>ספר לנו על העסק שלך</div>
            <div className="text-sm" style={{ color: '#8888A8' }}>המידע הזה יעזור ל-AI לכתוב בדיוק בסגנון שלך</div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#4A4A6A' }}>שם העסק *</label>
            <input
              value={businessName} onChange={e => setBusinessName(e.target.value)}
              placeholder="למשל: מספרת דוד, קפה ירושלים..."
              className="px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ background: '#FAFAFE', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E' }}
              onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: '#4A4A6A' }}>תיאור העסק *</label>
            <textarea
              value={rawDescription} onChange={e => setRawDescription(e.target.value)}
              placeholder="מה אתם עושים? מי הלקוחות שלכם? מה מייחד אתכם? ככל שתפרטו יותר — הפוסטים יהיו מדויקים יותר."
              rows={4}
              className="px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
              style={{ background: '#FAFAFE', border: '1.5px solid rgba(161,70,255,0.2)', color: '#1A1A2E', lineHeight: 1.7 }}
              onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.2)' }}
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!businessName.trim() || !rawDescription.trim()}
            className="w-full py-3 rounded-2xl text-white font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))',
              boxShadow: '0 0 20px rgba(161,70,255,0.25)',
              opacity: !businessName.trim() || !rawDescription.trim() ? 0.5 : 1,
            }}
          >
            המשך ←
          </button>
        </div>
      )}

      {/* ── שלב 2: טון + פרטים נוספים ── */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xl font-extrabold mb-1" style={{ color: '#1A1A2E' }}>איך אתם אוהבים לדבר?</div>
            <div className="text-sm" style={{ color: '#8888A8' }}>בחר את הטון שמתאים לאישיות העסק</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TONES.map(t => (
              <button key={t.value} onClick={() => setToneOfVoice(t.value)}
                className="p-4 rounded-2xl text-right transition-all"
                style={{
                  background: toneOfVoice === t.value ? 'var(--purple-soft)' : '#FAFAFE',
                  border: toneOfVoice === t.value ? '2px solid var(--purple)' : '1.5px solid rgba(161,70,255,0.15)',
                }}>
                <div className="text-2xl mb-1">{t.emoji}</div>
                <div className="text-sm font-bold" style={{ color: '#1A1A2E' }}>{t.label}</div>
                <div className="text-xs" style={{ color: '#8888A8' }}>{t.desc}</div>
              </button>
            ))}
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'rgba(161,70,255,0.1)' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: '#4A4A6A' }}>פרטים נוספים (אופציונלי)</div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'טלפון', value: phone, set: setPhone, placeholder: '050-0000000' },
                { label: 'כתובת', value: address, set: setAddress, placeholder: 'רחוב הרצל 1, תל אביב' },
                { label: 'שעות פעילות', value: operatingHours, set: setOperatingHours, placeholder: 'א׳-ה׳ 09:00-18:00' },
              ].map(f => (
                <input key={f.label}
                  value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={`${f.label}: ${f.placeholder}`}
                  className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#FAFAFE', border: '1.5px solid rgba(161,70,255,0.15)', color: '#1A1A2E' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.15)' }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all"
              style={{ background: '#FAFAFE', color: '#4A4A6A', border: '1.5px solid rgba(161,70,255,0.15)' }}>
              → חזור
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-[2] py-3 rounded-2xl text-white font-bold transition-all"
              style={{
                background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))',
                boxShadow: '0 0 20px rgba(161,70,255,0.25)',
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Gemini מייצר את הפרופיל...
                </span>
              ) : 'צור תיק עסק ←'}
            </button>
          </div>
        </div>
      )}

      {/* ── שלב 3: סיום ── */}
      {step === 3 && (
        <div className="flex flex-col gap-5 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
            ✓
          </div>
          <div>
            <div className="text-xl font-extrabold mb-2" style={{ color: '#1A1A2E' }}>תיק העסק שלך מוכן! 🎉</div>
            <div className="text-sm" style={{ color: '#8888A8' }}>Gemini יצר עבורך system prompt מותאם אישית</div>
          </div>

          {systemPrompt && (
            <div className="p-4 rounded-2xl text-right text-sm leading-relaxed"
              style={{ background: 'var(--purple-soft)', border: '1px solid var(--purple-border)', color: '#4A4A6A' }}>
              <div className="text-xs font-bold mb-2" style={{ color: 'var(--purple)' }}>הפרופיל שנוצר:</div>
              {systemPrompt}
            </div>
          )}

          <button onClick={onComplete}
            className="w-full py-3 rounded-2xl text-white font-bold transition-all"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 0 20px rgba(161,70,255,0.25)' }}>
            מעולה — בואו נתחיל לפרסם!
          </button>
        </div>
      )}
    </div>
  )
}
