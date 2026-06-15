# Klarsa v0.5.8 — Outreach Autopilot MVP

**Ziel:** Klarsa macht aus entdeckten Chancen **echte Verkaufs-Aktionen**. Die
Geld-Kette ist:

> Approved Discovery → Kandidat → **Outreach** → Follow-up → Termin → Offerte → Auftrag

Diese Version macht **entdeckte Kandidaten sofort handlungsfähig**: vorbereitete
Erstkontakte, Nachfass-Nachrichten und Terminvorschläge – **zum Kopieren, Prüfen
und selbst Senden**.

**Kein automatischer Versand in diesem Schritt** (kein konformer Versandkanal
verbunden), keine Buchung, keine bexio-API, kein Scraping, kein Spam, keine
versteckte Massen-Kontaktaufnahme. **Keine neue Migration**, kein Service-Role,
keine Secrets. `supabase/verification/004_bind_auth_user_to_fake_tenant.sql`
bleibt **unangetastet**.

---

## Was v0.5.8 hinzufügt

Neue geschützte Route **`/app-shell/revenue-autopilot/outreach`** — der **Outreach
Autopilot**. Er leitet seine Warteschlange **nur aus bestehenden Daten** ab
(keine erfundenen Daten) und gruppiert sie in fünf money-fokussierte Abschnitte:

| Abschnitt | Quelle (bestehende Daten) |
| --- | --- |
| **Bereit für Erstkontakt** | `prospects` – nicht übernommen, noch nicht kontaktiert, Score < 70 |
| **Heisse Chancen für Telefon/E-Mail** | `prospects` – nicht übernommen, noch nicht kontaktiert, Score ≥ 70 |
| **Leads ohne Follow-up** | offene `leads` ohne geplante `followup_tasks` |
| **Offerten – Antwort ausstehend** | `offers` mit Status `sent` |
| **Termine vorschlagen** | offene `leads` **mit** geplantem Follow-up (warm) |

## Entdeckte Kandidaten werden zu Verkaufs-Aktionen

Für jeden Kandidaten/Lead/jede Offerte erzeugt Klarsa **deterministische**
Schweizer-Business-Entwürfe (kein KI-API, keine Netzwerk-Calls):

- **Erstkontakt-E-Mail** (Betreff + Text)
- **WhatsApp/SMS-Text** (kurz)
- **Telefon-Skript** (Gesprächsleitfaden)
- **Follow-up-Nachricht**
- **Terminvorschlag**

(wiederverwendete reine Helfer: `components/revenue-autopilot/outreach.ts`,
`appointment.ts`, gerendert über `DraftChannels` mit Kopier-Buttons).

## Copy- & Action-Workflow

Pro Karte:

- **Kopier-Buttons** je Kanal (E-Mail/WhatsApp/Telefon/Follow-up/Termin).
- **„In Lead Inbox übernehmen"** (bestehende `promoteOpportunity`-Aktion) für
  Kandidaten.
- **„Als kontaktiert markieren"** – setzt `prospects.status='contacted'` über den
  **Session-Client (RLS)** (neue, schlanke Aktion `markProspectContacted`; nur
  vorwärts ab raw/scored/approved, nie Rückschritt; Klarsa sendet nichts – es
  protokolliert die manuelle Aktion).
- **„Follow-up planen"** / **„Im Lead Inbox öffnen"** – Links ins bestehende
  Follow-up-System.
- **Offerte öffnen** – Link in die Offer Engine.

Keine erzwungene Migration: es werden **nur bestehende Felder/Status** genutzt.

## Package Gating

| Paket | Outreach Autopilot |
| --- | --- |
| **Starter** | Gesperrt – Upgrade-Teaser. Offert-Büro bleibt voll nutzbar. |
| **Pro** | **Geführt** – vorbereitete Entwürfe + Freigabe-Workflow (kopieren, prüfen, selbst senden, kontaktiert markieren). |
| **Premium / internal_founder** | Wie Pro **plus** sichtbare Autopilot-Lane: „Kanal nicht verbunden" bzw. „Bereit für automatische Erstkontakte, sobald Versandkanal verbunden ist." |

Server-seitig erzwungen (`tierRank(tier) < pro` → gesperrte Ansicht). Standard/Pro
wirken **nicht kaputt** – sie sehen den Wert, den sie liefern.

## Money-fokussierte Sprache (keine internen Begriffe)

„Bereit für Erstkontakt", „Nachfassen geplant", „Antwort ausstehend", „Termin
vorschlagen", „Kanal nicht verbunden". **Keine** RLS-/Session-Client-/internen
Begriffe in der Inhaber-UI.

## Revenue-Autopilot-Integration

Auf `/app-shell/revenue-autopilot`:

- Der **Erstkontakt-Lane** verlinkt jetzt auf `/outreach` und zeigt
  „X Kandidaten bereit für Erstkontakt".
- Eine **Geld-Aktion** („X Kandidaten bereit für Erstkontakt → öffnen")
  erscheint, sobald Kandidaten bereit sind.

## Was jetzt funktioniert

- Entdeckte Kandidaten werden **sofort handlungsfähig**: fertige Entwürfe für alle
  Kanäle, Kopier-Workflow, „übernehmen"/„kontaktiert markieren", Follow-up-/
  Offerten-Links – alles aus echten, mandantengetrennten Daten.
- Vollständig **paket-bewusst**; jede Zeile zeigt einen ehrlichen Status.

## Was auf v0.5.9 wartet (Versandkanal)

- **Echter Versandkanal** (Gmail/SMTP/Resend mit Absender-Identität + Opt-out)
  bzw. **Kalender** – heute **nicht verbunden** (`sendConnected = false`). Bis
  dahin bleibt alles **vorbereiten → prüfen → freigeben → selbst senden**.
- **Cold-Outreach bleibt gesperrt**; automatischer Versand nur für **sichere
  Kategorien** (Inbound/Opt-in, Bestand, freigegeben) und nur mit konformem,
  konfiguriertem Provider.

## Sicherheits-Grenzen

- Kein automatischer E-Mail-/WhatsApp-Versand, keine Buchung, keine bexio-API.
- Kein Spam, keine versteckte Massen-Kontaktaufnahme; Discovery/Outreach bleiben
  sichtbar, gebunden und protokolliert.
- Session-Client + RLS only, **kein Service-Role**; keine erfundenen/echten
  Kundendaten im Repo/Docs.
- Nicht der alte, eigenständige Clean24 Lead Autopilot.

## Nächster Schritt

**v0.5.9 — Echte Versandkanal-Integration für kontrollierten Outreach:** ersten
konformen Kanal (Gmail/SMTP/Resend, Absender-Identität + Opt-out) anbinden, um den
Erstkontakt-/Nachfass-Lane von „Kanal nicht verbunden" auf „Aktiv" zu schalten –
**nur sichere Kategorien**, mit menschlicher Freigabe, Cold-Outreach gesperrt.
