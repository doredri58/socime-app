import { requireAdmin } from '@/lib/admin'
import AdminApisClient  from '@/components/admin/AdminApisClient'

export default async function AdminApisPage() {
  await requireAdmin()
  return <AdminApisClient />
}
