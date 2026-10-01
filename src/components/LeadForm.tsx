import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { CATEGORIES, type CategoryId, type Course } from '../lib/catalog'
import { submitLead } from '../lib/lead'
import { track } from '../lib/track'
import { Arrow, EASE } from './ui'

const STEPS = ['Ausbildung', 'Deine Daten', 'Kontakt', 'Absenden']
const TITLES = ['Welche Ausbildung möchtest du machen?', 'Erzähl uns kurz von dir.', 'Wie erreichen wir dich?', 'Alles richtig? Dann ab damit.']
const PHONE = '0511 6425068'

interface Data {
  salutation: string; firstName: string; lastName: string; birthDate: string; birthPlace: string; nationality: string; maritalStatus: string
  street: string; zip: string; city: string; phone: string; mobile: string; email: string; location: string; heardFrom: string; message: string
}
const EMPTY: Data = {
  salutation: '', firstName: '', lastName: '', birthDate: '', birthPlace: '', nationality: '', maritalStatus: '',
  street: '', zip: '', city: '', phone: '', mobile: '', email: '', location: 'Hannover', heardFrom: 'Messe', message: '',
}
const SALUTATIONS = ['Herr', 'Frau', 'Divers']
const MARITAL = ['ledig', 'verheiratet', 'geschieden', 'verwitwet', 'eingetragene Lebenspartnerschaft']
const HEARD = ['Messe', 'Empfehlung', 'Internet', 'Social Media', 'Agentur für Arbeit', 'Sonstiges']
const phoneOk = (v: string) => v.replace(/\D/g, '').length >= 6
type Errors = Partial<Record<keyof Data | 'consent' | 'course', string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(step: number, d: Data, course: Course | undefined, consent: boolean): Errors {
  const e: Errors = {}
  if (step === 0 && !course) e.course = 'Bitte wähle eine Ausbildung aus.'
  if (step === 1) {
    if (d.firstName.trim().length < 2) e.firstName = 'Bitte gib deinen Vornamen ein.'
    if (d.lastName.trim().length < 2) e.lastName = 'Bitte gib deinen Nachnamen ein.'
    if (d.birthDate) {
      const t = new Date(d.birthDate).getTime()
      if (!(t > new Date('1920-01-01').getTime() && t < Date.now())) e.birthDate = 'Bitte prüfe das Geburtsdatum.'
    }
  }
  if (step === 2) {
    if (!EMAIL_RE.test(d.email.trim())) e.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'
    if (d.mobile.trim() && !phoneOk(d.mobile)) e.mobile = 'Diese Nummer scheint zu kurz zu sein.'
    if (d.phone.trim() && !phoneOk(d.phone)) e.phone = 'Diese Nummer scheint zu kurz zu sein.'
    if (!d.mobile.trim() && !d.phone.trim()) e.mobile = 'Bitte gib Handy- oder Telefonnummer an.'
    if (d.zip.trim() && !/^\d{5}$/.test(d.zip.trim())) e.zip = 'PLZ mit 5 Ziffern.'
  }
  if (step === 3 && !consent) e.consent = 'Bitte stimme der Datenverarbeitung zu.'
  return e
}

export function LeadForm({
  courses,
  selected,
  onSelect,
  onChangeCategory,
}: {
  courses: Course[]
  selected: string | null
  onSelect: (slug: string) => void
  onChangeCategory?: (c: CategoryId) => void
}) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [d, setD] = useState<Data>(EMPTY)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'done'>('idle')
  const [picking, setPicking] = useState(false)
  const [pickCat, setPickCat] = useState<CategoryId>('lkw')
  const [hp, setHp] = useState('')
  const started = useRef(false)
  const root = useRef<HTMLDivElement>(null)
  const sent = useRef(false)

  const course = courses.find((c) => c.slug === selected)
  const cat = CATEGORIES.find((c) => c.id === course?.category)

  useEffect(() => {
    if (course) setPickCat(course.category)
  }, [course])

  const set = <K extends keyof Data>(k: K, v: Data[K]) => {
    setD((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }))
  }

  const startOnce = () => {
    if (!started.current) {
      started.current = true
      track('form_started', { course: course?.slug })
    }
  }

  const go = (n: number) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
    requestAnimationFrame(() => {
      const r = root.current?.getBoundingClientRect()
      if (r && (r.top < 0 || r.top > window.innerHeight * 0.4)) root.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const next = async () => {
    startOnce()
    const e = validate(step, d, course, consent)
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    if (step < 3) {
      if (step === 2) track('form_completed', { course: course?.slug })
      go(step + 1)
      return
    }
    if (sent.current || !course || !cat) return
    sent.current = true
    // Honeypot: Bots bekommen Erfolg vorgespielt, nichts wird gesendet
    if (hp) { setStatus('done'); return }
    setStatus('sending')
    track('lead_submitted', { course: course.slug, category: cat.id, location: d.location })
    try {
      await submitLead({ ...d, category: cat.name, course: course.short })
      track('lead_success', { course: course.slug, category: cat.id, location: d.location })
      setStatus('done')
      requestAnimationFrame(() => root.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (err) {
      sent.current = false
      track('lead_error', { reason: String((err as Error).message).slice(0, 60) })
      setStatus('error')
    }
  }

  const reset = () => {
    setStep(0); setD(EMPTY)
    setConsent(false); setStatus('idle'); setErrors({}); sent.current = false; started.current = false
  }

  const variants = {
    in: (x: number) => ({ opacity: 0, x: x * 40 }),
    on: { opacity: 1, x: 0 },
    out: (x: number) => ({ opacity: 0, x: x * -40 }),
  }

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && (e.target as HTMLElement).tagName !== 'BUTTON') {
      e.preventDefault()
      next()
    }
  }

  const field = (k: keyof Data, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field">
      <label htmlFor={`f-${k}`}>{label}</label>
      <input
        id={`f-${k}`}
        className="input"
        value={d[k]}
        onChange={(e) => set(k, e.target.value)}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `e-${k}` : undefined}
        {...props}
      />
      {errors[k] && <p className="err" id={`e-${k}`} role="alert">{errors[k]}</p>}
    </div>
  )

  if (status === 'done') {
    return (
      <div className="form" id="anfrage" ref={root}>
        <m.div className="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE }} role="status">
          <div className="check-circle">
            <m.span className="ring" initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }} />
            <svg viewBox="0 0 112 112" fill="none" aria-hidden>
              <m.circle cx="56" cy="56" r="52" stroke="#00cc36" strokeWidth="4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: EASE }} />
              <m.path d="M34 58l15 15 30-33" stroke="#00cc36" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: EASE, delay: 0.55 }} />
            </svg>
          </div>
          <m.h3 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7, ease: EASE }}>
            Alles klar{d.firstName ? `, ${d.firstName.trim()}` : ''}.<br />Deine Anfrage ist angekommen.
          </m.h3>
          <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.7 }}>
            METROPOL Bildungszentrum meldet sich schnellstmöglich bei dir.
          </m.p>
          {course && cat && (
            <m.div className="picked" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25, duration: 0.7, ease: EASE }}>
              <div><small>Deine Anfrage</small><b>{course.short}</b><span>{cat.name} · {d.location}</span></div>
            </m.div>
          )}
          <div className="nav">
            <a className="btn btn-ghost" href={`tel:${PHONE.replace(/\s/g, '')}`}>Lieber direkt anrufen</a>
            <button className="btn btn-primary" onClick={reset}>Weiteren Kurs anfragen</button>
          </div>
        </m.div>
      </div>
    )
  }

  const visibleCourses = courses.filter((c) => c.category === pickCat)
  const sending = status === 'sending'

  return (
    <div className="form" id="anfrage" ref={root} onFocusCapture={startOnce} onKeyDown={onEnter}>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-label={`Schritt ${step + 1} von 4`}>
        {STEPS.map((_, i) => (
          <div className="bar" key={i}><i style={{ transform: `scaleX(${i <= step ? 1 : 0})` }} /></div>
        ))}
      </div>
      <div className="pnames" aria-hidden>
        {STEPS.map((s, i) => <span key={s} className={i === step ? 'on' : ''}>{s}</span>)}
      </div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <m.div key={step} custom={dir} variants={variants} initial="in" animate="on" exit="out" transition={{ duration: 0.38, ease: EASE }}>
          <span className="step-no">0{step + 1}</span>
          <h3 className="q">{TITLES[step]}</h3>

          {step === 0 && (
            <div>
              {course && cat && !picking ? (
                <div className="picked">
                  <div>
                    <small>Dein ausgewählter Kurs</small>
                    <b>{course.short}</b>
                    <span>{cat.name}</span>
                  </div>
                  <button className="link" onClick={() => setPicking(true)}>Ändern</button>
                </div>
              ) : (
                <>
                  <div className="pick-cats" role="group" aria-label="Hauptkurs">
                    {CATEGORIES.map((c) => (
                      <button key={c.id} className="pill" aria-pressed={pickCat === c.id} onClick={() => { setPickCat(c.id); onChangeCategory?.(c.id) }}>{c.name}</button>
                    ))}
                  </div>
                  <div className="opt-list" role="radiogroup" aria-label="Kurs">
                    {visibleCourses.map((c) => (
                      <button
                        key={c.id}
                        role="radio"
                        aria-checked={c.slug === selected}
                        className="opt"
                        onClick={() => { onSelect(c.slug); setPicking(false); setErrors({}) }}
                      >
                        {c.short}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {errors.course && <p className="err" role="alert">{errors.course}</p>}
            </div>
          )}

          {step === 1 && (
            <div className="fields">
              <div className="field">
                <label id="sal-l">Anrede</label>
                <div className="pick-cats" role="radiogroup" aria-labelledby="sal-l" style={{ marginBottom: 0 }}>
                  {SALUTATIONS.map((x) => (
                    <button key={x} role="radio" aria-checked={d.salutation === x} className="pill" onClick={() => set('salutation', d.salutation === x ? '' : x)}>{x}</button>
                  ))}
                </div>
              </div>
              <div className="fields two">
                {field('firstName', 'Vorname', { autoComplete: 'given-name', autoCapitalize: 'words', enterKeyHint: 'next', autoFocus: true })}
                {field('lastName', 'Nachname', { autoComplete: 'family-name', autoCapitalize: 'words', enterKeyHint: 'next' })}
                {field('birthDate', 'Geburtstag (optional)', { type: 'date', autoComplete: 'bday', min: '1920-01-01', max: new Date().toISOString().slice(0, 10) })}
                {field('birthPlace', 'Geburtsort (optional)', { autoComplete: 'off', autoCapitalize: 'words' })}
                {field('nationality', 'Nationalität (optional)', { autoComplete: 'country-name', autoCapitalize: 'words' })}
                <div className="field">
                  <label htmlFor="f-marital">Familienstand (optional)</label>
                  <select id="f-marital" className="input" value={d.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
                    <option value="">Bitte wählen</option>
                    {MARITAL.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fields">
              <div className="fields two">
                {field('mobile', 'Handy', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', enterKeyHint: 'next', autoFocus: true })}
                {field('phone', 'Telefon (optional)', { type: 'tel', inputMode: 'tel', autoComplete: 'tel-national', enterKeyHint: 'next' })}
              </div>
              {field('email', 'E-Mail', { type: 'email', inputMode: 'email', autoComplete: 'email', autoCapitalize: 'none', spellCheck: false, enterKeyHint: 'next' })}
              {field('street', 'Straße, Hausnummer (optional)', { autoComplete: 'street-address', autoCapitalize: 'words' })}
              <div className="fields zip">
                {field('zip', 'PLZ', { inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 5 })}
                {field('city', 'Ort', { autoComplete: 'address-level2', autoCapitalize: 'words' })}
              </div>
              <div className="field">
                <label id="heard-l">Aufmerksam geworden durch</label>
                <div className="pick-cats" role="radiogroup" aria-labelledby="heard-l" style={{ marginBottom: 0 }}>
                  {HEARD.map((x) => (
                    <button key={x} role="radio" aria-checked={d.heardFrom === x} className="pill" onClick={() => set('heardFrom', x)}>{x}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <dl className="summary">
                <div><dt>Kurs</dt><dd>{course?.short}</dd></div>
                <div><dt>Name</dt><dd>{[d.salutation, d.firstName, d.lastName].filter(Boolean).join(' ')}</dd></div>
                <div><dt>E-Mail</dt><dd>{d.email}</dd></div>
                {(d.mobile || d.phone) && <div><dt>Telefon</dt><dd>{d.mobile || d.phone}</dd></div>}
                {(d.street || d.city) && <div><dt>Adresse</dt><dd>{[d.street, [d.zip, d.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</dd></div>}
                <div><dt>Standort</dt><dd>Hannover</dd></div>
              </dl>
              <div className="field">
                <label htmlFor="f-message">Nachricht (optional)</label>
                <textarea id="f-message" className="input" value={d.message} onChange={(e) => set('message', e.target.value)} maxLength={1000} placeholder="Fragen oder Wünsche, z. B. Wunschtermin" />
              </div>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={hp} onChange={(e) => setHp(e.target.value)} />
              <label className="check">
                <input type="checkbox" checked={consent} aria-invalid={!!errors.consent} onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: undefined })) }} />
                <span>Ich bin einverstanden, dass METROPOL meine Angaben zur Bearbeitung meiner Anfrage verarbeitet. <a href="https://metropol-bz.de/datenschutz" target="_blank" rel="noopener">Datenschutz</a></span>
              </label>
              {errors.consent && <p className="err" role="alert">{errors.consent}</p>}
              {status === 'error' && (
                <div className="banner" role="alert">
                  Das hat leider nicht geklappt. Bitte versuche es noch einmal oder ruf uns kurz an: <a href={`tel:${PHONE.replace(/\s/g, '')}`}>{PHONE}</a>
                </div>
              )}
            </div>
          )}

          <div className="nav">
            {step > 0 && <button className="back" onClick={() => go(step - 1)} disabled={sending}>Zurück</button>}
            <button className="btn btn-primary" onClick={next} disabled={sending}>
              {sending ? <span className="spin" aria-label="Wird gesendet" /> : step === 3 ? <>Anfrage senden <Arrow className="arr" /></> : <>Weiter <Arrow className="arr" /></>}
            </button>
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  )
}
