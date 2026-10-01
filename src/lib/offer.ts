/** Messe-Angebot laut interner Übersicht (Papier "Kursteilnahme / Einstiegsmöglichkeiten"). */
export type TrackId = 'auslieferung' | 'citylogistik' | 'fahrlehrer' | 'lkw' | 'bus'

export interface PathOption {
  id: 'modular' | 'tq'
  name: string
  sub: string
}

export interface Track {
  id: TrackId
  name: string
  chips: string
  img: string
  imgW: number[]
  pos: string
  needs: string[]
  start: string
  paths?: PathOption[]
  modules?: string[]
}

export const TRACKS: Track[] = [
  {
    id: 'lkw',
    name: 'LKW-Fahrer/in',
    chips: 'Modular oder TQ',
    img: 'fleet', imgW: [192], pos: '15% 55%',
    needs: ['Mindestens 21 Jahre', 'Führerschein Klasse B'],
    start: 'Modular: Einstieg jeden ersten Montag im Monat',
    paths: [
      { id: 'modular', name: 'Modular', sub: 'Individuell zusammenstellbar' },
      { id: 'tq', name: 'TQ1 Güterbeförderung', sub: 'Feste Maßnahme inkl. Praktikum' },
    ],
    modules: ['Klasse C1', 'Klasse C1E', 'Klasse C', 'Klasse CE', 'Ladungssicherung', 'ADR Basis', 'ADR Tank', 'Perfektions- und Rangertraining', 'Umbrücktraining', 'Beschleunigte Grundqualifikation'],
  },
  {
    id: 'bus',
    name: 'Busfahrer/in',
    chips: 'Modular oder TQ',
    img: 'bus', imgW: [192], pos: '50% 55%',
    needs: ['Mindestens 24 Jahre', 'Führerschein Klasse B (unter oder über 2 Jahre)', 'Deutsch mindestens B1'],
    start: 'Modular: Einstieg jeden ersten Montag im Monat',
    paths: [
      { id: 'modular', name: 'Modular', sub: 'Individuell zusammenstellbar' },
      { id: 'tq', name: 'TQ Personenbeförderung', sub: 'Feste Maßnahme inkl. Praktikum' },
    ],
    modules: ['FQN (beschleunigte Grundqualifikation)', 'Perfektionstraining', 'Klasse D', 'Klasse DE', 'Ladungssicherung'],
  },
  {
    id: 'fahrlehrer',
    name: 'Fahrlehrer/in',
    chips: 'Schule und Praktikum',
    img: 'fahrlehrer', imgW: [192], pos: '50% 30%',
    needs: [
      'Mindestens 21 Jahre',
      'Mindestens 3 Jahre Klasse B',
      'Klasse BE (auch nachträglich bei uns)',
      'Keine Punkte in Flensburg',
      'Abgeschlossene Ausbildung oder mind. Fachabitur',
      'Deutsch mindestens B1',
    ],
    start: 'Nächster Kurs ab 11.01.2027',
  },
  {
    id: 'citylogistik',
    name: 'City-Logistiker/in',
    chips: 'Klasse B/BE',
    img: 'hero', imgW: [192], pos: '78% 60%',
    needs: ['Mindestens 18 Jahre', 'Führerschein Klasse B oder BE', 'Inklusive ADR Basis'],
    start: 'Einstieg jeden ersten Montag im Monat',
  },
  {
    id: 'auslieferung',
    name: 'Auslieferungsfahrer/in',
    chips: 'Klasse B',
    img: 'hero', imgW: [192], pos: '22% 60%',
    needs: ['Mindestens 18 Jahre', 'Führerschein Klasse B'],
    start: 'Einstieg jeden ersten Montag im Monat',
  },
]

