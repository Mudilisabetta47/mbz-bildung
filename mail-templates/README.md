# E-Mail-Vorlagen (Kunde und Zentrale)

Mail-sichere HTML-Vorlagen (Tabellen, Inline-Styles) im Marken-Look mit Signatur. Platzhalter in `{{doppelten Klammern}}`.

- `kunde.html`: Bestätigung an den Teilnehmer
- `zentrale.html`: Anfrage-Übersicht für die Zentrale

Das Logo wird von `https://messe.metropol-bz.de/img/logo.png` geladen.
Die Mails verschickt aktuell die Funktion `send-contact-notification` im Supabase-Projekt von metropol-bz.de.
Diese Vorlagen dort einsetzen oder einen eigenen Versand anbinden.
