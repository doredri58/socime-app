import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

// POST { paused: boolean } — global pause switch for all of the user's
// scheduled publishing. While on, the cron skips every post of this user;
// nothing is published until the user turns it back off.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const { paused } = await req.json() as { paused?: unknown }
  if (typeof paused !== 'boolean') {
    return NextResponse.json({ error: 'ערך paused חסר' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('users')
    .update({ posting_paused: paused })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, paused })
}
