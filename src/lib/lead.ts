import { BACKEND } from './backend'
import { buildRow, makeRequestId, SOURCE, type Lead } from '../../shared/leadRow'

export type { Lead }

const CAMPAIGN = (import.meta.env.VITE_CAMPAIGN as string) || 'messe_2026'

async function post(url: string, body: unknown, headers: Record<string, string>, ms = 15000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

/** Direkt-Weg wie das Kontaktformular von metropol-bz.de (lokale Entwicklung bzw. falls /api/lead nicht erreichbar ist). */
async function direct(l: Lead): Promise<string> {
  const id = makeRequestId()
  const { row, name, course, message } = buildRow(l, CAMPAIGN, id)
  const h = { apikey: BACKEND.key, Authorization: `Bearer ${BACKEND.key}` }
  let res: Response | undefined
  for (let attempt = 0; attempt < 2 && !res?.ok; attempt++) {
    try {
      res = await post(`${BACKEND.url}/rest/v1/contact_requests`, row, { ...h, Prefer: 'return=minimal' })
      if (res.status >= 400 && res.status < 500) break
    } catch { /* Netzfehler → zweiter Versuch */ }
  }
  if (!res || !res.ok) throw new Error(`lead_insert_failed:${res?.status ?? 'network'}`)
  try {
    await post(`${BACKEND.url}/functions/v1/send-contact-notification`, { name, email: row.email, phone: row.phone ?? undefined, course, location: row.location_preference ?? undefined, message, source: SOURCE }, h, 8000)
  } catch { /* Lead ist gespeichert */ }
  return id
}

/**
 * Sendet die Anfrage an den eigenen Endpunkt `/api/lead` (Worker): speichert in `contact_requests`
 * (source = "messe", utm_campaign = "messe_2026") und verschickt die Mails (Resend, sonst bestehende Funktion).
 */
export async function submitLead(l: Lead): Promise<string> {
  let res: Response | undefined
  try {
    res = await post('/api/lead', l, {})
  } catch {
    res = undefined
  }
  if (res?.ok) {
    const j = (await res.json().catch(() => ({}))) as { id?: string }
    return j.id ?? ''
  }
  if (res && res.status !== 404 && res.status < 500) throw new Error(`lead_rejected:${res.status}`)
  if (res?.status === 502) throw new Error('lead_insert_failed:502')
  // Endpunkt nicht vorhanden (Dev) oder nicht erreichbar → direkter Weg
  return direct(l)
}
