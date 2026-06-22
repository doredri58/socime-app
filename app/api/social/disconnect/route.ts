import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase"

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { platform } = await req.json()
  if (!platform) return NextResponse.json({ error: "פלטפורמה חסרה" }, { status: 400 })

  const db = createServiceClient()
  await db.from("social_tokens").delete().eq("user_id", user.id).eq("platform", platform)
  return NextResponse.json({ ok: true })
}
