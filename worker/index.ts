// Cloudflare Worker: liefert die statische App aus (Assets) und verarbeitet POST /api/lead.
// Secrets/Variablen (Cloudflare → Worker → Einstellungen → Variablen und Geheimnisse):
//   RESEND_API_KEY (Secret)  – ohne Key wird die bestehende Funktion send-contact-notification genutzt
//   MAIL_FROM (optional)     – z. B. "METROPOL Bildungszentrum <messe@metropol-bz.de>"
//   MAIL_TO   (optional)     – Empfänger der Zentrale, Standard info@metropol-bz.de
import kundeHtml from '../mail-templates/kunde.html'
import zentraleHtml from '../mail-templates/zentrale.html'
import { buildRow, type Lead } from '../shared/leadRow'

interface Env {
  ASSETS: { fetch(r: Request): Promise<Response> }
  RESEND_API_KEY?: string
  MAIL_FROM?: string
  MAIL_TO?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  CAMPAIGN?: string
  RESEND_URL?: string
}

const DEFAULT_URL = 'https://fhamgdtnxssmmsdfalum.supabase.co'
// Öffentlicher anon key (identisch im Frontend von metropol-bz.de)
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYW1nZHRueHNzbW1zZGZhbHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjg2NDQsImV4cCI6MjA4NTY0NDY0NH0.TTjyv5n2JxcwVTFzTNPBlEy-ZfxClEmQSoOgtwasjis'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k === 'nachricht' ? esc(vars[k] ?? '').replace(/\n/g, '<br>') : esc(vars[k] ?? '')))
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function sanitize(b: any): Lead | null {
  if (!b || typeof b !== 'object') return null
  const l: Lead = {
    payMode: str(b.payMode, 40), payer: str(b.payer, 120), track: str(b.track, 80), path: str(b.path, 80),
    modules: Array.isArray(b.modules) ? b.modules.slice(0, 20).map((x: unknown) => str(x, 80)).filter(Boolean) : [],
    salutation: str(b.salutation, 20), firstName: str(b.firstName, 80), lastName: str(b.lastName, 80),
    birthDate: str(b.birthDate, 10), birthPlace: str(b.birthPlace, 80), nationality: str(b.nationality, 60), maritalStatus: str(b.maritalStatus, 60),
    street: str(b.street, 120), zip: str(b.zip, 5), city: str(b.city, 80), phone: str(b.phone, 40), mobile: str(b.mobile, 40),
    email: str(b.email, 160), heardFrom: str(b.heardFrom, 60), location: str(b.location, 40) || 'Hannover', message: str(b.message, 1000),
  }
  if (l.firstName.length < 2 || l.lastName.length < 2 || !EMAIL_RE.test(l.email) || !l.track || !l.payMode) return null
  if (!l.mobile && !l.phone) return null
  return l
}

async function sendMail(env: Env, to: string, subject: string, html: string, replyTo: string) {
  const r = await fetch(env.RESEND_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'METROPOL Bildungszentrum <messe@metropol-bz.de>',
      to: [to], subject, html, reply_to: replyTo,
    }),
  })
  return r.ok
}

export async function handleLead(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return json({ ok: false, error: 'origin' }, 403)
  let body: unknown
  try { body = await req.json() } catch { return json({ ok: false, error: 'json' }, 400) }
  const lead = sanitize(body)
  if (!lead) return json({ ok: false, error: 'invalid' }, 400)

  const url = env.SUPABASE_URL || DEFAULT_URL
  const key = env.SUPABASE_ANON_KEY || DEFAULT_KEY
  const campaign = env.CAMPAIGN || 'messe_2026'
  const { name, course, pay, message, row } = buildRow(lead, campaign)

  const ins = await fetch(`${url}/rest/v1/contact_requests`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  })
  if (!ins.ok) return json({ ok: false, error: 'store', status: ins.status }, 502)

  const mail = { zentrale: false, kunde: false, via: 'none' as string }
  if (env.RESEND_API_KEY) {
    const to = env.MAIL_TO || 'info@metropol-bz.de'
    const vars: Record<string, string> = {
      vorname: lead.firstName, name, anrede: lead.salutation, ausbildung: course, bezahlung: pay,
      handy: lead.mobile || '–', telefon: lead.phone || '–', email: lead.email, bausteine: lead.modules.join(', ') || '–',
      geburtstag: lead.birthDate ? lead.birthDate.split('-').reverse().join('.') : '–', geburtsort: lead.birthPlace || '–',
      nationalitaet: lead.nationality || '–', familienstand: lead.maritalStatus || '–',
      strasse: lead.street || '–', plz: lead.zip, ort: lead.city || '–', aufmerksam: lead.heardFrom || '–',
      datum: new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }) + ' Uhr',
      nachricht: lead.message || '–', title: '', footer: '',
    }
    mail.via = 'resend'
    try {
      mail.zentrale = await sendMail(env, to, `Neue Messe-Anfrage: ${name} · ${course}`, render(zentraleHtml, vars), lead.email)
      mail.kunde = await sendMail(env, lead.email, 'Deine Anfrage beim METROPOL Bildungszentrum', render(kundeHtml, vars), to)
    } catch { /* Lead ist gespeichert */ }
  } else {
    // Ohne Resend-Key: bestehende Benachrichtigung der Hauptseite
    mail.via = 'legacy'
    try {
      const r = await fetch(`${url}/functions/v1/send-contact-notification`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: lead.email, phone: row.phone ?? undefined, course, location: row.location_preference ?? undefined, message, source: 'messe' }),
      })
      mail.zentrale = mail.kunde = r.ok
    } catch { /* ignore */ }
  }
  return json({ ok: true, mail })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url)
    if (pathname === '/api/lead') {
      if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405)
      return handleLead(req, env)
    }
    return env.ASSETS.fetch(req)
  },
}
