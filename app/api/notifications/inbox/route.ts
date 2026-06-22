import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase"

// GET — רשימת התראות
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  return NextResponse.json({ notifications: data ?? [] })
}

// POST — יצירת התראה (שרת בלבד)
export async function POST(req: NextRequest) {
  const { userId, title, body, url, icon } = await req.json()
  const db = createServiceClient()
  const { data, error } = await db.from("notifications").insert({
    user_id: userId,
    title,
    body: body ?? null,
    url: url ?? "/dashboard",
    icon: icon ?? "🔔",
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notification: data })
}

// PATCH — סמן כנקרא
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { id, all } = await req.json()
  const db = createServiceClient()

  if (all) {
    await db.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
  } else if (id) {
    await db.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id)
  }

  return NextResponse.json({ ok: true })
}
