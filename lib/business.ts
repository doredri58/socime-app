import 'server-only'
import { createServiceClient } from '@/lib/supabase'

/* ════════════════════════════════════════════════════════════
   Multi-business helpers.
   A user can own several business profiles (Agency = up to 5).
   users.active_business_id points to the one currently selected.
════════════════════════════════════════════════════════════ */

export interface BusinessProfile {
  id: string
  user_id: string
  business_name: string
  raw_description: string | null
  parsed_system_prompt: string | null
  tone_of_voice: string | null
  phone: string | null
  address: string | null
  operating_hours: string | null
}

const BUSINESS_LIMIT: Record<string, number> = { free: 1, basic: 1, pro: 1, agency: 5 }

/** How many businesses a tier may manage. */
export function businessLimit(tier: string): number {
  return BUSINESS_LIMIT[tier] ?? 1
}

/** All of a user's businesses, oldest first. */
export async function listBusinesses(userId: string): Promise<BusinessProfile[]> {
  const db = createServiceClient()
  const { data } = await db
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return (data ?? []) as BusinessProfile[]
}

/** The active business: users.active_business_id → else the first one → else null. */
export async function getActiveBusiness(userId: string): Promise<BusinessProfile | null> {
  const db = createServiceClient()
  const { data: u } = await db.from('users').select('active_business_id').eq('id', userId).single()
  const activeId = (u?.active_business_id as string | null) ?? null

  if (activeId) {
    const { data } = await db
      .from('business_profiles').select('*')
      .eq('id', activeId).eq('user_id', userId).maybeSingle()
    if (data) return data as BusinessProfile
  }

  const { data } = await db
    .from('business_profiles').select('*')
    .eq('user_id', userId).order('created_at', { ascending: true })
    .limit(1).maybeSingle()
  return (data as BusinessProfile) ?? null
}

/** Switch the active business. Returns false if the business isn't the user's. */
export async function setActiveBusiness(userId: string, businessId: string): Promise<boolean> {
  const db = createServiceClient()
  const { data } = await db
    .from('business_profiles').select('id')
    .eq('id', businessId).eq('user_id', userId).maybeSingle()
  if (!data) return false
  await db.from('users').update({ active_business_id: businessId }).eq('id', userId)
  return true
}

/** Create a new business (respecting the tier limit) and make it active. */
export async function createBusiness(
  userId: string, tier: string, businessName: string,
): Promise<{ ok: true; business: BusinessProfile } | { ok: false; reason: 'limit' | 'error' }> {
  const db = createServiceClient()

  const existing = await listBusinesses(userId)
  if (existing.length >= businessLimit(tier)) return { ok: false, reason: 'limit' }

  const { data, error } = await db
    .from('business_profiles')
    .insert({ user_id: userId, business_name: businessName.trim() || 'עסק חדש' })
    .select('*')
    .single()
  if (error || !data) return { ok: false, reason: 'error' }

  await db.from('users').update({ active_business_id: data.id }).eq('id', userId)
  return { ok: true, business: data as BusinessProfile }
}
