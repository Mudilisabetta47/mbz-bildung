import { useEffect, useRef, useState } from 'react'
import { m, useDragControls } from 'framer-motion'
import { BACKEND, CATEGORIES, type Course } from '../lib/catalog'
import { Arrow, CAT_WIDTHS, Close, EASE, Pic, Tick } from './ui'

const LOC_BY_ID: Record<string, string> = {
  '9a73b594-2db9-4396-a2a3-987d2178e046': 'Hannover',
  '4111f2c6-d0d0-47c1-b29c-c3688aa0fae1': 'Bremen',
  '600a6fb9-9ea8-401c-acf3-09cd802dd46f': 'Garbsen',
}

interface DateRow { start_date: string; end_date: string | null; location_id: string | null }

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

function useDates(course: Course) {
  const [rows, setRows] = useState<DateRow[]>([])
  useEffect(() => {
    const ctrl = new AbortController()
    const today = new Date().toISOString().slice(0, 10)
    fetch(
      `${BACKEND.url}/rest/v1/course_dates?select=start_date,end_date,location_id&course_id=eq.${course.id}&is_active=eq.true&start_date=gte.${today}&order=start_date&limit=4`,
      { headers: { apikey: BACKEND.key, Authorization: `Bearer ${BACKEND.key}` }, signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((j: DateRow[]) => {
        const seen = new Set<string>()
        setRows((Array.isArray(j) ? j : []).filter((r) => { const k = `${r.start_date}|${r.end_date}|${r.location_id}`; return !seen.has(k) && !!seen.add(k) }).slice(0, 3))
      })
      .catch(() => setRows([]))
    return () => ctrl.abort()
  }, [course.id])
  return rows
}

export function CourseSheet({ course, onClose, onSelect }: { course: Course; onClose: () => void; onSelect: () => void }) {
  const cat = CATEGORIES.find((c) => c.id === course.category)!
  const dates = useDates(course)
  const drag = useDragControls()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const mobile = typeof window !== 'undefined' && window.innerWidth < 900

  return (
    <>
      <m.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <m.div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={course.short}
        initial={mobile ? { y: '100%' } : { opacity: 0, y: 40, scale: 0.97 }}
        animate={mobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
        exit={mobile ? { y: '100%' } : { opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.55, ease: EASE }}
        drag={mobile ? 'y' : false}
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, i) => (i.offset.y > 120 || i.velocity.y > 600) && onClose()}
      >
        <div className="sheet-scroll">
          <div className="sheet-hero" onPointerDown={(e) => mobile && drag.start(e)} style={{ touchAction: 'none' }}>
            <span className="grab" aria-hidden />
            <Pic name={cat.img} widths={CAT_WIDTHS[cat.img]} pos={cat.pos} sizes="(min-width: 900px) 800px, 100vw" eager />
            <button ref={closeRef} className="close" onClick={onClose} aria-label="Schließen">
              <Close />
            </button>
          </div>
          <div className="sheet-body">
            <div className="crumb" aria-label="Du bist hier">
              <span>Du bist hier:</span>
              <span className="here">{cat.name}</span>
              <i>→</i>
              <span className="here">{course.short}</span>
            </div>
            <h3>{course.short}</h3>
            <div className="meta">
              {course.duration && <span className="chip">Dauer <b>{course.duration}</b></span>}
              {course.price && <span className="chip">Preis <b>{course.price}</b></span>}
            </div>
            {course.description && <p className="desc">{course.description}</p>}
            {course.requirements && (
              <div className="block">
                <h4>Voraussetzungen</h4>
                <ul className="ticks"><li><Tick />{course.requirements}</li></ul>
              </div>
            )}
            {course.benefits.length > 0 && (
              <div className="block">
                <h4>Deine Vorteile</h4>
                <ul className="ticks">{course.benefits.map((b) => <li key={b}><Tick />{b}</li>)}</ul>
              </div>
            )}
            {dates.length > 0 && (
              <div className="block">
                <h4>Nächste Termine</h4>
                <div className="dates">
                  {dates.map((d, i) => (
                    <div className="date" key={i}>
                      {fmt(d.start_date)}{d.end_date ? ` – ${fmt(d.end_date)}` : ''}
                      <span>{d.location_id ? LOC_BY_ID[d.location_id] ?? '' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="sheet-cta">
          <button className="btn btn-primary btn-block" onClick={onSelect}>
            Diesen Kurs auswählen <Arrow className="arr" />
          </button>
        </div>
      </m.div>
    </>
  )
}
