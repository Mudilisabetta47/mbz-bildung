/** Gemeinsame Aufbereitung des Leads für Browser-Fallback und Worker (kein Vite/Cloudflare-spezifischer Code). */
export interface Lead {
  payMode: string
  payer: string
  track: string
  path: string
  modules: string[]
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
  location: string
  message: string
}

export const SOURCE = 'messe'

const de = (d: string) => (d ? d.split('-').reverse().join('.') : '')

export function buildRow(l: Lead, campaign: string) {
  const name = `${l.firstName.trim()} ${l.lastName.trim()}`
  const course = l.path ? `${l.track} (${l.path})` : l.track
  const pay = l.payMode + (l.payer ? ` (${l.payer})` : '')
  const lines: [string, string][] = [
    ['Kostenpunkt', pay],
    ['Ausbildung', course],
    ['Bausteine', l.modules.join(', ')],
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
  const msgBase = l.message.trim() || `Anfrage für: ${course}`
  const message = `${msgBase}\n\n— Messe-Anfrage (${campaign})\n${details}`
  const phone = (l.mobile || l.phone).trim()
  return {
    name,
    course,
    pay,
    message,
    row: {
      name,
      email: l.email.trim(),
      phone: phone || null,
      message,
      course_interest: course,
      location_preference: l.location || null,
      source: SOURCE,
      utm_source: SOURCE,
      utm_medium: 'qr',
      utm_campaign: campaign,
    },
  }
}
