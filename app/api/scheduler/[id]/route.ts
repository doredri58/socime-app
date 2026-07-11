import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

// PATCH /api/scheduler/[id] — update status or scheduled_at
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מורשה' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Whitelist — לא לקבל את כל הגוף ל-update (mass-assignment: הלקוח יכל לזייף
  // meta_post_id/published_at/attempt_count/user_id או status לא-חוקי).
  const VALID_STATUS = ['draft', 'pending_approval', 'queued', 'processing', 'published', 'failed', 'paused']
  const patch: Record<string, string> = {}
  if (typeof body.content_text === 'string')                      patch.content_text = body.content_text
  if (body.scheduledAt !== undefined && body.scheduledAt !== null) { patch.scheduled_at = String(body.scheduledAt); patch.status = 'queued' }
  if (typeof body.status === 'string' && VALID_STATUS.includes(body.status)) patch.status = body.status

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'אין שדות חוקיים לעדכון' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('scheduler')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
