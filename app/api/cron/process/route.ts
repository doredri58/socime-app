import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"
import { processDuePost, SchedulerRow } from "@/lib/publisher"
import { sendPush, PushSubscription } from "@/lib/web-push"

// Vercel Cron: מופעל כל דקה — `vercel.json`
// Authorization: Bearer CRON_SECRET

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceClient()
  const now = new Date().toISOString()

  // שלוף פוסטים שהגיע זמנם
  const { data: duePosts } = await db
    .from("scheduler")
    .select("id, user_id, content_text, caption, platform, payload_url, content_type, source")
    .eq("status", "queued")
    .lte("scheduled_at", now)
    .limit(10)

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  // Skip posts of users who hit the global pause switch (posting_paused) —
  // their posts stay queued untouched until they resume.
  const userIds = [...new Set(duePosts.map(p => p.user_id))]
  const { data: pausedUsers } = await db
    .from("users")
    .select("id")
    .in("id", userIds)
    .eq("posting_paused", true)
  const pausedSet = new Set((pausedUsers ?? []).map(u => u.id))
  const activePosts = duePosts.filter(p => !pausedSet.has(p.user_id))

  if (activePosts.length === 0) {
    return NextResponse.json({ processed: 0, skipped_paused: duePosts.length })
  }

  const results = []

  for (const post of activePosts as SchedulerRow[]) {
    // סמן כ-processing כדי למנוע כפילויות
    await db.from("scheduler").update({ status: "processing" }).eq("id", post.id)

    const result = await processDuePost(post)
    results.push({ id: post.id, ...result })

    // שלח Push notification למשתמש
    const { data: subs } = await db
      .from("push_subscriptions")
      .select("endpoint, keys")
      .eq("user_id", post.user_id)

    if (subs?.length) {
      const msg = result.success
        ? { title: "✅ פוסט פורסם!", body: "הפוסט שלך פורסם בהצלחה ברשת החברתית", url: "/dashboard/queue" }
        : { title: "❌ פרסום נכשל", body: result.error ?? "שגיאה בפרסום", url: "/dashboard/queue" }

      await Promise.allSettled(
        subs.map(s => sendPush(
          { endpoint: s.endpoint, keys: s.keys as PushSubscription["keys"] },
          msg
        ))
      )
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
