import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase"
import { sendPush } from "@/lib/web-push"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { title, body, url } = await req.json()

  const db = createServiceClient()
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("user_id", user.id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "אין מנויים פעילים" }, { status: 404 })
  }

  const results = await Promise.allSettled(
    subs.map(s => sendPush(
      { endpoint: s.endpoint, keys: s.keys as { p256dh: string; auth: string } },
      { title: title ?? "SociMe", body: body ?? "", url: url ?? "/dashboard" }
    ))
  )

  const sent = results.filter(r => r.status === "fulfilled").length
  return NextResponse.json({ sent, total: subs.length })
}
