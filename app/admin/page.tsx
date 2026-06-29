import { requireAdmin }        from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'
import GodModeDashboard        from '@/components/admin/GodModeDashboard'

export default async function AdminHome() {
  await requireAdmin()
  const db = createServiceClient()

  const { data: users } = await db
    .from('users')
    .select('id, email, name, role, tier, token_balance, status, created_at, last_login_at')
    .order('created_at', { ascending: false })

  const { count: postCount }  = await db.from('scheduler').select('id',           { count: 'exact', head: true })
  const { count: imageCount } = await db.from('image_usage_log').select('id',     { count: 'exact', head: true })
  const { data: txns }        = await db.from('transactions').select('amount_paid_ils')

  const allUsers     = users ?? []
  const totalRevenue = txns?.reduce((s, t) => s + ((t as { amount_paid_ils?: number }).amount_paid_ils ?? 0), 0) ?? 0

  const stats = {
    totalUsers:  allUsers.length,
    payingUsers: allUsers.filter(u => u.tier && u.tier !== 'free').length,
    totalRevenue,
    postCount:   postCount  ?? 0,
    imageCount:  imageCount ?? 0,
  }

  return <GodModeDashboard users={allUsers} stats={stats} />
}
