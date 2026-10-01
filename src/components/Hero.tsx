import { useEffect, useRef, useState } from 'react'
import { m, useScroll, useTransform } from 'framer-motion'
import { CATEGORIES, type CategoryId } from '../lib/catalog'
import { Arrow, CatIcon, EASE, Pic } from './ui'

const WORDS = ['Deine', 'Karriere', 'startet', 'hier.']

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
      <button className="btn btn-primary" onClick={onCta}>
        Beratung anfragen
      </button>
    </header>
  )
}

/** Intro-Video aus /video/intro.mp4 – nur wenn vorhanden, Daten-Sparmodus und "Bewegung reduzieren" aus. */
function HeroVideo() {
  const [ok, setOk] = useState(() => {
    if (typeof window === 'undefined') return false
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !nav.connection?.saveData
  })
  const [ready, setReady] = useState(false)
  if (!ok) return null
  return (
    <video
      className={`hero-video ${ready ? 'on' : ''}`}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="/img/hero-1280.webp"
      onCanPlay={() => setReady(true)}
      onError={() => setOk(false)}
    >
      <source src="/video/intro.webm" type="video/webm" onError={() => undefined} />
      <source src="/video/intro.mp4" type="video/mp4" onError={() => setOk(false)} />
    </video>
  )
}

export function Hero({ onExplore, onRequest, onQuick }: { onExplore: () => void; onRequest: () => void; onQuick: (id: CategoryId) => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section className="hero" ref={ref} id="top">
      <m.div className="hero-bg" style={{ y, scale }}>
        <Pic name="hero" widths={[768, 1280, 1920]} sizes="(max-width: 700px) 230vw, 100vw" eager alt="METROPOL Flotte mit LKW, Bus und Fahrschulwagen" />
        <HeroVideo />
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
          LKW, Bus, Fahrlehrer, BKF: Finde deine Ausbildung und frag sie in einer Minute direkt an.
        </m.p>
        <m.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.9 }}>
          <button className="btn btn-primary" onClick={onExplore}>
            Ausbildung entdecken <Arrow className="arr" />
          </button>
          <button className="btn btn-ghost" onClick={onRequest}>
            Beratung anfragen
          </button>
        </m.div>
        <m.div className="quick" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8, ease: EASE }}>
          <span>Direkt zu:</span>
          {CATEGORIES.slice(0, 4).map((c) => (
            <button key={c.id} onClick={() => onQuick(c.id)}><CatIcon id={c.id} />{c.name === 'BKF-Weiterbildung' ? 'BKF' : c.name}</button>
          ))}
        </m.div>
        <m.div className="chips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}>
          <span className="chip">AZAV-zertifiziert</span>
          <span className="chip">Förderung möglich</span>
          <span className="chip">Hannover · Bremen · Garbsen</span>
        </m.div>
      </m.div>
      <span className="scroll-hint" aria-hidden />
    </section>
  )
}

const BAND = ['LKW', 'Bus', 'Fahrlehrer', 'BKF-Weiterbildung', 'Hannover', 'Bremen', 'Garbsen']
export function Marquee() {
  const row = BAND.map((t) => (<span key={t}>{t}<i aria-hidden>✦</i></span>))
  return (
    <div className="band" aria-hidden>
      <div className="band-track">{row}{row}{row}{row}</div>
    </div>
  )
}
