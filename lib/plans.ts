/* ════════════════════════════════════════════════════════════
   Subscription plans — single source of truth (backend).
   Prices in ₪. Keep in sync with components/pricing/PricingPlans.tsx.
════════════════════════════════════════════════════════════ */

export type PlanId = 'basic' | 'pro' | 'agency'
export type BillingCycle = 'monthly' | 'annual'

export interface PlanConfig {
  id: PlanId
  tier: PlanId            // users.tier value
  name: string
  tokens: number          // monthly token allotment
  monthly: number         // ₪ / month, billed monthly
  annualPerMonth: number  // ₪ / month, billed annually
  annualTotal: number     // ₪ charged once per year
}

export const PLANS: Record<PlanId, PlanConfig> = {
  basic:  { id: 'basic',  tier: 'basic',  name: 'SociMe Basic',  tokens: 500,  monthly: 199, annualPerMonth: 159, annualTotal: 1908 },
  pro:    { id: 'pro',    tier: 'pro',    name: 'SociMe Pro',    tokens: 1000, monthly: 299, annualPerMonth: 239, annualTotal: 2868 },
  agency: { id: 'agency', tier: 'agency', name: 'SociMe Agency', tokens: 2000, monthly: 999, annualPerMonth: 799, annualTotal: 9588 },
}

export function isPlanId(value: unknown): value is PlanId {
  return value === 'basic' || value === 'pro' || value === 'agency'
}

/** Amount (₪) charged for a plan + billing cycle. Annual is charged in full. */
export function planAmountIls(id: PlanId, billing: BillingCycle): number {
  const p = PLANS[id]
  return billing === 'annual' ? p.annualTotal : p.monthly
}
