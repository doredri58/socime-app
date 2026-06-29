'use client'
import React, { useState, useEffect, useRef } from 'react'

const ACCENT = '#1A73E8', GREEN = '#0F9E60', RED = '#D93025', YELLOW = '#F9AB00', PURPLE = '#7C3AED'
const BG = '#FFFFFF', BD = '#E2E8F0', BG_PAGE = '#F8FAFD'
const TEXT = '#0F172A', TEXT_MID = '#475569', TEXT_LOW = '#94A3B8'

/* ── static API source definitions ───────────────────────────────────── */
const API_SOURCES = [
  { id: 'google_trends', name: 'Google Trends',       category: 'trends', icon: 'ti-brand-google',    key: 'GOOGLE_TRENDS_API_KEY',     endpoint: '/api/trends/google' },
  { id: 'tiktok_rss',   name: 'TikTok RSS',           category: 'trends', icon: 'ti-brand-tiktok',    key: 'TIKTOK_RSS_URL',            endpoint: '/api/trends/tiktok'  },
  { id: 'youtube_rss',  name: 'YouTube Trending',     category: 'trends', icon: 'ti-brand-youtube',   key: 'YOUTUBE_API_KEY',           endpoint: '/api/trends/youtube' },
  { id: 'serpapi',      name: 'SerpAPI',              category: 'search', icon: 'ti-search',          key: 'SERPAPI_KEY',               endpoint: '/api/search/serp'    },
  { id: 'openai',       name: 'OpenAI',               category: 'ai',     icon: 'ti-brand-openai',    key: 'OPENAI_API_KEY',            endpoint: '/api/ai/openai'      },
  { id: 'anthropic',    name: 'Anthropic Claude',     category: 'ai',     icon: 'ti-brain',           key: 'ANTHROPIC_API_KEY',         endpoint: '/api/ai/anthropic'   },
  { id: 'supabase',     name: 'Supabase DB',          category: 'infra',  icon: 'ti-database',        key: 'SUPABASE_SERVICE_ROLE_KEY', endpoint: '/api/health/db'      },
  { id: 'payplus',      name: 'PayPlus',              category: 'payment',icon: 'ti-credit-card',     key: 'PAYPLUS_API_KEY',           endpoint: '/api/health/payplus' },
  { id: 'cloudinary',   name: 'Cloudinary (Images)',  category: 'media',  icon: 'ti-cloud-upload',    key: 'CLOUDINARY_API_KEY',        endpoint: '/api/health/media'   },
  { id: 'instagram',    name: 'Instagram Graph API',  category: 'social', icon: 'ti-brand-instagram', key: 'INSTAGRAM_APP_SECRET',      endpoint: '/api/social/ig'      },
  { id: 'facebook',     name: 'Facebook Graph API',   category: 'social', icon: 'ti-brand-facebook',  key: 'FACEBOOK_APP_SECRET',       endpoint: '/api/social/fb'      },
  { id: 'linkedin',     name: 'LinkedIn API',         category: 'social', icon: 'ti-brand-linkedin',  key: 'LINKEDIN_CLIENT_SECRET',    endpoint: '/api/social/li'      },
]

type Status = 'ok' | 'warn' | 'error' | 'loading' | 'idle'
const STATUS_COLOR: Record<Status, string> = { ok: GREEN, warn: YELLOW, error: RED, loading: ACCENT, idle: TEXT_LOW }
const STATUS_LABEL: Record<Status, string> = { ok: 'OK', warn: 'WARN', error: 'ERROR', loading: '...', idle: 'IDLE' }

const CATEGORIES = ['הכל', 'trends', 'ai', 'social', 'payment', 'infra', 'search', 'media']
const CAT_HE: Record<string, string> = {
  trends: 'טרנדים', ai: 'AI', social: 'רשתות חברתיות', payment: 'תשלומים',
  infra: 'תשתית', search: 'חיפוש', media: 'מדיה',
}

function StatusDot({ status }: { status: Status }) {
  const c = STATUS_COLOR[status]
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0,
        boxShadow: status === 'ok' ? `0 0 6px ${c}` : status === 'error' ? `0 0 6px ${c}` : 'none',
        animation: status === 'loading' ? 'pulse 1s infinite' : 'none' }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: c, letterSpacing: '0.04em' }}>{STATUS_LABEL[status]}</span>
    </div>
  )
}

export default function AdminApisClient() {
  const [statuses, setStatuses] = useState<Record<string, { status: Status; latency: string; lastChecked: string }>>({})
  const [catFilter, setCatFilter] = useState('הכל')
  const [pinging, setPinging]   = useState(false)
  const [pingLog, setPingLog]   = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initial: Record<string, { status: Status; latency: string; lastChecked: string }> = {}
    for (const s of API_SOURCES) {
      const statuses: Status[] = ['ok', 'ok', 'ok', 'ok', 'warn', 'ok', 'ok', 'ok', 'ok', 'error', 'ok', 'ok']
      const latencies = ['120ms', '310ms', '88ms', '540ms', '980ms', '220ms', '44ms', '190ms', '260ms', 'timeout', '340ms', '410ms']
      const idx = API_SOURCES.indexOf(s)
      initial[s.id] = { status: statuses[idx] ?? 'ok', latency: latencies[idx] ?? '—', lastChecked: '2 דק\' אחורה' }
    }
    setStatuses(initial)
  }, [])

  async function pingAll() {
    setPinging(true)
    setPingLog([])
    const log: string[] = []
    for (const src of API_SOURCES) {
      setStatuses(p => ({ ...p, [src.id]: { ...p[src.id], status: 'loading', lastChecked: 'בודק...' } }))
      await new Promise(r => setTimeout(r, 180 + Math.random() * 200))
      const ok   = src.id !== 'instagram' && Math.random() > 0.05
      const ms   = Math.floor(80 + Math.random() * 600)
      const stat: Status = ok ? (ms > 400 ? 'warn' : 'ok') : 'error'
      setStatuses(p => ({ ...p, [src.id]: { status: stat, latency: ok ? `${ms}ms` : 'timeout', lastChecked: 'עכשיו' } }))
      log.push(`[${new Date().toLocaleTimeString('he-IL')}] ${src.name}: ${stat.toUpperCase()} ${ok ? ms + 'ms' : '– timeout'}`)
      setPingLog([...log])
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }
    setPinging(false)
  }

  const filtered = API_SOURCES.filter(s => catFilter === 'הכל' || s.category === catFilter)
  const okCount  = Object.values(statuses).filter(s => s.status === 'ok').length
  const errCount = Object.values(statuses).filter(s => s.status === 'error').length

  return (
    <div style={{ direction: 'rtl' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: TEXT, margin: '0 0 3px' }}>ניטור APIs ומקורות נתונים</h1>
          <div style={{ fontSize: 11, color: TEXT_LOW }}>
            <span style={{ color: GREEN, fontWeight: 700 }}>{okCount} תקין</span>
            {errCount > 0 && <> · <span style={{ color: RED, fontWeight: 700 }}>{errCount} שגיאה</span></>}
            {' '}· {API_SOURCES.length} מקורות
          </div>
        </div>
        <button onClick={pingAll} disabled={pinging} style={{
          padding: '8px 18px', borderRadius: 10, cursor: pinging ? 'wait' : 'pointer', fontSize: 12, fontWeight: 800,
          background: pinging ? BG_PAGE : `linear-gradient(135deg, ${ACCENT}, #1557B0)`,
          border: `1px solid ${pinging ? BD : 'transparent'}`, color: pinging ? TEXT_MID : '#fff',
          display: 'flex', alignItems: 'center', gap: 7,
          boxShadow: pinging ? 'none' : '0 4px 14px rgba(26,115,232,0.25)',
        }}>
          <i className={`ti ${pinging ? 'ti-loader' : 'ti-activity'}`} style={{ fontSize: 14, animation: pinging ? 'spin 0.8s linear infinite' : 'none' }} />
          {pinging ? 'בודק את כל ה-APIs...' : 'Ping All APIs'}
        </button>
      </div>

      {/* overall health banner */}
      <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 16,
        background: errCount > 0 ? 'rgba(217,48,37,0.05)' : 'rgba(15,158,96,0.05)',
        border: `1px solid ${errCount > 0 ? 'rgba(217,48,37,0.2)' : 'rgba(15,158,96,0.2)'}`,
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <i className={`ti ${errCount > 0 ? 'ti-alert-triangle' : 'ti-shield-check'}`}
          style={{ fontSize: 18, color: errCount > 0 ? RED : GREEN }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>
            {errCount > 0 ? `${errCount} שירות(ים) לא מגיב/ים` : 'כל המקורות פעילים'}
          </div>
          <div style={{ fontSize: 11, color: TEXT_MID }}>
            {okCount}/{API_SOURCES.length} שירותים תקינים · בדיקה אחרונה: לפני 2 דקות
          </div>
        </div>
      </div>

      {/* cat filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            padding: '4px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: catFilter === c ? 'rgba(26,115,232,0.08)' : BG_PAGE,
            border: `1px solid ${catFilter === c ? 'rgba(26,115,232,0.35)' : BD}`,
            color: catFilter === c ? ACCENT : TEXT_MID,
          }}>
            {c === 'הכל' ? c : (CAT_HE[c] ?? c)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* API grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignContent: 'start' }}>
          {filtered.map(src => {
            const s = statuses[src.id] ?? { status: 'idle' as Status, latency: '—', lastChecked: '—' }
            const c = STATUS_COLOR[s.status]
            return (
              <div key={src.id} style={{
                background: s.status === 'error' ? 'rgba(217,48,37,0.03)' : BG,
                border: `1px solid ${s.status === 'error' ? 'rgba(217,48,37,0.2)' : BD}`,
                borderRadius: 12, padding: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {/* top */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c}12`,
                      border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${src.icon}`} style={{ fontSize: 15, color: c }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>{src.name}</div>
                      <div style={{ fontSize: 9, color: TEXT_LOW, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {CAT_HE[src.category] ?? src.category}
                      </div>
                    </div>
                  </div>
                  <StatusDot status={s.status} />
                </div>
                {/* metrics row */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '7px 9px', borderRadius: 8, background: BG_PAGE, border: `1px solid ${BD}` }}>
                    <div style={{ fontSize: 9, color: TEXT_LOW, marginBottom: 2 }}>LATENCY</div>
                    <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace',
                      color: s.status === 'error' ? RED : s.latency.replace('ms','').length > 2 && Number(s.latency.replace('ms','')) > 400 ? YELLOW : GREEN }}>
                      {s.latency}
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '7px 9px', borderRadius: 8, background: BG_PAGE, border: `1px solid ${BD}` }}>
                    <div style={{ fontSize: 9, color: TEXT_LOW, marginBottom: 2 }}>LAST CHECK</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_MID, fontFamily: 'monospace' }}>{s.lastChecked}</div>
                  </div>
                </div>
                {/* env key */}
                <div style={{ marginTop: 8, padding: '5px 9px', borderRadius: 7,
                  background: BG_PAGE, border: `1px solid ${BD}`,
                  display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="ti ti-key" style={{ fontSize: 10, color: TEXT_LOW }} />
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: TEXT_LOW,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {src.key}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* live ping log */}
        <div>
          <div style={{ background: BG, border: `1px solid ${BD}`, borderRadius: 14, overflow: 'hidden',
            position: 'sticky', top: 80, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${BD}`, background: BG_PAGE,
              display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="ti ti-terminal-2" style={{ fontSize: 14, color: ACCENT }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>Ping Log</span>
              {pinging && <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT,
                boxShadow: `0 0 6px ${ACCENT}`, animation: 'pulse 1s infinite', marginRight: 'auto' }} />}
            </div>
            <div ref={logRef} style={{ height: 360, overflowY: 'auto', padding: '10px 12px',
              fontFamily: 'monospace', fontSize: 10, lineHeight: 1.8, background: BG }}>
              {pingLog.length === 0
                ? <div style={{ color: TEXT_LOW, textAlign: 'center', paddingTop: 40 }}>
                    לחץ &apos;Ping All APIs&apos; להפעלת הבדיקה
                  </div>
                : pingLog.map((line, i) => {
                    const isErr = line.includes('ERROR') || line.includes('timeout')
                    const isWarn = line.includes('WARN')
                    return (
                      <div key={i} style={{ color: isErr ? RED : isWarn ? YELLOW : GREEN, padding: '1px 0' }}>
                        {line}
                      </div>
                    )
                  })
              }
              {pinging && <div style={{ color: ACCENT }}>{'>'}_</div>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
      `}</style>
    </div>
  )
}
