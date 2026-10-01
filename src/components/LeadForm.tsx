import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { TRACKS, type Track, type TrackId } from '../lib/offer'
import { submitLead } from '../lib/lead'
import { track } from '../lib/track'
import { Arrow, EASE, Pic, Tick, TrackIcon } from './ui'

const PHONE = '0511 6425068'
const TEL = 'tel:+495116425068'

type StepId = 'track' | 'path' | 'person' | 'contact' | 'send'
const TITLES: Record<StepId, string> = {
  track: 'Woran hast du Interesse?',
  path: 'Wie möchtest du starten?',
  person: 'Deine Daten',
  contact: 'Wie erreichen wir dich?',
  send: 'Alles richtig? Dann ab damit.',
}

interface Data {
  salutation: string; firstName: string; lastName: string; birthDate: string; birthPlace: string; nationality: string; maritalStatus: string
  street: string; zip: string; city: string; phone: string; mobile: string; email: string; heardFrom: string; message: string; payer: string
}
const EMPTY: Data = {
  salutation: '', firstName: '', lastName: '', birthDate: '', birthPlace: '', nationality: '', maritalStatus: '',
  street: '', zip: '', city: '', phone: '', mobile: '', email: '', heardFrom: 'Messe', message: '', payer: '',
}
type Errors = Partial<Record<keyof Data | 'consent' | 'pay' | 'track' | 'path' | 'modules', string>>

const SALUTATIONS = ['Herr', 'Frau', 'Divers']
const MARITAL = ['ledig', 'verheiratet', 'geschieden', 'verwitwet', 'eingetragene Lebenspartnerschaft']
const HEARD = ['Messe', 'Empfehlung', 'Internet', 'Social Media', 'Agentur für Arbeit', 'Sonstiges']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const phoneOk = (v: string) => v.replace(/\D/g, '').length >= 6

export function LeadForm({ initialTrack }: { initialTrack: TrackId | null }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [dir, setDir] = useState(1)
  const [pay, setPay] = useState<'' | 'Selbstzahler' | 'Kostenübernahme'>('')
  const [trackId, setTrackId] = useState<TrackId | ''>(initialTrack ?? '')
  const [pathId, setPathId] = useState<'' | 'modular' | 'tq'>('')
  const [modules, setModules] = useState<string[]>([])
  const [d, setD] = useState<Data>(EMPTY)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'done'>('idle')
  const [hp, setHp] = useState('')
  const started = useRef(false)
  const sent = useRef(false)
  const root = useRef<HTMLDivElement>(null)

  const tr: Track | undefined = TRACKS.find((t) => t.id === trackId)
  const steps: StepId[] = ['track', ...(tr?.paths ? (['path'] as StepId[]) : []), 'person', 'contact', 'send']
  const step = steps[Math.min(stepIdx, steps.length - 1)]
  const path = tr?.paths?.find((p) => p.id === pathId)

  useEffect(() => { if (initialTrack) setTrackId(initialTrack) }, [initialTrack])

  const set = <K extends keyof Data>(k: K, v: Data[K]) => {
    setD((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }))
  }
  const startOnce = () => {
    if (!started.current) { started.current = true; track('form_started', { pay: pay || undefined }) }
  }

  const validate = (): Errors => {
    const e: Errors = {}
    if (step === 'track' && !tr) e.track = 'Bitte wähle eine Ausbildung.'
    if (step === 'path') {
      if (!pathId) e.path = 'Bitte wähle, wie du starten möchtest.'
      else if (pathId === 'modular' && modules.length === 0) e.modules = 'Wähle mindestens einen Baustein.'
    }
    if (step === 'person') {
      if (d.firstName.trim().length < 2) e.firstName = 'Bitte gib deinen Vornamen ein.'
      if (d.lastName.trim().length < 2) e.lastName = 'Bitte gib deinen Nachnamen ein.'
      if (!pay) e.pay = 'Bitte wähle Selbstzahler oder Kostenübernahme.'
      else if (pay === 'Kostenübernahme' && d.payer.trim().length < 2) e.payer = 'Bitte trage ein, wer die Kosten übernimmt.'
      if (d.birthDate) {
        const t = new Date(d.birthDate).getTime()
        if (!(t > new Date('1920-01-01').getTime() && t < Date.now())) e.birthDate = 'Bitte prüfe das Geburtsdatum.'
      }
    }
    if (step === 'contact') {
      if (!EMAIL_RE.test(d.email.trim())) e.email = 'Bitte gib eine gültige E-Mail-Adresse ein.'
      if (d.mobile.trim() && !phoneOk(d.mobile)) e.mobile = 'Diese Nummer scheint zu kurz zu sein.'
      if (d.phone.trim() && !phoneOk(d.phone)) e.phone = 'Diese Nummer scheint zu kurz zu sein.'
      if (!d.mobile.trim() && !d.phone.trim()) e.mobile = 'Bitte gib Handy- oder Telefonnummer an.'
      if (d.zip.trim() && !/^\d{5}$/.test(d.zip.trim())) e.zip = 'PLZ mit 5 Ziffern.'
    }
    if (step === 'send' && !consent) e.consent = 'Bitte stimme der Datenverarbeitung zu.'
    return e
  }

  const go = (n: number) => {
    setDir(n > stepIdx ? 1 : -1)
    setStepIdx(n)
    requestAnimationFrame(() => {
      const r = root.current?.getBoundingClientRect()
      if (r && (r.top < 0 || r.top > window.innerHeight * 0.4)) root.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const label = tr ? tr.name : ''
  const pathLabel = path ? (pathId === 'modular' && modules.length ? `${path.name}` : path.name) : ''

  const next = async (skipValidate = false) => {
    startOnce()
    if (!skipValidate) {
      const e = validate()
      setErrors(e)
      if (Object.keys(e).length) {
        requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
        return
      }
    }
    if (step !== 'send') {
      if (step === 'track') track('course_view', { course: trackId })
      if ((step === 'track' && !tr?.paths) || step === 'path') track('course_selected', { course: trackId, path: pathId || undefined })
      if (step === 'contact') track('form_completed', { course: trackId })
      go(stepIdx + 1)
      return
    }
    if (sent.current || !tr) return
    sent.current = true
    if (hp) { setStatus('done'); return } // Honeypot: Bots bekommen Erfolg vorgespielt
    setStatus('sending')
    track('lead_submitted', { course: tr.id, pay })
    try {
      await submitLead({ ...d, payMode: pay, payer: pay === 'Kostenübernahme' ? d.payer : '', track: tr.name, path: pathLabel, modules, location: 'Hannover' })
      track('lead_success', { course: tr.id, pay })
      setStatus('done')
      requestAnimationFrame(() => root.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (err) {
      sent.current = false
      track('lead_error', { reason: String((err as Error).message).slice(0, 60) })
      setStatus('error')
    }
  }

  const reset = () => {
    setStepIdx(0); setPay(''); setTrackId(''); setPathId(''); setModules([]); setD(EMPTY)
    setConsent(false); setStatus('idle'); setErrors({}); sent.current = false; started.current = false
  }

  // Einfach-Auswahl springt nach kurzem Moment weiter (Rückweg bleibt über "Zurück")
  const auto = (fn: () => void) => { fn(); setTimeout(() => nextRef.current(true), 260) }
  const nextRef = useRef(next)
  nextRef.current = next

  const variants = { in: (x: number) => ({ opacity: 0, x: x * 40 }), on: { opacity: 1, x: 0 }, out: (x: number) => ({ opacity: 0, x: x * -40 }) }
  const onEnter = (e: React.KeyboardEvent) => {
    const t = (e.target as HTMLElement).tagName
    if (e.key === 'Enter' && t !== 'TEXTAREA' && t !== 'BUTTON') { e.preventDefault(); next() }
  }

  const field = (k: keyof Data, lbl: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="field">
      <label htmlFor={`f-${k}`}>{lbl}</label>
      <input id={`f-${k}`} className="input" value={d[k]} onChange={(e) => set(k, e.target.value)}
        aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
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
          {tr && (
            <m.div className="picked" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.25, duration: 0.7, ease: EASE }}>
              <div><small>Deine Anfrage</small><b>{tr.name}</b><span>{[pathLabel, pay].filter(Boolean).join(' · ')}</span></div>
            </m.div>
          )}
          <div className="nav">
            <a className="btn btn-ghost" href={TEL}>Lieber direkt anrufen</a>
            <button className="btn btn-primary" onClick={reset}>Neue Anfrage</button>
          </div>
        </m.div>
      </div>
    )
  }

  const sending = status === 'sending'
  const toggleMod = (x: string) => { setModules((p) => (p.includes(x) ? p.filter((y) => y !== x) : [...p, x])); setErrors((p) => ({ ...p, modules: undefined })) }

  return (
    <div className="form" id="anfrage" ref={root} onFocusCapture={startOnce} onKeyDown={onEnter}>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIdx + 1} aria-label={`Schritt ${stepIdx + 1} von ${steps.length}`}
        style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((s, i) => (<div className="bar" key={s}><i style={{ transform: `scaleX(${i <= stepIdx ? 1 : 0})` }} /></div>))}
      </div>
      <div className="pcount" aria-hidden>Schritt {stepIdx + 1} von {steps.length}</div>

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <m.div key={step} custom={dir} variants={variants} initial="in" animate="on" exit="out" transition={{ duration: 0.38, ease: EASE }}>
          <span className="step-no">{String(stepIdx + 1).padStart(2, '0')}</span>
          <h3 className="q">{TITLES[step]}</h3>

          {step === 'track' && (
            <div>
              <div className="tracks" role="radiogroup" aria-label="Ausbildung">
                {TRACKS.map((t) => (
                  <button key={t.id} role="radio" aria-checked={trackId === t.id} className="trk"
                    onClick={() => { setTrackId(t.id); setPathId(''); setModules([]); setErrors({}); if (!t.paths) auto(() => undefined) }}>
                    <span className="thumb"><Pic name={t.img} widths={t.imgW} pos={t.pos} sizes="96px" /></span>
                    <span className="trk-t"><b>{t.name}</b><small>{t.chips}</small></span>
                    <span className="trk-i"><TrackIcon id={t.id} /></span>
                  </button>
                ))}
              </div>
              {tr && (
                <m.div key={tr.id} className="needs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                  <h4>Das brauchst du</h4>
                  <ul className="ticks">{tr.needs.map((n) => (<li key={n}><Tick />{n}</li>))}</ul>
                  <p className="start">{tr.start}</p>
                </m.div>
              )}
              {errors.track && <p className="err" role="alert">{errors.track}</p>}
            </div>
          )}

          {step === 'path' && tr?.paths && (
            <div>
              <div className="choice-grid" role="radiogroup" aria-label="Weg">
                {tr.paths.map((p) => (
                  <button key={p.id} role="radio" aria-checked={pathId === p.id} className="choice" onClick={() => { setPathId(p.id); setErrors({}); if (p.id === 'tq') setModules([]) }}>
                    <b>{p.name}</b><small>{p.sub}</small>
                  </button>
                ))}
              </div>
              {pathId === 'modular' && tr.modules && (
                <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} style={{ marginTop: 20 }}>
                  <div className="field"><label id="mods-l">Welche Bausteine interessieren dich?</label>
                    <div className="pick-cats" role="group" aria-labelledby="mods-l" style={{ marginBottom: 0 }}>
                      {tr.modules.map((x) => (<button key={x} className="pill" aria-pressed={modules.includes(x)} onClick={() => toggleMod(x)}>{x}</button>))}
                      <button className="pill" aria-pressed={modules.includes('Noch unsicher – bitte beraten')} onClick={() => toggleMod('Noch unsicher – bitte beraten')}>Noch unsicher</button>
                    </div>
                  </div>
                </m.div>
              )}
              {errors.path && <p className="err" role="alert">{errors.path}</p>}
              {errors.modules && <p className="err" role="alert">{errors.modules}</p>}
            </div>
          )}

          {step === 'person' && (
            <div className="fields">
              <div className="field">
                <label id="sal-l">Anrede</label>
                <div className="pick-cats" role="radiogroup" aria-labelledby="sal-l" style={{ marginBottom: 0 }}>
                  {SALUTATIONS.map((x) => (<button key={x} role="radio" aria-checked={d.salutation === x} className="pill" onClick={() => set('salutation', d.salutation === x ? '' : x)}>{x}</button>))}
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
              <div className="field kosten">
                <label id="pay-l">Kostenpunkt</label>
                <div className="choice-grid" role="radiogroup" aria-labelledby="pay-l">
                  <button role="radio" aria-checked={pay === 'Selbstzahler'} aria-invalid={!!errors.pay} className="choice" onClick={() => { setPay('Selbstzahler'); set('payer', ''); setErrors((p) => ({ ...p, pay: undefined, payer: undefined })) }}>
                    <b>Selbstzahler</b><small>Ich bezahle selbst</small>
                  </button>
                  <button role="radio" aria-checked={pay === 'Kostenübernahme'} aria-invalid={!!errors.pay} className="choice" onClick={() => { setPay('Kostenübernahme'); setErrors((p) => ({ ...p, pay: undefined })) }}>
                    <b>Kostenübernahme</b><small>Ein Kostenträger übernimmt die Kosten</small>
                  </button>
                </div>
                {errors.pay && <p className="err" role="alert">{errors.pay}</p>}
                {pay === 'Kostenübernahme' && (
                  <m.div className="fields" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} style={{ marginTop: 14 }}>
                    {field('payer', 'Kostenträger', { autoComplete: 'off', autoCapitalize: 'words', placeholder: 'Bitte selbst eintragen' })}
                  </m.div>
                )}
              </div>
            </div>
          )}

          {step === 'contact' && (
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
                  {HEARD.map((x) => (<button key={x} role="radio" aria-checked={d.heardFrom === x} className="pill" onClick={() => set('heardFrom', x)}>{x}</button>))}
                </div>
              </div>
            </div>
          )}

          {step === 'send' && (
            <div>
              <dl className="summary">
                <div><dt>Kostenpunkt</dt><dd>{pay}{pay === 'Kostenübernahme' && d.payer ? ` · ${d.payer}` : ''}</dd></div>
                <div><dt>Ausbildung</dt><dd>{label}{pathLabel ? ` · ${pathLabel}` : ''}</dd></div>
                {modules.length > 0 && <div><dt>Bausteine</dt><dd>{modules.join(', ')}</dd></div>}
                <div><dt>Name</dt><dd>{[d.salutation, d.firstName, d.lastName].filter(Boolean).join(' ')}</dd></div>
                <div><dt>E-Mail</dt><dd>{d.email}</dd></div>
                {(d.mobile || d.phone) && <div><dt>Telefon</dt><dd>{d.mobile || d.phone}</dd></div>}
                {(d.street || d.city) && <div><dt>Adresse</dt><dd>{[d.street, [d.zip, d.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}</dd></div>}
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
                  Das hat leider nicht geklappt. Bitte versuche es noch einmal oder ruf uns kurz an: <a href={TEL}>{PHONE}</a>
                </div>
              )}
            </div>
          )}

          <div className="nav">
            {stepIdx > 0 && <button className="back" onClick={() => go(stepIdx - 1)} disabled={sending}>Zurück</button>}
            <button className="btn btn-primary" onClick={() => next()} disabled={sending}>
              {sending ? <span className="spin" aria-label="Wird gesendet" /> : step === 'send' ? <>Anfrage senden <Arrow className="arr" /></> : <>Weiter <Arrow className="arr" /></>}
            </button>
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  )
}
