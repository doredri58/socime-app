'use client'
import React, { useState, useMemo, useRef, useEffect } from 'react'

const ACCENT = '#3B82EF', GREEN = '#10B981', RED = '#EF4444', YELLOW = '#F59E0B'
const BG = 'rgba(255,255,255,0.03)', BD = 'rgba(255,255,255,0.07)'

type Level = 'info' | 'warn' | 'error'
interface LogEntry { id: string; ts: string; level: string; source: string; message: string; userId: string }

const LEVEL_COLOR: Record<Level, string>    = { info: ACCENT, warn: YELLOW, error: RED }
const LEVEL_BG:    Record<Level, string>    = { info: 'rgba(59,130,239,0.10)', warn: 'rgba(245,158,11,0.10)', error: 'rgba(239,68,68,0.10)' }
const LEVEL_ICON:  Record<Level, string>    = { info: 'ti-info-circle', warn: 'ti-alert-triangle', error: 'ti-alert-octagon' }

function LevelBadge({ level }: { level: string }) {
  const l = (level as Level) in LEVEL_COLOR ? level as Level : 'info'
  return (
    <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.06em',
      color: LEVEL_COLOR[l], background: LEVEL_BG[l], border: `1px solid ${LEVEL_COLOR[l]}28`,
      textTransform: 'uppercase' as const, whiteSpace: 'nowrap', fontFamily: 'monospace',
      display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <i className={`ti ${LEVEL_ICON[l]}`} style={{ fontSize: 9 }} />
      {l}
    </span>
  )
}

export default function AdminLogsClient({ logs }: { logs: LogEntry[] }) {
  const [levelFilter, setLevelFilter] = useState<'all' | Level>('all')
  const [search, setSearch]           = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [autoScroll, setAutoScroll]   = useState(true)
  const [expandId, setExpandId]       = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [logs, autoScroll])

  const sources = useMemo(() => ['all', ...new Set(logs.map(l => l.source.split('/')[0]))], [logs])

  const filtered = useMemo(() => logs.filter(l => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false
    if (sourceFilter !== 'all' && !l.source.startsWith(sourceFilter)) return false
    if (!search) return true
    return (l.message + l.source + l.userId).toLowerCase().includes(search.toLowerCase())
  }), [logs, levelFilter, sourceFilter, search])

  const counts = useMemo(() => ({
    info:  logs.filter(l => l.level === 'info').length,
    warn:  logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
  }), [logs])

  function exportLogs() {
    const lines = filtered.map(l => `[${l.ts}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines], { type: 'text/plain' }))
    a.download = `socime-logs-${new Date().toISOString().slice(0,10)}.txt`; a.click()
  }

  return (
    <div style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', gap: 14 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: '#fff', margin: '0 0 3px' }}>לוגים ושגיאות</h1>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{logs.length} אירועים · System Logs</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportLogs} style={{ padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: 'rgba(59,130,239,0.08)', border: '1px solid rgba(59,130,239,0.2)', color: ACCENT,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-download" /> ייצוא לוגים
          </button>
          <button onClick={() => setAutoScroll(p => !p)} style={{ padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: autoScroll ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${autoScroll ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.08)'}`,
            color: autoScroll ? GREEN : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`ti ${autoScroll ? 'ti-player-pause' : 'ti-player-play'}`} />
            {autoScroll ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {([['info', counts.info, ACCENT], ['warn', counts.warn, YELLOW], ['error', counts.error, RED]] as const).map(([l, c, col]) => (
          <div key={l} style={{ padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
            background: levelFilter === l ? `${col}14` : BG,
            border: `1px solid ${levelFilter === l ? `${col}35` : BD}`,
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
            onClick={() => setLevelFilter(prev => prev === l ? 'all' : l)}>
            <i className={`ti ${LEVEL_ICON[l]}`} style={{ fontSize: 16, color: col }} />
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{c}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* filter bar */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש בלוגים..."
            style={{ padding: '7px 32px 7px 12px', borderRadius: 9, fontSize: 12, outline: 'none', direction: 'rtl', width: 220,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{
          padding: '7px 12px', borderRadius: 9, fontSize: 11, cursor: 'pointer', background: '#0A1020',
          border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', direction: 'rtl',
        }}>
          {sources.map(s => <option key={s} value={s} style={{ background: '#0A1020' }}>{s === 'all' ? 'כל המקורות' : s}</option>)}
        </select>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{filtered.length} רשומות</span>
      </div>

      {/* log viewer */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#020508', border: `1px solid ${BD}`, borderRadius: 14, display: 'flex', flexDirection: 'column' }}>
        {/* column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 60px 160px 1fr', gap: 0,
          padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)' }}>
          {['TIMESTAMP', 'LEVEL', 'SOURCE', 'MESSAGE'].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.08em', fontFamily: 'monospace' }}>{h}</div>
          ))}
        </div>

        {/* scrollable log list */}
        <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
              אין לוגים תואמים לסינון הנוכחי
            </div>
          )}
          {filtered.map((log, i) => {
            const l    = log.level as Level
            const col  = LEVEL_COLOR[l] ?? ACCENT
            const isEx = expandId === log.id
            const isErr = l === 'error'
            return (
              <div key={log.id}>
                <div
                  onClick={() => setExpandId(p => p === log.id ? null : log.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '140px 60px 160px 1fr', gap: 0,
                    padding: '5px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: isErr ? 'rgba(239,68,68,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    cursor: 'pointer', transition: 'background 0.1s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,239,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isErr ? 'rgba(239,68,68,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                >
                  {/* timestamp */}
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                    {new Date(log.ts).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                  </div>
                  {/* level */}
                  <div><LevelBadge level={log.level} /></div>
                  {/* source */}
                  <div style={{ fontSize: 10, color: col, opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.source}
                  </div>
                  {/* message */}
                  <div style={{ fontSize: 11, color: isErr ? 'rgba(239,68,68,0.85)' : 'rgba(255,255,255,0.65)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.message}
                  </div>
                </div>
                {/* expanded details */}
                {isEx && (
                  <div style={{ padding: '8px 14px 10px', background: 'rgba(59,130,239,0.04)',
                    borderBottom: '1px solid rgba(59,130,239,0.10)' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        <span style={{ color: ACCENT }}>USER ID:</span> {log.userId || '—'}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        <span style={{ color: ACCENT }}>SOURCE:</span> {log.source}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                        <span style={{ color: ACCENT }}>FULL TS:</span> {log.ts}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(0,0,0,0.3)', fontSize: 11, color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1.7, wordBreak: 'break-word' }}>
                      {log.message}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* status bar */}
        <div style={{ padding: '6px 14px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: autoScroll ? GREEN : YELLOW,
            boxShadow: autoScroll ? `0 0 5px ${GREEN}` : 'none' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            {autoScroll ? 'LIVE' : 'PAUSED'} · {filtered.length} entries shown · {logs.length} total
          </span>
        </div>
      </div>
    </div>
  )
}
