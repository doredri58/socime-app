import { requireAdmin }      from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'
import AdminLeadsClient       from '@/components/admin/AdminLeadsClient'

export default async function AdminLeadsPage() {
  await requireAdmin()
  const db = createServiceClient()

  const { data: leads } = await db
    .from('leads')
    .select('id, email, pain_point, generated_post, source, emailed, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  return <AdminLeadsClient leads={leads ?? []} />
}
