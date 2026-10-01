// Kleine, selbst erzeugte UI-Sounds (Web Audio, keine Dateien). Starten erst nach Tippen/Klicken (Browser-Regel),
// sind leise und lassen sich über den Lautsprecher-Knopf im Header abschalten.
type Win = Window & { webkitAudioContext?: typeof AudioContext }
const KEY = 'mbz_sfx'
let ctx: AudioContext | null = null
let master: GainNode | null = null

export const sfxEnabled = () => {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

function ac(): AudioContext | null {
  if (!sfxEnabled()) return null
  if (!ctx) {
    const C = window.AudioContext || (window as Win).webkitAudioContext
    if (!C) return null
    ctx = new C()
    master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(c: AudioContext, f: number, t0: number, dur: number, vol = 0.18, type: OscillatorType = 'sine', f2?: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t0)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(master!)
  o.start(t0)
  o.stop(t0 + dur + 0.03)
}

function noise(c: AudioContext, t0: number, dur: number, vol: number, f1: number, f2: number) {
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(f1, t0)
  bp.frequency.exponentialRampToValueAtTime(f2, t0 + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(bp).connect(g).connect(master!)
  src.start(t0)
}

const run = (fn: (c: AudioContext, t: number) => void) => {
  try { const c = ac(); if (c) fn(c, c.currentTime + 0.005) } catch { /* Ton ist nie kritisch */ }
}

export const sfx = {
  tap: () => run((c, t) => tone(c, 520, t, 0.07, 0.1, 'triangle')),
  select: () => run((c, t) => { tone(c, 660, t, 0.06, 0.1, 'triangle'); tone(c, 990, t + 0.05, 0.09, 0.09, 'triangle') }),
  next: () => run((c, t) => tone(c, 420, t, 0.16, 0.12, 'sine', 700)),
  back: () => run((c, t) => tone(c, 560, t, 0.14, 0.1, 'sine', 380)),
  error: () => run((c, t) => { tone(c, 240, t, 0.13, 0.12, 'triangle'); tone(c, 190, t + 0.12, 0.18, 0.12, 'triangle') }),
  whoosh: () => run((c, t) => noise(c, t, 0.5, 0.16, 300, 2600)),
  ding: () => run((c, t) => { tone(c, 1174, t, 0.5, 0.1); tone(c, 1568, t + 0.09, 0.6, 0.07) }),
  /** Studiolicht geht an: dumpfes Klacken, kurzes Surren, aufsteigender Schimmer */
  lightOn: () => run((c, t) => {
    tone(c, 95, t, 0.18, 0.28, 'sine', 55)
    noise(c, t, 0.12, 0.1, 1800, 900)
    tone(c, 120, t + 0.06, 0.7, 0.05, 'sawtooth', 126)
    tone(c, 700, t + 0.14, 0.7, 0.05, 'sine', 1900)
  }),
  success: () => run((c, t) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.09, 0.45, 0.14, 'sine'))
    noise(c, t + 0.25, 0.5, 0.04, 3000, 6000)
  }),
}

export function setSfx(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* ignorieren */ }
  if (on) sfx.select()
}
