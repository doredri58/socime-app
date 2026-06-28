import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import ApproveButtons from '@/components/dashboard/ApproveButtons'

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  draft:            { label: 'טיוטה',          bg: '#fef3c7', color: '#b45309' },
  scheduled:        { label: 'מתוזמן',         bg: '#dbeafe', color: '#1d4ed8' },
  pending_approval: { label: 'ממתין לאישורך',  bg: '#fff7ed', color: '#ea580c' },
  queued:           { label: 'בתור לפרסום',    bg: '#ede0ff', color: '#7c3aed' },
  published:        { label: 'פורסם',          bg: '#dcfce7', color: '#16a34a' },
  failed:           { label: 'נכשל',           bg: '#fee2e2', color: '#dc2626' },
  paused:           { label: 'מושהה',          bg: '#f3f4f6', color: '#6b7280' },
}

export default async function QueuePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?login=required')
  const db = createServiceClient()

  const { data: posts } = await db
    .from('scheduler')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
        תור פוסטים
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text-light)' }}>
        כל הפוסטים שלך — טיוטות, מתוזמנים ושפורסמו
      </p>

      {!posts || posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center" style={{ border: '1px solid var(--purple-border)' }}>
          <div className="text-4xl mb-3">📭</div>
          <div className="text-base font-bold mb-1" style={{ color: 'var(--text-dark)' }}>אין פוסטים עדיין</div>
          <div className="text-sm mb-5" style={{ color: 'var(--text-light)' }}>צור את הפוסט הראשון שלך</div>
          <a href="/dashboard/create"
            className="inline-block px-6 py-2.5 rounded-full text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,var(--purple),var(--purple-deep))', boxShadow: '0 4px 14px rgba(161,70,255,0.25)' }}>
            ✨ צור פוסט
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map(post => {
            const meta = STATUS_META[post.status] ?? STATUS_META.draft
            return (
              <div key={post.id} className="bg-white rounded-2xl p-5"
                style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                  <div className="flex gap-1">
                    {(post.platform ?? []).map((p: string) => (
                      <div key={p} className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: p === 'facebook' ? '#1877F2' : 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}>
                        {p === 'facebook' ? 'f' : 'ig'}
                      </div>
                    ))}
                  </div>
                </div>
                {/* media thumbnail for uploaded posts */}
                {post.payload_url && post.content_type === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.payload_url} alt=""
                    className="w-full rounded-xl mb-3 object-cover"
                    style={{ maxHeight: 220 }} />
                )}
                {post.payload_url && post.content_type === 'video' && (
                  <div className="w-full rounded-xl mb-3 flex items-center justify-center"
                    style={{ height: 80, background: '#1a1a2e', color: '#fff', fontSize: 28 }}>
                    🎬
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-dark)' }}>
                  {post.content_text || post.caption}
                </div>
                {post.hashtags && (
                  <div className="text-xs mt-2 font-semibold" style={{ color: 'var(--purple)' }}>{post.hashtags}</div>
                )}
                {post.source === 'uploaded' && (
                  <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-light)' }}>
                    📂 הועלה ידנית
                  </div>
                )}
                <div className="text-xs mt-3" style={{ color: 'var(--text-light)' }}>
                  {new Date(post.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </div>
                {post.status === 'pending_approval' && (
                  <ApproveButtons postId={post.id} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
