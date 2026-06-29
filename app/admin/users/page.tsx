import { requireAdmin }     from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'
import AdminUsersClient       from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  await requireAdmin()
  const db = createServiceClient()

  const { data: users } = await db
    .from('users')
    .select('id, email, name, role, tier, token_balance, status, created_at, last_login_at')
    .order('created_at', { ascending: false })

  const { data: businesses } = await db
    .from('business_profiles')
    .select('user_id, business_name, company_id, phone')

  const bizMap: Record<string, { business_name: string | null; company_id: string | null; phone: string | null }> = {}
  for (const b of businesses ?? []) bizMap[b.user_id] = b

  const enriched = (users ?? []).map(u => ({
    ...u,
    business_name: bizMap[u.id]?.business_name ?? null,
    company_id:    bizMap[u.id]?.company_id    ?? null,
    phone:         bizMap[u.id]?.phone         ?? null,
  }))

  return <AdminUsersClient users={enriched} />
}
