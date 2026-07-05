'use client'
import { useState } from 'react'
import { notifyTokensSpent } from '@/lib/tokens-client'

/* ════════════════════════════════════════════════════════════
   Pro Agents UI — 3 cards wired to /api/agents/*
   Renders the strict-JSON responses into result cards.
════════════════════════════════════════════════════════════ */

const PURPLE = '#9850FF'
const GOLD = '#FFD700'

type AgentState = { loading: boolean; error: string | null; data: unknown }
const IDLE: AgentState = { loading: false, error: null, data: null }

/* Map API error codes → friendly Hebrew messages */
function errorText(status: number, body: { error?: string; required?: number; balance?: number }) {
  if (status === 403 || body.error === 'pro_required') return 'הפיצ׳ר הזה זמין למסלול Pro ומעלה. שדרגו כדי להפעיל את הסוכן.'
  if (status === 402 || body.error === 'insufficient_tokens') return `אין מספיק טוקנים (נדרש ${body.required}, נותרו ${body.balance}).`
  if (status === 401) return 'נא להתחבר מחדש.'
  if (body.error === 'agent_failed') return 'הסוכן לא הצליח לייצר תוצאה — נסו שוב בעוד רגע.'
  return 'אירעה שגיאה. נסו שוב.'
}

async function callAgent(path: string, payload: unknown): Promise<{ ok: true; data: unknown } | { ok: false; msg: string }> {
  try {
    const res = await fetch(`/api/agents/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, msg: errorText(res.status, body) }
    notifyTokensSpent()   // agent run deducted tokens → refresh the header counter
    return { ok: true, data: body.data }
  } catch {
    return { ok: false, msg: 'שגיאת רשת — נסו שוב.' }
  }
}

/* ── Shared bits ──────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'rgba(13,10,31,0.7)', border: '1px solid rgba(139,92,246,0.18)',
  borderRadius: 18, padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
}
const labelS: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }
const inputS: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}
function RunButton({ loading, onClick, cost }: { loading: boolean; onClick: () => void; cost: number }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      marginTop: 4, padding: '10px 16px', borderRadius: 999, border: 'none',
      background: loading ? 'rgba(152,80,255,0.4)' : `linear-gradient(135deg, ${PURPLE}, #6D28D9)`,
      color: '#fff', fontWeight: 800, fontSize: 13, cursor: loading ? 'wait' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      {loading ? 'מריץ…' : <>הפעל סוכן <span style={{ opacity: 0.8, fontWeight: 600 }}>· {cost} טוקנים</span></>}
    </button>
  )
}
function CardHeader({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `${PURPLE}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 20, color: PURPLE }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{title}</span>
          <i className="ti ti-crown" style={{ fontSize: 13, color: GOLD }} />
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}
const Err = ({ msg }: { msg: string }) => (
  <div style={{ fontSize: 12, color: '#FCA5A5', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '8px 12px' }}>{msg}</div>
)
const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 14px' }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: PURPLE, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{children}</div>
  </div>
)

/* ════════════════════════════════════════════════════════════
   Agent 1 — Competitor Analyst
════════════════════════════════════════════════════════════ */
function CompetitorCard() {
  const [text, setText] = useState('')
  const [s, setS] = useState<AgentState>(IDLE)

  async function run() {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return setS({ ...IDLE, error: 'הדביקו לפחות פוסט אחד של מתחרה.' })
    setS({ loading: true, error: null, data: null })
    const competitors = lines.map(description => ({ description }))
    const r = await callAgent('competitor', { competitors })
    setS(r.ok ? { loading: false, error: null, data: r.data } : { loading: false, error: r.msg, data: null })
  }

  const d = s.data as { analysis_summary: string; top_performing_topics: string[]; actionable_counter_strategy: string[] } | null
  return (
    <div style={card}>
      <CardHeader icon="ti-spy" title="סוכן ריגול מתחרים" desc="ניתוח מתחרים ובניית אסטרטגיית-נגד" />
      <label style={labelS}>פוסטים של מתחרים (שורה לכל פוסט)</label>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="הדביקו תיאורי פוסטים ומדדים…" style={{ ...inputS, resize: 'vertical' }} />
      <RunButton loading={s.loading} onClick={run} cost={15} />
      {s.error && <Err msg={s.error} />}
      {d && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Block title="סיכום הניתוח">{d.analysis_summary}</Block>
          <Block title="נושאים מובילים">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(d.top_performing_topics ?? []).map((t, i) => (
                <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: `${PURPLE}22`, color: '#C4B5FD' }}>{t}</span>
              ))}
            </div>
          </Block>
          <Block title="אסטרטגיית-נגד">
            <ol style={{ margin: 0, paddingInlineStart: 18 }}>
              {(d.actionable_counter_strategy ?? []).map((t, i) => <li key={i} style={{ marginBottom: 4 }}>{t}</li>)}
            </ol>
          </Block>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Agent 2 — Ad Copywriter
════════════════════════════════════════════════════════════ */
function AdCopyCard() {
  const [niche, setNiche] = useState('')
  const [audience, setAudience] = useState('')
  const [offer, setOffer] = useState('')
  const [s, setS] = useState<AgentState>(IDLE)

  async function run() {
    if (!niche || !audience || !offer) return setS({ ...IDLE, error: 'מלאו תחום, קהל יעד והצעה.' })
    setS({ loading: true, error: null, data: null })
    const r = await callAgent('ad-copy', { niche, audience, offer })
    setS(r.ok ? { loading: false, error: null, data: r.data } : { loading: false, error: r.msg, data: null })
  }

  const d = s.data as { facebook_ad: { primary_text: string; headline: string; hook: string }; google_ad: { headlines_max_30_chars: string[]; descriptions_max_90_chars: string[] } } | null
  return (
    <div style={card}>
      <CardHeader icon="ti-ad" title="סוכן ממומן" desc="קופי ממיר למודעות פייסבוק וגוגל" />
      <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="תחום העסק" style={inputS} />
      <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="קהל יעד" style={inputS} />
      <input value={offer} onChange={e => setOffer(e.target.value)} placeholder="המוצר / ההצעה" style={inputS} />
      <RunButton loading={s.loading} onClick={run} cost={12} />
      {s.error && <Err msg={s.error} />}
      {d && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Block title="פייסבוק · Hook">{d.facebook_ad?.hook}</Block>
          <Block title="פייסבוק · טקסט ראשי">{d.facebook_ad?.primary_text}</Block>
          <Block title="פייסבוק · כותרת">{d.facebook_ad?.headline}</Block>
          <Block title="גוגל · כותרות (עד 30 תווים)">
            {(d.google_ad?.headlines_max_30_chars ?? []).map((h, i) => <div key={i}>• {h} <span style={{ color: 'rgba(255,255,255,0.3)' }}>({h.length})</span></div>)}
          </Block>
          <Block title="גוגל · תיאורים (עד 90 תווים)">
            {(d.google_ad?.descriptions_max_90_chars ?? []).map((h, i) => <div key={i}>• {h}</div>)}
          </Block>
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Agent 3 — Multi-Platform Adapter
════════════════════════════════════════════════════════════ */
function AdapterCard() {
  const [content, setContent] = useState('')
  const [s, setS] = useState<AgentState>(IDLE)

  async function run() {
    if (!content.trim()) return setS({ ...IDLE, error: 'כתבו תוכן בסיס להתאמה.' })
    setS({ loading: true, error: null, data: null })
    const r = await callAgent('adapt', { content })
    setS(r.ok ? { loading: false, error: null, data: r.data } : { loading: false, error: r.msg, data: null })
  }

  const d = s.data as { tiktok_caption: string; instagram_post: string; facebook_post: string } | null
  const platforms: [string, string, string][] = d ? [
    ['ti-brand-tiktok', 'TikTok', d.tiktok_caption],
    ['ti-brand-instagram', 'Instagram', d.instagram_post],
    ['ti-brand-facebook', 'Facebook', d.facebook_post],
  ] : []
  return (
    <div style={card}>
      <CardHeader icon="ti-arrows-shuffle" title="סוכן אומני-צ'אנל" desc="התאמת תוכן אחד ל-3 פלטפורמות" />
      <label style={labelS}>תוכן הבסיס</label>
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="כתבו פוסט / תמלול בסיס…" style={{ ...inputS, resize: 'vertical' }} />
      <RunButton loading={s.loading} onClick={run} cost={10} />
      {s.error && <Err msg={s.error} />}
      {d && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {platforms.map(([icon, name, body]) => (
            <Block key={name} title={`${name}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <i className={`ti ${icon}`} style={{ color: PURPLE }} />
              </span>
              <div style={{ marginTop: 4 }}>{body}</div>
            </Block>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Page
════════════════════════════════════════════════════════════ */
export default function ProAgents({ isPro }: { isPro: boolean }) {
  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
          סוכני Pro <i className="ti ti-crown" style={{ fontSize: 18, color: GOLD }} />
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          3 סוכני AI מתקדמים. {isPro ? 'הזינו קלט והפעילו.' : 'זמינים במסלול Pro — שדרגו כדי להפעיל.'}
        </p>
      </div>

      {!isPro && (
        <a href="/dashboard/upgrade" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '14px 18px', borderRadius: 14, textDecoration: 'none',
          background: `${GOLD}14`, border: `1px solid ${GOLD}55`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
            <i className="ti ti-crown" style={{ color: GOLD, marginInlineEnd: 6 }} />
            פתחו את כל סוכני ה-Pro
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>שדרגו ל-Pro ←</span>
        </a>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <CompetitorCard />
        <AdCopyCard />
        <AdapterCard />
      </div>
    </div>
  )
}
