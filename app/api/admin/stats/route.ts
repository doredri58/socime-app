import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()

  /* ── total_users ── */
  let total_users = 0
  try {
    const { count } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
    total_users = count ?? 0
  } catch {}

  /* ── active_users (signed in last 30 days — use last_login_at or created_at) ── */
  let active_users = 0
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: countByLogin } = await db
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('last_login_at', thirtyDaysAgo)
    if (countByLogin !== null) {
      active_users = countByLogin
    } else {
      // fallback: count by created_at
      const { count: countByCreated } = await db
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', thirtyDaysAgo)
      active_users = countByCreated ?? 0
    }
  } catch {}

  /* ── posts_created (try scheduler, then posts) ── */
  let posts_created = 0
  try {
    const { count } = await db
      .from('scheduler')
      .select('id', { count: 'exact', head: true })
    posts_created = count ?? 0
  } catch {
    try {
      const { count } = await db
        .from('posts')
        .select('id', { count: 'exact', head: true })
      posts_created = count ?? 0
    } catch {}
  }

  /* ── users by tier ── */
  let free_users = 0, basic_users = 0, pro_users = 0, agency_users = 0
  try {
    const { data: tierRows } = await db
      .from('users')
      .select('tier')
    if (tierRows) {
      for (const row of tierRows) {
        const t = (row as { tier?: string | null }).tier ?? 'free'
        if (t === 'pro')         pro_users++
        else if (t === 'basic')  basic_users++
        else if (t === 'agency') agency_users++
        else                     free_users++
      }
    }
  } catch {}

  /* ── paying users (basic + pro + agency) ── */
  const paying_users = basic_users + pro_users + agency_users

  /* ── revenue_mtd (sum from transactions this calendar month) ── */
  let revenue_mtd = 0
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { data: txns } = await db
      .from('transactions')
      .select('amount_paid_ils')
      .gte('created_at', startOfMonth.toISOString())
    if (txns) {
      revenue_mtd = txns.reduce(
        (sum, t) => sum + ((t as { amount_paid_ils?: number }).amount_paid_ils ?? 0),
        0
      )
    }
  } catch {}

  /* ── total revenue (all time) ── */
  let total_revenue = 0
  try {
    const { data: allTxns } = await db
      .from('transactions')
      .select('amount_paid_ils')
    if (allTxns) {
      total_revenue = allTxns.reduce(
        (sum, t) => sum + ((t as { amount_paid_ils?: number }).amount_paid_ils ?? 0),
        0
      )
    }
  } catch {}

  /* ── image count ── */
  let image_count = 0
  try {
    const { count } = await db
      .from('image_usage_log')
      .select('id', { count: 'exact', head: true })
    image_count = count ?? 0
  } catch {}

  return NextResponse.json({
    total_users,
    active_users,
    paying_users,
    posts_created,
    free_users,
    basic_users,
    pro_users,
    agency_users,
    revenue_mtd,
    total_revenue,
    image_count,
  })
}
