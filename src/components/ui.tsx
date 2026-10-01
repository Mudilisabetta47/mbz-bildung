import type { ReactNode } from 'react'
import { m } from 'framer-motion'

export const EASE = [0.16, 1, 0.3, 1] as const

/** AVIF → WebP, mit festen Maßen gegen Layout-Shift; object-fit schneidet statt zu verzerren. */
export function Pic({
  name,
  widths,
  alt = '',
  sizes = '100vw',
  eager = false,
  pos,
  className,
}: {
  name: string
  widths: number[]
  alt?: string
  sizes?: string
  eager?: boolean
  pos?: string
  className?: string
}) {
  const set = (ext: string) => widths.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(', ')
  const last = widths[widths.length - 1]
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`/img/${name}-${last}.webp`}
        alt={alt}
        className={className}
        style={pos ? { objectPosition: pos } : undefined}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
      />
    </picture>
  )
}

export const CAT_WIDTHS: Record<string, number[]> = {
  fleet: [640, 1280],
  bus: [640, 1280],
  fahrlehrer: [640, 1100],
  hero: [768, 1280],
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </m.div>
  )
}

export const Arrow = ({ className = '' }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const Tick = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
export const Phone = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
)
export const Close = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const ic = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
export const CatIcon = ({ id }: { id: string }) => {
  switch (id) {
    case 'lkw':
      return (<svg {...ic}><path d="M2 6h11v10H2zM13 9h4l4 3v4h-8" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>)
    case 'bus':
      return (<svg {...ic}><rect x="3" y="4" width="18" height="13" rx="2.5" /><path d="M3 11h18M7 17v2M17 17v2" /><circle cx="7.5" cy="14" r=".6" /><circle cx="16.5" cy="14" r=".6" /></svg>)
    case 'fahrlehrer':
      return (<svg {...ic}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.2" /><path d="M12 3v6.8M3.5 14.5l6.4-2M20.5 14.5l-6.4-2" /></svg>)
    case 'bkf':
      return (<svg {...ic}><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>)
    default:
      return (<svg {...ic}><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></svg>)
  }
}
export const TrackIcon = ({ id }: { id: string }) => {
  if (id === 'auslieferung') return (<svg {...ic}><path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5L12 12l9-4.5M12 12v9" /></svg>)
  if (id === 'citylogistik') return (<svg {...ic}><path d="M4 21V9l6-3v15M10 21V4l10 4v13M2 21h20M13 11h4M13 15h4" /></svg>)
  return <CatIcon id={id} />
}
