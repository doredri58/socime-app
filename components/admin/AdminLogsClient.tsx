'use client'
import React, { useState, useMemo, useRef, useEffect } from 'react'

const ACCENT = '#1A73E8', GREEN = '#0F9E60', RED = '#D93025', YELLOW = '#F9AB00'
const BG = '#FFFFFF', BD = '#E2E8F0', BG_PAGE = '#F8FAFD'
const TEXT = '#0F172A', TEXT_MID = '#475569', TEXT_LOW = '#94A3B8'

type Level = 'info' | 'warn' | 'error'
interface LogEntry { id: string; ts: string; level: string; source: string; message: string; userId: string }

const LEVEL_COLOR: Record<Level, string> = { info: ACCENT, warn: YELLOW, error: RED }
const LEVEL_BG:    Record<Level, string> = { info: 'rgba(26,115,232,0.08)', warn: 'rgba(249,171,0,0.10)', error: 'rgba(217,48,37,0.08)' }
const LEVEL_BD:    Record<Level, string> = { info: 'rgba(26,115,232,0.22)', warn: 'rgba(249,171,0,0.25)', error: 'rgba(217,48,37,0.22)' }
const LEVEL_ICON:  Record<Level, string> = { info: 'ti-info-circle', warn: 'ti-alert-triangle', error: 'ti-alert-octagon' }
/* left border color for log entries */
const LEVEL_LEFT:  Record<Level, string> = { info: ACCENT, warn: YELLOW, error: RED }

function LevelBadge({ level }: { level: string }) {
  const l = (level as Level) in LEVEL_COLOR ? level as Level : 'info'
  return (
    <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.06em',
      color: LEVEL_COLOR[l], background: LEVEL_BG[l], border: `1px solid ${LEVEL_BD[l]}`,
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
          <h1 style={{ fontSize: 19, fontWeight: 900, color: TEXT, margin: '0 0 3px' }}>לוגים ושגיאות</h1>
          <div style={{ fontSize: 11, color: TEXT_LOW }}>{logs.length} אירועים · System Logs</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportLogs} style={{ padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.2)', color: ACCENT,
            display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-download" /> ייצוא לוגים
          </button>
          <button onClick={() => setAutoScroll(p => !p)} style={{ padding: '7px 14px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 700,
            background: autoScroll ? 'rgba(15,158,96,0.06)' : BG_PAGE,
            border: `1px solid ${autoScroll ? 'rgba(15,158,96,0.22)' : BD}`,
            color: autoScroll ? GREEN : TEXT_MID, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`ti ${autoScroll ? 'ti-player-pause' : 'ti-player-play'}`} />
            {autoScroll ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {([['info', counts.info, ACCENT], ['warn', counts.warn, YELLOW], ['error', counts.error, RED]] as const).map(([l, c, col]) => (
          <div key={l} style={{ padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
            background: levelFilter === l ? LEVEL_BG[l] : BG,
            border: `1px solid ${levelFilter === l ? LEVEL_BD[l] : BD}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
            onClick={() => setLevelFilter(prev => prev === l ? 'all' : l)}>
            <i className={`ti ${LEVEL_ICON[l]}`} style={{ fontSize: 16, color: col }} />
            <span style={{ fontSize: 18, fontWeight: 900, color: TEXT, fontFamily: 'monospace' }}>{c}</span>
            <span style={{ fontSize: 10, color: TEXT_LOW, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</span>
          </div>
        ))}
      </div>

      {/* filter bar */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <i className="ti ti-search" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: TEXT_LOW, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חפש בלוגים..."
            style={{ padding: '7px 32px 7px 12px', borderRadius: 9, fontSize: 12, outline: 'none', direction: 'rtl', width: 220,
              background: BG_PAGE, border: `1px solid ${BD}`, color: TEXT }} />
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} style={{
          padding: '7px 12px', borderRadius: 9, fontSize: 11, cursor: 'pointer', background: BG_PAGE,
          border: `1px solid ${BD}`, color: TEXT_MID, direction: 'rtl',
        }}>
          {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'כל המקורות' : s}</option>)}
        </select>
        <span style={{ fontSize: 11, color: TEXT_LOW }}>{filtered.length} רשומות</span>
      </div>

      {/* log viewer */}
      <div style={{ flex: 1, overflow: 'hidden', background: BG, border: `1px solid ${BD}`, borderRadius: 14,
        display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '140px 60px 160px 1fr', gap: 0,
          padding: '7px 14px', borderBottom: `1px solid ${BD}`, background: BG_PAGE }}>
          {['TIMESTAMP', 'LEVEL', 'SOURCE', 'MESSAGE'].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 800, color: TEXT_LOW,
              letterSpacing: '0.08em', fontFamily: 'monospace' }}>{h}</div>
          ))}
        </div>

        {/* scrollable log list */}
        <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: TEXT_LOW, fontSize: 12 }}>
              אין לוגים תואמים לסינון הנוכחי
            </div>
          )}
          {filtered.map((log, i) => {
            const l    = log.level as Level
            const col  = LEVEL_COLOR[l] ?? ACCENT
            const isEx = expandId === log.id
            const isErr = l === 'error'
            const leftCol = LEVEL_LEFT[l] ?? ACCENT
            return (
              <div key={log.id}>
                <div
                  onClick={() => setExpandId(p => p === log.id ? null : log.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '140px 60px 160px 1fr', gap: 0,
                    padding: '5px 14px',
                    borderBottom: `1px solid ${BD}`,
                    borderRight: `3px solid ${leftCol}`,
                    background: isErr ? 'rgba(217,48,37,0.03)' : i % 2 === 0 ? '#FFFFFF' : BG_PAGE,
                    cursor: 'pointer', transition: 'background 0.1s',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(26,115,232,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isErr ? 'rgba(217,48,37,0.03)' : i % 2 === 0 ? '#FFFFFF' : BG_PAGE)}
                >
                  {/* timestamp */}
                  <div style={{ fontSize: 10, color: TEXT_LOW, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                    {new Date(log.ts).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                  </div>
                  {/* level */}
                  <div><LevelBadge level={log.level} /></div>
                  {/* source */}
                  <div style={{ fontSize: 10, color: col, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.source}
                  </div>
                  {/* message */}
                  <div style={{ fontSize: 11, color: isErr ? RED : TEXT_MID,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.message}
                  </div>
                </div>
                {/* expanded details */}
                {isEx && (
                  <div style={{ padding: '8px 14px 10px', background: 'rgba(26,115,232,0.03)',
                    borderBottom: `1px solid rgba(26,115,232,0.12)` }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 10, color: TEXT_MID }}>
                        <span style={{ color: ACCENT }}>USER ID:</span> {log.userId || '—'}
                      </div>
                      <div style={{ fontSize: 10, color: TEXT_MID }}>
                        <span style={{ color: ACCENT }}>SOURCE:</span> {log.source}
                      </div>
                      <div style={{ fontSize: 10, color: TEXT_MID }}>
                        <span style={{ color: ACCENT }}>FULL TS:</span> {log.ts}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8,
                      background: BG_PAGE, border: `1px solid ${BD}`, fontSize: 11, color: TEXT,
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
        <div style={{ padding: '6px 14px', borderTop: `1px solid ${BD}`, background: BG_PAGE,
          display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: autoScroll ? GREEN : YELLOW,
            boxShadow: autoScroll ? `0 0 5px ${GREEN}` : 'none' }} />
          <span style={{ fontSize: 10, color: TEXT_LOW, fontFamily: 'monospace' }}>
            {autoScroll ? 'LIVE' : 'PAUSED'} · {filtered.length} entries shown · {logs.length} total
          </span>
        </div>
      </div>
    </div>
  )
}
