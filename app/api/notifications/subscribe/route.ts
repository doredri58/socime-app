import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys) return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 })

  const db = createServiceClient()
  await db.from("push_subscriptions")
    .upsert({ user_id: user.id, endpoint, keys }, { onConflict: "user_id,endpoint" })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { endpoint } = await req.json()
  const db = createServiceClient()
  await db.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint)
  return NextResponse.json({ ok: true })
}
