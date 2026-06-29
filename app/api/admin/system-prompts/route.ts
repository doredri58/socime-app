import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET /api/admin/system-prompts — return all prompts as { [key]: content }
export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('system_prompts')
    .select('key, content')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result: Record<string, string> = {}
  for (const row of data ?? []) {
    result[row.key] = row.content
  }

  return NextResponse.json(result)
}

// POST /api/admin/system-prompts — upsert a single prompt { key, content }
export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  const body = await req.json()
  const key: string    = body?.key
  const content: string = body?.content

  if (!key || typeof content !== 'string') {
    return NextResponse.json({ error: 'חסרים שדות key / content' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('system_prompts')
    .upsert(
      { key, content, updated_at: new Date().toISOString(), updated_by: ctx.userId },
      { onConflict: 'key' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, key })
}
