'use client'
import Image from 'next/image'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#F9F7FF' }}>

      <div className="text-center w-full" style={{ maxWidth: 380 }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #EDE9FE',
          borderRadius: 24,
          padding: '40px 32px',
          boxShadow: '0 8px 40px rgba(109,40,217,0.08), 0 2px 12px rgba(0,0,0,0.05)',
        }}>
          {/* Cancel icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: '#FEF2F2',
              border: '2px solid #FECACA',
              fontSize: 28, color: '#EF4444',
            }}>
            ✕
          </div>

          <div className="mx-auto mb-5 w-fit rounded-xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(109,40,217,0.1)' }}>
            <Image src="/logo.png" alt="SociMe" width={36} height={36} style={{ objectFit: 'cover' }} />
          </div>

          <h1 className="text-xl font-extrabold mb-2" style={{ color: '#111827' }}>
            התשלום בוטל
          </h1>
          <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
            לא חויבת בשום סכום. תוכל להתחיל מנוי בכל עת.
          </p>

          <a href="/"
            className="block w-full py-3 rounded-xl font-bold text-center transition-all"
            style={{
              background: '#F5F3FF', color: '#7C3AED',
              border: '1px solid #DDD6FE',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#EDE9FE'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#F5F3FF'
              ;(e.currentTarget as HTMLElement).style.transform = ''
            }}>
            חזרה לדף הבית
          </a>
        </div>
      </div>
    </div>
  )
}
