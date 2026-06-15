# Klarsa v0.5.7 — Approved Discovery Autopilot

> **Latest verification — VERIFIED in production (2026-06-15, v0.5.7.1).** The
> owner deployed v0.5.7 and confirmed the production UI changed as expected:
> `/app-shell/revenue-autopilot/discovery` opens as the Approved Discovery
> Autopilot (status, freigegebene Quellen, source-aware run, result breakdown);
> official adapters only, preview when auto-create is OFF, cold candidates created
> when policy is ON. No outreach/email/calendar/bexio; no scraping. See
> [`clean24-approved-discovery-autopilot-results.md`](./clean24-approved-discovery-autopilot-results.md).

**Ziel:** Klarsa bekommt seinen **ersten echten Automatik-Lane**. Premium-Klarsa
arbeitet wie ein echtes AI-Verkaufsbüro und **findet selbst** passende
Geschäfts-Chancen – über **offizielle, freigegebene Quellen** – und erstellt,
**wenn die Richtlinie es erlaubt**, automatisch **kalte Kandidaten**.

**Dieser Schritt ist nur Discovery.** Keine Kontaktaufnahme, kein E-Mail-/
WhatsApp-Versand, keine Terminbuchung, keine bexio-API, **kein unkontrolliertes
Scraping**. **Keine neue Migration**, kein Service-Role, keine Secrets im Repo.
`supabase/verification/004_bind_auth_user_to_fake_tenant.sql` bleibt
**unangetastet**.

---

## Was v0.5.7 hinzufügt

`/app-shell/revenue-autopilot/discovery` ist jetzt der **Approved Discovery
Autopilot** statt einer einfachen Discovery-Seite:

- **Discovery-Autopilot-Status** – Quellen-Verbindung (Aktiv / Bereit / Kanal
  nicht verbunden) und Auto-Erstellung (EIN/AUS), paket-bewusst.
- **Freigegebene Quellen** – die offiziellen Adapter mit Verbindungsstatus
  (Google Places, Baugesuche Zürich); geplante Quellen (SIMAP, ZEFIX) als Hinweis.
- **Letzter Lauf** – Quelle, Gefunden/Erstellt/Bereits-vorhanden, Zeitpunkt.
- **Lauf starten** – Quelle wählen, ausführen; klares Ergebnis:
  **Gefunden · Neu erstellt · Bereits vorhanden · Übersprungen · Fehler**.
- **Nächste empfohlene Aktion** – kontextabhängig (Quelle verbinden →
  Auto-Erstellung aktivieren → Kandidaten im Lead Hunter freigeben → Lauf starten).
- **Entdeckte Kandidaten (kalt)** – fliessen über den bestehenden `prospects`-
  Pfad in **Lead Hunter / Radar**.

Auf `/app-shell/revenue-autopilot` zeigt der **Discovery-Lane** den echten Status
inkl. „Letzter Lauf: X gefunden, Y erstellt".

## Approved Discovery only (keine wilde Suche)

Es laufen **ausschliesslich offizielle, freigegebene Adapter** (`lib/discovery/*`,
`SIGNAL_ADAPTERS`):

- **Google Places** – offizielle Places-Text-Search-API, env `GOOGLE_PLACES_API_KEY`.
- **Baugesuche Zürich** – offizieller Kanton-Open-Data-Feed (CSV/JSON), env
  `BAUGESUCHE_ZH_SIGNAL_URL`.

**Kein** Scraping, **kein** HTML-/PDF-Parsing, **kein** Headless-Browser, **kein**
Besuch beliebiger Webseiten. Fehlt der Schlüssel/die URL → „nicht verbunden",
die App läuft weiter. Geplante Quellen (SIMAP/ZEFIX) sind dokumentiert und
**erst nach gesonderter Freigabe** live.

## Kein Outreach (in diesem Schritt)

Discovery erzeugt **nur kalte Kandidaten**. Es gibt **kein** automatisches
E-Mail/WhatsApp, **keine** Anrufe, **keine** Terminbuchung, **keine** bexio-API.
Kalt entdeckte Kontakte sind per Richtlinie für Cold-Outreach **hart gesperrt** –
Kontaktaufnahme nur nach **manueller Freigabe** im Lead Hunter.

## Package Gating

| Paket | Approved Discovery Autopilot |
| --- | --- |
| **Starter** | Gesperrt – „ab Pro verfügbar" mit Upgrade-Hinweis. Offert-Büro bleibt voll nutzbar. |
| **Pro** | **Geführt** – startet Läufe selbst; Auto-Erstellung **nur wenn die Richtlinie es erlaubt**. |
| **Premium / internal_founder** | **Vollautomatik-fähig** – Läufe können (sobald freigegeben) automatisch und kanalweise laufen; heute auf Auslösung. |

Server-seitig erzwungen: `tierRank(tier) < pro` → `locked` (kein Lauf). UI zeigt
für Starter einen ruhigen Upgrade-Zustand (nicht „kaputt").

## Auto-Create Policy

Wiederverwendet die bestehende, sichere Richtlinie
(`company_settings.settings.autopilot.autoCreateColdCandidates`, Owner-Toggle in
den **Autopilot-Richtlinien**) – **keine neue Migration**:

- **AUS (Default):** nur **Vorschau** – Treffer werden angezeigt, **nichts wird
  erstellt**.
- **EIN:** Treffer werden über den **Session-Client (RLS)** als **kalte**
  `prospects` (`status='raw'`) erstellt – nie Service-Role, nie als Lead/Kunde.

## Deduplizierung & Caps

Vor dem Erstellen:

- **Bereits vorhanden:** Abgleich gegen bestehende `prospects` (Name + Region,
  case-insensitiv) → übersprungen.
- **Übersprungen:** Batch-interne Duplikate (Name/Region bzw. Provider-ID) und
  alles über dem **Run-Cap** (`MAX_CREATE_PER_RUN = 15`; Quellen liefern ohnehin
  max. 10).
- **Ergebnis:** Gefunden · Neu erstellt · Bereits vorhanden · Übersprungen ·
  Fehler – sichtbar im Lauf-Ergebnis und im Audit (`audit_logs`,
  `entity_type='discovery_run'`).

## Mapping (nur bestehende Spalten)

| Discovered | → prospects-Spalte |
| --- | --- |
| Name / Bauvorhaben | `name` |
| Quelle | `source_type` (`google` bzw. `other` für Baugesuche – beide = kalt) |
| Region / Ort | `region` |
| Service-Fit | `search_query` |
| Signal / Grund / Timing / Lage / Quelle | `reason` |
| Typ | `category` (`Firma` / `Bauprojekt`) |
| Score | `score` (deterministisch via `analyzeOpportunity`) |
| Status | `status='raw'` (kalt) |

Keine erfundenen Daten; keine entdeckten Produktionsdaten im Repo/Docs.

## Fehlerbehandlung (ruhig)

Provider-Fehler erscheinen als **ruhiger Betriebsstatus**, nie als roher Fehler:

- „Quelle momentan nicht erreichbar (Zugriff oder Kontingent prüfen). Klarsa hat
  nichts geändert."
- „Quelle erreichbar, aber das Datenformat wurde nicht erkannt. Konfiguration
  prüfen." (unbekanntes Schema)
- „… noch nicht verbunden." (nicht konfiguriert)

Keine HTTP-Statuscodes / Entwickler-Details in der Inhaber-UI.

## Wie Clean24 das nutzt

1. Inhaber verbindet eine freigegebene Quelle (Owner setzt
   `GOOGLE_PLACES_API_KEY` und/oder `BAUGESUCHE_ZH_SIGNAL_URL` in der Umgebung –
   nie im Repo).
2. Optional **Auto-Erstellung** in den Autopilot-Richtlinien einschalten.
3. Auf der Discovery-Seite Quelle wählen und **Lauf starten** (Owner/Admin).
4. **Kalte Kandidaten** im **Lead Hunter** prüfen, qualifizieren und – bei Eignung
   – manuell in den Lead Inbox übernehmen. Erst dort beginnt (späterer) Kontakt.

## Sicherheits-Grenzen

- Offizielle Quellen only, kein Scraping/HTML/PDF/Headless.
- Session-Client + RLS only, **kein Service-Role**.
- Auto-Erstellung nur per Owner-Toggle; nur **kalte** Kandidaten, nie Leads/Kunden.
- Dedupe + harter Run-Cap; jeder Lauf protokolliert (Audit).
- **Kein** Outreach/Versand/Buchung/bexio-API in diesem Schritt.
- Nicht der alte, eigenständige Clean24 Lead Autopilot.

## Nächster Schritt

**v0.5.8 — Outreach Autopilot (gated):** der erste **konforme Versand-Kanal**
(Gmail/SMTP/Resend mit Absender-Identität + Opt-out) bzw. **Kalender**, um den
Erstkontakt-/Nachfass-/Termin-Lane von „Bereit für Premium" auf „Aktiv" zu
schalten – **nur für sichere Kategorien** (Inbound/Opt-in, Bestand, freigegeben),
mit menschlicher Freigabe. **Cold-Outreach bleibt gesperrt.**
