'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveButtons({ postId }: { postId: string }) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch('/api/scheduler/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId, action }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--purple-border)' }}>
      <button
        onClick={() => handle('approve')}
        disabled={!!loading}
        className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
        style={{ background: loading === 'approve' ? '#86efac' : 'linear-gradient(135deg,#16a34a,#15803d)', opacity: loading ? 0.7 : 1 }}
      >
        {loading === 'approve' ? '...' : '✅ אשר ותזמן'}
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={!!loading}
        className="flex-1 py-2 rounded-xl text-sm font-bold"
        style={{ background: '#fee2e2', color: '#dc2626', opacity: loading ? 0.7 : 1 }}
      >
        {loading === 'reject' ? '...' : '✕ החזר לטיוטה'}
      </button>
    </div>
  )
}
