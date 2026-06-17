# Klarsa v0.5.12 — Compact Money Flow & Contact Enrichment

**Ziel:** Klarsa soll einfach und nützlich sein – **ein** Verkaufs-Ablauf statt
vieler Module. Der Inhaber muss nichts über „Module" verstehen, sondern sieht:

> **Firmen finden → Kontakt automatisch finden → E-Mail senden → Nachfassen/
> Termin → Offerte/Auftrag**

**Reine UI + Helfer + sichere Schreibvorgänge. Keine neue Migration** (nutzt die
Kontaktfelder aus 007). Session-Client + RLS, kein Service-Role, keine Secrets.
`supabase/verification/004_bind_auth_user_to_fake_tenant.sql` bleibt
**unangetastet**.

---

## 1. Kompakter Ablauf

`/app-shell` zeigt den **Verkaufs-Ablauf** als fünf kompakte Schritte
(`components/app-shell/CompactFlow.tsx`) – je mit **Zahl, Status und einem
Button**:

| Schritt | Zahl | Button → |
| --- | --- | --- |
| Firmen finden | Firmen im Radar | Discovery |
| Kontakt finden | Kandidaten ohne Kontakt | Outreach |
| E-Mail senden | bereit zum Versand | Outreach |
| Nachfassen | offene Leads ohne Follow-up | Lead Inbox |
| Offerte/Auftrag | offene Offerten/Aufträge | Offer Engine |

Die alte, doppelte „Umsatz-Kette" wurde entfernt – ein Ablauf, nicht zwei
Trichter. Erweiterte Seiten (Radar, Quellen, Discovery-Details) bleiben
erreichbar, aber nicht dominant.

## 2. Contact Enrichment Autopilot

Neuer Helfer `lib/outreach/contact-enrichment.ts`: für einen Kandidaten findet
Klarsa **E-Mail, Telefon, Website, Kontaktperson** und füllt **nur leere** Felder
(007: `contact_email/phone/website/person`). Aufruf über die Aktion
`enrichProspectContact` (Pro+).

## 3. Quellen (sicher, in dieser Reihenfolge)

- **A) Vorhandene Discovery-Daten** – Website aus dem gespeicherten Grund/Feld.
- **B) Google Places (offiziell)** – nur wenn `GOOGLE_PLACES_API_KEY` gesetzt ist:
  Website + Telefon aus dem Top-Treffer. Kein Scraping. (Die Discovery speichert
  Telefon/Website jetzt direkt beim Anlegen – günstige Auto-Anreicherung.)
- **C) Eigene öffentliche Website** des Kandidaten – nur ein **winziges, festes**
  Set öffentlicher Seiten: Start, `/kontakt`, `/impressum`, `/contact`. Extrahiert
  E-Mail/Telefon/Kontaktseite (und offensichtliche Kontaktperson).
- **D) ZEFIX / local.ch / search.ch** – **nicht** implementiert; künftige,
  freigegebene/konforme Adapter (kein unkontrolliertes Scraping).

## 4. Harte Grenzen (Quelle C)

- **max. 4 Seiten**, je **5 s Timeout**, **nur `text/html`**, Größen-Limit
  (~400 KB Text, 2 MB Antwort), früher Abbruch sobald E-Mail+Telefon gefunden.
- **Kein Headless-Browser, kein PDF, kein Login, kein Formular-Versand, kein
  Crawlen beliebiger Links** – nur das feste Seiten-Set auf der eigenen Domain.
- **SSRF-Schutz**: nur öffentliche `http(s)`-Hosts; `localhost`/private/Link-Local-
  Adressen werden blockiert.
- Schlüssel/Werte werden nie geloggt; im Audit nur **Flags + Quellen** (keine PII).

## 5. Integration in Outreach

`/app-shell/revenue-autopilot/outreach` ist enrichment-first:

- Kartenstatus: **E-Mail gefunden · Telefon gefunden · Website gefunden ·
  Kontakt fehlt** (und transient „Quelle nicht erreichbar" nach einem Lauf).
- Buttons: **„Kontakt automatisch finden"**, **„E-Mail senden"** (wenn E-Mail +
  Kanal + Premium), **„Anrufen"** (wenn Telefon), **„Website öffnen"** (wenn
  Website), **„Aus Arbeitsliste"** (v0.5.11). Manuelle Kontakt-Bearbeitung bleibt,
  ist aber **sekundär** (eingeklappt).

## 6. Was ist jetzt automatisch?

- **Discovery** speichert Telefon/Website direkt beim Anlegen (alle, die Discovery
  ausführen dürfen).
- **Premium/Internal Founder**: tiefere Anreicherung (B + Website-Fetch) ist die
  Vollausbau-Stufe; heute pro Kandidat per **„Kontakt automatisch finden"**.
- **Pro**: geführte Ein-Klick-Anreicherung (gleicher Button).
- **Starter**: gesperrt (kein Outreach-Zugang).
- **Keine versteckten Cron-/Hintergrund-Jobs** – jede Anreicherung ist
  owner-/nutzer-ausgelöst.

## 7. Versand-Sichtbarkeit

Kanal-Status oben sichtbar (**SMTP/Resend** verbunden / **Kanal nicht
verbunden**). Fehlt der Versand-Button, steht der Grund da: **E-Mail fehlt**,
**Kanal nicht verbunden**, **Senden ab Premium**, **bereits kontaktiert**. Kein
versteckter Button.

## 8. Cleanup/Reset (unverändert)

Die v0.5.11-Bereinigung (`/app-shell/ceo/cleanup`, Tippbestätigung) bleibt
unverändert. Archivierte/zurückgesetzte Einträge verschwinden aus dem aktiven
Ablauf (alle Listen filtern soft-gelöschte Einträge).

## Sicherheits-Grenzen (Zusammenfassung)

- Kein unkontrolliertes Scraping, kein Headless/PDF/Login/Formular, kein
  Crawlen; Quelle C ist hart gedeckelt + SSRF-geschützt.
- Kein Bulk/Spam, kein Hintergrund-Versand, keine Buchung, keine bexio-API.
- Session-Client + RLS, **kein Service-Role**; keine Secrets im Repo; keine echten
  Kundendaten im Repo/Docs.
- Nicht der alte, eigenständige Clean24 Lead Autopilot.

## Geänderte/neue Dateien

**Neu:** `lib/outreach/contact-enrichment.ts`,
`app/app-shell/revenue-autopilot/outreach/EnrichContactButton.tsx`,
`components/app-shell/CompactFlow.tsx`,
`docs/clean24-compact-money-flow-contact-enrichment.md`.

**Geändert:** `lib/discovery/google-places.ts` (Telefon im Field-Mask + Candidate),
`app/app-shell/revenue-autopilot/discovery/actions.ts` (Telefon/Website speichern),
`app/app-shell/revenue-autopilot/outreach/{actions.ts,page.tsx}` (Enrichment +
Karten-Status + Anrufen/Website), `app/app-shell/page.tsx` (kompakter Ablauf,
ohne doppelte Kette), `README.md`.

## Nächster Schritt

**v0.5.13 — IMAP Reply-Tracking + Follow-up/Appointment Autopilot:** eingehende
Antworten (IMAP) owner-getriggert erkennen und Outreach-Datensätzen zuordnen
(„Antwort erhalten"), darauf aufbauend Follow-ups/Termine. Buchung nur nach
Bestätigung; Cold-Outreach bleibt gesperrt.
