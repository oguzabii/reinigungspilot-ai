# Klarsa v0.5.10 — SMTP Send Provider & IMAP Inbox Foundation

**Ziel:** Klarsa soll **nicht nur** von Resend abhängen. Clean24 soll aus dem
**eigenen Postfach** (z. B. `info@clean-24.ch`) per **SMTP** senden – und das
Fundament legen, um Antworten aus demselben Postfach per **IMAP** zu lesen.

> **SMTP = E-Mails senden. IMAP = eingehende Antworten lesen.**

Resend bleibt vollständig erhalten. Versand ist jetzt **provider-basiert**
(`resend` | `smtp`); der Eingangskanal (`imap`) ist als **sicheres Fundament**
vorbereitet. **Keine neue Migration** (007 unverändert), kein Service-Role, keine
Secrets im Repo. `supabase/verification/004_bind_auth_user_to_fake_tenant.sql`
bleibt **unangetastet**.

---

## Warum SMTP/IMAP anders ist als Resend

- **Resend** ist eine **REST-API** (HTTPS). Dependency-frei, ideal für
  verifizierte Absender-Domains.
- **SMTP** spricht direkt mit dem **echten Postfach** des Betriebs (Benutzer +
  Passwort, Host/Port/TLS). So sendet Clean24 von `info@clean-24.ch` aus dem
  eigenen Mailserver. Dafür wird die offizielle Bibliothek **nodemailer**
  genutzt (kein selbstgebautes SMTP).
- **IMAP** liest **eingehende** Nachrichten (Antworten) aus demselben Postfach –
  die andere Richtung, die Resend nicht abdeckt.

## SMTP sendet

`lib/outreach/send-provider.ts` ist jetzt provider-basiert:

- `OUTREACH_SEND_PROVIDER=resend|smtp` wählt den Kanal. Leer → Resend, falls
  konfiguriert, sonst SMTP (bestehende Resend-Setups bleiben **unverändert**).
- `resend` → bisherige REST-Logik (unverändert).
- `smtp` → Versand über **nodemailer** (`createTransport` + `sendMail`), lazy
  importiert (nur bei SMTP-Versand geladen; `serverExternalPackages: ['nodemailer']`).
- Fehlender Provider/Env → `not_configured` (UI: „Kanal nicht verbunden").
- Gleiches kontrolliertes Verhalten wie zuvor: **eine** Nachricht, **ein**
  Empfänger, pro **explizitem Klick** (Premium). Kein Bulk, kein Zeitplan, kein
  Hintergrund-Versand, kein WhatsApp.
- Schlüssel/Passwörter werden **nie geloggt**, **nie zum Client** gesendet.

## IMAP liest Antworten (Fundament)

`lib/outreach/inbox-provider.ts` ist in v0.5.10 ein **sicheres Fundament**:

- Erkennt, ob ein IMAP-Postfach konfiguriert ist, und liefert einen Status.
- **Verbindet sich NICHT**, **pollt NICHT**, **importiert keine** Mail in dieser
  Version. Kein Hintergrund-Polling, kein Cron, kein automatischer Kundendaten-
  Import.
- Die UI zeigt „Antwort-Erkennung über IMAP vorbereitet".
- **Reply-Tracking folgt in v0.5.11** – dann **owner-getriggert**, nur minimale
  Header (From/Subject/Datum/Snippet), Zuordnung zu bestehenden Outreach-
  Datensätzen, keine vollen Bodies ohne Notwendigkeit, keine Kundendaten im Repo/
  Docs.

## Unterstützte Umgebungsvariablen

Nur **Platzhalter** in `.env.local.example` (keine Werte, SERVER-ONLY, nie im Repo):

```
OUTREACH_SEND_PROVIDER=     # resend | smtp (leer = auto)

# SMTP (senden)
SMTP_HOST=
SMTP_PORT=                  # 465 (implizit TLS) oder 587 (STARTTLS)
SMTP_SECURE=                # "true" für 465; leer = aus Port abgeleitet
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=                  # z. B. "Clean24 <info@clean-24.ch>"

# IMAP (Antworten lesen – Fundament)
INBOX_PROVIDER=             # imap
IMAP_HOST=
IMAP_PORT=
IMAP_SECURE=
IMAP_USER=
IMAP_PASSWORD=
IMAP_MAILBOX=               # Standard "INBOX"
```

## UI / Revenue-Autopilot

- **`/app-shell/revenue-autopilot/outreach`** zeigt den aktiven Kanal:
  „Versandkanal: SMTP" / „Versandkanal: Resend" / „Kanal nicht verbunden" und
  „Eingangskanal: IMAP vorbereitet / nicht verbunden". Einzelversand pro Klick
  bleibt unverändert.
- **`/app-shell/revenue-autopilot`** zeigt eine Kanal-Status-Zeile: Versandkanal
  verbunden/nicht verbunden, Eingangskanal vorbereitet/nicht verbunden,
  „Antwort-Erkennung über IMAP vorbereitet".

## Package Gating (unverändert)

| Paket | Verhalten |
| --- | --- |
| **Starter** | gesperrt. |
| **Pro** | Kopier-/Freigabe-Workflow, kein automatischer Versand. |
| **Premium / internal_founder** | echter Einzelversand (SMTP **oder** Resend, je nach Konfiguration); IMAP-Reply-Fundament sichtbar. |

## Abhängigkeiten

- **nodemailer** (+ `@types/nodemailer`) neu hinzugefügt – die Standard-Bibliothek
  für SMTP (kein selbstgebautes SMTP). Server-only, via
  `serverExternalPackages` aus dem Bundle gehalten, lazy importiert.
- **Keine** IMAP-Bibliothek in dieser Version (Fundament ohne Verbindung).

## Sicherheits-Grenzen

- Kein Bulk, kein Spam, kein Hintergrund-/geplanter Versand, kein WhatsApp,
  keine Buchung, keine bexio-API, kein Scraping.
- IMAP: keine Verbindung/kein Polling/kein Import in v0.5.10.
- Session-Client + RLS für Tenant-Writes, **kein Service-Role**.
- Keine Secrets im Repo; Schlüssel/Passwörter nur in der Umgebung, nie geloggt.
- Nicht der alte, eigenständige Clean24 Lead Autopilot.

## Nächster Schritt

**v0.5.11 — Reply-Tracking + Follow-up/Appointment Autopilot:** owner-getriggertes
IMAP-Lesen (minimale Header), Zuordnung von Antworten zu Outreach-Datensätzen
(„Antwort erhalten"), darauf aufbauend geplante Follow-ups und Terminkoordination
(Vorschlag → Bestätigung). Buchung nur nach Kundenbestätigung; Cold-Outreach
bleibt gesperrt.
