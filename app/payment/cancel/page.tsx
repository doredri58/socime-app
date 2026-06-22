'use client'
import Image from 'next/image'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg,#f8f4ff 0%,#ffffff 60%)' }}>
      <div className="bg-white rounded-3xl p-10 text-center max-w-sm w-full"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>

        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ background: '#fef2f2', border: '2px solid #fecaca' }}>
          ✕
        </div>

        <Image src="/logo.png" alt="SociMe" width={36} height={36}
          className="rounded-xl mx-auto mb-4"
          style={{ boxShadow: '0 0 10px rgba(161,70,255,0.15)' }} />

        <h1 className="text-xl font-extrabold mb-2" style={{ color: '#1A1A2E' }}>
          התשלום בוטל
        </h1>
        <p className="text-sm mb-8" style={{ color: '#8888A8' }}>
          לא חויבת בשום סכום. תוכל להתחיל מנוי בכל עת.
        </p>

        <a href="/"
          className="block w-full py-3 rounded-2xl font-bold text-center transition-all"
          style={{ background: '#f8f4ff', color: '#a146ff', border: '1.5px solid rgba(161,70,255,0.25)' }}>
          חזרה לדף הבית
        </a>
      </div>
    </div>
  )
}
