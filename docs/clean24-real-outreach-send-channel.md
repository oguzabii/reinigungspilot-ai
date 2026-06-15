# Klarsa v0.5.9 — Controlled Outreach Send Channel MVP

**Ziel:** Klarsa geht von **kopier-only** zu **kontrolliertem echtem Versand** für
Premium – die erste echte Geld-Ausführung. Das ist **kein** Massenversand, **kein**
Spam, **kein** verstecktes Auto-Senden: **eine** ausgewählte Nachricht an **einen**
Empfänger, pro **explizitem Klick** des Inhabers, über einen **konfigurierten**
Provider.

**Nur E-Mail in diesem Schritt.** Kein WhatsApp, keine Buchung, keine bexio-API,
kein Bulk, kein geplanter/Hintergrund-Versand, kein Cold-Outreach. Tenant-Writes
laufen über den **Session-Client (RLS)**, nie Service-Role; keine Secrets im Repo.
`supabase/verification/004_bind_auth_user_to_fake_tenant.sql` bleibt
**unangetastet**.

---

## Was v0.5.9 hinzufügt

- **Kontaktfelder für Kandidaten** (Migration 007, additiv/idempotent):
  `prospects.contact_email/contact_phone/contact_website/contact_person/
  last_contacted_at` (alle nullable). `leads` hatten Kontaktfelder bereits; jetzt
  auch `prospects`, damit ein Mensch die freigegebene Kontaktangabe hinterlegen
  kann.
- **Kontakt-Editor** auf den Outreach-Karten: fehlt eine E-Mail, zeigt die Karte
  „Kontaktangaben fehlen" und ein kleines Formular (E-Mail/Telefon/Website/
  Ansprechperson) → `updateProspectContact` (Session-Client/RLS).
- **Provider-Abstraktion** `lib/outreach/send-provider.ts`: `isSendConfigured()` +
  `sendEmail()` über die **offizielle Resend-REST-API** (kein SMTP-Paket, keine
  neue Dependency). Ohne `RESEND_API_KEY` + `RESEND_FROM_EMAIL` → „Kanal nicht
  verbunden", Senden deaktiviert. Schlüssel nie geloggt / nie zum Client.
- **Owner-approved Einzelversand** `sendOutreachMessage` (Server-Action):
  Premium-only; ein Empfänger; Empfänger = die **gespeicherte** E-Mail des
  Kandidaten (server-seitig gelesen, nie client-geliefert); Body = der
  **deterministisch neu gebaute** Entwurf (kein Client-Inhalt); validiert E-Mail/
  Betreff/Text; schreibt Audit; setzt `status='contacted'` + `last_contacted_at`;
  ruhige Erfolg/Fehler-Meldung.

## Package Gating

| Paket | Versand |
| --- | --- |
| **Starter** | Outreach gesperrt (Upgrade-Teaser). |
| **Pro** | Vorbereiten/Kopieren + Freigabe-Workflow; **kein** automatischer Versand. Karte zeigt „Senden ab Premium". |
| **Premium / internal_founder** | **Echter Einzelversand** je Karte (E-Mail), nach explizitem Klick – wenn Kanal verbunden und E-Mail vorhanden. Server-seitig erzwungen. |

## Sendeverhalten (hart)

- **Ein** Empfänger pro Klick, **kein** Bulk, **kein** Zeitplan, **kein**
  Hintergrund-/Cron-Versand, **kein** WhatsApp.
- Empfänger ist **immer** die gespeicherte Kandidaten-E-Mail (server-seitig),
  niemals eine vom Client gelieferte Adresse.
- Validierung: E-Mail vorhanden/plausibel, Betreff und Text nicht leer.
- Nach Erfolg: Kandidat „kontaktiert" (+ Zeitstempel), Audit-Eintrag
  (`entity_type='outreach_send'`, **keine** Empfänger-PII im Log).
- Cold-Outreach bleibt blockiert; Versand ist eine bewusste, einzelne Inhaber-
  Aktion.

## UI auf `/app-shell/revenue-autopilot/outreach`

Pro E-Mail-Entwurf:

- **Kopieren** bleibt immer verfügbar.
- **„E-Mail senden"** wenn Premium + Kanal verbunden + Empfänger-E-Mail vorhanden.
- Sonst ruhige, deaktivierte Hinweise: **„Kanal verbinden"**, **„E-Mail-Adresse
  fehlt"**, **„Senden ab Premium"**.
- Nach Versand: **„Gesendet"**.

Business-Wording: „Bereit zum Versand", „Gesendet", „Kanal nicht verbunden",
„Freigabe erforderlich", „Keine Massenmails".

## Revenue-Autopilot-Integration

Der **Erstkontakt-Lane** spiegelt jetzt `isSendConfigured()` (Aktiv/Bereit), und
die Geld-Aktion zeigt **Versandkanal-Status**, **X bereit zum Versand** und
**Y ohne Kontakt** mit Link auf `/outreach`.

## Provider-/Env-Setup

`.env.local.example` (Platzhalter, **keine** Werte):

```
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Beide SERVER-ONLY (nie `NEXT_PUBLIC_`, nie geloggt, nie im Repo). Der Inhaber setzt
sie in der Umgebung (Vercel/Supabase) und ist für **Absender-Identität + Opt-out**
verantwortlich. Ohne beide Werte bleibt der Kanal „nicht verbunden".

## Migration

**Migration 007** (`supabase/migrations/007_prospect_contact_fields.sql`) –
additiv, idempotent (`add column if not exists`), nullable, **keine** RLS-
Änderung (bestehende `prospects`-Policies decken alle Spalten), **keine** Daten.
Vom Inhaber gegen Staging/Produktion anzuwenden. 001–006 unverändert.

## Sicherheits-Grenzen

- Kein Bulk, kein Spam, kein Hintergrund-Versand, kein WhatsApp, keine Buchung,
  keine bexio-API, kein Scraping.
- Session-Client + RLS für Tenant-Writes, **kein Service-Role**.
- Kein Secret im Repo; Schlüssel nur in der Umgebung.
- Nicht der alte, eigenständige Clean24 Lead Autopilot.

## Nächster Schritt

**v0.5.10 — Follow-up Autopilot / Appointment Coordination:** geplante Follow-ups
und Terminkoordination (Vorschlag → Bestätigung) auf demselben kontrollierten,
freigabe-basierten Fundament aufbauen. Buchung weiterhin nur nach
Kundenbestätigung; Cold-Outreach bleibt gesperrt.
