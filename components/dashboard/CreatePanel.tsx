'use client'
import { useState } from 'react'
import ImageGenerator from '@/components/ImageGenerator'

interface Props {
  userId: string
  businessDescription: string
}

type Tab = 'post' | 'image'

export default function CreatePanel({ userId, businessDescription }: Props) {
  const [tab, setTab]         = useState<Tab>('post')
  const [desc, setDesc]       = useState(businessDescription)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [post, setPost]       = useState<{ text: string; hashtags: string } | null>(null)
  const [saved, setSaved]     = useState(false)

  async function handleGenerate() {
    if (desc.trim().length < 3) return
    setLoading(true); setError(''); setPost(null); setSaved(false)
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessDesc: desc, userId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    setPost({ text: data.text, hashtags: data.hashtags })
  }

  async function handleSaveDraft() {
    if (!post) return
    const res = await fetch('/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentText: post.text,
        hashtags: post.hashtags,
        platform: ['facebook', 'instagram'],
      }),
    })
    if (res.ok) setSaved(true)
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['post', '📝 פוסט'], ['image', '🖼️ תמונה']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: tab === key ? 'linear-gradient(135deg,var(--purple),var(--purple-deep))' : '#fff',
              color:      tab === key ? '#fff' : 'var(--text-mid)',
              border:     tab === key ? 'none' : '1.5px solid var(--purple-border)',
              boxShadow:  tab === key ? '0 4px 14px rgba(161,70,255,0.25)' : 'none',
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'post' && (
        <div className="bg-white rounded-3xl p-7" style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 16px rgba(0,0,0,0.03)', maxWidth: 560 }}>
          <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-mid)' }}>על מה לכתוב?</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
            placeholder="מבצע סוף שבוע, פתיחת סניף חדש, טיפ מקצועי..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
            style={{ background: '#FAFAFE', border: '1.5px solid var(--purple-border)', color: 'var(--text-dark)', lineHeight: 1.7 }}
            onFocus={e => { e.target.style.borderColor = 'var(--purple)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(161,70,255,0.15)' }} />

          {error && <div className="p-3 rounded-xl mb-3 text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>}

          <button onClick={handleGenerate} disabled={loading || desc.trim().length < 3}
            className="w-full py-3 rounded-2xl text-white font-bold transition-all"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 4px 18px rgba(161,70,255,0.25)', opacity: loading || desc.trim().length < 3 ? 0.6 : 1 }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                כותב פוסט...
              </span>
            ) : '✨ צור פוסט'}
          </button>

          {post && (
            <div className="mt-5">
              <div className="p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: '#FAFAFE', border: '1px solid var(--purple-border)', color: 'var(--text-dark)' }}>
                {post.text}
                <div className="mt-3 font-semibold" style={{ color: 'var(--purple)' }}>{post.hashtags}</div>
              </div>
              <button onClick={handleSaveDraft} disabled={saved}
                className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: saved ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#FAFAFE',
                  color:      saved ? '#fff' : 'var(--purple)',
                  border:     saved ? 'none' : '1.5px solid var(--purple-border)',
                }}>
                {saved ? '✓ נשמר בתור הפוסטים' : 'שמור כטיוטה בתור'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'image' && <ImageGenerator userId={userId} />}
    </div>
  )
}
