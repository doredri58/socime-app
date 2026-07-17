import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getActiveBusiness } from '@/lib/business'

// Removes one item (post or video) from the cached batch — called when the user
// sends it to the studio ("implemented and uploaded"). The batch is persisted
// server-side precisely because sending navigates away from the bank; without
// this, a consumed item would reappear on return. When the last one is removed
// the bank shows the generate button again.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { id, kind } = await req.json().catch(() => ({ id: null, kind: 'post' }))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id חסר' }, { status: 400 })
  }
  const column = kind === 'video' ? 'cached_video_ideas' : 'cached_post_ideas'

  const business = await getActiveBusiness(user.id)
  if (!business) return NextResponse.json({ error: 'אין עסק פעיל' }, { status: 400 })

  const cached = (business as unknown as Record<string, unknown>)[column]
  const current = Array.isArray(cached) ? (cached as { id?: string }[]) : []
  const remaining = current.filter(p => p?.id !== id)

  const db = createServiceClient()
  await db
    .from('business_profiles')
    .update({ [column]: remaining })
    .eq('id', business.id)

  return NextResponse.json({ remaining })
}
