import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
mkdirSync('public/img', { recursive: true })
const jobs = [
  ['fleet-team-DPoPbaaJ.webp', 'hero', [192, 768, 1280, 1920]],
  ['fleet-vehicles-Dp-_Qf7o.jpg', 'fleet', [192, 640, 1280]],
  ['bus-metropol-B33sF9AE.jpg', 'bus', [192, 640, 1280]],
  ['fahrlehrer-slide-KNYuoOGI.png', 'fahrlehrer', [192, 640, 1100]],
  ['regina-martin-D96uDswi.png', 'team', [480]],
]
for (const [src, name, widths] of jobs) {
  for (const w of widths) {
    const img = sharp(`assets-src/${src}`).resize({ width: w, withoutEnlargement: true })
    await img.clone().avif({ quality: 55, effort: 6 }).toFile(`public/img/${name}-${w}.avif`)
    await img.clone().webp({ quality: 74 }).toFile(`public/img/${name}-${w}.webp`)
  }
}
// Hero-Hochformat-Ausschnitt für Handys (statt Desktop-Bild mit 230vw)
for (const w of [520, 700]) {
  const img = sharp('assets-src/fleet-team-DPoPbaaJ.webp').extract({ left: 640, top: 0, width: 700, height: 1080 }).resize({ width: w })
  await img.clone().avif({ quality: 52, effort: 6 }).toFile(`public/img/heroM-${w}.avif`)
  await img.clone().webp({ quality: 70 }).toFile(`public/img/heroM-${w}.webp`)
}
// Logo: Original (dunkler Untertitel) bleibt unverändert, zusätzlich Favicon/Touch-Icon
await sharp('assets-src/logo-metropol-C66mY4ex.png').resize({ width: 590 }).webp({ quality: 90 }).toFile('public/img/logo.webp')
await sharp('assets-src/logo-metropol-C66mY4ex.png').png().toFile('public/img/logo.png')
await sharp('assets-src/logo-metropol-C66mY4ex.png').extract({ left: 0, top: 0, width: 130, height: 70 }).resize(180, 180, { fit: 'contain', background: '#ffffff' }).png({ palette: true, quality: 80, effort: 10 }).toFile('public/icon.png')
console.log('done')
