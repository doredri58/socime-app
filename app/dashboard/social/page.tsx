import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase"
import SocialConnect from "@/components/dashboard/SocialConnect"

export default async function SocialPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/?login=required")

  const db = createServiceClient()
  const { data: profile } = await db.from("users").select("tier").eq("id", user.id).single()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#fff', letterSpacing: "-0.5px" }}>
        חיבור רשתות חברתיות
      </h1>
      <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
        חבר את הפלטפורמות כדי לפרסם ישירות מה-SociMe
      </p>
      <Suspense fallback={null}>
        <SocialConnect tier={profile?.tier ?? 'free'} />
      </Suspense>
    </div>
  )
}
