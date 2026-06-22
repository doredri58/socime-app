import Link from 'next/link'
import Image from 'next/image'
import { requireAdmin } from '@/lib/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFE', direction: 'rtl' }}>
      {/* Admin top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-white"
        style={{ borderBottom: '1px solid var(--purple-border)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SociMe" width={32} height={32} className="rounded-lg"
            style={{ boxShadow: '0 0 10px rgba(161,70,255,0.25)' }} />
          <span className="text-base font-black" style={{ color: 'var(--text-dark)' }}>
            Soci<span style={{ color: 'var(--purple)' }}>Me</span>
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#1A1A2E', color: '#fff' }}>ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-light)' }}>
            {admin.name} · מייסד
          </span>
          <Link href="/dashboard"
            className="text-sm font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: '#FAFAFE', color: 'var(--purple)', border: '1px solid var(--purple-border)' }}>
            ← לדשבורד
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-10">{children}</main>
    </div>
  )
}
