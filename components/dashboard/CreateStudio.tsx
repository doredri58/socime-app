'use client'
import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// ─── constants ───────────────────────────────────────────────────────────────
const PURPLE  = '#9850FF'
const PURPLE2 = '#BE56FF'
const BLUE    = '#3B82EF'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 20,
}

const PLATFORMS = [
  { id: 'facebook',  label: 'פייסבוק',    icon: 'ti-brand-facebook',  color: '#1877F2' },
  { id: 'instagram', label: 'אינסטגרם',   icon: 'ti-brand-instagram', color: '#E1306C' },
  { id: 'linkedin',  label: 'לינקדאין',   icon: 'ti-brand-linkedin',  color: '#0A66C2' },
] as const
type Platform = typeof PLATFORMS[number]['id']

const MAGIC_ACTIONS = [
  { label: 'קצר את זה',        icon: 'ti-scissors',       instruction: 'קצר את הטקסט הבא ל־3 משפטים מקסימום תוך שמירה על הרעיון המרכזי' },
  { label: 'יותר מקצועי',      icon: 'ti-briefcase',      instruction: 'כתוב מחדש את הטקסט הבא בסגנון מקצועי ועסקי יותר' },
  { label: 'הוסף אימוג\'י',    icon: 'ti-mood-happy',     instruction: 'הוסף אימוג\'ים מתאימים לטקסט הבא בצורה טבעית ולא מוגזמת' },
  { label: 'יותר מעניין',       icon: 'ti-wand',           instruction: 'הפוך את הטקסט הבא למושך ומרתק יותר עם hook חזק בהתחלה' },
  { label: 'הוסף CTA',         icon: 'ti-cursor-text',    instruction: 'הוסף קריאה לפעולה (CTA) חזקה בסוף הטקסט הבא' },
]

// ─── props ────────────────────────────────────────────────────────────────────
interface Props {
  userId: string
  businessName: string
  businessDescription: string
  userName: string
  tokenBalance: number
  initialPrompt?: string
}

// ─── sub-components ──────────────────────────────────────────────────────────

function PlatformTab({ p, active, onClick }: { p: typeof PLATFORMS[number]; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.2s',
        background: active ? `${p.color}22` : 'transparent',
        border: active ? `1px solid ${p.color}55` : '1px solid rgba(255,255,255,0.08)',
        color: active ? p.color : 'rgba(255,255,255,0.45)',
      }}
    >
      <i className={`ti ${p.icon}`} style={{ fontSize: 15 }} />
      {p.label}
    </button>
  )
}

function PhoneMockup({ text, hashtags, imageUrl, platform, businessName, userName }: {
  text: string; hashtags: string; imageUrl: string | null
  platform: Platform; businessName: string; userName: string
}) {
  const plat = PLATFORMS.find(p => p.id === platform)!
  const displayName = businessName || userName || 'שם העסק'
  const previewText = text || 'הטקסט שלך יופיע כאן בזמן אמת...'
  const tags = hashtags ? hashtags.split(' ').filter(Boolean) : []

  return (
    <div style={{
      width: 280, margin: '0 auto',
      background: 'linear-gradient(180deg, #1a1040 0%, #0D0829 100%)',
      border: '6px solid rgba(255,255,255,0.12)',
      borderRadius: 44, padding: '0', overflow: 'hidden',
      boxShadow: `0 0 0 1px rgba(255,255,255,0.05), 0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${plat.color}22`,
      position: 'relative',
    }}>
      {/* notch */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 28, background: 'rgba(0,0,0,0.8)',
        borderRadius: '0 0 16px 16px', zIndex: 10,
      }} />

      {/* screen */}
      <div style={{ background: platform === 'linkedin' ? '#1B1F23' : '#0A0A0A', minHeight: 520, paddingTop: 36 }}>

        {/* platform top bar */}
        <div style={{
          padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <i className={`ti ${plat.icon}`} style={{ fontSize: 18, color: plat.color }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <i className="ti ti-search" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
            <i className="ti ti-bell" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
          </div>
        </div>

        {/* post card */}
        <div style={{ padding: '12px 14px' }}>
          {/* post header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${PURPLE}, ${BLUE})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {displayName.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{displayName}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-clock" style={{ fontSize: 9 }} /> עכשיו
                {platform === 'facebook' && <> · <i className="ti ti-world" style={{ fontSize: 9 }} /></>}
              </div>
            </div>
            <i className="ti ti-dots" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginRight: 'auto' }} />
          </div>

          {/* post text */}
          <div style={{
            fontSize: 10.5, color: text ? '#fff' : 'rgba(255,255,255,0.2)',
            lineHeight: 1.6, marginBottom: 8, direction: 'rtl',
            fontStyle: text ? 'normal' : 'italic',
            maxHeight: 120, overflow: 'hidden',
          }}>
            {previewText.slice(0, 220)}{previewText.length > 220 ? '...' : ''}
          </div>

          {/* hashtags */}
          {tags.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {tags.slice(0, 4).map(t => (
                <span key={t} style={{ fontSize: 9, color: plat.color, marginLeft: 4 }}>{t}</span>
              ))}
            </div>
          )}

          {/* image placeholder */}
          <div style={{
            width: '100%', height: imageUrl ? 'auto' : 120,
            background: imageUrl ? 'transparent' : 'rgba(255,255,255,0.04)',
            border: imageUrl ? 'none' : '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 12, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10,
          }}>
            {imageUrl
              ? <Image src={imageUrl} alt="post" width={248} height={140} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
              : <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>
                  <i className="ti ti-photo" style={{ fontSize: 22, display: 'block', marginBottom: 4 }} />
                  תמונה / וידאו
                </div>
            }
          </div>

          {/* reactions bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', justifyContent: 'space-around' }}>
            {[['ti-thumb-up', 'אהבתי'], ['ti-message-circle', 'תגובה'], ['ti-share', 'שתף']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 12 }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* home indicator */}
      <div style={{ background: '#0A0A0A', padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999 }} />
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function CreateStudio({ userId, businessName, businessDescription, userName, tokenBalance, initialPrompt }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [platform, setPlatform]       = useState<Platform>('facebook')
  const [prompt, setPrompt]           = useState(initialPrompt)
  const [postText, setPostText]       = useState('')
  const [hashtags, setHashtags]       = useState('')
  const [imageUrl, setImageUrl]       = useState<string | null>(null)
  const [imageFile, setImageFile]     = useState<File | null>(null)
  const [dragOver, setDragOver]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [magicLoading, setMagicLoading] = useState<string | null>(null)
  const [imgGenLoading, setImgGenLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [scheduling, setScheduling]   = useState(false)
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)
  const [tokens, setTokens]           = useState(tokenBalance)
  const [charCount, setCharCount]     = useState(0)

  const maxChars = platform === 'instagram' ? 2200 : platform === 'linkedin' ? 3000 : 63206

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  // ── generate post ──
  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessDesc: prompt || businessDescription, userId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { showToast(data.error ?? 'שגיאה ביצירת תוכן', false); return }
    setPostText(data.text ?? '')
    setHashtags(data.hashtags ?? '')
    setCharCount((data.text ?? '').length)
    setTokens(t => Math.max(0, t - 10))
  }

  // ── magic rewrite ──
  async function handleMagic(instruction: string, actionLabel: string) {
    if (!postText.trim()) { showToast('יש ליצור טקסט קודם', false); return }
    setMagicLoading(actionLabel)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessDesc: `${instruction}:\n\n${postText}`, userId }),
    })
    const data = await res.json()
    setMagicLoading(null)
    if (!res.ok) { showToast(data.error ?? 'שגיאה', false); return }
    setPostText(data.text ?? postText)
    setCharCount((data.text ?? '').length)
  }

  // ── AI image generation ──
  async function handleGenerateImage() {
    if (!prompt.trim() && !postText.trim()) { showToast('יש להזין פרומפט קודם', false); return }
    setImgGenLoading(true)
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt || postText.slice(0, 200) }),
    })
    const data = await res.json()
    setImgGenLoading(false)
    if (!res.ok) { showToast(data.error ?? 'שגיאה ביצירת תמונה', false); return }
    setImageUrl(data.url)
  }

  // ── file drop ──
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      setImageUrl(URL.createObjectURL(file))
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) { setImageFile(file); setImageUrl(URL.createObjectURL(file)) }
  }

  // ── save draft ──
  async function handleSaveDraft() {
    if (!postText.trim()) { showToast('אין תוכן לשמירה', false); return }
    setSavingDraft(true)
    const res = await fetch('/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentText: postText, hashtags, platform: [platform], status: 'draft' }),
    })
    setSavingDraft(false)
    showToast(res.ok ? 'נשמר כטיוטה ✓' : 'שגיאה בשמירה', res.ok)
  }

  // ── schedule ──
  async function handleSchedule() {
    if (!postText.trim()) { showToast('אין תוכן לתזמון', false); return }
    router.push(`/dashboard/queue?draft=${encodeURIComponent(postText)}&platform=${platform}`)
  }

  const charPct = Math.min(100, (charCount / maxChars) * 100)
  const charColor = charPct > 90 ? '#F87171' : charPct > 70 ? '#FBBF24' : 'rgba(255,255,255,0.3)'

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', direction: 'rtl', overflow: 'hidden', position: 'relative' }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 24px', borderRadius: 14, zIndex: 200, fontSize: 13, fontWeight: 600,
          background: toast.ok ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
          border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: toast.ok ? '#34D399' : '#F87171', backdropFilter: 'blur(12px)',
        }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          RIGHT COLUMN — Editor & AI Workspace
      ═══════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        paddingLeft: 24, paddingTop: 24, paddingBottom: 80,
        overflowY: 'auto', minWidth: 0,
      }}>

        {/* Page header + token indicator */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 3px' }}>סטודיו יצירה</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: 0 }}>צור תוכן מותאם אישית לעסק שלך</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(152,80,255,0.12)', border: '1px solid rgba(152,80,255,0.25)',
          }}>
            <i className="ti ti-coins" style={{ fontSize: 14, color: PURPLE }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE2 }}>{tokens.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>טוקנים</span>
          </div>
        </div>

        {/* ── 1. AI Prompt ── */}
        <div className="neon-card" style={{ ...GLASS, padding: '18px 20px', marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 10, letterSpacing: '0.05em' }}>
            <i className="ti ti-sparkles" style={{ marginLeft: 5, color: PURPLE }} />
            תאר לAI את הפוסט שתרצה
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }}
              placeholder={`לדוגמה: "פוסט לקידום המבצע שלנו לקיץ — 20% הנחה על כל המוצרים"`}
              rows={2}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 14, fontSize: 13, color: '#fff',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                outline: 'none', resize: 'none', direction: 'rtl', lineHeight: 1.6,
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              style={{
                padding: '12px 20px', borderRadius: 14, cursor: loading ? 'wait' : 'pointer',
                background: loading ? 'rgba(152,80,255,0.3)' : `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
                color: '#fff', fontSize: 13, fontWeight: 700, border: 'none',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(152,80,255,0.4)',
                whiteSpace: 'nowrap', minWidth: 110, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 7,
                opacity: !prompt.trim() ? 0.5 : 1,
              }}
            >
              {loading
                ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> יוצר...</>
                : <><i className="ti ti-wand" style={{ fontSize: 15 }} /> צור קסם</>
              }
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            Ctrl+Enter ליצירה מהירה · כל יצירה ~10 טוקנים
          </div>
        </div>

        {/* ── 2. Rich Text Editor ── */}
        <div className="neon-card" style={{ ...GLASS, padding: '18px 20px', marginBottom: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>
              <i className="ti ti-pencil" style={{ marginLeft: 5 }} />
              טקסט הפוסט
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: charColor, fontVariantNumeric: 'tabular-nums' }}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()}
              </span>
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${charPct}%`, background: charColor, borderRadius: 999, transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>

          <textarea
            value={postText}
            onChange={e => { setPostText(e.target.value); setCharCount(e.target.value.length) }}
            placeholder={loading ? 'ה-AI כותב עבורך...' : 'כתוב פוסט או לחץ "צור קסם" למעלה...'}
            style={{
              flex: 1, minHeight: 160, padding: '14px', borderRadius: 14, fontSize: 13.5,
              color: postText ? '#fff' : 'rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              outline: 'none', resize: 'none', direction: 'rtl', lineHeight: 1.75,
              fontFamily: 'inherit', transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(152,80,255,0.35)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />

          {/* hashtags row */}
          {hashtags && (
            <div style={{
              marginTop: 10, padding: '10px 14px', borderRadius: 12,
              background: 'rgba(152,80,255,0.06)', border: '1px solid rgba(152,80,255,0.15)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <i className="ti ti-hash" style={{ fontSize: 14, color: PURPLE, marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: PURPLE2, lineHeight: 1.7, direction: 'ltr', flex: 1 }}>
                <input
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: PURPLE2, fontSize: 12, fontFamily: 'inherit' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Magic Buttons ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.06em' }}>
            שיפור מהיר ב-AI
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MAGIC_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => handleMagic(action.instruction, action.label)}
                disabled={!!magicLoading || !postText.trim()}
                style={{
                  padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  cursor: magicLoading || !postText.trim() ? 'not-allowed' : 'pointer',
                  background: magicLoading === action.label ? 'rgba(152,80,255,0.25)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${magicLoading === action.label ? 'rgba(152,80,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: magicLoading === action.label ? PURPLE2 : 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                  opacity: !postText.trim() ? 0.4 : 1,
                }}
              >
                {magicLoading === action.label
                  ? <div style={{ width: 10, height: 10, border: '1.5px solid rgba(152,80,255,0.3)', borderTop: '1.5px solid #BE56FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <i className={`ti ${action.icon}`} style={{ fontSize: 13 }} />
                }
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. Media Upload ── */}
        <div className="neon-card" style={{ ...GLASS, padding: '18px 20px', marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 12, letterSpacing: '0.05em' }}>
            <i className="ti ti-photo" style={{ marginLeft: 5 }} />
            מדיה
          </label>

          {imageUrl ? (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 10 }}>
              <Image src={imageUrl} alt="uploaded" width={600} height={280} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => { setImageUrl(null); setImageFile(null) }}
                style={{
                  position: 'absolute', top: 10, left: 10, width: 32, height: 32,
                  borderRadius: '50%', background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}
              >
                <i className="ti ti-x" style={{ fontSize: 14 }} />
              </button>
              <div style={{
                position: 'absolute', bottom: 10, right: 10, padding: '4px 10px',
                borderRadius: 999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                fontSize: 10, color: 'rgba(255,255,255,0.7)',
              }}>
                {imageFile ? imageFile.name : 'תמונה שנוצרה ב-AI'}
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? PURPLE : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 16, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(152,80,255,0.06)' : 'transparent',
                transition: 'all 0.2s', marginBottom: 10,
              }}
            >
              <i className="ti ti-cloud-upload" style={{ fontSize: 28, color: dragOver ? PURPLE : 'rgba(255,255,255,0.2)', display: 'block', marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: dragOver ? PURPLE2 : 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                גרור תמונה לכאן
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                JPG, PNG, MP4 · עד 50MB
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileChange} />

          <button
            onClick={handleGenerateImage}
            disabled={imgGenLoading}
            style={{
              width: '100%', padding: '11px', borderRadius: 14, cursor: imgGenLoading ? 'wait' : 'pointer',
              background: 'rgba(59,130,239,0.12)', border: '1px solid rgba(59,130,239,0.25)',
              color: '#60A5FA', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {imgGenLoading
              ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(96,165,250,0.3)', borderTop: '2px solid #60A5FA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> יוצר תמונה...</>
              : <><i className="ti ti-wand" style={{ fontSize: 15 }} /> ייצר תמונה ב-AI</>
            }
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          LEFT COLUMN — Live Preview (sticky)
      ═══════════════════════════════════════════════════ */}
      <div style={{
        width: 340, flexShrink: 0,
        padding: '24px 24px 80px',
        overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* sticky wrapper */}
        <div style={{ position: 'sticky', top: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 14, letterSpacing: '0.06em' }}>
            תצוגה מקדימה חיה
          </div>

          {/* Platform toggles */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {PLATFORMS.map(p => (
              <PlatformTab key={p.id} p={p} active={platform === p.id} onClick={() => setPlatform(p.id)} />
            ))}
          </div>

          {/* Phone mockup */}
          <PhoneMockup
            text={postText}
            hashtags={hashtags}
            imageUrl={imageUrl}
            platform={platform}
            businessName={businessName}
            userName={userName}
          />

          {/* character tip */}
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6,
          }}>
            {platform === 'instagram' && '📸 אינסטגרם: מומלץ עד 125 תווים לנראות. האלגוריתם מעדיף 5-10 האשטגים.'}
            {platform === 'facebook' && '👍 פייסבוק: מומלץ עד 40-80 תווים לפוסטים עם מעורבות גבוהה.'}
            {platform === 'linkedin' && '💼 לינקדאין: 1,300 תווים ראשונים נראים לפני "ראה עוד". תוכן מקצועי מקבל בוסט.'}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM STICKY ACTION BAR
      ═══════════════════════════════════════════════════ */}
      <div style={{
        position: 'fixed', bottom: 0, right: 0, left: 0,
        height: 68, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingInline: 24, gap: 10, direction: 'rtl',
        background: 'rgba(13,8,41,0.92)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 50,
      }}>
        {/* post char count summary */}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
          {postText.trim() ? `${charCount} תווים · ${platform}` : 'אין תוכן עדיין'}
        </div>

        {/* Save draft */}
        <button
          onClick={handleSaveDraft}
          disabled={savingDraft || !postText.trim()}
          style={{
            padding: '10px 22px', borderRadius: 14, cursor: 'pointer',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 7,
            opacity: !postText.trim() ? 0.4 : 1, transition: 'all 0.2s',
          }}
        >
          {savingDraft
            ? <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            : <i className="ti ti-device-floppy" style={{ fontSize: 15 }} />
          }
          שמור כטיוטה
        </button>

        {/* Schedule CTA */}
        <button
          onClick={handleSchedule}
          disabled={scheduling || !postText.trim()}
          style={{
            padding: '11px 28px', borderRadius: 14, cursor: 'pointer',
            background: postText.trim() ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : 'rgba(152,80,255,0.2)',
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
            boxShadow: postText.trim() ? '0 4px 24px rgba(152,80,255,0.45)' : 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: !postText.trim() ? 0.4 : 1, transition: 'all 0.2s',
            letterSpacing: '-0.2px',
          }}
        >
          <i className="ti ti-calendar-plus" style={{ fontSize: 16 }} />
          תזמן פוסט
        </button>
      </div>

      {/* spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
