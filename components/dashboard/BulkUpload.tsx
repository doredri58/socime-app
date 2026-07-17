'use client'
import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'

interface FileItem {
  file: File
  preview: string
  caption: string
}

interface UploadResult {
  name: string
  id?: string
  url?: string
  error?: string
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
const MAX_FILES = 20
const MAX_SIZE_MB = 50

export default function BulkUpload() {
  const [items, setItems]       = useState<FileItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [results, setResults]   = useState<UploadResult[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming)
    const valid = arr.filter(f => {
      if (!ACCEPTED.includes(f.type)) return false
      if (f.size > MAX_SIZE_MB * 1024 * 1024) return false
      return true
    })
    setItems(prev => {
      const combined = [...prev, ...valid.map(f => ({
        file: f,
        preview: f.type.startsWith('video/') ? '' : URL.createObjectURL(f),
        caption: '',
      }))]
      return combined.slice(0, MAX_FILES)
    })
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }, [])

  function removeItem(idx: number) {
    setItems(prev => {
      const copy = [...prev]
      if (copy[idx].preview) URL.revokeObjectURL(copy[idx].preview)
      copy.splice(idx, 1)
      return copy
    })
  }

  function setCaption(idx: number, value: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, caption: value } : it))
  }

  async function handleUpload() {
    if (!items.length) return
    setUploading(true)
    setResults(null)

    const fd = new FormData()
    items.forEach(it => fd.append('files', it.file))
    fd.append('captions', JSON.stringify(items.map(it => it.caption)))

    try {
      const res = await fetch('/api/bulk-upload', { method: 'POST', body: fd })
      const data = await res.json()
      setResults(data.results ?? [])
      // revoke object URLs for successful uploads
      items.forEach(it => { if (it.preview) URL.revokeObjectURL(it.preview) })
      setItems([])
    } catch {
      setResults([{ name: 'כללי', error: 'שגיאת רשת — נסו שוב' }])
    } finally {
      setUploading(false)
    }
  }

  const succeeded = results?.filter(r => !r.error).length ?? 0
  const failed    = results?.filter(r => r.error).length ?? 0

  return (
    <div>
      {/* Drop zone */}
      {!results && (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all mb-6"
            style={{
              border: `2px dashed ${dragging ? 'var(--purple)' : 'var(--purple-border)'}`,
              background: dragging ? 'var(--purple-soft)' : '#FAFAFE',
              padding: '48px 24px',
            }}
          >
            <div className="text-4xl">📂</div>
            <div className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>
              גררו קבצים לכאן או לחצו לבחירה
            </div>
            <div className="text-xs" style={{ color: 'var(--text-light)' }}>
              תמונות ווידאו · עד {MAX_FILES} קבצים · עד {MAX_SIZE_MB}MB לקובץ
            </div>
            <div className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: 'var(--purple-soft)', color: 'var(--purple)' }}>
              JPG · PNG · GIF · WebP · MP4 · MOV · WebM
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED.join(',')}
            className="hidden"
            onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
          />
        </>
      )}

      {/* Preview grid */}
      {items.length > 0 && !results && (
        <>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
            {items.length} קבצים נבחרו
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {items.map((it, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid var(--purple-border)', background: '#fff' }}>
                {/* thumbnail */}
                <div className="relative" style={{ aspectRatio: '1', background: '#f3f4f6' }}>
                  {it.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                  )}
                  <button
                    onClick={() => removeItem(idx)}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>✕</button>
                  <div className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                    {it.file.type.startsWith('video/') ? '🎬' : '🖼️'}
                  </div>
                </div>
                {/* caption */}
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="כיתוב (אופציונלי)..."
                    value={it.caption}
                    onChange={e => setCaption(idx, e.target.value)}
                    className="w-full text-xs rounded-lg px-2 py-1.5 outline-none"
                    style={{ border: '1px solid var(--purple-border)', color: 'var(--text-dark)', background: '#FAFAFE' }}
                  />
                </div>
              </div>
            ))}

            {/* Add more tile */}
            {items.length < MAX_FILES && (
              <div
                onClick={() => inputRef.current?.click()}
                className="rounded-2xl flex items-center justify-center cursor-pointer transition-all"
                style={{ border: '2px dashed var(--purple-border)', aspectRatio: '1', background: '#FAFAFE', minHeight: 120 }}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">+</div>
                  <div className="text-xs" style={{ color: 'var(--text-light)' }}>הוסיפו עוד</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-bold transition-all"
              style={{
                background: uploading ? '#c4b5fd' : 'linear-gradient(135deg,var(--purple),var(--purple-deep))',
                boxShadow: uploading ? 'none' : '0 4px 14px rgba(161,70,255,0.3)',
              }}>
              {uploading ? '⏳ מעלה...' : `📤 העלה ${items.length} קבצים לתור`}
            </button>
            <button
              onClick={() => { items.forEach(it => { if (it.preview) URL.revokeObjectURL(it.preview) }); setItems([]) }}
              disabled={uploading}
              className="px-5 py-3 rounded-2xl text-sm font-semibold"
              style={{ border: '1px solid var(--purple-border)', color: 'var(--text-mid)', background: '#FAFAFE' }}>
              נקה
            </button>
          </div>
        </>
      )}

      {/* Results */}
      {results && (
        <div className="rounded-3xl p-8 text-center" style={{ border: '1px solid var(--purple-border)', background: '#fff' }}>
          {succeeded > 0 && (
            <>
              <div className="text-5xl mb-3">🎉</div>
              <div className="text-xl font-black mb-1" style={{ color: 'var(--text-dark)' }}>
                {succeeded} פוסטים נוספו לתור
              </div>
              <div className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
                הקבצים נשמרו בהצלחה וממתינים לפרסום
              </div>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/queue"
                  className="px-6 py-2.5 rounded-full text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 4px 14px rgba(161,70,255,0.25)' }}>
                  📅 עבור לתור
                </Link>
                <button
                  onClick={() => setResults(null)}
                  className="px-6 py-2.5 rounded-full text-sm font-bold"
                  style={{ border: '1px solid var(--purple-border)', color: 'var(--text-mid)' }}>
                  העלה עוד
                </button>
              </div>
            </>
          )}

          {failed > 0 && (
            <div className="mt-4">
              <div className="text-sm font-bold mb-2" style={{ color: '#dc2626' }}>
                {failed} קבצים נכשלו
              </div>
              {results.filter(r => r.error).map((r, i) => (
                <div key={i} className="text-xs py-1" style={{ color: '#ef4444' }}>
                  {r.name}: {r.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
