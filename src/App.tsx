import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'framer-motion'
import { fetchLiveCourses, snapshotCourses, type CategoryId, type Course } from './lib/catalog'
import { track } from './lib/track'
import { Header, Hero, Marquee } from './components/Hero'
import { Explorer } from './components/Explorer'
import { CourseSheet } from './components/CourseSheet'
import { LeadForm } from './components/LeadForm'
import { Arrow, EASE, Phone, Pic, Reveal } from './components/ui'

const PHONE = '0511 6425068'
const TEL = 'tel:+495116425068'

const STEPS = [
  { n: '01', t: 'Kurs wählen', p: 'Finde die passende Ausbildung und lies alle Infos auf einen Blick.' },
  { n: '02', t: 'Anfrage senden', p: 'In unter einer Minute, direkt hier auf dem Handy.' },
  { n: '03', t: 'Persönliche Beratung', p: 'Wir melden uns schnellstmöglich bei dir und klären alle Fragen.' },
  { n: '04', t: 'Los geht’s', p: 'Gemeinsam klären wir Förderung, Termin und Standort.' },
]

const slugFromHash = () => {
  const h = window.location.hash
  if (h.startsWith('#kurs=')) return decodeURIComponent(h.slice(6))
  return new URLSearchParams(window.location.search).get('kurs')
}

export default function App() {
  const [courses, setCourses] = useState<Course[]>(snapshotCourses)
  const [cat, setCat] = useState<CategoryId | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [stickyHidden, setStickyHidden] = useState(false)
  const pushed = useRef(false)
  const scrollAfter = useRef(false)

  // Live-Daten aus dem Admin-System; Snapshot bleibt als Fallback
  useEffect(() => {
    track('page_view', { page: 'messe_home' })
    const ctrl = new AbortController()
    fetchLiveCourses(ctrl.signal).then((l) => l && setCourses(l))
    return () => ctrl.abort()
  }, [])

  // Deep-Link (QR-Code pro Kurs): ?kurs=c-ce oder #kurs=c-ce
  useEffect(() => {
    const apply = () => {
      const s = slugFromHash()
      const c = s ? courses.find((x) => x.slug === s) : undefined
      if (c) { setCat(c.category); setOpen(c.slug) } else setOpen(null)
    }
    apply()
    window.addEventListener('popstate', apply)
    return () => window.removeEventListener('popstate', apply)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses.length])

  const openCourse = (slug: string) => {
    const c = courses.find((x) => x.slug === slug)
    if (!c) return
    track('course_view', { course: slug, category: c.category })
    history.pushState(null, '', `#kurs=${encodeURIComponent(slug)}`)
    pushed.current = true
    setOpen(slug)
  }

  const closeSheet = useCallback(() => {
    if (pushed.current) { pushed.current = false; history.back() }
    else { history.replaceState(null, '', window.location.pathname); setOpen(null) }
  }, [])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const choose = () => {
    const c = courses.find((x) => x.slug === open)
    if (!c) return
    track('course_selected', { course: c.slug, category: c.category })
    setSelected(c.slug)
    scrollAfter.current = true
    closeSheet()
  }

  useEffect(() => {
    if (!open && scrollAfter.current) {
      scrollAfter.current = false
      setTimeout(() => scrollTo('anfrage'), 350)
    }
  }, [open])

  // Sticky-Leiste ausblenden, wenn das Formular sichtbar ist
  useEffect(() => {
    const el = document.getElementById('anfrage')
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStickyHidden(e.isIntersecting), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const selectedCourse = courses.find((c) => c.slug === open)
  const pickFromForm = (slug: string) => {
    const c = courses.find((x) => x.slug === slug)
    track('course_selected', { course: slug, category: c?.category, via: 'form' })
    setSelected(slug)
  }

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict={false}>
        <Header onCta={() => scrollTo('anfrage')} />
        <main>
          <Hero onExplore={() => scrollTo('kurse')} onRequest={() => scrollTo('anfrage')} onQuick={(id) => { setCat(id); setTimeout(() => scrollTo('kurse'), 50) }} />
          <Marquee />

          <div className="wrap">
            <Reveal>
              <div className="stats">
                <div className="stat"><b>{courses.length}</b><span>Kurse im Programm</span></div>
                <div className="stat"><b>3</b><span>Standorte im Norden</span></div>
                <div className="stat"><b>AZAV</b><span>zertifizierter Träger</span></div>
                <div className="stat"><b>100 %</b><span>Förderung möglich</span></div>
              </div>
            </Reveal>
          </div>

          <Explorer courses={courses} cat={cat} onCat={setCat} onOpen={openCourse} />

          <section className="sec">
            <div className="wrap">
              <Reveal>
                <span className="kicker">So einfach geht’s</span>
                <h2 className="h2">In vier Schritten zu deiner Ausbildung.</h2>
              </Reveal>
              <div className="steps">
                {STEPS.map((s, i) => (
                  <Reveal key={s.n} delay={i * 0.08} className="step">
                    <div className="n">{s.n}</div>
                    <h3>{s.t}</h3>
                    <p>{s.p}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="sec tint">
            <div className="wrap form-wrap">
              <Reveal className="form-side">
                <span className="kicker">Anfrage</span>
                <h2 className="h2">Dein Platz wartet.</h2>
                <p className="lead">Kurs ausgewählt? Dann ist der Rest in einer Minute erledigt. Unverbindlich und kostenlos.</p>
                <ul className="perks">
                  <li>Unverbindlich und kostenlos</li>
                  <li>Wir melden uns schnellstmöglich</li>
                  <li>Förderung (z. B. Bildungsgutschein) möglich</li>
                </ul>
                <div className="contact">
                  <Pic name="team" widths={[480]} sizes="64px" alt="Regina Martin, Ansprechpartnerin" />
                  <div><b>Regina Martin</b><span>Deine Ansprechpartnerin · <a href={TEL}>{PHONE}</a></span></div>
                </div>
              </Reveal>
              <LeadForm
                courses={courses}
                selected={selected}
                onSelect={pickFromForm}
                onChangeCategory={() => undefined}
              />
            </div>
          </section>

          <section className="sec final">
            <div className="wrap">
              <Reveal>
                <h2 className="h2">Bereit für den nächsten Schritt?</h2>
                <p className="lead">Wir beraten dich gern persönlich: am Messestand, am Telefon oder in einem unserer drei Standorte.</p>
                <div className="hero-cta">
                  <button className="btn btn-primary" onClick={() => scrollTo('anfrage')}>Jetzt anfragen <Arrow className="arr" /></button>
                  <a className="btn btn-ghost" href={TEL}>{PHONE}</a>
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        <footer className="ftr">
          <div className="wrap ftr-grid">
            <div>
              <span className="logo"><img src="/img/logo.webp" width="295" height="70" alt="METROPOL Bildungszentrum" loading="lazy" /></span>
              <p>METROPOL Bildungszentrum GmbH<br />Berufskraftfahrer · Fahrlehrer · BKF</p>
            </div>
            <div><b>Hannover</b>Vahrenwalder Str. 213<br />30165 Hannover</div>
            <div><b>Bremen</b>Bahnhofsplatz 41<br />28195 Bremen<br /><b style={{ marginTop: 12 }}>Garbsen</b>Planetenring 25–27<br />30823 Garbsen</div>
            <div>
              <b>Kontakt</b>
              <a href={TEL}>{PHONE}</a><br />
              <a href="mailto:info@metropol-bz.de">info@metropol-bz.de</a><br /><br />
              <a href="https://metropol-bz.de/impressum" target="_blank" rel="noopener">Impressum</a> · <a href="https://metropol-bz.de/datenschutz" target="_blank" rel="noopener">Datenschutz</a><br />
              <a href="https://metropol-bz.de" target="_blank" rel="noopener">metropol-bz.de</a>
            </div>
          </div>
        </footer>

        <AnimatePresence>
          {!stickyHidden && !open && (
            <m.div className="sticky" initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              <button className="btn btn-primary" onClick={() => scrollTo('anfrage')}>Jetzt anfragen <Arrow className="arr" /></button>
              <a className="btn call" href={TEL} aria-label={`Anrufen ${PHONE}`}><Phone /></a>
            </m.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedCourse && <CourseSheet key={selectedCourse.slug} course={selectedCourse} onClose={closeSheet} onSelect={choose} />}
        </AnimatePresence>
      </LazyMotion>
    </MotionConfig>
  )
}

