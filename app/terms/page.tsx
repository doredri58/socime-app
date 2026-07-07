import type { Metadata } from 'next'
import PublicLegalShell from '@/components/legal/PublicLegalShell'
import TermsContent from '@/components/legal/TermsContent'

export const metadata: Metadata = {
  title: 'תנאי שימוש – SociMe',
  description: 'תנאי השימוש של שירות SociMe לניהול רשתות חברתיות באמצעות בינה מלאכותית.',
}

export default function PublicTermsPage() {
  return (
    <PublicLegalShell>
      <TermsContent />
    </PublicLegalShell>
  )
}
