# METROPOL Bildungszentrum – Messe-Seite

Eigenständige, statisch deploybare Messe-Webseite (Vite + React + Framer Motion). Läuft unabhängig von metropol-bz.de
und bindet sich nur für Kurse (lesend) und Lead-Übertragung (Insert) an das bestehende Backend an.

## Entwickeln

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # erzeugt dist/ (statisch, überall hostbar)
npm run images     # erzeugt AVIF/WebP aus assets-src/ neu
```

## Intro-Video und Töne

Beim ersten Öffnen läuft ein Begrüßungs-Intro im Studiolicht (`src/components/Intro.tsx`): stumm automatisch, Ton auf Tipp,
Button "Jetzt starten" bringt direkt zum Fragebogen. Dateien in `public/video/` (siehe dort), Erzeugung aus dem iPhone-Original per `scripts/video.sh`
(braucht ffmpeg). `?intro=1` erzwingt das Intro, `?intro=0` überspringt es. Bei "Bewegung reduzieren" und Datensparmodus entfällt es.
UI-Töne (`src/lib/sfx.ts`) werden per Web Audio erzeugt, sind leise und über den Lautsprecher-Knopf im Header abschaltbar.

## Ablauf (Fragebogen)

1. Woran hast du Interesse? Ausbildung: LKW-Fahrer/in, Busfahrer/in, Fahrlehrer/in, City-Logistiker/in, Auslieferungsfahrer/in (Angebot laut Messe-Übersicht, `src/lib/offer.ts`)
2. Nur LKW/Bus: Modular oder TQ, bei Modular die Bausteine
3. Deine Daten inkl. Kostenpunkt (Selbstzahler oder Kostenübernahme mit selbst eingetragenem Kostenträger), Kontakt, Absenden. Standort ist fest Hannover.

## Backend-Anbindung (bestehendes Supabase von metropol-bz.de)

- Leads: `POST /rest/v1/contact_requests` mit `source = "messe"`, `utm_source = "messe"`, `utm_medium = "qr"`,
  `utm_campaign = "messe_2026"`, danach `send-contact-notification` (Mail), wie beim Kontaktformular der Hauptseite.
- Felder ohne eigene Spalte (Kostenträger, Ausbildung, Bausteine, Anrede, Geburtstag, Adresse usw.) stehen strukturiert in `message`.
  Mit neuen Spalten nur `src/lib/lead.ts` anpassen.
- Konfiguration über `.env` (siehe `.env.example`).

## QR-Codes pro Ausbildung

`https://<domain>/?ausbildung=lkw` (weitere: `bus`, `fahrlehrer`, `citylogistik`, `auslieferung`) startet mit vorgewählter Ausbildung.

`https://<domain>/?kurs=<slug>` öffnet direkt die Kursdetails, z. B. `?kurs=c-ce`, `?kurs=d-de`.

## Tracking

Events (`window.dataLayer` bzw. GA4, wenn `VITE_GA_ID` gesetzt ist): `page_view`, `course_view`, `course_selected`,
`form_started`, `form_completed`, `lead_submitted`, `lead_success` (+ `lead_error`). Alle mit `source=messe`, `campaign=messe_2026`.
GA4 läuft im Consent Mode v2 (`denied`, cookielos). Für Marketing-Cookies zusätzlich eine Einwilligung einholen.

## Deployment (Subdomain)

Cloudflare (DNS liegt dort): Repo verbinden, Build-Befehl `npm run build`, Bereitstellungsbefehl `npx wrangler deploy` (Konfiguration in `wrangler.jsonc`), Custom Domain `messe.metropol-bz.de`. Alternativ jedes statische Hosting. Build-Befehl `npm run build`, Ausgabe `dist`.
SPA-Fallback auf `index.html`. `noindex` ist gesetzt (Meta, `robots.txt`, `X-Robots-Tag` in `_headers`/`vercel.json`).
DNS: CNAME der Subdomain (z. B. `messe`) auf das Hosting-Ziel; HTTPS stellt das Hosting automatisch aus.
Die Hauptdomain wird nicht angefasst.
