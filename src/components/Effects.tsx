import { m, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'

/** Grüner Lese-Fortschritt am oberen Rand */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 24, mass: 0.4 })
  return <m.div className="scrollbar" style={{ scaleX }} aria-hidden />
}

/** Weiches Licht, das dem Mauszeiger folgt (nur Desktop, per fx.ts gesteuert) */
export const CursorGlow = () => <div className="cursor-glow" aria-hidden />

/** Aufsteigende Lichtpunkte über dem Hero */
export function HeroSparks() {
  return (
    <div className="sparks" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => {
        const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280
        return (
          <i key={i} style={{ left: `${r(1) * 100}%`, ['--s' as string]: `${3 + r(2) * 6}px`, ['--d' as string]: `${8 + r(3) * 9}s`, ['--dl' as string]: `${-r(4) * 14}s`, ['--dx' as string]: `${(r(5) - 0.5) * 80}px` }} />
        )
      })}
    </div>
  )
}

const WORDS = ['LKW', 'Bus', 'Fahrlehrer', 'City-Logistik', 'Auslieferung', 'Hannover']

/** Zwei gegenläufige Textbänder; beim schnellen Scrollen neigen sie sich */
export function Marquee() {
  const { scrollY } = useScroll()
  const v = useVelocity(scrollY)
  const skewX = useSpring(useTransform(v, [-2500, 0, 2500], [-9, 0, 9]), { stiffness: 260, damping: 38 })
  const row = (key: string) =>
    WORDS.map((w) => (
      <span key={key + w}>{w}<i aria-hidden>✦</i></span>
    ))
  return (
    <div className="mq" aria-hidden>
      <m.div className="mq-in" style={{ skewX }}>
        <div className="mq-row a"><div className="mq-track">{row('a1')}{row('a2')}{row('a3')}{row('a4')}</div></div>
        <div className="mq-row b"><div className="mq-track">{row('b1')}{row('b2')}{row('b3')}{row('b4')}</div></div>
      </m.div>
    </div>
  )
}
