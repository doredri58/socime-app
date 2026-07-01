import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { listBusinesses, businessLimit } from '@/lib/business'

export const runtime = 'nodejs'

// GET → { businesses, activeId, limit, tier }
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: profile } = await db.from('users').select('tier, active_business_id').eq('id', user.id).single()
  const tier = profile?.tier ?? 'free'
  const businesses = await listBusinesses(user.id)

  return NextResponse.json({
    businesses: businesses.map(b => ({ id: b.id, name: b.business_name })),
    activeId: profile?.active_business_id ?? businesses[0]?.id ?? null,
    limit: businessLimit(tier),
    tier,
  })
}
