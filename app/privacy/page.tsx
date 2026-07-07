import type { Metadata } from 'next'
import PublicLegalShell from '@/components/legal/PublicLegalShell'
import PrivacyContent from '@/components/legal/PrivacyContent'

export const metadata: Metadata = {
  title: 'מדיניות פרטיות – SociMe',
  description: 'מדיניות הפרטיות של SociMe — איזה מידע נאסף, איך נעשה בו שימוש והזכויות שלכם לפי חוק הגנת הפרטיות ו-GDPR.',
}

export default function PublicPrivacyPage() {
  return (
    <PublicLegalShell>
      <PrivacyContent showAccountActions={false} />
    </PublicLegalShell>
  )
}
