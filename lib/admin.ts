import 'server-only'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

const ADMIN_ROLES = ['admin', 'founder']

// MFA enforcement — admins must reach AAL2 (a verified TOTP challenge) to access
// the admin area. Returns 'ok' | 'challenge' (has factor, needs code) |
// 'enroll' (no factor yet).
async function adminMfaState(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<'ok' | 'challenge' | 'enroll'> {
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (data?.currentLevel === 'aal2') return 'ok'
  return data?.nextLevel === 'aal2' ? 'challenge' : 'enroll'
}

// לשימוש בדפי שרת — מפנה החוצה אם לא אדמין, או לזרימת MFA אם אדמין בלי AAL2
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

  // אכיפת MFA לחשבונות ניהול
  const mfa = await adminMfaState(supabase)
  if (mfa === 'challenge') redirect('/dashboard/verify-mfa?next=/admin')
  if (mfa === 'enroll')    redirect('/dashboard/settings?tab=security&mfa=required')

  return profile
}

// לשימוש ב-API routes — מחזיר true/false במקום הפניה
export async function isAdminRequest(): Promise<boolean> {
  return !!(await getAdminContext())
}

// מחזיר את ה-userId והתפקיד של המבצע, או null אם אינו אדמין / לא עבר MFA (AAL2)
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

  // אכיפת MFA — פעולות ניהול דורשות AAL2 (הגנת עומק על ה-API)
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2') return null

  return { userId: user.id, role: profile.role }
}
