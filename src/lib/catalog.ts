import snapshot from '../data/courses.snapshot.json'

export interface Course {
  id: string
  slug: string
  title: string
  short: string
  description: string
  category: CategoryId
  duration: string | null
  price: string | null
  requirements: string | null
  benefits: string[]
}

export type CategoryId = 'lkw' | 'bus' | 'fahrlehrer' | 'bkf' | 'sonstige'

export interface Category {
  id: CategoryId
  name: string
  tagline: string
  img: string
  pos: string
}

/** Hauptkurse = Kategorien aus der `courses`-Tabelle von metropol-bz.de, Reihenfolge fürs Messe-Publikum. */
export const CATEGORIES: Category[] = [
  { id: 'lkw', name: 'LKW', tagline: 'Führerschein C/CE und C1/C1E', img: 'fleet', pos: '18% 55%' },
  { id: 'bus', name: 'Bus', tagline: 'Führerschein D/DE', img: 'bus', pos: '50% 60%' },
  { id: 'bkf', name: 'BKF-Weiterbildung', tagline: 'Module 1–5 nach BKrFQG', img: 'fleet', pos: '88% 55%' },
  { id: 'fahrlehrer', name: 'Fahrlehrer', tagline: 'Ausbildung & Fortbildung', img: 'fahrlehrer', pos: '50% 35%' },
  { id: 'sonstige', name: 'Qualifizierung', tagline: 'Citylogistiker, Auslieferungsfahrer & mehr', img: 'hero', pos: '50% 60%' },
]

const stripGender = (t: string) => t.replace(/\s*\(m\/w\/d\)/g, '')

/** Anzeigename: Zusatz "(m/w/d)" und "für Berufskraftfahrer/Busfahrer" entfernen. */
export function shortTitle(title: string): string {
  return stripGender(title)
    .replace(/\s+für\s+(Berufskraftfahrer|Busfahrer)\s*$/i, '')
    .trim()
}

interface Raw {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  duration_info: string | null
  price_info: string | null
  requirements: string | null
  benefits: string[] | null
  is_active?: boolean
}

function normalize(rows: Raw[]): Course[] {
  const seen = new Set<string>()
  const out: Course[] = []
  for (const r of rows) {
    if (r.is_active === false) continue
    if (!CATEGORIES.some((c) => c.id === r.category)) continue
    // Dubletten in der Quelldatenbank (gleicher Titel) nur einmal zeigen
    const key = r.title.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      id: r.id,
      slug: r.slug,
      title: stripGender(r.title),
      short: shortTitle(r.title),
      description: r.description ?? '',
      category: r.category as CategoryId,
      duration: r.duration_info,
      price: r.price_info,
      requirements: r.requirements,
      benefits: Array.isArray(r.benefits) ? r.benefits : [],
    })
  }
  return out.sort((a, b) => a.short.localeCompare(b.short, 'de', { numeric: true }))
}

export const snapshotCourses: Course[] = normalize(snapshot as Raw[])

const URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://fhamgdtnxssmmsdfalum.supabase.co'
// Öffentlicher anon key (steckt identisch im Frontend von metropol-bz.de); Zugriff regelt RLS.
const KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYW1nZHRueHNzbW1zZGZhbHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjg2NDQsImV4cCI6MjA4NTY0NDY0NH0.TTjyv5n2JxcwVTFzTNPBlEy-ZfxClEmQSoOgtwasjis'

export const BACKEND = { url: URL, key: KEY }

/** Live-Kurse; bei Fehler bleibt der Snapshot (Seite funktioniert offline-tolerant am Messestand). */
export async function fetchLiveCourses(signal?: AbortSignal): Promise<Course[] | null> {
  try {
    const r = await fetch(
      `${URL}/rest/v1/courses?select=id,slug,title,description,category,duration_info,price_info,requirements,benefits,is_active&is_active=eq.true`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, signal },
    )
    if (!r.ok) return null
    const rows = (await r.json()) as Raw[]
    const list = normalize(rows)
    return list.length ? list : null
  } catch {
    return null
  }
}

export const LOCATIONS = [
  { value: 'Hannover', label: 'Hannover', sub: 'Vahrenwalder Str. 213' },
  { value: 'Bremen', label: 'Bremen', sub: 'Bahnhofsplatz 41' },
  { value: 'Garbsen', label: 'Garbsen', sub: 'Planetenring 25–27' },
  { value: 'Flexibel / Alle Standorte', label: 'Egal', sub: 'Flexibel' },
]
