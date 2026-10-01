import { useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { sfx } from '../lib/sfx'
import { Arrow, EASE } from './ui'

const Speaker = ({ off }: { off?: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    {off ? <path d="M22 9l-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
  </svg>
)
const Replay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
  </svg>
)

/**
 * Begrüßungs-Intro im Studiolicht. Stumm automatisch, Ton auf Tipp.
 * Endet auf der Zeigegeste nach unten, dann pulsiert der Button "Jetzt starten".
 */
export function Intro({ onClose }: { onClose: (scroll: boolean) => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<'silent' | 'sound'>('silent')
  const [muted, setMuted] = useState(true)
  const [ended, setEnded] = useState(false)
  const [ready, setReady] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false)
    window.addEventListener('keydown', onKey)
    // Autoplay blockiert (z. B. Stromsparmodus)? Dann Abspielen-Knopf zeigen.
    const t = setTimeout(() => { if (!ref.current || ref.current.paused) setBlocked(true) }, 1800)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [onClose])

  const withSound = () => {
    const v = ref.current
    if (!v) return
    sfx.lightOn()
    // Alles synchron im Klick-Handler, damit auch iOS den Ton erlaubt
    v.src = '/video/intro-sound.mp4'
    v.muted = false
    v.currentTime = 0
    v.play().catch(() => { v.muted = true; setMuted(true); void v.play() })
    setMode('sound'); setMuted(false); setEnded(false); setBlocked(false)
  }
  const toggleMute = () => {
    const v = ref.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    sfx.tap()
  }
  const startPlain = () => { void ref.current?.play(); setBlocked(false); sfx.tap() }

  const label = ended ? 'Nochmal mit Ton' : mode === 'silent' ? 'Mit Ton ansehen' : muted ? 'Ton an' : 'Ton aus'
  const action = ended || mode === 'silent' ? withSound : toggleMute

  return (
    <m.div className="intro" role="dialog" aria-modal="true" aria-label="Begrüßung"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: '-5%', scale: 1.04, filter: 'blur(10px)' }} transition={{ duration: 0.8, ease: EASE }}>
      <div className="intro-bg" aria-hidden />
      <div className="intro-light" aria-hidden><i className="cone l" /><i className="cone r" /><i className="pool" /></div>

      <div className="intro-stage">
        <img className="intro-poster" src="/video/poster.webp" width="720" height="1280" alt="" fetchPriority="high" />
        <video
          ref={ref}
          className={`intro-video ${ready ? 'on' : ''}`}
          src="/video/intro.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          onPlaying={() => { setReady(true); setBlocked(false) }}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
          onEnded={() => { setEnded(true); setProgress(1); sfx.ding() }}
          onError={() => onClose(false)}
        />
        <div className="intro-prog" aria-hidden><i style={{ transform: `scaleX(${progress})` }} /></div>
        <div className="intro-vig" aria-hidden />
        {blocked && !ready && (
          <button className="intro-play" onClick={startPlain} aria-label="Video abspielen">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
      </div>

      <button className="intro-skip" onClick={() => { sfx.whoosh(); onClose(false) }}>Überspringen</button>

      <div className="intro-ui">
        <button className="intro-sound" onClick={action} aria-label={label}>
          {ended ? <Replay /> : <Speaker off={mode === 'sound' && muted} />}
          <span>{label}</span>
        </button>
        <button className={`btn btn-primary intro-go ${ended ? 'hot' : ''}`} onClick={() => { sfx.whoosh(); onClose(true) }}>
          Jetzt starten <Arrow className="arr down" />
        </button>
      </div>
    </m.div>
  )
}
