type Params = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined
let booted = false

function boot() {
  if (booted) return
  booted = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    // gtag erwartet das arguments-Objekt, kein Array
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  if (!GA_ID) return
  // Consent Mode v2: ohne Einwilligung keine Cookies, nur cookielose Pings
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
  document.head.appendChild(s)
}

export type EventName =
  | 'page_view'
  | 'course_view'
  | 'course_selected'
  | 'form_started'
  | 'form_completed'
  | 'lead_submitted'
  | 'lead_success'
  | 'lead_error'

const base = { source: 'messe', campaign: import.meta.env.VITE_CAMPAIGN || 'messe_2026' }

export function track(event: EventName, params: Params = {}) {
  try {
    boot()
    const payload = { ...base, ...params }
    if (GA_ID) window.gtag?.('event', event, payload)
    else window.dataLayer!.push({ event, ...payload })
    if (import.meta.env.DEV) console.debug('[track]', event, payload)
  } catch {
    /* Tracking darf nie die UI stören */
  }
}
