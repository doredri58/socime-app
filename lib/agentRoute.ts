import 'server-only'
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase'
import { getTokenBalance, deductTokens, TOKEN_COSTS, type TokenAction } from '@/lib/tokens'
import { AgentError } from '@/lib/agents'

/* ════════════════════════════════════════════════════════════════════════
   Shared guard for Pro-tier agent endpoints.
   Pipeline: session auth → Pro-tier gate → token balance → run → deduct.
   Deducts a FIXED token cost (predictable for users) and logs the real
   Gemini api cost to the ledger.
════════════════════════════════════════════════════════════════════════ */

const PRO_TIERS = ['pro', 'agency']

export async function runProAgent<T>(
  action: TokenAction,
  run: () => Promise<{ data: T; costUsd: number }>,
): Promise<NextResponse> {
  // 1 — Authenticated session (never trust a userId from the body)
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // 2 — Pro-tier gate
  const db = createServiceClient()
  const { data: profile } = await db.from('users').select('tier').eq('id', user.id).single()
  const tier = profile?.tier ?? 'free'
  if (!PRO_TIERS.includes(tier)) {
    return NextResponse.json({ error: 'pro_required', tier }, { status: 403 })
  }

  // 3 — Token balance (fixed cost)
  const required = TOKEN_COSTS[action]
  const balance = (await getTokenBalance(user.id)) ?? 0
  if (balance < required) {
    return NextResponse.json({ error: 'insufficient_tokens', balance, required }, { status: 402 })
  }

  // 4 — Run the agent + deduct
  try {
    const result = await run()
    await deductTokens(user.id, action, undefined, result.costUsd) // undefined → fixed TOKEN_COSTS
    return NextResponse.json({ data: result.data, tokensCharged: required, balance: balance - required })
  } catch (err) {
    if (err instanceof AgentError) {
      return NextResponse.json({ error: 'agent_failed', message: err.message }, { status: 502 })
    }
    console.error(`[agent:${action}]`, err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
