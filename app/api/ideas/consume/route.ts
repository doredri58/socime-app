import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getActiveBusiness } from '@/lib/business'

// Removes one post from the cached batch — called when the user sends it to the
// studio ("implemented and uploaded"). The batch is persisted server-side
// precisely because sending navigates away from the bank; without this, a
// consumed post would reappear on return. When the last one is removed the bank
// shows the generate button again.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id } = await req.json().catch(() => ({ id: null }))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id חסר' }, { status: 400 })
  }

  const business = await getActiveBusiness(user.id)
  if (!business) return NextResponse.json({ error: 'אין עסק פעיל' }, { status: 400 })

  const cached = (business as unknown as { cached_post_ideas?: unknown }).cached_post_ideas
  const current = Array.isArray(cached) ? (cached as { id?: string }[]) : []
  const remaining = current.filter(p => p?.id !== id)

  const db = createServiceClient()
  await db
    .from('business_profiles')
    .update({ cached_post_ideas: remaining })
    .eq('id', business.id)

  return NextResponse.json({ remaining })
}
