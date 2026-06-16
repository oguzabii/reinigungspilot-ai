# Klarsa v0.5.11 — Workspace Cleanup & Simpler Money Flow

**Warum diese Version:** Der Inhaber meldete, der Arbeitsbereich sei zu
kompliziert: Test-/Altdaten aus früheren Läufen liessen sich nicht entfernen,
einige Texte wirkten wie Warnungen/Fehler, und der Hauptablauf war nicht klar.
v0.5.11 macht Klarsa zu einem **einfachen, funktionierenden Verkaufsbüro** statt
eines komplizierten Admin-Dashboards.

**Klarer Geld-Ablauf:** Firmen finden → Kontakte prüfen → E-Mail senden →
Nachfassen / Termin → Offerte / Auftrag.

**Reine UI + sichere Archiv-/Reset-Schreibvorgänge. Keine neue Migration.** Kein
Service-Role, keine Secrets, keine echten Kundendaten.
`supabase/verification/004_bind_auth_user_to_fake_tenant.sql` bleibt
**unangetastet**.

---

## 1. Archivieren / Entfernen (pro Eintrag)

Neuer, geteilter `ArchiveButton` + Aktion `archiveEntity`
(`app/app-shell/archive-actions.ts`) auf allen Arbeitslisten:

- **Firmen/Chancen** (Lead Hunter, Outreach), **Leads**, **Follow-ups**,
  **Offerten**, **Aufträge**.
- **Soft only:** Tabellen mit `deleted_at` (prospects/leads/offers/jobs) werden
  auf gelöscht gesetzt; **Follow-ups** (ohne `deleted_at`) auf Status `skipped`.
  **Nichts wird hart gelöscht.** Der Eintrag verschwindet aus allen aktiven
  Listen (alle filtern `deleted_at is null` bzw. Status ≠ skipped).
- Wording: „Aus Arbeitsliste" bzw. „Nicht relevant". Klares Erfolg-/Fehler-
  Feedback; keine kaputten Referenzen.
- Session-Client + RLS (Sales/Ops-Domäne) – nie Service-Role.

## 2. Cleanup / Reset des Arbeitsbereichs

Neue, owner/admin-only Route **`/app-shell/ceo/cleanup`** (verlinkt aus der
Chefansicht):

- **Vorschau-Zahlen**: Firmen/Chancen, Leads, Follow-ups, Offerten, Aufträge,
  bexio-Übergaben.
- **Tippbestätigung** `CLEAN24 RESET` (Button bleibt bis dahin deaktiviert).
- **Archiviert** (soft) alle aktiven Arbeitsdaten des Mandanten: prospects,
  leads, offers, jobs auf `deleted_at`; Follow-ups auf `skipped`. bexio-Übergaben
  verschwinden mit ihren archivierten Aufträgen aus der Liste.
- **Nie angerührt:** Betrieb/Tenant, Einstellungen, Dienstleistungen, Nutzer/
  Mitgliedschaften, Anmeldung/Auth, Paket – **und der Protokoll-/Audit-Verlauf**
  (es wird nur ein zusätzlicher Audit-Eintrag `workspace_reset` geschrieben).
- **Soft, nicht hart:** „Arbeitsdaten archivieren" statt endgültigem Löschen.

## 3. „In Lead Inbox übernehmen" ohne Sackgasse

Nach dem Übernehmen (oder wenn bereits übernommen) zeigt der Button jetzt klare
nächste Schritte statt einer toten Bestätigung:
**„Im Lead Inbox"** + **Lead öffnen** · **Follow-up planen** · **Offerte
vorbereiten**.

## 4. E-Mail-Versand sichtbar

Auf `/app-shell/revenue-autopilot/outreach`:
- Oben eine Kanal-Statuskarte: **„Versandkanal: SMTP / Resend"** bzw. **„Kanal
  nicht verbunden"** + Eingangskanal-Status.
- Pro Karte ein eindeutiger nächster Button bzw. der genaue Grund, wenn Senden
  nicht möglich ist: **„E-Mail senden"**, **„Kontaktangaben fehlen"** /
  „E-Mail-Adresse fehlt", **„Kanal verbinden"**, **„Senden ab Premium"**, nach
  Versand **„Gesendet"**.
- Einzelversand pro Klick bleibt: kein Bulk, kein Zeitplan, kein Hintergrund-
  Versand.

## 5. Ruhige Status-Texte statt Warnungen

Technische, warnungsartige Banner wurden durch ruhige Status-Hinweise ersetzt.
**Keine** Inhaber-Begriffe mehr wie RLS, Session-Client, Safe Mode, „kein
Scraping", „keine Integration", „manuell only" auf den Hauptseiten (Leads,
Offerten, Aufträge, bexio, Lead Hunter, Radar, Quellen, Chefansicht, Autopilot-
Banner). Stattdessen Business-Wording: „Kontrollierter Versand", „Kanal
verbunden/nicht verbunden", „nur Ihr Betrieb", „nachvollziehbar".

## 6. Einfacherer Einstieg (Cockpit)

`/app-shell` zeigt jetzt den klaren Ablauf:
- Hero **„Heute Geld holen"** (Premium: „Klarsa hat für Sie gearbeitet").
- Drei grosse Karten: **Firmen finden** → Discovery, **Kontakte & E-Mail** →
  Outreach, **Offerten & Aufträge** → Offer Engine.
- **Chefansicht** als eigener Einstieg.

Erweiterte Seiten (Radar, Quellen, Discovery-Details) bleiben erreichbar, sind
aber nicht mehr visuell dominant.

## Datenverhalten (Zusammenfassung)

| Aktion | Effekt |
| --- | --- |
| Archivieren (prospect/lead/offer/job) | `deleted_at = now()` (soft) |
| Archivieren (followup) | `status = 'skipped'` (soft) |
| Reset | wie oben für alle aktiven Einträge des Mandanten |
| Audit-Logs | nie gelöscht (Reset schreibt einen zusätzlichen Eintrag) |
| Tenant/Settings/Services/Users/Auth/Paket | nie angerührt |

## Sicherheits-Grenzen

- Soft-Archiv only; kein Hard-Delete; keine erzwungene Migration.
- Reset ist owner/admin-only mit Tippbestätigung.
- Session-Client + RLS für alle Schreibvorgänge, **kein Service-Role**.
- Kein Scraping, kein Bulk/Hintergrund-Versand, keine Buchung, keine bexio-API.
- Nicht der alte, eigenständige Clean24 Lead Autopilot.

## Nächster Schritt

**v0.5.12 — Contact Enrichment Autopilot oder IMAP Reply-Tracking:** entweder
Kontaktangaben für entdeckte Firmen anreichern (owner-bestätigt) oder eingehende
Antworten per IMAP erkennen und Outreach-Datensätzen zuordnen („Antwort
erhalten") – als Basis für Follow-up-/Termin-Automatik. Buchung nur nach
Bestätigung; Cold-Outreach bleibt gesperrt.
