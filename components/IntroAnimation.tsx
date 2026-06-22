'use client'
import { useEffect, useState } from 'react'

export default function IntroAnimation() {
  const [show, setShow]   = useState(false)
  const [done, setDone]   = useState(false)

  useEffect(() => {
    setShow(true)
    runAnimation()
  }, [])

  async function runAnimation() {
    await wait(80)

    const line = el('sm-line')
    const wrap = el('sm-wrap')
    const glow = el('sm-glow')
    const sub  = el('sm-sub')

    if (!line || !wrap) return

    // TV line appears
    line.style.opacity = '1'
    await wait(60)

    // Expand horizontal
    line.style.transition = 'width 160ms cubic-bezier(.4,0,.2,1)'
    line.style.width = '100vw'
    line.style.left = '0'
    line.style.transform = 'translateY(-50%)'
    await wait(180)

    // Expand vertical
    line.style.transition = 'height 220ms cubic-bezier(.4,0,.2,1)'
    line.style.height = '100vh'
    line.style.top = '0'
    line.style.transform = 'none'
    line.style.borderRadius = '0'
    await wait(250)

    // Flash → dark
    line.style.transition = 'background 180ms ease'
    line.style.background = 'rgba(255,255,255,0.9)'
    await wait(110)
    line.style.background = '#0a0012'
    await wait(200)

    // Logo in
    wrap.style.transition = 'opacity 500ms ease'
    wrap.style.opacity = '1'
    if (glow) {
      glow.style.transition = 'transform 650ms cubic-bezier(.34,1.56,.64,1), box-shadow 650ms ease'
      glow.style.transform = 'scale(1)'
      glow.style.boxShadow = '0 0 60px rgba(167,139,250,0.55), 0 0 120px rgba(192,38,211,0.2)'
    }
    await wait(700)

    // Subtitle
    if (sub) { sub.style.transition = 'opacity 400ms ease'; sub.style.opacity = '1' }
    await wait(900)

    // Fade out logo
    if (glow) { glow.style.transition = 'box-shadow 300ms ease'; glow.style.boxShadow = '0 0 0 rgba(0,0,0,0)' }
    await wait(200)
    wrap.style.transition = 'opacity 500ms ease'
    wrap.style.opacity = '0'
    line.style.transition = 'opacity 300ms'
    line.style.opacity = '0'

    await wait(500)
    setDone(true)
  }

  if (!show || done) return null

  return (
    <div id="sm-intro" style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* TV line */}
      <div id="sm-line" style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%,-50%)',
        width: 2, height: 2,
        background: '#fff', borderRadius: 2, opacity: 0,
      }} />

      {/* Logo */}
      <div id="sm-wrap" style={{ opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'relative', zIndex: 2 }}>
        <div id="sm-glow" style={{
          width: 120, height: 120, borderRadius: 28,
          background: '#5B21B6',
          overflow: 'hidden',
          transform: 'scale(0.7)',
          boxShadow: '0 0 0 rgba(0,0,0,0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 700, color: 'white',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="SociMe" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#fff', letterSpacing: -1.5 }}>
            Soci<span style={{ background: 'linear-gradient(90deg,#A78BFA,#F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Me</span>
          </div>
          <div id="sm-sub" style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6, opacity: 0 }}>
            Social Media · AI Powered
          </div>
        </div>
      </div>
    </div>
  )
}

function el(id: string) { return document.getElementById(id) as HTMLElement | null }
function wait(ms: number) { return new Promise(r => setTimeout(r, ms)) }
