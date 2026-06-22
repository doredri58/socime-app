import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase"
import { encrypt } from "@/lib/crypto"

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const { platform, oauthToken, scopes, expiresAt } = await req.json()
  if (!platform || !oauthToken) return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 })
  if (!["instagram", "facebook"].includes(platform))
    return NextResponse.json({ error: "פלטפורמה לא נתמכת" }, { status: 400 })

  const encryptedToken = encrypt(oauthToken)

  const db = createServiceClient()
  const { error } = await db.from("social_tokens").upsert({
    user_id: user.id,
    platform,
    encrypted_oauth_token: encryptedToken,
    scopes: scopes ?? [],
    expires_at: expiresAt ?? null,
  }, { onConflict: "user_id,platform" })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "לא מחובר" }, { status: 401 })

  const db = createServiceClient()
  const { data } = await db
    .from("social_tokens")
    .select("platform, scopes, expires_at, created_at")
    .eq("user_id", user.id)

  return NextResponse.json({ connected: data ?? [] })
}
