import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getTokenBalance } from '@/lib/tokens'

// GET /api/tokens/balance — current token balance for the logged-in user.
// Used by the TopBar to live-refresh the counter after a spend.
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const balance = await getTokenBalance(user.id)
  return NextResponse.json({ balance: balance ?? 0 })
}
