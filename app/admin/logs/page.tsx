import { requireAdmin }       from '@/lib/admin'
import { createServiceClient }  from '@/lib/supabase'
import AdminLogsClient          from '@/components/admin/AdminLogsClient'

export default async function AdminLogsPage() {
  await requireAdmin()
  const db = createServiceClient()

  /* pull recent scheduler activity as a proxy for system events */
  const { data: schedulerEvents } = await db
    .from('scheduler')
    .select('id, user_id, platform, status, created_at, scheduled_at, content')
    .order('created_at', { ascending: false })
    .limit(200)

  /* pull recent transactions */
  const { data: txnEvents } = await db
    .from('transactions')
    .select('id, user_id, amount_paid_ils, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  /* build unified log entries */
  const logs = [
    ...(schedulerEvents ?? []).map(e => ({
      id: e.id, ts: e.created_at ?? '',
      level: e.status === 'failed' ? 'error' : e.status === 'pending' ? 'warn' : 'info',
      source: `scheduler/${e.platform ?? 'unknown'}`,
      message: `פוסט ${e.status ?? '?'} — ${(e.content ?? '').slice(0, 60)}${(e.content?.length ?? 0) > 60 ? '...' : ''}`,
      userId: e.user_id,
    })),
    ...(txnEvents ?? []).map(e => ({
      id: e.id, ts: e.created_at ?? '',
      level: e.status === 'failed' ? 'error' : 'info',
      source: 'billing/payplus',
      message: `תשלום ₪${e.amount_paid_ils ?? 0} — ${e.status ?? 'completed'}`,
      userId: e.user_id,
    })),
  ].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 300)

  return <AdminLogsClient logs={logs} />
}
