import Link from 'next/link'

// עטיפה ציבורית לעמודי משפט (תקנון/פרטיות) — רקע כהה תואם לתוכן הזכוכית,
// עם קישור חזרה לדף הבית. נגיש ללא התחברות עבור crawlers של TikTok/Meta/Google.
export default function PublicLegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', padding: '32px 20px 72px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto 22px', direction: 'rtl' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          color: '#CE7BFF', textDecoration: 'none', fontSize: 14, fontWeight: 800,
        }}>
          <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />
          SociMe
        </Link>
      </div>
      {children}
    </div>
  )
}
