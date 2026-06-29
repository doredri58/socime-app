import type { Metadata } from 'next'
import { Heebo, Arimo, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils"
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/contexts/ThemeContext'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
})

const arimo = Arimo({
  subsets: ['latin', 'hebrew'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arimo',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space',
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
    <html lang="he" dir="rtl" className={cn(heebo.variable, arimo.variable, spaceGrotesk.variable)}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body className="min-h-full antialiased" style={{ fontFamily: 'var(--font-heebo), Heebo, sans-serif' }}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
