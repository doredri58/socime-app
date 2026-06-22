import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { createServiceClient } from '@/lib/supabase'

const ALLOWED_TIERS    = ['free', 'basic', 'pro']
const ALLOWED_STATUSES = ['active', 'suspended', 'deleted']
const ASSIGNABLE_ROLES = ['user', 'editor', 'admin']  // 'founder' לא ניתן להקצאה דרך ה-UI

export async function PATCH(req: NextRequest) {
  // הגנה — רק אדמין/מייסד
  const ctx = await getAdminContext()
  if (!ctx) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  const { userId, tier, status, role, tokenBalance } = await req.json()
  if (!userId) {
    return NextResponse.json({ error: 'חסר userId' }, { status: 400 })
  }

  const patch: Record<string, string | number> = {}
  if (tier   !== undefined && ALLOWED_TIERS.includes(tier))      patch.tier   = tier
  if (status !== undefined && ALLOWED_STATUSES.includes(status)) patch.status = status

  // עריכת טוקנים — מותר לכל אדמין/מייסד
  if (tokenBalance !== undefined) {
    const n = Number(tokenBalance)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'כמות טוקנים לא חוקית' }, { status: 400 })
    }
    patch.token_balance = Math.floor(n)
  }

  // שינוי תפקיד — בלעדי למייסד
  if (role !== undefined) {
    if (ctx.role !== 'founder') {
      return NextResponse.json({ error: 'רק מייסד יכול לשנות תפקידים' }, { status: 403 })
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: 'תפקיד לא חוקי' }, { status: 400 })
    }
    patch.role = role
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'אין שדות חוקיים לעדכון' }, { status: 400 })
  }

  const db = createServiceClient()

  // הגנה — אי אפשר לשנות חשבון מייסד
  const { data: target } = await db.from('users').select('role').eq('id', userId).single()
  if (target?.role === 'founder') {
    return NextResponse.json({ error: 'לא ניתן לשנות חשבון מייסד' }, { status: 403 })
  }

  const { error } = await db.from('users').update(patch).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, patch })
}
