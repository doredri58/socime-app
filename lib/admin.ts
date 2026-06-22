import 'server-only'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

const ADMIN_ROLES = ['admin', 'founder']

// לשימוש בדפי שרת — מפנה החוצה אם לא אדמין
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role)) redirect('/dashboard')
  return profile
}

// לשימוש ב-API routes — מחזיר true/false במקום הפניה
export async function isAdminRequest(): Promise<boolean> {
  return !!(await getAdminContext())
}

// מחזיר את ה-userId והתפקיד של המבצע, או null אם אינו אדמין
export async function getAdminContext(): Promise<{ userId: string; role: string } | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const db = createServiceClient()
  const { data: profile } = await db
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role)) return null
  return { userId: user.id, role: profile.role }
}
