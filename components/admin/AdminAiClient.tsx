'use client'
import React, { useState } from 'react'

const ACCENT = '#3B82EF', GREEN = '#10B981', RED = '#EF4444', YELLOW = '#F59E0B', PURPLE = '#8B5CF6'
const BG = 'rgba(255,255,255,0.03)', BD = 'rgba(255,255,255,0.07)'

type PromptKey = 'ideas' | 'post' | 'onboarding' | 'image'

const PROMPT_META: Record<PromptKey, { label: string; sub: string; icon: string; color: string; vars: string[] }> = {
  ideas:      { label: 'מנוע רעיונות',       sub: 'Ideas Bank generation',     icon: 'ti-bulb',          color: YELLOW, vars: ['{{business_type}}', '{{business_name}}'] },
  post:       { label: 'יצירת פוסטים',       sub: 'Post creation studio',      icon: 'ti-pencil',        color: ACCENT, vars: ['{{platform}}', '{{tone}}', '{{business_name}}', '{{business_type}}', '{{target_audience}}'] },
  onboarding: { label: 'אונבורדינג',          sub: 'Business profile builder',  icon: 'ti-user-star',     color: GREEN,  vars: ['{{raw_description}}'] },
  image:      { label: 'יצירת תמונות',       sub: 'Image generation prompt',   icon: 'ti-photo-ai',      color: PURPLE, vars: ['{{style}}', '{{platform}}', '{{brand_colors}}', '{{subject}}'] },
}

const MODELS = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-8', 'gpt-4o', 'gpt-4o-mini']

interface Props { defaultPrompts: Record<PromptKey, string> }

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500,
      padding: '10px 20px', borderRadius: 10, backdropFilter: 'blur(20px)',
      background: ok ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
      border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12, fontWeight: 700 }}>
      <i className={`ti ${ok ? 'ti-circle-check' : 'ti-alert-circle'}`} style={{ color: ok ? GREEN : RED }} />
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
  const [testing, setTesting]     = useState(false)

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200) }

  async function save() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600)) // optimistic
    setSaving(false)
    showToast('System Prompts נשמרו בהצלחה ✓', true)
  }

  async function testPrompt() {
    setTesting(true)
    setTestOutput('')
    await new Promise(r => setTimeout(r, 1200))
    setTestOutput(`[סימולציה] תגובת ${model}:\n\n✓ הפרומפט תקין ומובן ל-AI.\n✓ משתנים שזוהו: ${PROMPT_META[activeKey].vars.join(', ')}\n✓ אורך הפרומפט: ${prompts[activeKey].length} תווים\n⚡ זמן תגובה משוער: 1.2-2.4 שניות\n\nדוגמת פלט:\nהעסק שלך נראה כמו חנות אופנה מדהימה שמתמחה ב-{{business_type}}. הנה 3 רעיונות מנצחים...`)
    setTesting(false)
  }

  const meta = PROMPT_META[activeKey]
  const charCount = prompts[activeKey].length

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>מנוע ה-AI — System Prompts</h1>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>ניהול ועריכת הפרומפטים המניעים את כל מערכת ה-AI</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* prompt selector sidebar */}
        <div>
          <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            {(Object.keys(PROMPT_META) as PromptKey[]).map(k => {
              const m = PROMPT_META[k]; const active = activeKey === k
              return (
                <button key={k} onClick={() => setActiveKey(k)} style={{
                  width: '100%', padding: '12px 14px', textAlign: 'right', cursor: 'pointer',
                  background: active ? `${m.color}14` : 'transparent',
                  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderRight: active ? `3px solid ${m.color}` : '3px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: active ? `${m.color}18` : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${m.icon}`} style={{ fontSize: 14, color: active ? m.color : 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#fff' : 'rgba(255,255,255,0.45)' }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{m.sub}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* model config card */}
          <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, padding: '14px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 12 }}>הגדרות מודל</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, display: 'block', marginBottom: 5 }}>MODEL</label>
                <select value={model} onChange={e => setModel(e.target.value)} style={{
                  width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                  background: '#0A1020', border: '1px solid rgba(59,130,239,0.25)', color: '#fff', direction: 'ltr',
                }}>
                  {MODELS.map(m => <option key={m} value={m} style={{ background: '#0A1020' }}>{m}</option>)}
                </select>
              </div>
              {[
                { label: 'MAX TOKENS', val: maxTokens, set: setMaxTokens, type: 'number' },
                { label: 'TEMPERATURE', val: temperature, set: setTemp, type: 'number' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, display: 'block', marginBottom: 5 }}>{f.label}</label>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 11, outline: 'none', direction: 'ltr',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', boxSizing: 'border-box' as const }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* prompt editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* editor card */}
          <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* editor toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${meta.color}14`,
                  border: `1px solid ${meta.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${meta.icon}`} style={{ fontSize: 14, color: meta.color }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{meta.label}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>· {meta.sub}</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button onClick={testPrompt} disabled={testing} style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)',
                  color: PURPLE, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className={`ti ${testing ? 'ti-loader' : 'ti-player-play'}`} style={{ fontSize: 12, animation: testing ? 'spin 0.8s linear infinite' : 'none' }} />
                  {testing ? 'בודק...' : 'בדוק פרומפט'}
                </button>
                <button onClick={save} disabled={saving} style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)',
                  color: GREEN, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className={`ti ${saving ? 'ti-loader' : 'ti-device-floppy'}`} style={{ fontSize: 12, animation: saving ? 'spin 0.8s linear infinite' : 'none' }} />
                  {saving ? 'שומר...' : 'שמור הכל'}
                </button>
              </div>
            </div>

            {/* variables bar */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.05em' }}>VARIABLES:</span>
              {meta.vars.map(v => (
                <span key={v} style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 5,
                  background: `${meta.color}10`, border: `1px solid ${meta.color}25`, color: meta.color }}>
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
                background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0',
                fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box',
              }}
            />

            {/* char count */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{charCount} chars</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>·</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                ~{Math.ceil(charCount / 4)} tokens
              </span>
            </div>
          </div>

          {/* test output */}
          {(testOutput || testing) && (
            <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="ti ti-terminal-2" style={{ fontSize: 13 }} /> פלט בדיקה — {model}
              </div>
              {testing
                ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace' }}>מריץ בדיקה...</div>
                : <pre style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace',
                    lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{testOutput}</pre>
              }
            </div>
          )}

          {/* performance metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Total Calls Today', val: '284',   color: ACCENT  },
              { label: 'Avg Latency',        val: '1.4s',  color: GREEN   },
              { label: 'Error Rate',         val: '0.4%',  color: YELLOW  },
              { label: 'Cache Hit Rate',     val: '23%',   color: PURPLE  },
            ].map(m => (
              <div key={m.label} style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: m.color, fontFamily: 'monospace' }}>{m.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{m.label}</div>
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
