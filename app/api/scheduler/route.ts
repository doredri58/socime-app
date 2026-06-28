import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { contentText, hashtags, platform, scheduledAt } = await req.json()
  const db = createServiceClient()
  const { data, error } = await db.from("scheduler").insert({
    user_id:      user.id,
    content_text: contentText ?? "",
    hashtags:     hashtags ?? "",
    platform:     platform ?? ["instagram"],
    status:       scheduledAt ? "pending_approval" : "draft",
    scheduled_at: scheduledAt ?? null,
    source:       "generated",
    content_type: "text",
  }).select("id").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { id, scheduledAt, status } = await req.json()
  if (!id) return NextResponse.json({ error: "חסר id" }, { status: 400 })

  const patch: Record<string, string> = {}
  if (scheduledAt !== undefined) { patch.scheduled_at = scheduledAt; patch.status = "queued" }
  if (status !== undefined) patch.status = status

  const db = createServiceClient()
  const { error } = await db.from("scheduler").update(patch).eq("id", id).eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
