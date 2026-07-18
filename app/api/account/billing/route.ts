import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'

// PATCH — עדכון פרטי החיוב לחשבונית (שם עסק, ח.פ., כתובת, אימייל לחשבוניות)
// הנתונים נשמרים על העסק הפעיל של המשתמש ב-business_profiles.
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'לא מחובר' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : undefined
  const companyId    = typeof body.companyId    === 'string' ? body.companyId.trim()    : undefined
  const address      = typeof body.address      === 'string' ? body.address.trim()      : undefined
  const billingEmail = typeof body.billingEmail === 'string' ? body.billingEmail.trim() : undefined

  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return NextResponse.json({ error: 'אימייל לא תקין' }, { status: 400 })
  }

  const patch: Record<string, string | null> = {}
  if (businessName !== undefined) patch.business_name = businessName
  if (companyId    !== undefined) patch.company_id    = companyId    || null
  if (address      !== undefined) patch.address       = address      || null
  if (billingEmail !== undefined) patch.billing_email = billingEmail || null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'אין שדות לעדכון' }, { status: 400 })
  }

  const db = createServiceClient()

  // מזהים את העסק הפעיל; נופלים חזרה לעסק הראשון של המשתמש אם אין active.
  const { data: u } = await db.from('users').select('active_business_id').eq('id', user.id).single()
  let businessId = u?.active_business_id as string | null | undefined
  if (!businessId) {
    const { data: first } = await db
      .from('business_profiles').select('id').eq('user_id', user.id)
      .order('created_at', { ascending: true }).limit(1).single()
    businessId = first?.id
  }
  if (!businessId) return NextResponse.json({ error: 'לא נמצא עסק' }, { status: 404 })

  const { error } = await db
    .from('business_profiles')
    .update(patch)
    .eq('id', businessId)
    .eq('user_id', user.id)   // הגנה — רק העסק של המשתמש עצמו

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
