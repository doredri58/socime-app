import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { setActiveBusiness } from '@/lib/business'

export const runtime = 'nodejs'

// POST { businessId }
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { businessId } = await req.json().catch(() => ({}))
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 })

  const ok = await setActiveBusiness(user.id, businessId)
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
