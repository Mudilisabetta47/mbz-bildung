import { BACKEND } from './catalog'

export interface Lead {
  salutation: string
  firstName: string
  lastName: string
  birthDate: string
  birthPlace: string
  nationality: string
  maritalStatus: string
  street: string
  zip: string
  city: string
  phone: string
  mobile: string
  email: string
  heardFrom: string
  category: string
  course: string
  location: string
  message: string
}

const CAMPAIGN = (import.meta.env.VITE_CAMPAIGN as string) || 'messe_2026'
const SOURCE = 'messe'

const headers = {
  apikey: BACKEND.key,
  Authorization: `Bearer ${BACKEND.key}`,
  'Content-Type': 'application/json',
}

async function post(url: string, body: unknown, extra: Record<string, string> = {}, ms = 15000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body), signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/**
 * Überträgt die Anfrage in dieselbe Tabelle (`contact_requests`) wie das Kontaktformular von metropol-bz.de,
 * damit sie im Admin-System unter "Kontakte" erscheint. `source`/`utm_*` kennzeichnen die Messe.
 * Anschließend wird – wie auf der Hauptseite – die Benachrichtigungs-Mail ausgelöst (Fehler dort sind nicht kritisch).
 */
export async function submitLead(l: Lead): Promise<void> {
  const name = `${l.firstName.trim()} ${l.lastName.trim()}`
  const de = (d: string) => (d ? d.split('-').reverse().join('.') : '')
  // Felder des Papierformulars "Datenerfassung – Teilnehmer"; contact_requests hat dafür keine Spalten
  const lines: [string, string][] = [
    ['Anrede', l.salutation],
    ['Geburtstag', de(l.birthDate)],
    ['Geburtsort', l.birthPlace],
    ['Nationalität', l.nationality],
    ['Familienstand', l.maritalStatus],
    ['Straße, Hausnummer', l.street],
    ['PLZ, Ort', [l.zip, l.city].filter(Boolean).join(' ')],
    ['Telefon', l.phone],
    ['Handy', l.mobile],
    ['Aufmerksam geworden durch', l.heardFrom],
  ]
  const details = lines.filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v.trim()}`).join('\n')
  const msgBase = l.message.trim() || `Anfrage für: ${l.course}`
  const message = `${msgBase}\n\n— Messe-Anfrage (${CAMPAIGN}) · ${l.category} → ${l.course}\n${details}`
  const phone = (l.mobile || l.phone).trim()
  const row = {
    name,
    email: l.email.trim(),
    phone: phone || null,
    message,
    course_interest: l.course,
    location_preference: l.location || null,
    source: SOURCE,
    utm_source: SOURCE,
    utm_medium: 'qr',
    utm_campaign: CAMPAIGN,
  }

  let res: Response | undefined
  for (let attempt = 0; attempt < 2 && !res?.ok; attempt++) {
    try {
      res = await post(`${BACKEND.url}/rest/v1/contact_requests`, row, { Prefer: 'return=minimal' })
      if (res.status >= 400 && res.status < 500) break // Retry nur bei Netz-/5xx-Fehlern
    } catch {
      /* Netzfehler → zweiter Versuch */
    }
  }
  if (!res || !res.ok) throw new Error(`lead_insert_failed:${res?.status ?? 'network'}`)

  try {
    await post(`${BACKEND.url}/functions/v1/send-contact-notification`, {
      name,
      email: row.email,
      phone: row.phone ?? undefined,
      course: l.course,
      location: row.location_preference ?? undefined,
      message: message,
      source: SOURCE,
    }, {}, 8000)
  } catch {
    /* Lead ist gespeichert; Mail-Benachrichtigung ist Zusatz */
  }
}
