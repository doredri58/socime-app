import 'server-only'
import { createServiceClient } from '@/lib/supabase'

export const TOKEN_COSTS = {
  generate_post:    10,
  generate_image:   25,
  generate_ideas:    8,  // per batch of 12 ideas
  onboarding:        5,
  video_transcribe:  5,
  video_render:     10,
  // Pro-tier AI agents (fixed cost per run)
  agent_competitor: 15,
  agent_ad_copy:    12,
  agent_adapt:      10,
} as const

export type TokenAction = keyof typeof TOKEN_COSTS

/**
 * Returns the user's current token balance, or null if user not found.
 */
export async function getTokenBalance(userId: string): Promise<number | null> {
  const db = createServiceClient()
  const { data } = await db
    .from('users')
    .select('token_balance')
    .eq('id', userId)
    .single()
  return data?.token_balance ?? null
}

/**
 * Checks if the user has enough tokens for an action.
 * Returns { ok: true } or { ok: false, balance, required }.
 */
export async function checkTokenBalance(
  userId: string,
  action: TokenAction
): Promise<{ ok: true } | { ok: false; balance: number; required: number }> {
  const balance = await getTokenBalance(userId)
  const required = TOKEN_COSTS[action]

  if (balance === null) return { ok: false, balance: 0, required }
  if (balance < required) return { ok: false, balance, required }
  return { ok: true }
}

/**
 * Deducts tokens from the user's balance and logs the action to token_ledger.
 * Uses the decrement_tokens RPC to avoid race conditions.
 */
export async function deductTokens(
  userId: string,
  action: TokenAction,
  tokensUsed?: number,
  costUsd?: number
): Promise<void> {
  const db = createServiceClient()
  const amount = tokensUsed ?? TOKEN_COSTS[action]

  await Promise.all([
    db.from('token_ledger').insert({
      user_id:       userId,
      tokens_used:   amount,
      api_cost_usd:  costUsd ?? 0,
      action_type:   action,
    }),
    db.rpc('decrement_tokens', { uid: userId, amount }),
  ])
}
