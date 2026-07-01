import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { createBusiness } from '@/lib/business'

export const runtime = 'nodejs'

// POST { businessName } → creates a business (if under the tier limit) and makes it active
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { businessName } = await req.json().catch(() => ({}))

  const db = createServiceClient()
  const { data: profile } = await db.from('users').select('tier').eq('id', user.id).single()
  const tier = profile?.tier ?? 'free'

  const result = await createBusiness(user.id, tier, businessName ?? '')
  if (!result.ok) {
    if (result.reason === 'limit') {
      return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
    }
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, business: { id: result.business.id, name: result.business.business_name } })
}
