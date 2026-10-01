import { useEffect, useRef, useState } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import { sfxEnabled, setSfx } from '../lib/sfx'
import { Arrow, EASE, Pic } from './ui'

const WORDS = ['Deine', 'Karriere', 'startet', 'hier.']

function SfxToggle() {
  const [on, setOn] = useState(sfxEnabled)
  return (
    <button className="sfx" aria-pressed={on} aria-label={on ? 'Töne ausschalten' : 'Töne einschalten'} onClick={() => { const n = !on; setOn(n); setSfx(n) }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4z" />
        {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="M22 9l-6 6M16 9l6 6" />}
      </svg>
    </button>
  )
}

export function Header({ onCta }: { onCta: () => void }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 40)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <header className={`hdr ${solid ? 'solid' : ''}`}>
      <a className="logo" href="#top" aria-label="METROPOL Bildungszentrum">
        <img src="/img/logo.webp" width="295" height="70" alt="METROPOL Bildungszentrum" />
      </a>
      <div className="hdr-r">
        <SfxToggle />
        <button className="btn btn-primary" onClick={onCta}>
          Jetzt starten
        </button>
      </div>
    </header>
  )
}

export function Hero({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section className="hero" ref={ref} id="top">
      <m.div className="hero-bg" style={{ y, scale }}>
        <Pic name="hero" widths={[768, 1280, 1920]} sizes="(max-width: 700px) 230vw, 100vw" eager alt="METROPOL Flotte mit LKW, Bus und Fahrschulwagen" />
      </m.div>
      <m.div className="wrap hero-in" style={{ opacity: fade }}>
        <m.span className="kicker" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}>
          Messe 2026 · METROPOL
        </m.span>
        <h1 aria-label={WORDS.join(' ')}>
          {WORDS.map((w, i) => (
            <span key={w} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '.08em', marginRight: '.22em' }} aria-hidden>
              <m.span
                style={{ display: 'inline-block' }}
                className={i === 1 ? 'hl' : undefined}
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.25 + i * 0.09 }}
              >
                {w}
              </m.span>
            </span>
          ))}
        </h1>
        <m.p className="hero-sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}>
          Beantworte ein paar kurze Fragen und starte direkt mit deiner Anfrage.
        </m.p>
        <m.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.9 }}>
          <button className="btn btn-primary" onClick={onStart}>
            Jetzt starten <Arrow className="arr" />
          </button>
          <a className="btn btn-ghost" href="tel:+495116425068">
            Anrufen
          </a>
        </m.div>
        <m.div className="chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
          <span className="chip">AZAV-zertifiziert</span>
          <span className="chip">Förderung möglich</span>
          <span className="chip">Standort Hannover</span>
        </m.div>
      </m.div>
      <span className="scroll-hint" aria-hidden />
    </section>
  )
}
