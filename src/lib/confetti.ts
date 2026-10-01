// Winziges Canvas-Konfetti (keine Bibliothek), startet nur beim erfolgreichen Absenden.
const COLORS = ['#00cc36', '#7dff9b', '#00a82d', '#ffffff', '#ffd84d', '#222a25']

export function burst() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = document.createElement('canvas')
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:300'
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  cv.width = innerWidth * dpr
  cv.height = innerHeight * dpr
  document.body.appendChild(cv)
  const ctx = cv.getContext('2d')!
  ctx.scale(dpr, dpr)
  type P = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; c: string; life: number }
  const make = (x: number, ang: number, n: number): P[] =>
    Array.from({ length: n }, () => {
      const a = ang + (Math.random() - 0.5) * 0.9
      const v = 9 + Math.random() * 11
      return { x, y: innerHeight * 0.62, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 7, h: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLORS[(Math.random() * COLORS.length) | 0], life: 1 }
    })
  const ps = [...make(innerWidth * 0.15, -1.15, 55), ...make(innerWidth * 0.85, -2.0, 55), ...make(innerWidth * 0.5, -1.57, 50)]
  let t0 = performance.now()
  const frame = (now: number) => {
    const dt = Math.min((now - t0) / 16.7, 3)
    t0 = now
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    let alive = 0
    for (const p of ps) {
      p.vy += 0.38 * dt
      p.vx *= 0.992
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.r += p.vr * dt
      if (p.y > innerHeight * 0.75) p.life -= 0.02 * dt
      if (p.life <= 0 || p.y > innerHeight + 30) continue
      alive++
      ctx.save()
      ctx.globalAlpha = Math.max(p.life, 0)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.fillStyle = p.c
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    if (alive) requestAnimationFrame(frame)
    else cv.remove()
  }
  requestAnimationFrame(frame)
  try { navigator.vibrate?.([18, 40, 18, 40, 30]) } catch { /* ignorieren */ }
}
