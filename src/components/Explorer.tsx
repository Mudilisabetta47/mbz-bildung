import { AnimatePresence, m } from 'framer-motion'
import { CATEGORIES, type CategoryId, type Course } from '../lib/catalog'
import { Arrow, CAT_WIDTHS, CatIcon, EASE, Pic, Reveal } from './ui'

export function Explorer({
  courses,
  cat,
  onCat,
  onOpen,
}: {
  courses: Course[]
  cat: CategoryId | null
  onCat: (c: CategoryId | null) => void
  onOpen: (slug: string) => void
}) {
  const current = CATEGORIES.find((c) => c.id === cat)
  const list = courses.filter((c) => c.category === cat)

  return (
    <section className="sec tint" id="kurse">
      <div className="wrap">
        <Reveal>
          <span className="kicker">Ausbildung wählen</span>
          <h2 className="h2">Was möchtest du machen?</h2>
        </Reveal>

        <div className="crumb" style={{ marginTop: 22 }} aria-live="polite">
          <span>Du bist hier:</span>
          {current ? (
            <>
              <button onClick={() => onCat(null)}>Ausbildungen</button>
              <i>→</i>
              <span className="here">{current.name}</span>
            </>
          ) : (
            <span className="here">Ausbildungen</span>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {!current ? (
            <m.div
              key="cats"
              className="cat-grid"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              {CATEGORIES.map((c, i) => {
                const n = courses.filter((x) => x.category === c.id).length
                return (
                  <m.button
                    key={c.id}
                    className="cat"
                    onClick={() => (n === 1 ? onOpen(courses.find((x) => x.category === c.id)!.slug) : onCat(c.id))}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.8, ease: EASE, delay: (i % 3) * 0.08 }}
                  >
                    <div className="cat-img">
                      <Pic name={c.img} widths={CAT_WIDTHS[c.img]} pos={c.pos} sizes="(min-width: 700px) 50vw, 100vw" />
                    </div>
                    <span className="cat-ic"><CatIcon id={c.id} /></span>
                    <div className="cat-body">
                      <div>
                        <span className="count">{n} {n === 1 ? 'Kurs' : 'Kurse'}</span>
                        <h3>{c.name}</h3>
                        <p>{c.tagline}</p>
                      </div>
                      <span className="arrow"><Arrow /></span>
                    </div>
                  </m.button>
                )
              })}
            </m.div>
          ) : (
            <m.div
              key={`sub-${current.id}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <p className="lead" style={{ marginTop: 22 }}>{current.tagline}. Wähle deinen Kurs für alle Infos.</p>
              <div className="sub-list">
                {list.map((c, i) => (
                  <m.button
                    key={c.id}
                    className="sub"
                    onClick={() => onOpen(c.slug)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
                  >
                    <span>
                      <b>{c.short}</b>
                      <small>{[c.duration, c.price].filter(Boolean).join(' · ')}</small>
                    </span>
                    <span className="arrow"><Arrow /></span>
                  </m.button>
                ))}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
