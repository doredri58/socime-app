'use client'
import React, { useState, useEffect } from 'react'

const ACCENT = '#1A73E8', GREEN = '#0F9E60', RED = '#D93025', YELLOW = '#F9AB00', PURPLE = '#7C3AED'
const BG = '#FFFFFF', BD = '#E2E8F0', BG_PAGE = '#F8FAFD'
const TEXT = '#0F172A', TEXT_MID = '#475569', TEXT_LOW = '#94A3B8'

type PromptKey = 'ideas' | 'post' | 'onboarding' | 'image'

const PROMPT_META: Record<PromptKey, { label: string; sub: string; icon: string; color: string; vars: string[] }> = {
  ideas:      { label: 'מנוע רעיונות',  sub: 'Ideas Bank generation',    icon: 'ti-bulb',       color: YELLOW, vars: ['{{business_type}}', '{{business_name}}'] },
  post:       { label: 'יצירת פוסטים',  sub: 'Post creation studio',     icon: 'ti-pencil',     color: ACCENT, vars: ['{{platform}}', '{{tone}}', '{{business_name}}', '{{business_type}}', '{{target_audience}}'] },
  onboarding: { label: 'אונבורדינג',    sub: 'Business profile builder', icon: 'ti-user-star',  color: GREEN,  vars: ['{{raw_description}}'] },
  image:      { label: 'יצירת תמונות',  sub: 'Image generation prompt',  icon: 'ti-photo-ai',   color: PURPLE, vars: ['{{style}}', '{{platform}}', '{{brand_colors}}', '{{subject}}'] },
}

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'claude-sonnet-4-6', 'gpt-4o', 'gpt-4o-mini']

interface Props { defaultPrompts: Record<PromptKey, string> }

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500,
      padding: '10px 20px', borderRadius: 10,
      background: ok ? GREEN : RED,
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
      <i className={`ti ${ok ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ color: '#fff' }} />
      {msg}
    </div>
  )
}

export default function AdminAiClient({ defaultPrompts }: Props) {
  const [activeKey, setActiveKey] = useState<PromptKey>('ideas')
  const [prompts, setPrompts]     = useState<Record<PromptKey, string>>(defaultPrompts as Record<PromptKey, string>)
  const [model, setModel]         = useState(MODELS[0])
  const [maxTokens, setMaxTokens] = useState('2048')
  const [temperature, setTemp]    = useState('0.7')
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [testOutput, setTestOutput] = useState('')
  const [testMeta, setTestMeta]   = useState<{ latency_ms: number; tokens_used: number } | null>(null)
  const [testing, setTesting]     = useState(false)

  // Load persisted prompts from DB on mount; fall back to defaultPrompts if table is empty
  useEffect(() => {
    fetch('/api/admin/system-prompts')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        if (data && typeof data === 'object' && !('error' in data)) {
          setPrompts(prev => {
            const merged = { ...prev }
            for (const k of Object.keys(data) as PromptKey[]) {
              if (k in PROMPT_META) merged[k] = data[k]
            }
            return merged
          })
        }
      })
      .catch(() => { /* silently fall back to defaultPrompts */ })
  }, [])

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200) }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/system-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activeKey, content: prompts[activeKey] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'שגיאה לא ידועה')
      showToast('System Prompt נשמר בהצלחה ✓', true)
    } catch (err: unknown) {
      showToast(`שגיאה בשמירה: ${err instanceof Error ? err.message : String(err)}`, false)
    } finally {
      setSaving(false)
    }
  }

  async function testPrompt() {
    setTesting(true)
    setTestOutput('')
    setTestMeta(null)
    try {
      const res = await fetch('/api/admin/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activeKey, content: prompts[activeKey], model }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'שגיאה לא ידועה')
      setTestOutput(data.output ?? '')
      setTestMeta({ latency_ms: data.latency_ms ?? 0, tokens_used: data.tokens_used ?? 0 })
    } catch (err: unknown) {
      setTestOutput(`שגיאה: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setTesting(false)
    }
  }

  const meta = PROMPT_META[activeKey]
  const charCount = prompts[activeKey].length

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: TEXT, margin: '0 0 3px' }}>מנוע ה-AI — System Prompts</h1>
        <div style={{ fontSize: 11, color: TEXT_LOW }}>ניהול ועריכת הפרומפטים המניעים את כל מערכת ה-AI</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* prompt selector sidebar */}
        <div>
          <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden', marginBottom: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {(Object.keys(PROMPT_META) as PromptKey[]).map(k => {
              const m = PROMPT_META[k]; const active = activeKey === k
              return (
                <button key={k} onClick={() => setActiveKey(k)} style={{
                  width: '100%', padding: '12px 14px', textAlign: 'right', cursor: 'pointer',
                  background: active ? `${m.color}0E` : 'transparent',
                  border: 'none', borderBottom: `1px solid ${BD}`,
                  borderRight: active ? `3px solid ${m.color}` : '3px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: active ? `${m.color}14` : BG_PAGE,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${m.icon}`} style={{ fontSize: 14, color: active ? m.color : TEXT_LOW }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? TEXT : TEXT_MID }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: TEXT_LOW }}>{m.sub}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* model config card */}
          <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: TEXT_MID, letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 12 }}>הגדרות מודל</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: TEXT_LOW, fontWeight: 700, display: 'block', marginBottom: 5 }}>MODEL</label>
                <select value={model} onChange={e => setModel(e.target.value)} style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                  background: BG_PAGE, border: `1px solid ${BD}`, color: TEXT, direction: 'ltr',
                }}>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {[
                { label: 'MAX TOKENS', val: maxTokens, set: setMaxTokens, type: 'number' },
                { label: 'TEMPERATURE', val: temperature, set: setTemp, type: 'number' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 10, color: TEXT_LOW, fontWeight: 700, display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11, outline: 'none', direction: 'ltr',
                      background: BG_PAGE, border: `1px solid ${BD}`, color: TEXT, boxSizing: 'border-box' as const }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* prompt editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* editor card */}
          <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {/* editor toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BD}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              background: BG_PAGE }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${meta.color}12`,
                  border: `1px solid ${meta.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${meta.icon}`} style={{ fontSize: 14, color: meta.color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{meta.label}</span>
                <span style={{ fontSize: 11, color: TEXT_LOW }}>· {meta.sub}</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={testPrompt} disabled={testing} style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.22)',
                  color: PURPLE, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className={`ti ${testing ? 'ti-loader' : 'ti-player-play'}`} style={{ fontSize: 12, animation: testing ? 'spin 0.8s linear infinite' : 'none' }} />
                  {testing ? 'בודק...' : 'בדוק פרומפט'}
                </button>
                <button onClick={save} disabled={saving} style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, background: 'rgba(15,158,96,0.08)', border: '1px solid rgba(15,158,96,0.22)',
                  color: GREEN, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className={`ti ${saving ? 'ti-loader' : 'ti-device-floppy'}`} style={{ fontSize: 12, animation: saving ? 'spin 0.8s linear infinite' : 'none' }} />
                  {saving ? 'שומר...' : 'שמור הכל'}
                </button>
              </div>
            </div>

            {/* variables bar */}
            <div style={{ padding: '8px 16px', borderBottom: `1px solid ${BD}`,
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: BG_PAGE }}>
              <span style={{ fontSize: 10, color: TEXT_LOW, fontWeight: 700, letterSpacing: '0.05em' }}>VARIABLES:</span>
              {meta.vars.map(v => (
                <span key={v} style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 5,
                  background: `${meta.color}0E`, border: `1px solid ${meta.color}28`, color: meta.color }}>
                  {v}
                </span>
              ))}
            </div>

            {/* textarea */}
            <textarea
              value={prompts[activeKey]}
              onChange={e => setPrompts(p => ({ ...p, [activeKey]: e.target.value }))}
              style={{
                width: '100%', minHeight: 280, padding: '16px', fontSize: 12, lineHeight: 1.8, direction: 'rtl',
                background: '#FFFFFF', border: 'none', outline: 'none', color: TEXT,
                fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            {/* char count */}
            <div style={{ padding: '8px 16px', borderTop: `1px solid ${BD}`, background: BG_PAGE,
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: TEXT_LOW, fontFamily: 'monospace' }}>{charCount} chars</span>
              <span style={{ fontSize: 10, color: TEXT_LOW }}>·</span>
              <span style={{ fontSize: 10, color: TEXT_LOW, fontFamily: 'monospace' }}>
                ~{Math.ceil(charCount / 4)} tokens
              </span>
            </div>
          </div>

          {/* test output */}
          {(testOutput || testing) && (
            <div style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="ti ti-terminal-2" style={{ fontSize: 13 }} /> פלט בדיקה — {model}
                {testMeta && (
                  <span style={{ marginRight: 'auto', fontSize: 10, color: TEXT_LOW, fontFamily: 'monospace', fontWeight: 400 }}>
                    {testMeta.latency_ms}ms · {testMeta.tokens_used} tokens
                  </span>
                )}
              </div>
              {testing
                ? <div style={{ color: TEXT_MID, fontSize: 12, fontFamily: 'monospace' }}>מריץ בדיקה...</div>
                : <pre style={{ fontSize: 11, color: TEXT_MID, fontFamily: 'monospace',
                    lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{testOutput}</pre>
              }
            </div>
          )}

          {/* performance metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Total Calls Today', val: '284',  color: ACCENT  },
              { label: 'Avg Latency',       val: '1.4s', color: GREEN   },
              { label: 'Error Rate',        val: '0.4%', color: YELLOW  },
              { label: 'Cache Hit Rate',    val: '23%',  color: PURPLE  },
            ].map(m => (
              <div key={m.label} style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px 14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                <div style={{ fontSize: 10, color: TEXT_LOW, marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
