import Link from 'next/link'

// עטיפה ציבורית לעמודי משפט (תקנון/פרטיות) — רקע בהיר אוורירי תואם לעיצוב,
// עם קישור חזרה לדף הבית. נגיש ללא התחברות עבור crawlers של TikTok/Meta/Google.
export default function PublicLegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="light-page" style={{
      minHeight: '100vh', padding: '32px 20px 72px',
      background: `radial-gradient(ellipse at 20% 0%, rgba(190,86,254,.22) 0%, transparent 55%),
                   linear-gradient(152deg, #E9DEFB 0%, #DCD6F7 50%, #CCE0FF 100%)`,
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto 22px', direction: 'rtl' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          color: '#BE56FE', textDecoration: 'none', fontSize: 14, fontWeight: 800,
        }}>
          <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
          SociMe
        </Link>
      </div>
      {children}
    </div>
  )
}
