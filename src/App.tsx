import { useEffect, useState } from 'react'
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion'
import { TRACKS, type TrackId } from './lib/offer'
import { track } from './lib/track'
import { Header, Hero } from './components/Hero'
import { LeadForm } from './components/LeadForm'
import { Pic, Reveal } from './components/ui'

const PHONE = '0511 6425068'
const TEL = 'tel:+495116425068'

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/** Deep-Link für QR-Codes: ?ausbildung=lkw|bus|fahrlehrer|citylogistik|auslieferung */
function initialTrack(): TrackId | null {
  const v = new URLSearchParams(window.location.search).get('ausbildung')
  return (TRACKS.find((t) => t.id === v)?.id as TrackId) ?? null
}

export default function App() {
  const [start] = useState(initialTrack)
  useEffect(() => { track('page_view', { page: 'messe_home' }) }, [])

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict={false}>
        <Header onCta={() => scrollTo('anfrage')} />
        <main>
          <Hero onStart={() => scrollTo('anfrage')} />
          <section className="sec tint">
            <div className="wrap form-wrap">
              <Reveal className="form-side">
                <span className="kicker">Fragebogen</span>
                <h2 className="h2">Dein Platz wartet.</h2>
                <p className="lead">Ein paar kurze Fragen, dann melden wir uns bei dir. Unverbindlich und kostenlos.</p>
                <div className="contact">
                  <Pic name="team" widths={[480]} sizes="64px" alt="Regina Martin, Ansprechpartnerin" />
                  <div><b>Regina Martin</b><span>Deine Ansprechpartnerin · <a href={TEL}>{PHONE}</a></span></div>
                </div>
              </Reveal>
              <LeadForm initialTrack={start} />
            </div>
          </section>
        </main>
        <footer className="ftr">
          <div className="wrap ftr-grid">
            <div>
              <span className="logo"><img src="/img/logo.webp" width="295" height="70" alt="METROPOL Bildungszentrum" loading="lazy" /></span>
              <p>METROPOL Bildungszentrum GmbH<br />Vahrenwalder Str. 213, 30165 Hannover</p>
            </div>
            <div>
              <b>Kontakt</b>
              <a href={TEL}>{PHONE}</a><br />
              <a href="mailto:info@metropol-bz.de">info@metropol-bz.de</a>
            </div>
            <div>
              <a href="https://metropol-bz.de/impressum" target="_blank" rel="noopener">Impressum</a><br />
              <a href="https://metropol-bz.de/datenschutz" target="_blank" rel="noopener">Datenschutz</a><br />
              <a href="https://metropol-bz.de" target="_blank" rel="noopener">metropol-bz.de</a>
            </div>
          </div>
        </footer>
      </LazyMotion>
    </MotionConfig>
  )
}
