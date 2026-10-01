// Interaktions-Effekte per Event-Delegation: Ripple, Haptik, magnetische Buttons, Karten-Tilt mit Glanz, Cursor-Licht.
// Nur Transform/Opacity, keine Layout-Arbeit. Bei "Bewegung reduzieren" passiert nichts.
const RIPPLE = '.btn, .pill, .choice, .trk, .loc'
const TILT = '.trk, .choice'

export function initFx(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const off: (() => void)[] = []
  const on = <K extends keyof DocumentEventMap>(t: K, fn: (e: DocumentEventMap[K]) => void) => {
    document.addEventListener(t, fn as EventListener, { passive: true })
    off.push(() => document.removeEventListener(t, fn as EventListener))
  }

  // Ripple + kurze Vibration (Android)
  on('pointerdown', (e) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(RIPPLE)
    if (!el || el.hasAttribute('disabled')) return
    const r = el.getBoundingClientRect()
    const d = Math.max(r.width, r.height) * 2
    const s = document.createElement('span')
    s.className = 'ripple'
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`
    el.appendChild(s)
    s.addEventListener('animationend', () => s.remove(), { once: true })
    try { navigator.vibrate?.(8) } catch { /* nicht überall verfügbar */ }
  })

  if (fine) {
    let magnet: HTMLElement | null = null
    let tilt: HTMLElement | null = null
    const glow = document.querySelector<HTMLElement>('.cursor-glow')
    let raf = 0
    on('pointermove', (e) => {
      if (glow && !raf) {
        raf = requestAnimationFrame(() => { raf = 0; glow.style.transform = `translate(${e.clientX - 210}px, ${e.clientY - 210}px)`; glow.style.opacity = '1' })
      }
      const t = e.target as HTMLElement | null
      const b = t?.closest<HTMLElement>('.btn-primary')
      if (magnet && magnet !== b) { magnet.style.setProperty('--mx', '0px'); magnet.style.setProperty('--my', '0px'); magnet = null }
      if (b && !b.hasAttribute('disabled')) {
        const r = b.getBoundingClientRect()
        b.style.setProperty('--mx', `${(e.clientX - (r.left + r.width / 2)) * 0.16}px`)
        b.style.setProperty('--my', `${(e.clientY - (r.top + r.height / 2)) * 0.28}px`)
        magnet = b
      }
      const c = t?.closest<HTMLElement>(TILT)
      if (tilt && tilt !== c) { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); tilt = null }
      if (c) {
        const r = c.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        c.style.setProperty('--rx', `${(0.5 - py) * 7}deg`)
        c.style.setProperty('--ry', `${(px - 0.5) * 9}deg`)
        c.style.setProperty('--gx', `${px * 100}%`)
        c.style.setProperty('--gy', `${py * 100}%`)
        tilt = c
      }
    })
    on('pointerleave' as keyof DocumentEventMap, () => { if (glow) glow.style.opacity = '0' })
  }
  return () => off.forEach((f) => f())
}
