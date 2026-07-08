import { requireAdmin }       from '@/lib/admin'
import { createServiceClient }  from '@/lib/supabase'
import { PLANS }                from '@/lib/plans'
import AdminBillingClient       from '@/components/admin/AdminBillingClient'

export default async function AdminBillingPage() {
  await requireAdmin()
  const db = createServiceClient()

  const { data: txns } = await db
    .from('transactions')
    .select('id, user_id, amount_paid_ils, tokens_granted, created_at, status')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: users } = await db
    .from('users')
    .select('id, email, name, tier, created_at')

  /* build plan distribution */
  const tierCount = { free: 0, basic: 0, pro: 0, agency: 0 }
  for (const u of users ?? []) {
    const t = (u.tier ?? 'free') as keyof typeof tierCount
    if (t in tierCount) tierCount[t]++
  }

  /* MRR — monthly prices from lib/plans (₪199 / ₪299 / ₪999) */
  const mrr = tierCount.basic  * PLANS.basic.monthly
            + tierCount.pro    * PLANS.pro.monthly
            + tierCount.agency * PLANS.agency.monthly

  /* monthly revenue buckets (last 6 months) */
  const buckets: Record<string, number> = {}
  for (const t of txns ?? []) {
    const m = t.created_at?.slice(0, 7) ?? ''
    buckets[m] = (buckets[m] ?? 0) + (t.amount_paid_ils ?? 0)
  }
  const monthlyRev = Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    .map(([month, total]) => ({ month, total }))

  /* user map for transaction names */
  const userMap: Record<string, { email: string; name: string | null }> = {}
  for (const u of users ?? []) userMap[u.id] = { email: u.email, name: u.name }

  return (
    <AdminBillingClient
      txns={txns ?? []}
      userMap={userMap}
      tierCount={tierCount}
      mrr={mrr}
      monthlyRev={monthlyRev}
      totalRevenue={(txns ?? []).reduce((s, t) => s + (t.amount_paid_ils ?? 0), 0)}
    />
  )
}
