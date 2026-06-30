import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

// Vercel Cron: 1st of each month (vercel.json). Resets every user's
// token_balance to their tier allowance via the reset_monthly_tokens RPC.
// Authorization: Bearer CRON_SECRET
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const { error } = await db.rpc('reset_monthly_tokens')
  if (error) {
    console.error('[cron/reset-tokens]', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, reset_at: new Date().toISOString() })
}
