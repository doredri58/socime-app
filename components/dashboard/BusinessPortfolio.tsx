'use client'
import { useState, useRef, useEffect } from 'react'
import { TONES, type ToneId } from '@/lib/tones'

/* ── design tokens ────────────────────────────────────────────────────── */
const PURPLE  = '#B030F5'
const PURPLE2 = '#CE7BFF'
const BLUE    = '#F72D93'
const GREEN   = '#34D399'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 20,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12, fontSize: 13,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
  color: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  direction: 'rtl',
}

/* ── types ────────────────────────────────────────────────────────────── */

interface Profile {
  business_name?: string
  raw_description?: string
  tone_of_voice?: ToneId
  phone?: string
  address?: string
  operating_hours?: string
  parsed_system_prompt?: string
  company_id?: string
  website?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  tiktok?: string
  target_audience?: string
  unique_value?: string
}

interface Props { userId: string; initialProfile: Profile | null }

/* ── tone options ─────────────────────────────────────────────────────── */

/* ── labeled input helper ─────────────────────────────────────────────── */
function Field({ label, icon, children }: { label: string; icon?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />}
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, icon, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; icon?: string; type?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      {icon && (
        <i className={`ti ${icon}`} style={{
          position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
          fontSize: 14, color: focused ? PURPLE2 : 'rgba(255,255,255,0.25)', transition: 'color 0.2s', pointerEvents: 'none',
        }} />
      )}
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...INPUT_STYLE,
          paddingRight: icon ? 38 : 14,
          borderColor: focused ? `${PURPLE}80` : 'rgba(255,255,255,0.10)',
          boxShadow: focused ? `0 0 0 3px rgba(176,48,245,0.10)` : 'none',
        }}
      />
    </div>
  )
}

/* ── section card wrapper ─────────────────────────────────────────────── */
function SectionCard({ icon, iconBg, iconColor, title, subtitle, children, glow }: {
  icon: string; iconBg: string; iconColor: string
  title: string; subtitle?: string; children: React.ReactNode; glow?: string
}) {
  return (
    <div className="neon-card" style={{
      ...GLASS, padding: '28px',
      ...(glow ? { borderColor: `${glow}30`, background: `rgba(${hexToRgb(glow)},0.04)` } : {}),
    }}>
      {/* section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: iconBg, border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 18, color: iconColor }} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

/* ── toast ────────────────────────────────────────────────────────────── */
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      padding: '12px 24px', borderRadius: 999, zIndex: 200, pointerEvents: 'none',
      background: type === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
      border: `1px solid ${type === 'success' ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`,
      backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <i className={`ti ${type === 'success' ? 'ti-circle-check' : 'ti-alert-circle'}`}
        style={{ fontSize: 16, color: type === 'success' ? GREEN : '#F87171' }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{message}</span>
    </div>
  )
}

/* ── main component ───────────────────────────────────────────────────── */
export default function BusinessPortfolio({ userId, initialProfile }: Props) {
  /* ── form state ── */
  const [businessName,    setBusinessName]    = useState(initialProfile?.business_name    ?? '')
  const [companyId,       setCompanyId]       = useState(initialProfile?.company_id       ?? '')
  const [phone,           setPhone]           = useState(initialProfile?.phone            ?? '')
  const [address,         setAddress]         = useState(initialProfile?.address          ?? '')
  const [operatingHours,  setOperatingHours]  = useState(initialProfile?.operating_hours  ?? '')
  const [website,         setWebsite]         = useState(initialProfile?.website          ?? '')
  const [instagram,       setInstagram]       = useState(initialProfile?.instagram        ?? '')
  const [facebook,        setFacebook]        = useState(initialProfile?.facebook         ?? '')
  const [linkedin,        setLinkedin]        = useState(initialProfile?.linkedin         ?? '')
  const [tiktok,          setTiktok]          = useState(initialProfile?.tiktok           ?? '')
  const [rawDescription,  setRawDescription]  = useState(initialProfile?.raw_description  ?? '')
  const [uniqueValue,     setUniqueValue]     = useState(initialProfile?.unique_value     ?? '')
  const [targetAudience,  setTargetAudience]  = useState(initialProfile?.target_audience  ?? '')
  const [selectedTones,   setSelectedTones]   = useState<ToneId[]>(
    initialProfile?.tone_of_voice ? [initialProfile.tone_of_voice] : ['warm']
  )
  const [systemPrompt,    setSystemPrompt]    = useState(initialProfile?.parsed_system_prompt ?? '')
  const [editingPrompt,   setEditingPrompt]   = useState(false)

  /* ── status ── */
  const [loading,    setLoading]    = useState(false)
  const [regen,      setRegen]      = useState(false)
  const [toast,      setToast]      = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  function toggleTone(id: ToneId) {
    setSelectedTones(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(t => t !== id) : prev  // keep at least one
        : [...prev, id]
    )
  }

  async function handleSave() {
    if (!businessName.trim()) { showToast('שם העסק הוא שדה חובה', 'error'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, businessName, rawDescription, toneOfVoice: selectedTones[0],
          phone:          phone          || undefined,
          address:        address        || undefined,
          operatingHours: operatingHours || undefined,
          companyId:      companyId      || undefined,
          website:        website        || undefined,
          instagram:      instagram      || undefined,
          facebook:       facebook       || undefined,
          linkedin:       linkedin       || undefined,
          tiktok:         tiktok         || undefined,
          targetAudience: targetAudience || undefined,
          uniqueValue:    uniqueValue    || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'שגיאה בשמירה', 'error'); return }
      if (data.parsedSystemPrompt) setSystemPrompt(data.parsedSystemPrompt)
      showToast('תיק העסק עודכן בהצלחה ✓', 'success')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegen() {
    setRegen(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, businessName, rawDescription, toneOfVoice: selectedTones[0] }),
      })
      const data = await res.json()
      if (res.ok && data.parsedSystemPrompt) {
        setSystemPrompt(data.parsedSystemPrompt)
        showToast('הסיכום חולל מחדש ✓', 'success')
      }
    } finally {
      setRegen(false)
    }
  }

  const divider = <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '20px 0' }} />

  return (
    <div style={{ direction: 'rtl', paddingBottom: 60 }}>

      {/* ── page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' }}>תיק עסק</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            המידע הזה מזין את ה-AI שכותב את הפוסטים שלך — עדכן כאן, תראה שיפור מיידי
          </p>
        </div>

        <button onClick={handleSave} disabled={loading} style={{
          padding: '11px 24px', borderRadius: 14, cursor: loading ? 'wait' : 'pointer',
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
          border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 18px rgba(176,48,245,0.35)', opacity: loading ? 0.75 : 1,
          transition: 'all 0.2s',
        }}>
          {loading
            ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />שומר...</>
            : <><i className="ti ti-device-floppy" style={{ fontSize: 16 }} />שמור שינויים</>
          }
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — AI Business Summary
        ══════════════════════════════════════════════════════════ */}
        <SectionCard
          icon="ti-brain" iconBg="rgba(176,48,245,0.15)" iconColor={PURPLE2}
          title="איך SociMe מבינה אתכם"
          subtitle="סיכום AI של פרופיל העסק שלך — הבסיס לכל התוכן שנכתב"
          glow={PURPLE}
        >
          {/* ambient glow blobs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(176,48,245,0.10)', filter: 'blur(50px)', pointerEvents: 'none' }} />

          {systemPrompt ? (
            <>
              {editingPrompt ? (
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  rows={6}
                  style={{ ...INPUT_STYLE, lineHeight: 1.8, resize: 'vertical', minHeight: 120 }}
                />
              ) : (
                <div style={{
                  padding: '16px 18px', borderRadius: 14, lineHeight: 1.85,
                  background: 'rgba(176,48,245,0.07)', border: '1px solid rgba(176,48,245,0.18)',
                  fontSize: 13, color: 'rgba(255,255,255,0.70)',
                }}>
                  {systemPrompt}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button onClick={() => setEditingPrompt(p => !p)} style={{
                  padding: '9px 18px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)' }}
                >
                  <i className={`ti ${editingPrompt ? 'ti-check' : 'ti-pencil'}`} style={{ fontSize: 13 }} />
                  {editingPrompt ? 'סיים עריכה' : 'ערוך ידנית'}
                </button>

                <button onClick={handleRegen} disabled={regen} style={{
                  padding: '9px 18px', borderRadius: 12, cursor: regen ? 'wait' : 'pointer', fontSize: 12, fontWeight: 700,
                  background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: 6, opacity: regen ? 0.7 : 1,
                  boxShadow: '0 3px 12px rgba(176,48,245,0.3)', transition: 'all 0.18s',
                }}>
                  {regen
                    ? <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <i className="ti ti-sparkles" style={{ fontSize: 13 }} />
                  }
                  חולל מחדש
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', borderRadius: 14, background: 'rgba(176,48,245,0.06)', border: '1px dashed rgba(176,48,245,0.25)' }}>
              <i className="ti ti-brain" style={{ fontSize: 28, color: 'rgba(176,48,245,0.4)', display: 'block', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '0 0 14px', lineHeight: 1.7 }}>
                מלא את פרטי העסק בטפסים מטה ולחץ "שמור שינויים" — ה-AI יצור סיכום מותאם אישית
              </p>
            </div>
          )}
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — Technical Details & Digital Assets
        ══════════════════════════════════════════════════════════ */}
        <SectionCard
          icon="ti-building-store" iconBg="rgba(247,45,147,0.12)" iconColor={BLUE}
          title="פרטים יבשים ונכסים דיגיטליים"
          subtitle="מידע בסיסי על העסק ולינקים לנוכחות הדיגיטלית"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* column 1 — business info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: BLUE, letterSpacing: '0.06em', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="ti ti-info-circle" style={{ fontSize: 13 }} /> פרטי העסק
              </div>

              <Field label="שם העסק" icon="ti-building-store">
                <TextInput value={businessName} onChange={setBusinessName}
                  placeholder="מספרת דוד, קפה הפינה..." icon="ti-building-store" />
              </Field>

              <Field label='ח.פ / עוסק מורשה' icon="ti-id-badge">
                <TextInput value={companyId} onChange={setCompanyId}
                  placeholder="123456789" icon="ti-id-badge" />
              </Field>

              <Field label="טלפון" icon="ti-phone">
                <TextInput value={phone} onChange={setPhone}
                  placeholder="050-0000000" icon="ti-phone" type="tel" />
              </Field>

              <Field label="כתובת" icon="ti-map-pin">
                <TextInput value={address} onChange={setAddress}
                  placeholder="רחוב הרצל 1, תל אביב" icon="ti-map-pin" />
              </Field>

              <Field label="שעות פעילות" icon="ti-clock">
                <TextInput value={operatingHours} onChange={setOperatingHours}
                  placeholder="א׳-ה׳ 09:00–19:00" icon="ti-clock" />
              </Field>
            </div>

            {/* vertical divider */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', right: -12, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.07)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#60A5FA', letterSpacing: '0.06em', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-world" style={{ fontSize: 13 }} /> נכסים דיגיטליים
                </div>

                <Field label="אתר אינטרנט" icon="ti-world">
                  <TextInput value={website} onChange={setWebsite}
                    placeholder="www.example.co.il" icon="ti-world" />
                </Field>

                <Field label="Instagram" icon="ti-brand-instagram">
                  <TextInput value={instagram} onChange={setInstagram}
                    placeholder="@username" icon="ti-brand-instagram" />
                </Field>

                <Field label="Facebook" icon="ti-brand-facebook">
                  <TextInput value={facebook} onChange={setFacebook}
                    placeholder="facebook.com/page" icon="ti-brand-facebook" />
                </Field>

                <Field label="LinkedIn" icon="ti-brand-linkedin">
                  <TextInput value={linkedin} onChange={setLinkedin}
                    placeholder="linkedin.com/company/..." icon="ti-brand-linkedin" />
                </Field>

                <Field label="TikTok" icon="ti-brand-tiktok">
                  <TextInput value={tiktok} onChange={setTiktok}
                    placeholder="@username" icon="ti-brand-tiktok" />
                </Field>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — AI Engine Settings
        ══════════════════════════════════════════════════════════ */}
        <SectionCard
          icon="ti-sparkles" iconBg="rgba(251,191,36,0.12)" iconColor="#FBBF24"
          title="הגדרות ליבה של ה-AI"
          subtitle="הנתונים שקובעים את אופי התוכן — מה לשנות כאן משפיע מיד על הפלט"
          glow="#FBBF24"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* raw description */}
            <Field label="תיאור העסק הכללי" icon="ti-file-description">
              <div style={{ position: 'relative' }}>
                <textarea
                  value={rawDescription}
                  onChange={e => setRawDescription(e.target.value)}
                  rows={4}
                  placeholder="מה אתם עושים? מי הלקוחות שלכם? מה הסיפור שלכם?"
                  onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = `${PURPLE}80`; (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(176,48,245,0.10)' }}
                  onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.10)'; (e.target as HTMLTextAreaElement).style.boxShadow = 'none' }}
                  style={{ ...INPUT_STYLE, lineHeight: 1.8, resize: 'vertical', minHeight: 100 }}
                />
                <span style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                  {rawDescription.length} תווים
                </span>
              </div>
            </Field>

            {divider}

            {/* unique value */}
            <Field label="היתרון היחסי — מה אנחנו עושים הכי טוב?" icon="ti-star">
              <textarea
                value={uniqueValue}
                onChange={e => setUniqueValue(e.target.value)}
                rows={3}
                placeholder="מה מבדיל אתכם מהמתחרים? מה הלקוחות שלכם אומרים שהם לא מקבלים אצל אף אחד אחר?"
                onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = `${PURPLE}80`; (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 3px rgba(176,48,245,0.10)' }}
                onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.10)'; (e.target as HTMLTextAreaElement).style.boxShadow = 'none' }}
                style={{ ...INPUT_STYLE, lineHeight: 1.8, resize: 'vertical', minHeight: 84 }}
              />
            </Field>

            {/* target audience */}
            <Field label="מי קהל היעד שלנו?" icon="ti-users">
              <TextInput value={targetAudience} onChange={setTargetAudience}
                placeholder="נשים בגיל 25–45, בעלי עסקים קטנים, הורים לילדים..."
                icon="ti-users" />
            </Field>

            {divider}

            {/* tone tags */}
            <Field label="טון וסגנון דיבור" icon="ti-message-circle">
              <div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px', lineHeight: 1.6 }}>
                  בחר אחד או יותר — ה-AI ישלב את הסגנונות שנבחרו
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TONES.map(tone => {
                    const active = selectedTones.includes(tone.id)
                    return (
                      <button key={tone.id} onClick={() => toggleTone(tone.id)} style={{
                        padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: active ? 'rgba(176,48,245,0.18)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? 'rgba(206,123,255,0.45)' : 'rgba(255,255,255,0.09)'}`,
                        color: active ? PURPLE2 : 'rgba(255,255,255,0.45)',
                        display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: active ? '0 2px 10px rgba(176,48,245,0.18)' : 'none',
                        transition: 'all 0.18s',
                      }}>
                        <span>{tone.emoji}</span>
                        {tone.label}
                        {active && <i className="ti ti-check" style={{ fontSize: 11 }} />}
                      </button>
                    )
                  })}
                </div>

                {/* selected summary */}
                {selectedTones.length > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(176,48,245,0.07)', border: '1px solid rgba(176,48,245,0.15)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    <i className="ti ti-sparkles" style={{ color: PURPLE2, marginLeft: 5 }} />
                    ה-AI ישתמש בטון: <strong style={{ color: PURPLE2 }}>{selectedTones.map(id => TONES.find(t => t.id === id)?.label).join(' + ')}</strong>
                  </div>
                )}
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── sticky save footer ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 12, paddingTop: 4 }}>
          <button onClick={handleSave} disabled={loading} style={{
            padding: '13px 32px', borderRadius: 14, cursor: loading ? 'wait' : 'pointer',
            background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`,
            border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: 9, opacity: loading ? 0.75 : 1,
            boxShadow: '0 4px 22px rgba(176,48,245,0.4)', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = '' }}
          >
            {loading
              ? <><div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />שומר ומעדכן AI...</>
              : <><i className="ti ti-device-floppy" style={{ fontSize: 16 }} />שמור שינויים</>
            }
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', alignSelf: 'center', lineHeight: 1.6 }}>
            השמירה מפעילה מחדש את מנוע ה-AI עם הנתונים החדשים
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
