'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'

/* ══════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════════════ */
const PURPLE  = '#9656FE'
const PURPLE2 = '#BE56FE'
const BLUE    = '#3B82EF'
const GREEN   = '#0A7159'
const RED     = '#CC1F1F'
const YELLOW  = '#FBBF24'
const ORANGE  = '#FB923C'

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 18,
}

const VIDEO_COST_TOKENS = 15

/* ══════════════════════════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════════════════════════ */

/* Subtitle style presets.
   `preview` drives UI only (the chip swatch and the player overlay) — the real
   burned-in subtitles are rendered from `id` server-side, so these values are
   safe to tune for legibility.
   The whites are #FAFAFC, not #fff, ON PURPOSE: both surfaces they sit on are
   dark (#000 player, rgba(0,0,0,0.6) chip), and the light-theme transform in
   globals.css matches `[style*="color:#fff"]` and would repaint them slate —
   invisible on black. Lightning CSS strips a `:not()` with a complex selector,
   so the surface can't be excluded in CSS. Keep these off pure white. */
const SUBTITLE_PRESETS = [
  {
    id: 'bold_word',
    label: 'מילה מודגשת',
    sub: 'סגנון ViralTikTok',
    preview: { bg: '#000', mainColor: '#FBBF24', accentColor: '#FAFAFC', weight: 900, shadow: true },
    icon: 'ti-typography',
    popular: true,
  },
  {
    id: 'clean',
    label: 'נקי ומינימליסטי',
    sub: 'YouTube מקצועי',
    preview: { bg: 'rgba(0,0,0,0.6)', mainColor: '#FAFAFC', accentColor: '#FAFAFC', weight: 600, shadow: false },
    icon: 'ti-letter-case',
    popular: false,
  },
  {
    id: 'gradient',
    label: 'גרדיאנט בוהק',
    sub: 'Reels / Shorts',
    preview: { bg: 'rgba(150,86,254,0.3)', mainColor: '#FAFAFC', accentColor: PURPLE2, weight: 800, shadow: true },
    icon: 'ti-color-filter',
    popular: false,
  },
] as const
type SubtitlePreset = typeof SUBTITLE_PRESETS[number]['id']

/* Background music options */
const MUSIC_STYLES = ['אנרגטי 🔥', 'השראה ✨', 'דרמטי 🎭', 'רגוע 🌊', 'קורפורייט 💼', 'ללא מוזיקה']

/* Smart cut positions on the video track (percent of width) */
const SMART_CUTS = [18, 36, 54, 72]

/* Subtitle bar positions for the subtitle track */
const SUBTITLE_BARS = [
  { left: 2,  width: 14, label: 'טיפ אחד...' },
  { left: 18, width: 16, label: 'כך הכפ...'  },
  { left: 37, width: 13, label: '3 שניות...' },
  { left: 54, width: 17, label: 'סוד שה...'  },
  { left: 74, width: 14, label: 'תוצאות...'  },
  { left: 91, width: 7,  label: 'CTA'         },
]

/* ══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════ */

/* Toggle switch */
function Toggle({ on, onChange, color = PURPLE }: { on: boolean; onChange: () => void; color?: string }) {
  return (
    <div onClick={onChange} style={{
      width: 46, height: 25, borderRadius: 999, cursor: 'pointer', flexShrink: 0, position: 'relative',
      background: on ? `linear-gradient(135deg, ${color}, ${color}aa)` : 'rgba(255,255,255,0.10)',
      border: `1px solid ${on ? color + '55' : 'rgba(255,255,255,0.14)'}`,
      transition: 'all 0.25s', boxShadow: on ? `0 0 12px ${color}44` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 3, width: 17, height: 17, borderRadius: '50%',
        background: '#fff', transition: 'all 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        ...(on ? { right: 3 } : { left: 3 }),
      }} />
    </div>
  )
}

/* Module wrapper card */
function Module({ icon, color, title, sub, on, onToggle, children, disabled }: {
  icon: string; color: string; title: string; sub?: string
  on: boolean; onToggle: () => void; children?: React.ReactNode; disabled?: boolean
}) {
  return (
    <div style={{
      ...GLASS, padding: '16px 18px',
      border: `1px solid ${on ? color + '30' : 'rgba(255,255,255,0.08)'}`,
      background: on ? `${color}08` : 'rgba(255,255,255,0.03)',
      transition: 'all 0.25s', opacity: disabled ? 0.5 : 1,
    }}>
      {/* module header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: on && children ? 14 : 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: on ? `${color}18` : 'rgba(255,255,255,0.05)',
          border: `1px solid ${on ? color + '30' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s' }}>
          <i className={`ti ${icon}`} style={{ fontSize: 17, color: on ? color : 'rgba(255,255,255,0.3)', transition: 'color 0.25s' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: on ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'color 0.25s' }}>{title}</div>
          {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, lineHeight: 1.5 }}>{sub}</div>}
        </div>
        <Toggle on={on} onChange={onToggle} color={color} />
      </div>
      {/* collapsible content */}
      {on && children && (
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.07)`, paddingTop: 14 }}>
          {children}
        </div>
      )}
    </div>
  )
}

/* SVG Audio Waveform */
function Waveform({ active }: { active: boolean }) {
  const W = 600, H = 28
  const bars = Array.from({ length: 80 }, (_, i) => {
    const seed = Math.sin(i * 2.7) * 0.5 + Math.sin(i * 0.9) * 0.3 + Math.sin(i * 5.1) * 0.2
    return Math.abs(seed) * H * 0.9 + 2
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={PURPLE}  stopOpacity={active ? 0.9 : 0.3} />
          <stop offset="50%"  stopColor={BLUE}    stopOpacity={active ? 0.9 : 0.3} />
          <stop offset="100%" stopColor={PURPLE2} stopOpacity={active ? 0.9 : 0.3} />
        </linearGradient>
      </defs>
      {bars.map((h, i) => (
        <rect key={i} x={i * (W / 80) + 1} y={(H - h) / 2} width={Math.max(W / 80 - 2, 1)} height={h}
          rx={1} fill="url(#waveGrad)" />
      ))}
    </svg>
  )
}

/* Mini timeline */
function MiniTimeline({ smartTrim, subtitles, audio }: { smartTrim: boolean; subtitles: boolean; audio: boolean }) {
  const trackStyle: React.CSSProperties = {
    flex: 1, height: 28, borderRadius: 6, overflow: 'hidden', position: 'relative',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.07em', textTransform: 'uppercase', width: 68, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 4,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Video track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={labelStyle}><i className="ti ti-video" style={{ fontSize: 10 }} />וידאו</div>
        <div style={trackStyle}>
          {/* main video strip gradient */}
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, rgba(59,130,239,0.25) 0%, rgba(150,86,254,0.2) 100%)' }} />
          {/* filmstrip dashes */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: 4, bottom: 4, width: 1,
              left: `${(i + 1) * 5}%`, background: 'rgba(255,255,255,0.07)',
            }} />
          ))}
          {/* smart cut markers */}
          {smartTrim && SMART_CUTS.map(pos => (
            <React.Fragment key={pos}>
              {/* cut zone (deleted silence) */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: '3%',
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }} />
              {/* cut line */}
              <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${pos + 1.5}%`, width: 2,
                background: RED, zIndex: 5, boxShadow: `0 0 6px ${RED}` }}>
                {/* scissors icon at top */}
                <div style={{ position: 'absolute', top: -1, left: -6, fontSize: 9, color: RED }}>✂</div>
              </div>
            </React.Fragment>
          ))}
          {/* playhead */}
          <div style={{ position: 'absolute', top: -2, bottom: -2, left: '32%', width: 2,
            background: '#fff', zIndex: 10, boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}>
            <div style={{ position: 'absolute', top: -1, left: -3, width: 8, height: 8,
              borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>
      </div>

      {/* Subtitles track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={labelStyle}><i className="ti ti-subtask" style={{ fontSize: 10 }} />כתוביות</div>
        <div style={trackStyle}>
          {subtitles ? (
            SUBTITLE_BARS.map((bar, i) => (
              <div key={i} style={{
                position: 'absolute', top: 4, height: 20, left: `${bar.left}%`, width: `${bar.width}%`,
                borderRadius: 4, background: `linear-gradient(90deg, ${PURPLE}55, ${PURPLE2}33)`,
                border: `1px solid ${PURPLE}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <span style={{ fontSize: 8, color: PURPLE2, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 3px' }}>
                  {bar.label}
                </span>
              </div>
            ))
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>— הפעל כתוביות —</div>
          )}
        </div>
      </div>

      {/* Audio track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={labelStyle}><i className="ti ti-music" style={{ fontSize: 10 }} />אודיו</div>
        <div style={{ ...trackStyle, padding: '0 4px' }}>
          <Waveform active={audio} />
        </div>
      </div>
    </div>
  )
}

/* Subtitle preview card */
function SubtitleCard({ preset, selected, onSelect, previewLabel }: {
  preset: typeof SUBTITLE_PRESETS[number]
  selected: boolean; onSelect: () => void
  previewLabel: string
}) {
  const p = preset.preview
  return (
    <button onClick={onSelect} style={{
      flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
      background: selected ? 'rgba(150,86,254,0.14)' : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${selected ? PURPLE + '55' : 'rgba(255,255,255,0.08)'}`,
      transition: 'all 0.18s', position: 'relative',
    }}>
      {preset.popular && (
        <span style={{ position: 'absolute', top: -7, right: '50%', transform: 'translateX(50%)',
          fontSize: 8, fontWeight: 900, padding: '1px 7px', borderRadius: 999,
          background: `linear-gradient(135deg, ${YELLOW}, ${ORANGE})`, color: '#000' }}>
          פופולרי
        </span>
      )}
      {/* mini subtitle preview */}
      <div style={{ padding: '8px 6px', borderRadius: 8, marginBottom: 8,
        background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 36 }}>
        <div style={{ fontSize: 9, lineHeight: 1.3, textAlign: 'center' }}>
          <span style={{ color: p.mainColor, fontWeight: p.weight,
            textShadow: p.shadow ? `0 0 8px ${p.mainColor}` : 'none' }}>
            {previewLabel}
          </span>
        </div>
      </div>
      <i className={`ti ${preset.icon}`} style={{ fontSize: 13, color: selected ? PURPLE2 : 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 3 }} />
      <div style={{ fontSize: 11, fontWeight: selected ? 800 : 600, color: selected ? '#fff' : 'rgba(255,255,255,0.5)' }}>{preset.label}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{preset.sub}</div>
    </button>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   UPLOAD DROP ZONE
══════════════════════════════════════════════════════════════════════ */
function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) onFile(f)
  }, [onFile])

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', borderRadius: 24, gap: 18, transition: 'all 0.25s',
        border: `2px dashed ${drag ? PURPLE2 : 'rgba(255,255,255,0.12)'}`,
        background: drag ? 'rgba(150,86,254,0.08)' : 'rgba(255,255,255,0.02)',
        boxShadow: drag ? `0 0 40px rgba(150,86,254,0.15)` : 'none',
      }}>
      <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onInput} />

      {/* icon blob */}
      <div style={{ position: 'relative' }}>
        <div style={{ width: 90, height: 90, borderRadius: 24,
          background: `linear-gradient(135deg, ${PURPLE}22, ${BLUE}15)`,
          border: `1px solid rgba(150,86,254,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(150,86,254,0.12)' }}>
          <i className="ti ti-video-plus" style={{ fontSize: 38, color: drag ? PURPLE2 : 'rgba(255,255,255,0.3)' }} />
        </div>
        {/* sparkle dots */}
        {[
          { top: -6, right: -6, color: PURPLE2 },
          { bottom: -4, left: -8, color: BLUE },
          { top: 28, right: -16, color: YELLOW },
        ].map(({ top, right, bottom, left, color }, i) => (
          <div key={i} style={{
            position: 'absolute',
            ...(top !== undefined ? { top } : {}),
            ...(bottom !== undefined ? { bottom } : {}),
            ...(right !== undefined ? { right } : {}),
            ...(left !== undefined ? { left } : {}),
            width: 8, height: 8, borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}`, animation: `pulse ${1.2 + i * 0.3}s infinite`,
          }} />
        ))}
      </div>

      <div style={{ textAlign: 'center', maxWidth: 300 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
          {drag ? 'שחרר כדי להעלות 🎬' : 'גררו סרטון לכאן'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
          או לחצו לבחירת קובץ מהמחשב
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
          MP4, MOV, AVI, MKV · עד 500MB
        </div>
      </div>

      {/* supported platforms */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { icon: 'ti-brand-instagram', color: '#E1306C', label: 'Reels' },
          { icon: 'ti-brand-tiktok',    color: '#010101', label: 'TikTok' },
          { icon: 'ti-brand-youtube',   color: '#FF0000', label: 'Shorts' },
          { icon: 'ti-brand-facebook',  color: '#1877F2', label: 'Reels'  },
        ].map(p => (
          <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8,
              background: `${p.color}18`, border: `1px solid ${p.color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`ti ${p.icon}`} style={{ fontSize: 15, color: p.color }} />
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   VIDEO PLAYER — real <video> element with blob URL
══════════════════════════════════════════════════════════════════════ */
function VideoPlayer({ file, subtitles, subtitlePreset, onPlayPause }: {
  file: File; subtitles: boolean; subtitlePreset: SubtitlePreset
  onPlayPause: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const preset = SUBTITLE_PRESETS.find(p => p.id === subtitlePreset)!

  /* create blob URL and clean up on unmount or file change */
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setBlobUrl(url)
    setProgress(0)
    setPlaying(false)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  function handlePlayPause() {
    const vid = videoRef.current
    if (!vid) return
    if (vid.paused) {
      void vid.play()
      setPlaying(true)
    } else {
      vid.pause()
      setPlaying(false)
    }
    onPlayPause()
  }

  function handleTimeUpdate() {
    const vid = videoRef.current
    if (!vid || !vid.duration) return
    setProgress((vid.currentTime / vid.duration) * 100)
  }

  function handleLoadedMetadata() {
    if (videoRef.current) setDuration(videoRef.current.duration)
  }

  function handleEnded() {
    setPlaying(false)
    setProgress(0)
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const vid = videoRef.current
    if (!vid || !vid.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    vid.currentTime = ratio * vid.duration
  }

  const currentSec = duration > 0 ? Math.floor((progress / 100) * duration) : 0
  const durMin = Math.floor(duration / 60)
  const durSec = Math.floor(duration % 60)
  const curMin = Math.floor(currentSec / 60)
  const curSec = currentSec % 60
  const timeStr = `${curMin}:${String(curSec).padStart(2, '0')} / ${durMin}:${String(durSec).padStart(2, '0')}`

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 60px rgba(0,0,0,0.5)',
      background: '#000', cursor: 'pointer' }}
      onClick={handlePlayPause}>

      {blobUrl && (
        <video
          ref={videoRef}
          src={blobUrl}
          style={{ width: '100%', display: 'block', borderRadius: 16 }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          playsInline
        />
      )}

      {/* subtitle overlay */}
      {subtitles && playing && (
        <div style={{
          position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, textAlign: 'center',
          padding: '6px 14px', borderRadius: 8,
          background: preset.preview.bg, backdropFilter: 'blur(4px)',
          maxWidth: '80%',
        }}>
          <span style={{ fontSize: 16, fontWeight: preset.preview.weight,
            color: preset.preview.mainColor,
            textShadow: preset.preview.shadow ? `0 0 12px ${preset.preview.mainColor}` : 'none' }}>
            כתוביות AI
          </span>
        </div>
      )}

      {/* top bar: file name + status */}
      <div style={{ position: 'absolute', top: 10, right: 10, left: 10, display: 'flex', justifyContent: 'space-between', zIndex: 20 }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.5)',
          padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(8px)',
          maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.5)',
          padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: playing ? RED : 'rgba(255,255,255,0.3)',
            boxShadow: playing ? `0 0 5px ${RED}` : 'none', animation: playing ? 'pulse 1s infinite' : 'none' }} />
          {playing ? 'LIVE' : 'PAUSED'}
        </div>
      </div>

      {/* play overlay when paused */}
      {!playing && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          pointerEvents: 'none',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-player-play-filled" style={{ fontSize: 22, color: '#fff', marginRight: -2 }} />
          </div>
        </div>
      )}

      {/* bottom controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '24px 12px 10px' }}>
        {/* progress bar */}
        <div
          style={{ height: 3, background: 'rgba(255,255,255,0.15)', borderRadius: 99, marginBottom: 8, cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); seekTo(e) }}
        >
          <div style={{ height: '100%', width: `${progress}%`, borderRadius: 99,
            background: `linear-gradient(90deg, ${PURPLE}, ${PURPLE2})`,
            boxShadow: `0 0 6px ${PURPLE}` }} />
        </div>
        {/* control row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={e => { e.stopPropagation(); handlePlayPause() }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: '#fff', display: 'flex', alignItems: 'center' }}>
            <i className={`ti ${playing ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`}
              style={{ fontSize: 16 }} />
          </button>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
            {timeStr}
          </span>
          <div style={{ marginRight: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={e => e.stopPropagation()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <i className="ti ti-volume" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); videoRef.current?.requestFullscreen?.() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <i className="ti ti-maximize" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   PROCESSING OVERLAY
══════════════════════════════════════════════════════════════════════ */
function ProcessingOverlay({ progress, step }: { progress: number; step: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6,8,20,0.88)', backdropFilter: 'blur(20px)' }}>
      <div style={{ textAlign: 'center', maxWidth: 380, width: '100%', padding: '0 24px' }}>
        {/* animated ring */}
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 28px' }}>
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#pg)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
            <defs>
              <linearGradient id="pg" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} />
                <stop offset="100%" stopColor={PURPLE2} />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{progress}%</span>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>מעבד את הסרטון שלך</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>{step}</div>
        {['ניתוח שתיקות וחיתוך חכם', 'יצירת כתוביות אוטומטיות', 'עיבוד אודיו ומוזיקה', 'רנדור הסרטון הסופי'].map((s, i) => {
          const done = i * 25 < progress
          const active = i * 25 <= progress && progress < (i + 1) * 25
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: done ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})` : active ? 'rgba(150,86,254,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${done ? 'transparent' : active ? PURPLE + '55' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done ? <i className="ti ti-check" style={{ fontSize: 10, color: '#fff' }} />
                       : active ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: PURPLE2,
                                    animation: 'pulse 1s infinite' }} /> : null}
              </div>
              <span style={{ fontSize: 12, color: done ? '#fff' : active ? PURPLE2 : 'rgba(255,255,255,0.25)',
                fontWeight: done || active ? 700 : 400 }}>
                {s}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════ */
interface VideoEditorProps { tokenBalance: number }

export default function VideoEditor({ tokenBalance }: VideoEditorProps) {
  const [videoFile, setVideoFile]         = useState<File | null>(null)
  const [tokens, setTokens]               = useState(tokenBalance)

  /* AI module toggles */
  const [subtitles, setSubtitles]         = useState(false)
  const [subtitlePreset, setSubtitlePreset] = useState<SubtitlePreset>('bold_word')
  const [aiAudio, setAiAudio]             = useState(false)
  const [musicStyle, setMusicStyle]       = useState(MUSIC_STYLES[0])
  const [voiceover, setVoiceover]         = useState(false)
  const [smartTrim, setSmartTrim]         = useState(false)

  /* processing */
  const [processing, setProcessing]       = useState(false)
  const [procProgress, setProcProgress]   = useState(0)
  const [procStep, setProcStep]           = useState('')
  const [done, setDone]                   = useState(false)
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null)

  /* real upload / render state */
  const [uploadProgress, setUploadProgress]   = useState(0)
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null)
  const [cloudinaryUrl, setCloudinaryUrl]     = useState<string | null>(null)
  const [transcribeJobId, setTranscribeJobId] = useState<string | null>(null)
  const [outputUrl, setOutputUrl]             = useState<string | null>(null)

  /* playing state — tracked by VideoPlayer internally, lifted here for timeline */
  const [playing, setPlaying] = useState(false)

  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000) }

  function handleFile(f: File) {
    setVideoFile(f); setPlaying(false); setDone(false)
    setCloudinaryPublicId(null); setCloudinaryUrl(null); setOutputUrl(null)
    showToast(`${f.name} נבחר — לחצו עבד וידאו להעלאה`, true)
  }

  async function handleRender() {
    if (!videoFile) return
    if (tokens < VIDEO_COST_TOKENS) { showToast('אין מספיק טוקנים לעיבוד', false); return }
    setProcessing(true); setProcProgress(0); setOutputUrl(null)

    try {
      // ── Stage 1: upload to Cloudinary ──
      setProcStep('מעלה סרטון לענן...'); setProcProgress(5)

      const signRes = await fetch('/api/video/sign-upload', { method: 'POST' })
      if (!signRes.ok) throw new Error('שגיאה בהשגת הרשאת העלאה')
      const { signature, timestamp, api_key, cloud_name, folder } = await signRes.json() as {
        signature: string; timestamp: number; api_key: string; cloud_name: string; folder: string
      }

      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('signature', signature)
      formData.append('timestamp', String(timestamp))
      formData.append('api_key', api_key)
      formData.append('folder', folder)
      formData.append('resource_type', 'video')

      let uploadedUrl = ''   // נלכד מקומית — ה-state cloudinaryUrl עדיין null בסגירה הזו
      const uploadedPublicId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 30) + 5
            setUploadProgress(pct); setProcProgress(pct)
          }
        }
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText) as { public_id: string; secure_url: string }
            setCloudinaryPublicId(data.public_id)
            setCloudinaryUrl(data.secure_url)
            uploadedUrl = data.secure_url
            resolve(data.public_id)
          } else {
            reject(new Error('שגיאה בהעלאת הסרטון לענן'))
          }
        }
        xhr.onerror = () => reject(new Error('שגיאת רשת בהעלאה'))
        xhr.send(formData)
      })

      setProcProgress(40); setProcStep('העלאה הושלמה — מעבד כתוביות...')

      // ── Stage 2: transcribe (if subtitles enabled) ──
      let _srtText: string | undefined
      if (subtitles && uploadedUrl) {
        setProcStep('שולח לתמלול AI...'); setProcProgress(45)

        const transcribeRes = await fetch('/api/video/transcribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ cloudinary_url: uploadedUrl, language: 'he' }),
        })
        if (!transcribeRes.ok) throw new Error('שגיאה בתמלול')
        const { job_id } = await transcribeRes.json() as { job_id: string }
        setTranscribeJobId(job_id)

        setProcStep('ממתין לתמלול Hebrew...')
        let attempts = 0
        while (attempts < 40) {
          await new Promise(r => setTimeout(r, 3000))
          const pollRes = await fetch(`/api/video/transcribe?job_id=${job_id}`)
          const pollData = await pollRes.json() as { status: string; srt?: string; text?: string }
          if (pollData.status === 'completed') {
            _srtText = pollData.srt
            setProcProgress(70); setProcStep('כתוביות מוכנות!')
            break
          }
          if (pollData.status === 'error') throw new Error('שגיאה בתמלול הסרטון')
          attempts++
          setProcProgress(45 + Math.min(attempts, 20))
        }
      } else {
        setProcProgress(70)
      }

      // ── Stage 3: render ──
      setProcStep('מרנדר סרטון סופי עם Cloudinary...')
      setProcProgress(75)

      const renderRes = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          public_id: uploadedPublicId,
          options: {
            smartTrim,
            musicTrack: aiAudio ? musicStyle : undefined,
            subtitleStyle: subtitlePreset,
          },
        }),
      })
      if (!renderRes.ok) throw new Error('שגיאה בעיבוד הסרטון')
      const { output_url } = await renderRes.json() as { output_url: string }

      setProcProgress(100); setProcStep('הסרטון מוכן! 🎉')
      await new Promise(r => setTimeout(r, 600))

      setOutputUrl(output_url)
      setProcessing(false); setDone(true)
      setTokens(t => t - VIDEO_COST_TOKENS)
      showToast('הסרטון עובד ונשמר בהצלחה ✓', true)

    } catch (err) {
      setProcessing(false)
      showToast((err instanceof Error ? err.message : 'שגיאה לא ידועה'), false)
    }
  }

  /* suppress unused variable warnings for real upload state */
  void uploadProgress; void cloudinaryPublicId; void transcribeJobId

  const canRender = !!videoFile && tokens >= VIDEO_COST_TOKENS

  /* ── active modules count ── */
  const activeCount = [subtitles, aiAudio, smartTrim].filter(Boolean).length

  /* ── no video yet ── */
  if (!videoFile) return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', direction: 'rtl', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>עורך וידאו AI</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>העלה סרטון לעריכה חכמה אוטומטית</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <i className="ti ti-coins" style={{ fontSize: 13, color: PURPLE }} />
          <span style={{ color: PURPLE2, fontWeight: 700 }}>{tokens}</span> טוקנים
        </div>
      </div>
      <DropZone onFile={handleFile} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )

  /* ── editor workspace ── */
  return (
    <div style={{ display: 'flex', gap: 20, height: '100%', direction: 'rtl', position: 'relative' }}>
      {processing && <ProcessingOverlay progress={procProgress} step={procStep} />}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
          padding: '10px 20px', borderRadius: 12, backdropFilter: 'blur(16px)',
          background: toast.ok ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)',
          border: `1px solid ${toast.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 12, fontWeight: 700 }}>
          <i className={`ti ${toast.ok ? 'ti-circle-check' : 'ti-alert-circle'}`}
            style={{ color: toast.ok ? GREEN : RED }} />{toast.msg}
        </div>
      )}

      {/* ════════════════════════════════════════════
          LEFT: VIDEO PLAYER + TIMELINE
      ════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>תצוגה מקדימה</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{videoFile.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* active modules badge */}
            {activeCount > 0 && (
              <div style={{ padding: '4px 11px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                background: 'rgba(150,86,254,0.12)', border: '1px solid rgba(150,86,254,0.25)', color: PURPLE2,
                display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="ti ti-sparkles" style={{ fontSize: 11 }} />{activeCount} כלים פעילים
              </div>
            )}
            <button onClick={() => { setVideoFile(null); setPlaying(false); setDone(false) }}
              style={{ padding: '5px 11px', borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-refresh" style={{ fontSize: 12 }} /> החלף סרטון
            </button>
          </div>
        </div>

        {/* real video player */}
        <VideoPlayer
          file={videoFile}
          subtitles={subtitles}
          subtitlePreset={subtitlePreset}
          onPlayPause={() => setPlaying(p => !p)}
        />

        {/* mini timeline */}
        <div style={{ ...GLASS, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <i className="ti ti-adjustments-horizontal" style={{ fontSize: 14, color: PURPLE2 }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>טיימליין</span>
            {smartTrim && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', color: RED,
                display: 'flex', alignItems: 'center', gap: 3 }}>
                <span>✂</span> {SMART_CUTS.length} חיתוכים חכמים
              </span>
            )}
          </div>
          <MiniTimeline smartTrim={smartTrim} subtitles={subtitles} audio={aiAudio} />

          {/* legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {[
              { color: 'rgba(59,130,239,0.5)', label: 'קטע וידאו' },
              ...(smartTrim ? [{ color: RED, label: 'חיתוך חכם' }] : []),
              ...(subtitles ? [{ color: PURPLE2, label: 'כתוביות' }] : []),
              ...(aiAudio ? [{ color: BLUE, label: 'אודיו' }] : []),
              { color: '#fff', label: 'ראש נגן' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          RIGHT: AI CONTROLS PANEL
      ════════════════════════════════════════════ */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>

        <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.08em', textTransform: 'uppercase', paddingRight: 2, marginBottom: 2 }}>
          כלי AI
        </div>

        {/* ── Module 1: Auto Subtitles ── */}
        <Module
          icon="ti-subtask" color={PURPLE2}
          title="כתוביות אוטומטיות"
          sub="Auto-Subtitles · זיהוי דיבור ל-30+ שפות"
          on={subtitles} onToggle={() => setSubtitles(p => !p)}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            סגנון כתוביות
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {SUBTITLE_PRESETS.map(preset => (
              <SubtitleCard key={preset.id} preset={preset}
                selected={subtitlePreset === preset.id}
                onSelect={() => setSubtitlePreset(preset.id)}
                previewLabel={preset.label}
              />
            ))}
          </div>
        </Module>

        {/* ── Module 2: AI Audio ── */}
        <Module
          icon="ti-music" color={BLUE}
          title="עריכת אודיו וקריינות"
          sub="AI Audio · מוזיקה, מיקס ווויסאובר"
          on={aiAudio} onToggle={() => setAiAudio(p => !p)}
        >
          {/* music style dropdown */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              סגנון מוזיקת רקע
            </div>
            <select value={musicStyle} onChange={e => setMusicStyle(e.target.value)} style={{
              width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,239,0.25)',
              color: '#fff', direction: 'rtl', outline: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'left 10px center', paddingLeft: 28,
            }}>
              {MUSIC_STYLES.map(s => <option key={s} value={s} style={{ background: '#20112F' }}>{s}</option>)}
            </select>
          </div>
          {/* voiceover toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 10,
            background: voiceover ? 'rgba(59,130,239,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${voiceover ? 'rgba(59,130,239,0.22)' : 'rgba(255,255,255,0.06)'}` }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: voiceover ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                קריינות AI
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>AI Voiceover — עברית</div>
            </div>
            <Toggle on={voiceover} onChange={() => setVoiceover(p => !p)} color={BLUE} />
          </div>
          {voiceover && (
            <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 10,
              background: 'rgba(59,130,239,0.06)', border: '1px solid rgba(59,130,239,0.15)',
              fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              <i className="ti ti-microphone" style={{ color: BLUE, marginLeft: 5 }} />
              טקסט הוידאו ינוקה ויוקרא ע&quot;י קריין AI בעברית
            </div>
          )}
        </Module>

        {/* ── Module 3: Smart Trim ── */}
        <Module
          icon="ti-scissors" color={ORANGE}
          title="חיתוך שתיקות אוטומטי"
          sub="Smart Trim · מוחק קטעים מתים ליצירת קצב ויראלי"
          on={smartTrim} onToggle={() => setSmartTrim(p => !p)}
        >
          {/* stats */}
          <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'שתיקות זוהו', val: '4', icon: 'ti-circle-x', color: RED    },
              { label: 'זמן נחסך',    val: '8ש\'',icon: 'ti-clock',   color: GREEN  },
            ].map(s => (
              <div key={s.label} style={{ padding: '9px 10px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2,
                  display: 'flex', alignItems: 'center', gap: 3 }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 9 }} />{s.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, display: 'flex', gap: 6 }}>
            <i className="ti ti-info-circle" style={{ fontSize: 13, color: ORANGE, flexShrink: 0, marginTop: 1 }} />
            מוחק שתיקות וקטעים מתים מהסרטון ליצירת קצב מהיר וויראלי
          </div>
        </Module>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />

        {/* ── Token cost + render ── */}
        <div style={{ ...GLASS, padding: '16px 18px' }}>
          {/* done state */}
          {done ? (
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
                background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ti ti-circle-check" style={{ fontSize: 22, color: GREEN }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', marginBottom: 4 }}>הסרטון מוכן!</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
                מחכה להורדה / פרסום
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => outputUrl && window.open(outputUrl, '_blank')}
                  style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                    background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`, border: 'none', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 4px 16px rgba(150,86,254,0.35)' }}>
                  <i className="ti ti-download" style={{ fontSize: 14 }} /> {outputUrl ? 'הורד סרטון' : 'הורד'}
                </button>
                <button style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                  background: 'rgba(59,130,239,0.12)', border: '1px solid rgba(59,130,239,0.25)', color: BLUE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className="ti ti-send" style={{ fontSize: 14 }} /> פרסם
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* token cost notice */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 12, marginBottom: 12,
                background: 'rgba(150,86,254,0.08)', border: '1px solid rgba(150,86,254,0.18)' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>עלות גנרוט וידאו AI</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: PURPLE2 }}>{VIDEO_COST_TOKENS}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>טוקנים</span>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>יתרתך</div>
                  <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace',
                    color: tokens < VIDEO_COST_TOKENS ? RED : tokens < 50 ? YELLOW : GREEN }}>
                    {tokens}
                  </div>
                </div>
              </div>

              {/* progress bar: tokens remaining */}
              <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(tokens / 100 * 100, 100)}%`, borderRadius: 99,
                  background: tokens < 20 ? RED : tokens < 50 ? YELLOW : `linear-gradient(90deg, ${PURPLE}, ${PURPLE2})`,
                  transition: 'width 0.3s' }} />
              </div>

              {/* selected tools summary */}
              {activeCount > 0 && (
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                  {subtitles && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999,
                    background: 'rgba(190,86,254,0.10)', border: '1px solid rgba(190,86,254,0.22)', color: PURPLE2 }}>
                    כתוביות · {SUBTITLE_PRESETS.find(p => p.id === subtitlePreset)?.label}
                  </span>}
                  {aiAudio && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999,
                    background: 'rgba(59,130,239,0.10)', border: '1px solid rgba(59,130,239,0.22)', color: BLUE }}>
                    🎵 {musicStyle}
                  </span>}
                  {smartTrim && <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999,
                    background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.22)', color: ORANGE }}>
                    ✂ חיתוך חכם
                  </span>}
                </div>
              )}

              {/* render button */}
              <button onClick={handleRender} disabled={!canRender} style={{
                width: '100%', padding: '13px', borderRadius: 14, cursor: canRender ? 'pointer' : 'not-allowed',
                background: canRender
                  ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE2})`
                  : 'rgba(255,255,255,0.06)',
                border: 'none', color: canRender ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: canRender ? '0 4px 20px rgba(150,86,254,0.4)' : 'none',
                transition: 'all 0.2s', letterSpacing: '-0.2px',
              }}>
                <i className="ti ti-device-gamepad-2" style={{ fontSize: 17 }} />
                עבד ושמור וידאו
              </button>
              {!canRender && tokens < VIDEO_COST_TOKENS && (
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: RED }}>
                  חסרים {VIDEO_COST_TOKENS - tokens} טוקנים — <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>רכוש עוד</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar       { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 99px; }
      `}</style>
    </div>
  )
}
