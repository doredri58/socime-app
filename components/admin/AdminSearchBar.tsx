'use client'

const ACCENT   = '#1A73E8'
const TEXT     = '#0F172A'
const TEXT_LOW = '#94A3B8'

export default function AdminSearchBar() {
  return (
    <div style={{ flex: 1, maxWidth: 440, position: 'relative' }}>
      <i className="ti ti-search" style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 14, color: TEXT_LOW, pointerEvents: 'none',
      }} />
      <input
        type="text"
        placeholder="חפש משתמש, אימייל או ח.פ..."
        style={{
          width: '100%', padding: '8px 36px 8px 12px', borderRadius: 10, fontSize: 12,
          background: '#F1F3F4', border: '1px solid transparent',
          color: TEXT, outline: 'none', direction: 'rtl', boxSizing: 'border-box',
          fontFamily: 'Space Grotesk, sans-serif',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = '#fff' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#F1F3F4' }}
      />
    </div>
  )
}
