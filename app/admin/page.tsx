import { requireAdmin } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'
import UsersTable from '@/components/admin/UsersTable'

export default async function AdminHome() {
  const admin = await requireAdmin()
  const db = createServiceClient()

  // כל המשתמשים
  const { data: users } = await db
    .from('users')
    .select('id, email, name, role, tier, token_balance, status, created_at, last_login_at, image_count_this_month')
    .order('created_at', { ascending: false })

  // ספירות כלליות
  const { count: postCount }  = await db.from('scheduler').select('id', { count: 'exact', head: true })
  const { count: imageCount } = await db.from('image_usage_log').select('id', { count: 'exact', head: true })
  const { data: txns }        = await db.from('transactions').select('amount_paid_ils')

  const totalUsers   = users?.length ?? 0
  const payingUsers  = users?.filter(u => u.tier && u.tier !== 'free').length ?? 0
  const revenue      = txns?.reduce((sum, t) => sum + (t.amount_paid_ils ?? 0), 0) ?? 0

  const stats = [
    { label: 'משתמשים',      value: totalUsers,             icon: '👥', color: 'var(--purple)' },
    { label: 'משלמים',       value: payingUsers,            icon: '💎', color: '#16a34a' },
    { label: 'פוסטים',       value: postCount ?? 0,         icon: '📝', color: '#2563eb' },
    { label: 'תמונות שנוצרו', value: imageCount ?? 0,        icon: '🖼️', color: '#db2777' },
    { label: 'הכנסות',       value: `₪${revenue.toLocaleString()}`, icon: '💰', color: '#d97706' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-1" style={{ color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
        ניהול מערכת
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-light)' }}>
        סקירה כללית וניהול משתמשים
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5"
            style={{ border: '1px solid var(--purple-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-light)' }}>
        משתמשים ({totalUsers})
      </div>
      <UsersTable users={users ?? []} currentRole={admin.role} />
    </div>
  )
}
