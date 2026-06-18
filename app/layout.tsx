import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SociMe – מנהל הסושיאל החכם שלך',
  description: 'AI-Powered Social Media Manager לעסקים קטנים בישראל. כתיבה, תזמון ופרסום אוטומטי לפייסבוק ואינסטגרם.',
  openGraph: {
    title: 'SociMe – מנהל הסושיאל החכם שלך',
    description: 'AI שכותב, מתזמן ומפרסם עבורך לסושיאל מדיה',
    locale: 'he_IL',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-full antialiased" style={{ fontFamily: 'var(--font-heebo), Heebo, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
