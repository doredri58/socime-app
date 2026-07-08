// מכסת תמונות חודשית לפי tier
export const IMAGE_QUOTA: Record<string, number> = {
  free:   5,
  basic:  30,
  pro:    100,
  agency: 500,
}

export function getQuotaForTier(tier: string | null | undefined): number {
  return IMAGE_QUOTA[tier ?? 'free'] ?? IMAGE_QUOTA.free
}
