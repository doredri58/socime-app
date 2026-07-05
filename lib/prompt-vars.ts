import 'server-only'
import type { BusinessProfile } from '@/lib/business'

/* ════════════════════════════════════════════════════════════
   Prompt variables — single source of truth for {{placeholders}}.
   Builds the substitution map from a business profile and renders
   it into a template, plus a compact "facts" block that injects any
   optional details (tone, address, phone, hours…) the profile has.
════════════════════════════════════════════════════════════ */

// Human-readable tone descriptions (matches the onboarding TONE_MAP)
const TONE_LABELS: Record<string, string> = {
  professional: 'מקצועי, נקי ועסקי — משדר אמינות',
  warm:         'חם, אישי ואנושי — כאילו חבר כותב',
  funny:        'הומוריסטי, קליל ומצחיק',
  serious:      'רציני, עמוק ואמין',
  direct:       'ישיר וחותך — הולך לעניין',
  inspiring:    'מעורר השראה ומניע לפעולה',
  casual:       'קליל ויומיומי, בגובה העיניים',
}

export function toneLabel(tone: string | null | undefined): string {
  if (!tone) return ''
  return TONE_LABELS[tone] ?? tone
}

/** All available {{variables}} → their value for a given business. */
export function buildBusinessVars(b: BusinessProfile | null): Record<string, string> {
  const tone = toneLabel(b?.tone_of_voice)
  return {
    business_name:   b?.business_name ?? '',
    business_type:   b?.raw_description ?? '',   // legacy alias used by older templates
    raw_description: b?.raw_description ?? '',
    tone,
    tone_of_voice:   tone,
    target_audience: b?.target_audience ?? '',
    unique_value:    b?.unique_value ?? '',
    address:         b?.address ?? '',
    phone:           b?.phone ?? '',
    operating_hours: b?.operating_hours ?? '',
    website:         b?.website ?? '',
  }
}

/** Replace {{var}} tokens with their values; unknown/empty vars become ''. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? '')
}

/**
 * Compact bullet list of every optional detail the business actually filled in,
 * appended to a system prompt so the AI can use address/phone/hours/etc.
 * Returns '' when nothing extra is available.
 */
export function businessFactsBlock(vars: Record<string, string>): string {
  const facts: [string, string][] = [
    ['טון דיבור', vars.tone],
    ['קהל יעד', vars.target_audience],
    ['בידול ייחודי', vars.unique_value],
    ['כתובת', vars.address],
    ['טלפון', vars.phone],
    ['שעות פעילות', vars.operating_hours],
    ['אתר', vars.website],
  ]
  const filled = facts.filter(([, v]) => v && v.trim())
  if (filled.length === 0) return ''
  return `\n\nפרטי העסק (השתמש בהם כשרלוונטי):\n${filled.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
}

/** Convenience: business system prompt + its facts block, ready for the model. */
export function enrichSystemPrompt(base: string, b: BusinessProfile | null): string {
  return base + businessFactsBlock(buildBusinessVars(b))
}
