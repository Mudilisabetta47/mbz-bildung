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

## Intro-Video

Datei `public/video/intro.mp4` (optional zusätzlich `intro.webm`) ablegen, committen, deployen. Empfehlung: H.264, 1080p/720p,
8–15 Sek. Loop, unter 8 MB. Das Video startet stumm automatisch im Hero. Ohne Datei, bei Datensparmodus oder "Bewegung reduzieren" wird das Foto gezeigt.
Komprimieren z. B.: `ffmpeg -i original.mov -vf scale=1280:-2 -an -c:v libx264 -crf 28 -preset slow -movflags +faststart public/video/intro.mp4`

## Backend-Anbindung (bestehendes Supabase von metropol-bz.de)

- Kurse: `GET /rest/v1/courses` (live, mit eingebautem Snapshot als Fallback) und `course_dates` für Termine.
- Leads: `POST /rest/v1/contact_requests` mit `source = "messe"`, `utm_source = "messe"`, `utm_medium = "qr"`,
  `utm_campaign = "messe_2026"`, danach `send-contact-notification` (Mail), wie beim Kontaktformular der Hauptseite.
- Zusatzfelder des Papierformulars (Anrede, Geburtstag, Geburtsort, Nationalität, Familienstand, Adresse, Telefon/Handy, "aufmerksam geworden durch")
  haben in `contact_requests` keine eigenen Spalten und werden strukturiert in `message` übertragen.
  Wenn dafür Spalten angelegt werden, nur `src/lib/lead.ts` anpassen.
- Konfiguration über `.env` (siehe `.env.example`).

## QR-Codes pro Kurs

`https://<domain>/?kurs=<slug>` öffnet direkt die Kursdetails, z. B. `?kurs=c-ce`, `?kurs=d-de`.

## Tracking

Events (`window.dataLayer` bzw. GA4, wenn `VITE_GA_ID` gesetzt ist): `page_view`, `course_view`, `course_selected`,
`form_started`, `form_completed`, `lead_submitted`, `lead_success` (+ `lead_error`). Alle mit `source=messe`, `campaign=messe_2026`.
GA4 läuft im Consent Mode v2 (`denied`, cookielos). Für Marketing-Cookies zusätzlich eine Einwilligung einholen.

## Deployment (Subdomain)

Cloudflare Pages (empfohlen, DNS liegt dort): Repo verbinden, Build `npm run build`, Ausgabe `dist`, Variable `NODE_VERSION=22`, Custom Domain `messe.metropol-bz.de`. Alternativ jedes statische Hosting. Build-Befehl `npm run build`, Ausgabe `dist`.
SPA-Fallback auf `index.html`. `noindex` ist gesetzt (Meta, `robots.txt`, `X-Robots-Tag` in `_headers`/`vercel.json`).
DNS: CNAME der Subdomain (z. B. `messe`) auf das Hosting-Ziel; HTTPS stellt das Hosting automatisch aus.
Die Hauptdomain wird nicht angefasst.
