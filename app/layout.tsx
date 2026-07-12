import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils"
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/contexts/ThemeContext'

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-rubik',
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
    <html lang="he" dir="rtl" className={cn(rubik.variable)} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body className="min-h-full antialiased" style={{ fontFamily: 'var(--font-rubik), Rubik, sans-serif' }} suppressHydrationWarning>
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
