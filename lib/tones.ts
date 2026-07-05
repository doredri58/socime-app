/* Single source of truth for the brand tone-of-voice options.
   Used by both the onboarding wizard and the business-portfolio editor so the
   two pickers can never drift apart again. All ids are valid values of the
   business_profiles.tone_of_voice DB constraint. */

export type ToneId =
  | 'professional' | 'warm' | 'funny' | 'serious' | 'direct' | 'inspiring' | 'casual'

export interface ToneOption {
  id: ToneId
  label: string
  emoji: string
}

export const TONES: ToneOption[] = [
  { id: 'professional', label: 'מקצועי',           emoji: '💼' },
  { id: 'warm',         label: 'חם ואישי',         emoji: '🤝' },
  { id: 'funny',        label: 'הומוריסטי',        emoji: '😄' },
  { id: 'serious',      label: 'רציני',             emoji: '🎯' },
  { id: 'direct',       label: 'ישיר ותכליתי',      emoji: '⚡' },
  { id: 'inspiring',    label: 'מעורר השראה',       emoji: '✨' },
  { id: 'casual',       label: "קז'ואל ויומיומי",   emoji: '😎' },
]

export const DEFAULT_TONE: ToneId = 'warm'
