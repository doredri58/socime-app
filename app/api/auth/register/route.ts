import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, draftPost } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'שדות חסרים' }, { status: 400 })
    }

    const db = createServiceClient()

    // Create auth user
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'כתובת האימייל כבר רשומה במערכת'
        : authError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = authData.user.id

    // Insert into public.users
    await db.from('users').insert({
      id: userId,
      email,
      name,
      plan: 'pro',
      token_balance: 200,
    })

    // Log the subscription transaction
    await db.from('transactions').insert({
      user_id: userId,
      transaction_type: 'subscription',
      amount_paid_ils: 49,
      tokens_granted: 200,
    })

    // Save draft post if provided
    if (draftPost?.text) {
      await db.from('scheduler').insert({
        user_id: userId,
        content_text: draftPost.text,
        hashtags: draftPost.hashtags ?? '',
        platform: ['facebook', 'instagram'],
        status: 'draft',
      })
    }

    return NextResponse.json({ success: true, userId })
  } catch (err: unknown) {
    console.error('[/api/auth/register]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}
