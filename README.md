# Klarsa

Das KI-Verkaufsbüro für Schweizer KMU — der verkaufsstarke, paketbasierte
Master-Demo-Foundation. Dieses Repository ist die **eigenständige,
verkaufsfähige Produkt- und Demo-Basis**. Clean24 dient ausschliesslich als
interner Pilot/Proof und ist hier nicht öffentlich integriert.

## Aktuelle Version

**v0.4.1.1** — **Clean24 Production-Tenant-Bootstrap (Produktion verifiziert).**
Produktion
läuft an: Supabase **Pro**, Projekt `klarsa-production` mit Migrationen 001–006,
`verification/006` **PASS**, tägliche Backups aktiv. Neu: ein **produktionssicheres,
idempotentes** Bootstrap-Skript
`supabase/production/001_create_clean24_production_tenant.sql` legt den realen
Tenant **Clean24 Memis GmbH** an (Premium, `billing_status=internal_founder`,
`access_status=full`, Status `active`, 26 Kantone) + Einstellungen + eigener
Service-/Quellen-**Konfig**-Baseline und bindet den **Inhaber** als `owner`
(upsert `user_profiles` + `company_members`). Der Owner-UID steht **nur als
Platzhalter** `CLEAN24_OWNER_AUTH_USER_ID` (einmalig, im `DO`-Block; ohne Ersetzen
bricht das Skript sauber ab) – **kein echter UID, keine Secrets im Repo**; die
E-Mail wird aus `auth.users` gelesen, nicht hartcodiert. **Keine Kunden-Leads/
-Offerten/-Aufträge/-Prospects, keine Fake-/Demo-/Staging-Daten.** Doku
`docs/clean24-production-tenant-bootstrap.md`. **001–006 unverändert; die Staging-/
Fake-Skripte (`verification/002–005`) laufen nie in Produktion; `004`
unangetastet.** Auf **Produktion verifiziert** (2026-06-13, manueller Nutzertest):
Bootstrap in `klarsa-production` ausgeführt (Platzhalter nur im SQL-Editor
ersetzt), Verifikationsabfrage erwartungsgemäss (Clean24 Memis GmbH ·
premium/active/internal_founder/full · services=8 · sources=4 · owners=1 · alle
Kundendaten-Zähler=0), Vercel-Produktions-Env gesetzt (ohne Secret-Werte hier) +
Auth-URL `https://klarsa.vercel.app`, Redeploy, **Owner-Login erfolgreich**,
`/app-shell` geöffnet, keine echten Kundendaten —
`docs/clean24-production-bootstrap-results.md`. **Echte Kundendaten bleiben
NO-GO**, bis **Restore-Test** bestanden und **Inhaber-Freigabe (GO)** vorliegen.
Die Verkaufs-Demo (v0.1.7) bleibt unverändert.

> **v0.4.0:** Clean24 Production-Readiness-Gate — Policy/Runbooks + read-only
> Checks (Hub `production-readiness-gate.md` + RLS-Verifikation, Backup/Restore,
> Staging-/Produktions-Trennung, Real-Data-Gate, Incident-Runbook, Datenrichtlinie
> + `verification/006`). Harte Regel „No Security = No Customer Data"; Produktion
> gesperrt bis Inhaber-Freigabe. Keine Features/echten Daten/Secrets.

> **v0.3.13/.13.1:** CEO-/KPI-Dashboard-Fundament — `/app-shell/ceo`
> („CEO-Briefing"), read-only Owner-Überblick (Geld-Wirkung/KPI/Trichter/
> Letzte-7-Tage/Achtung) aus vorhandenen RLS-Daten, reiner `components/ceo/kpi.ts`-
> Helper, keine KI/externe API/Schreibvorgänge, keine neue Migration. Auf Staging
> **verifiziert** (2026-06-12) — `docs/clean24-ceo-kpi-dashboard-results.md`.

> **v0.3.12/.12.1:** bexio-Übergabe-Fundament — `/app-shell/bexio`, manuelle
> Rechnungs-Übergabe-Warteschlange für abgeschlossene Aufträge (`bexio_handoffs`),
> „Für bexio vorbereiten"/„Als verrechnet markieren" + kopierbare Zusammenfassung,
> Manage-Domäne (`can_manage_company`), keine echte bexio-API/Token, keine neue
> Migration. Auf Staging **verifiziert** (2026-06-12) —
> `docs/clean24-bexio-handoff-results.md`.

> **v0.3.11/.11.1:** Swiss Opportunity Radar Map-Fundament —
> `/app-shell/lead-hunter/radar`, statische/stilisierte Kanton-Radar-SVG +
> Stat-Karten + Top-Regionen + Service-/Quellen-/Typ-Chips aus `prospects`-Daten,
> deterministisches Region→Kanton-Offline-Mapping, nur Lesen (Session-Client/RLS),
> kein Kartenanbieter/Tiles/Geokodierung, keine neue Migration. Auf Staging
> **verifiziert** (2026-06-12) — `docs/clean24-swiss-opportunity-radar-map-results.md`.

> **v0.3.10/.10.1:** Source → Opportunity-Workflow — aus registrierter Quelle
> „Opportunity vorbereiten" → vorausgefülltes Formular (`?source=<id>`), Seed
> (`source_type` + Grund aus `label`/`notes`), Rückverknüpfung über
> `prospects.source_id` (additive Migration `006`, spiegelt `leads.source_id`),
> Session-Client (RLS, `can_write_sales`), Defense-in-Depth. Auf Staging
> **verifiziert** (2026-06-11) — `docs/clean24-source-to-opportunity-results.md`.

> **v0.3.9/.9.1:** Lead-Hunter-Quellen-Registry-Fundament — `/app-shell/lead-hunter/sources`,
> owner/admin registrieren kontrollierte `lead_sources` (label/type/enabled/notes)
> + Badges (Aktiv + Phase Manuell/API/Register) + Vorlagen, Settings-Domäne
> (`can_write_settings`), keine neue Migration. Auf Staging **verifiziert**
> (2026-06-11) — `docs/clean24-lead-hunter-source-registry-results.md`.

> **v0.3.8:** Opportunity → Lead-Inbox-Konversion — auf `/app-shell/lead-hunter`
> per „In Lead Inbox übernehmen" eine qualifizierte Opportunity manuell in den
> Lead Inbox überführen (`prospects`→`leads`, atomarer Duplikat-Claim
> `promoted_lead_id IS NULL` + Orphan-Rollback, bidirektionaler Link). Beide
> Schreibpfade über **Session-Client (RLS, `can_write_sales`)**, keine neue
> Migration, keine externe API/Scraping.

> **v0.3.7/.7.1:** Lead-Hunter-Scoring & Service-Matching — deterministischer,
> client-seitiger Helper (`scoring.ts`) matcht Clean24-Services, erklärt den Score
> und schlägt eine nächste Aktion vor (live, „Vorschläge übernehmen"), Badges in
> Form + Liste. Keine KI/API/Netzwerk/Scraping, keine neue Migration. Auf Staging
> **verifiziert** (2026-06-11) — `docs/clean24-lead-hunter-scoring-results.md`.

> **v0.3.6/.6.1:** Lead Hunter- / Opportunity-Radar-Fundament — `/app-shell/lead-hunter`,
> Opportunities **manuell erfassen** (Felder auf `prospects` gemappt) + Radar-
> Übersicht, Sales-Domäne (`can_write_sales`), keine neue Migration, **kein
> Scraping/externe Quelle**. Auf Staging **verifiziert** (2026-06-11) —
> `docs/clean24-lead-hunter-results.md`.

> **v0.3.5/.5.1:** Job-Workflow- & Kalender-Fundament — `/app-shell/jobs` mit
> Status pflegen + Termin (`scheduled_for`, Browser→UTC) + Route-Handler
> `GET /app-shell/jobs/[id]/ics` (.ics, RFC 5545, ohne Library/Asset/Sync).
> Server-Actions + Session-Client (RLS, Ops-Domäne), keine neue Migration. Auf
> Staging **verifiziert** (2026-06-11) — `docs/clean24-job-workflow-calendar-results.md`.

> **v0.3.4/.4.1:** Auftrag-aus-Offerte-Fundament — aus einer angenommenen Offerte
> per „Auftrag erstellen" manuell eine `jobs`-Zeile (Ops-Domäne `can_write_ops`),
> duplikat-sicher (App-Vorprüfung + additive **Migration `005`**), Liste unter
> `/app-shell/jobs`. Auf Staging **verifiziert** (2026-06-11) —
> `docs/clean24-job-from-offer-results.md`.

> **v0.3.3/.3.1:** Offer PDF- & Versand-Fundament — geschützte Route
> `GET /app-shell/offers/[id]/pdf` (Session-Client/RLS + `company_id`/`id`-Scoping,
> fremde id → 404) liefert ein PDF (Generator ohne Library/Asset,
> `lib/pdf/offer-pdf.ts`) + pro Offerte ein manueller Versand-Entwurf (Kopiertext,
> kein echter Versand). Keine neue Migration. Auf Staging **verifiziert**
> (2026-06-11, PDF Fundament-Niveau) — `docs/clean24-offer-pdf-results.md`.

> **v0.3.2/.2.1:** Offer Draft-Fundament — geschützte Route `/app-shell/offers`,
> manuelle Offerten-Entwürfe (optional aus Lead) + `offer_items` mit
> serverseitig berechneten Summen + Status-Flow, Server-Actions + Session-Client
> (RLS, `can_write_sales`). Additive **Migration `004`** (F6-Hardening: `unique
> leads(id,company_id)` + Composite FK). Auf Staging **verifiziert** (2026-06-10)
> — `docs/clean24-offer-draft-results.md`.

> **v0.3.1/.1.1:** Lead-Status-Workflow & Follow-up-Fundament — `/app-shell/leads`
> mit Status-Select je Lead (9 Werte, kanonische Reihenfolge, Korrekturen
> möglich) + manuelle Follow-ups (Stufe, Fälligkeit, Kanal, Titel), Server-Actions
> + Session-Client (RLS), Defense-in-Depth, null neue Migrationen. Auf Staging
> **verifiziert** (2026-06-10) — `docs/clean24-lead-status-followups-results.md`.

> **v0.3.0/.0.1:** Lead Inbox-Fundament — geschützte Route `/app-shell/leads`,
> manuelles Erfassen + Listen via Server-Action und Session-Client (RLS),
> additive Migration `003` (`leads.notes`). Auf Staging **verifiziert**
> (2026-06-09) — `docs/clean24-lead-inbox-results.md`.

> Klarsa Core: v0.2.0–v0.2.6 (Docs/Schema/RLS/Verifikation/Auth), v0.2.7
> (App-Shell ↔ Staging), v0.2.8 (Clean24-Tenant-Setup), v0.2.9 (Tenant
> verifiziert), v0.3.0/.0.1 (Lead Inbox, auf Staging verifiziert),
> v0.3.1/.1.1 (Lead-Status & Follow-ups, auf Staging verifiziert),
> v0.3.2/.2.1 (Offer Draft-Fundament + Migration 004, auf Staging verifiziert),
> v0.3.3/.3.1 (Offer PDF- & Versand-Fundament, auf Staging verifiziert),
> v0.3.4/.4.1 (Auftrag-aus-Offerte-Fundament + Migration 005, auf Staging verifiziert),
> v0.3.5/.5.1 (Job-Workflow- & Kalender-Fundament, .ics-Download, auf Staging verifiziert),
> v0.3.6/.6.1 (Lead Hunter- / Opportunity-Radar-Fundament, manuell, auf Staging verifiziert),
> v0.3.7/.7.1 (Lead-Hunter-Scoring & Service-Matching, deterministisch/offline, auf Staging verifiziert),
> v0.3.8 (Opportunity → Lead-Inbox-Konversion, manuell),
> v0.3.9/.9.1 (Lead-Hunter-Quellen-Registry-Fundament, manuell, auf Staging verifiziert),
> v0.3.10/.10.1 (Source → Opportunity-Workflow, manuell, Migration 006, auf Staging verifiziert),
> v0.3.11/.11.1 (Swiss Opportunity Radar Map-Fundament, statisch/manuell, keine neue Migration, auf Staging verifiziert),
> v0.3.12/.12.1 (bexio-Übergabe-Fundament, manuell, keine echte bexio-API, keine neue Migration, auf Staging verifiziert),
> v0.3.13/.13.1 (CEO-/KPI-Dashboard-Fundament, read-only, keine neue Migration, auf Staging verifiziert),
> v0.4.0 (Clean24 Production-Readiness-Gate — Policy/Runbooks/Checks, keine Features, Produktion gesperrt bis Freigabe),
> **v0.4.1/.1.1 (Clean24 Production-Tenant-Bootstrap-Skript + Produktions-Login verifiziert — produktionssicher, idempotent, Platzhalter-UID, keine Kundendaten; real-data weiter NO-GO bis Restore-Test + GO)**.
> **Clean24 Memis GmbH** = **erster Tenant / Live-Proof** – erst nach dem Auth-/
> RLS-/Backup-Gate.

> Öffentliche Marke = **Klarsa**. Das interne Repo/Paket heisst weiterhin
> `reinigungspilot-ai`. Der alte, eigenständige **Clean24 Lead Autopilot** bleibt
> ein **getrenntes** System und wird nicht eingebunden.

> **Nächster Schritt:** v0.3.2 — **Offer Draft-Fundament** (Offerten-Entwürfe zu
> Leads; manuell, RLS-gescopt, keine externen Integrationen). Echte Daten erst
> nach Backup/Restore, sauberer **Staging-/Produktions-Trennung** und validiertem
> Auth/RLS/Security.

### Strategie

- **Positionierung:** KI-Verkaufsbüro für Schweizer KMU – Dienstleister, Handwerk, Reinigung, Umzug, Gartenbau, Hauswartung, Maler/Gipser, lokale Service-Betriebe.
- **Reinigung = erste Branchenvorlage**, nicht das ganze Produkt (`lib/industries.ts`).
- **Öffentlicher Pilot entfernt:** `/pilot` ist durch `/beratung` ersetzt.
- **Clean24** ist interner Pilot/Proof – nicht öffentlich integriert, kein öffentlicher Case.
- **bexio Connect** ab Pro, **bexio Connect Plus** ab Premium (Demo-Übergabe, echte API später).
- Demo-Firma: **Muster Service GmbH**.

## Tech-Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4**
- **lucide-react** (Icons)
- **@supabase/supabase-js** + **@supabase/ssr** (Auth-Fundament ab v0.2.6; build-sicher, ohne echte Env)
- Systemschrift-Stack (kein externer Font-Fetch)

## Lokal starten

```bash
npm install
npm run dev      # Entwicklungsserver (http://localhost:3000)
npm run lint     # ESLint
npm run build    # Produktions-Build
npm run start    # Produktionsserver (nach build)
```

## Routen

| Route           | Zweck                                                        |
| --------------- | ------------------------------------------------------------ |
| `/`             | Öffentliche Landingpage: Hero, Trust-Bar, „In 1 Minute erklärt“, Problem, Lösung, Module, Pakete, Add-ons, Vergleich, 12-Monats-Plan, Beratungs-CTA |
| `/demo`         | Interaktive Sales-Demo: Paketumschalter, Demo-Story, Branchenvorlagen, bexio-Übergabe und Modulansichten |
| `/pricing`      | Preisseite: Pakete mit exakten Limiten, „Für wen geeignet?“, enthalten / nicht enthalten, Add-ons, Abgrenzung |
| `/beratung`     | Beratungsseite (ersetzt `/pilot`): für wen, Ablauf, was wir prüfen, was Sie erhalten, Beratungs-CTA |
| `/faq`          | Häufige Fragen und Einwände (Accordion), inkl. bexio & Branchen |
| `/brochure`     | Öffentliche Verkaufsbroschüre (Grundlage für späteres PDF): Problem, Lösung, Branchen, Module, Pakete, bexio, Add-ons, 12-Monats-Plan, Abgrenzung |
| `/demo-script`  | **Intern** (noindex): Gesprächsleitfaden für die Live-Demo – 5-Minuten-Flow, Paket-Pitches, Einwände, Abschluss |
| `/sales-kit`    | **Intern** (noindex): Positionierung, Pitches, Cold-E-Mails, Nachrichten, Telefonskript, Einwände, Abschlusssätze |
| `/video-script` | **Intern** (noindex): 60-Sekunden-Storyboard mit deutschem Voiceover für das geplante Erklärvideo |
| `/workspace`    | **Intern** (noindex): Klarsa App Foundation – Architektur-Plan, Clean24 als erster Tenant, geplante Module, Auth-Fundament-Hinweis |
| `/login`        | **Intern** (noindex): Login-Skelett (Supabase Auth). Inaktiv ohne Staging-Env, keine echten Daten |
| `/app-shell`    | **Intern** (noindex, **dynamisch/geschützt**): authentifizierter Tenant-Arbeitsbereich – Redirect ohne Session, RLS-gefilterte Staging-Zähler, kein Service-Role-Lesen, CEO-Briefing-Karte. Ohne Env: „Setup erforderlich" |
| `/app-shell/ceo` | **Intern** (noindex, **dynamisch/geschützt**): **CEO-Briefing** – **read-only** KPI-Überblick über die Kette (Geld-Wirkung CHF, KPI-Kacheln, Trichter Opportunity→Lead→Offerte→Auftrag→bexio, Letzte 7 Tage, Achtung-Karten) aus vorhandenen RLS-Daten. Keine Schreibvorgänge/KI/externe API/bexio-API/Scraping |
| `/app-shell/leads` | **Intern** (noindex, **dynamisch/geschützt**): Lead Inbox – Tenant-Leads anzeigen, manuell erfassen, **Status pflegen** und **Follow-ups planen** (Server-Actions, Session-Client/RLS). Kein Versand, keine externen Integrationen |
| `/app-shell/lead-hunter` | **Intern** (noindex, **dynamisch/geschützt**): Lead Hunter / Opportunity Radar – Opportunities **manuell erfassen** + Radar-Übersicht + **deterministisches Service-Matching/Scoring** (live) + **„In Lead Inbox übernehmen"** (Promotion zu `leads`) + **„Opportunity aus Quelle"** (vorausgefülltes Formular via `?source=<id>`, verknüpft `prospects.source_id`) + Links zur **Quellen-Registry** und zum **Schweiz-Radar** (Server-Actions, Session-Client/RLS). Kein Scraping/Auto-Suche/KI/externe Quellen |
| `/app-shell/lead-hunter/radar` | **Intern** (noindex, **dynamisch/geschützt**): Lead Hunter **Schweiz-Radar** – statische, stilisierte Kanton-Radar-Karte aus erfassten Opportunities (Stat-Karten, Kanton-SVG-Pins, Top-Regionen, Service-/Quellen-/Typ-Chips), nur Lesen (Session-Client/RLS). Kein Kartenanbieter/Google/ZEFIX/SIMAP/Geokodierung/externe Abfrage |
| `/app-shell/lead-hunter/sources` | **Intern** (noindex, **dynamisch/geschützt**): Lead Hunter **Quellen-Registry** – kontrollierte, von Menschen freigegebene Lead-Quellen **manuell registrieren** + Liste mit Badges (Aktiv/Inaktiv + Phase) + **„Opportunity vorbereiten"** je Quelle (Server-Action, Session-Client/RLS, Settings-Domäne `can_write_settings` = owner/admin). Kein Scraping/Google/ZEFIX/SIMAP/Auto-Abfrage |
| `/app-shell/offers` | **Intern** (noindex, **dynamisch/geschützt**): Offer Engine – Offerten-Entwürfe manuell erstellen (optional aus Lead), Positionen + Netto/MwSt/Brutto, **Status pflegen**, **PDF-Download** + manueller Versand-Entwurf (Server-Actions, Session-Client/RLS). Kein echter Versand/bexio |
| `/app-shell/offers/[id]/pdf` | **Intern** (noindex, **dynamisch/geschützt**): Route-Handler – generiert das Offerten-PDF (Session-Client/RLS, nur eigene Offerte, sonst 404). Ohne Abhängigkeit/Asset, kein Versand |
| `/app-shell/jobs` | **Intern** (noindex, **dynamisch/geschützt**): Auftragsliste – aus angenommenen Offerten erstellte Jobs, **Status & Termin pflegen**, .ics-Download (Status, Termin, Kunde, Quell-Offerte, Wert). Session-Client/RLS. Kein Kalender-Sync/E-Mail/bexio |
| `/app-shell/jobs/[id]/ics` | **Intern** (noindex, **dynamisch/geschützt**): Route-Handler – generiert die Termin-.ics eines Auftrags (Session-Client/RLS, nur eigener Auftrag, sonst 404; ohne Termin 404). Ohne Abhängigkeit/Asset, kein Sync |
| `/app-shell/bexio` | **Intern** (noindex, **dynamisch/geschützt**): bexio-Übergabe – **manuelle** Rechnungs-Übergabe-Warteschlange für abgeschlossene Aufträge (Kunden-/Offerten-Daten, „Für bexio vorbereiten" → `bexio_handoffs`, „Als verrechnet markieren", kopierbare Zusammenfassung), Session-Client/RLS, Settings-/Manage-Domäne `can_manage_company` = owner/admin. **Keine echte bexio-API/Token/Netzwerkaufruf/automatische Rechnung** |
| `/auth/callback`| Route-Handler (dynamisch): OAuth/PKCE-Code-Tausch → Session-Cookie → Redirect |
| `/logout`       | Route-Handler (dynamisch): Sign-out → Redirect auf `/login` |

## Architektur

Die zentrale Regel: **keine zufälligen Features** — alles ist paketbasiert
(„package-gated"). Limiten und Gating sind **nie** in Komponenten hartcodiert,
sondern liegen in zentralen Config-Dateien.

```
lib/
  packages.ts        # Pakete (Starter/Pro/Premium): Preise + Limiten (inkl. bexio) — Source of Truth
  package-gates.ts   # Modul-Gating-Matrix (full | limited | locked) je Paket
  modules.ts         # Demo-Navigation + Modul-Metadaten (Marketing-Übersicht)
  industries.ts      # Branchenvorlagen (Reinigung = erste Vorlage)
  addons.ts          # Add-on-Katalog mit strukturierten Preisen
  beratung.ts        # Beratungs-Inhalte (ersetzt Pilot)
  faq.ts             # FAQ / Einwände
  objections.ts      # Gemeinsame Einwandbehandlung (Demo-Skript + Sales-Kit)
  sales-kit.ts       # Internes Sales-Kit (Pitches, E-Mails, Skripte)
  brochure.ts        # Broschüren-Texte
  video-script.ts    # 60-Sekunden-Video-Storyboard
  scope.ts           # „Was nicht enthalten ist“
  demo-data.ts       # Zentrale Seed-Daten (Muster Service GmbH) + bexio-Übergabe
  format.ts          # Deterministische CHF-/Zahlenformatierung (SSR-sicher)
  cn.ts              # className-Helper
  # Klarsa Core (Phase 2):
  klarsa-core-types.ts # Multi-Tenant-Domänentypen (Plan, vgl. docs/data-model.md)
  tenant-clean24.ts    # Erst-Tenant-Config: Clean24 Memis GmbH (ohne Secrets/echte Daten)
  database-types.ts    # TS-Spiegel des Supabase-Schemas (Enums + Row-Typen, v0.2.1)
  env.ts               # Lazy Env-Validierung (build-sicher; Service-Role nur Server)
  supabase/            # Clients: browser.ts (Anon), server.ts (Cookies), admin.ts (Service-Role, Server), middleware.ts
  auth/session.ts      # Server-Session-Helfer: getCurrentUser/Profile/Memberships/CompanyContext
  auth/tenant-data.ts  # RLS-gescopte Tenant-Reads (Firma, Zähler, Leads, Follow-ups [inkl. leadId], Offerten, Jobs, Opportunities/getProspects, Quellen/getLeadSources + getLeadSourceById, bexio-Übergaben/getInvoiceHandoffJobs) via Session-Client
  pdf/offer-pdf.ts     # abhängigkeitsfreier PDF-1.4-Generator (Standard-Helvetica/WinAnsi, keine Assets) (v0.3.3)
  ics/job-ics.ts       # abhängigkeitsfreier iCalendar-(.ics)-Generator (RFC 5545 VEVENT, keine Assets/Sync) (v0.3.5)

components/          # Wiederverwendbare UI-Bausteine
  PackageToggle, PackageCard, LockedFeature, DashboardMetricCard,
  LeadTable, LeadCard, AddOnCard, StatusBadge, ScoreBadge, SectionHeader,
  DemoShell, ModuleHeader, Panel, ComparisonTable, SuccessTimeline, Logo
  modules/           # Demo-Modulansichten (BossDashboard, LeadInbox, …)
  landing/           # Landingpage-Sektionen (Hero, ProblemSection, …)
  auth/LoginForm.tsx # Client-Login-Formular (Supabase Auth, lazy)
  leads/NewLeadForm.tsx # Client-Formular „Neuen Lead erfassen" (Server-Action, useActionState)
  leads/LeadStatusForm.tsx # Status-Select je Lead (kanonische Reihenfolge, Server-Action) (v0.3.1)
  leads/NewFollowupForm.tsx # „Follow-up erstellen" (Lead, Stufe, Fälligkeit, Kanal, Titel) (v0.3.1)
  leads/lead-status.ts    # geteilte Status-/Stufen-Metadaten (Labels, Flow-Reihenfolge, Badges)
  leads/form-styles.ts    # geteilte Formular-Tailwind-Klassen (DRY)
  offers/NewOfferForm.tsx # „Neue Offerte erstellen" (Lead, Referenz, Gültig-bis, MwSt, erste Position) (v0.3.2)
  offers/OfferStatusForm.tsx # Status-Select je Offerte (kanonische Reihenfolge, Server-Action) (v0.3.2)
  offers/AddOfferItemForm.tsx # Position zu Offerte hinzufügen (Server-Action, Summen-Neuberechnung) (v0.3.2)
  offers/offer-status.ts  # geteilte Offerten-Status-Metadaten + CHF-Formatter (v0.3.2)
  offers/OfferSendDraft.tsx # manueller Versand-Entwurf (Betreff/Text kopieren, kein Versand) (v0.3.3)
  offers/offer-send-draft.ts # reine Funktion: Schweizerdeutscher E-Mail-Entwurf aus Offerten-Daten (v0.3.3)
  offers/CreateJobButton.tsx # „Auftrag erstellen" auf angenommener Offerte (Server-Action, Duplikat-sicher) (v0.3.4)
  jobs/job-status.ts      # geteilte Job-Status-Metadaten (Labels, Badges) (v0.3.4)
  jobs/JobStatusForm.tsx  # Status-Select je Auftrag (kanonische Reihenfolge, Server-Action) (v0.3.5)
  jobs/JobScheduleForm.tsx # Termin setzen/entfernen (datetime-local → UTC-Instant, Server-Action) (v0.3.5)
  lead-hunter/NewOpportunityForm.tsx # „Opportunity erfassen" (manuell, Server-Action; optionaler Quellen-Seed + verstecktes source_id v0.3.10) (v0.3.6)
  lead-hunter/opportunity-meta.ts # geteilte Opportunity-Metadaten (Typen, 7 Services, Status, Score-Badge) (v0.3.6)
  lead-hunter/scoring.ts  # deterministisches Service-Matching + Score-Erklärung + nächste Aktion (pur, offline, keine KI/API) (v0.3.7)
  lead-hunter/PromoteOpportunityButton.tsx # „In Lead Inbox übernehmen" / „Bereits im Lead Inbox" (Server-Action) (v0.3.8)
  lead-hunter/NewSourceForm.tsx # „Quelle registrieren" (Quellen-Registry, manuell, Vorlagen-Chips, Server-Action) (v0.3.9)
  lead-hunter/source-meta.ts # geteilte Quellen-Metadaten (Typen, Phasen-Badges Manuell/API/Register, Vorlagen) (v0.3.9)
  lead-hunter/swiss-radar.ts # Schweiz-Radar-Daten (26 Kantone + stilisierte Koordinaten, Region→Kanton-Keyword-Map, Score-Farben; pur/offline, kein Kartenanbieter) (v0.3.11)
  bexio/handoff-meta.ts   # bexio-Übergabe-Status-Metadaten (handoff_status → Label/Badge, READY_JOB_STATUS) (v0.3.12)
  bexio/handoff-summary.ts # reine Funktion: kopierbare Rechnungs-Zusammenfassung (Kunde/Leistung/Ort/Netto-MwSt-Brutto) (v0.3.12)
  bexio/HandoffSummary.tsx # kopierbare bexio-Zusammenfassung (Clipboard, kein Versand/keine API) (v0.3.12)
  bexio/PrepareHandoffButton.tsx # „Für bexio vorbereiten" (Server-Action, owner/admin) (v0.3.12)
  bexio/MarkInvoicedButton.tsx # „Als verrechnet markieren" (Server-Action, owner/admin) (v0.3.12)
  ceo/kpi.ts              # reiner, deterministischer KPI-Helper (Volumen/Geld/Trichter/Conversions/Achtung/7-Tage; nowIso vom Aufrufer, keine KI) (v0.3.13)

app/
  layout.tsx         # Root-Layout (de, Systemschrift, Metadaten)
  icon.svg           # Favicon (Brand-Mark)
  page.tsx           # Landingpage
  demo/  pricing/  beratung/  faq/  brochure/   # öffentliche Seiten
  demo-script/  sales-kit/  video-script/       # interne Seiten (noindex)
  workspace/         # interne App-Foundation (noindex, statisch)
  app-shell/         # geschützter Tenant-Arbeitsbereich (noindex, force-dynamic, Session+RLS)
    leads/           # Lead Inbox: page.tsx (Liste, Status, Follow-ups) + actions.ts (createLead, updateLeadStatus, createFollowup)
    lead-hunter/     # Lead Hunter / Opportunity Radar: page.tsx (Radar-Übersicht, Liste, Promotion, Registry-/Radar-Links, Seed aus Quelle via ?source=) + actions.ts (createOpportunity [+ source_id], promoteOpportunity)
      sources/       # Quellen-Registry: page.tsx (Liste, Badges, Übersicht, owner/admin-Formular, „Opportunity vorbereiten") + actions.ts (createLeadSource; Settings-Domäne) (v0.3.9)
      radar/         # Schweiz-Radar: page.tsx (Stat-Karten, Kanton-Radar-SVG, Top-Regionen, Service-/Quellen-/Typ-Chips; nur Lesen, kein Kartenanbieter) (v0.3.11)
    offers/          # Offer Engine: page.tsx (Liste, Positionen, Summen, Status, PDF, Versand-Entwurf, Auftrag erstellen) + actions.ts (createOffer, updateOfferStatus, addOfferItem)
      [id]/pdf/route.ts  # geschützter Route-Handler: Offerten-PDF (Session-Client/RLS, sonst 404) (v0.3.3)
    jobs/            # Aufträge: page.tsx (Liste, Status, Termin) + actions.ts (createJobFromOffer, updateJobStatus, updateJobSchedule; Ops-Domäne)
      [id]/ics/route.ts  # geschützter Route-Handler: Termin-.ics (Session-Client/RLS, sonst 404) (v0.3.5)
    bexio/           # bexio-Übergabe: page.tsx (Bereit/Vorbereitet/Verrechnet, kopierbare Zusammenfassung) + actions.ts (prepareHandoff, markHandoffInvoiced; Manage-Domäne, keine echte bexio-API) (v0.3.12)
    ceo/             # CEO-Briefing: page.tsx (read-only KPI-Überblick, Geld-Wirkung, Trichter, Achtung-Karten; keine Actions) (v0.3.13)
  login/             # Login-Seite (noindex, Skelett)
  auth/callback/  logout/                        # Auth-Route-Handler (force-dynamic)
  globals.css        # Tailwind v4 Theme (navy-Palette), Basis-Stile

proxy.ts             # Next-16-Proxy (vormals middleware): Session-Refresh, gescopt auf /app-shell,/workspace,/login,/auth; no-op ohne Env

docs/                # Klarsa Core Architektur-Plan (Phase 2)
  phase-2-architecture.md  data-model.md  security-architecture.md
  lead-hunter-engine.md    bexio-architecture.md
  supabase-schema-notes.md       # Schema-Design zu supabase/migrations (v0.2.1)
  supabase-staging-setup.md      # Staging-Projekt anlegen + Migration anwenden (v0.2.2)
  rls-test-plan.md               # RLS-Testfälle + Rollenmatrix (Mandantentrennung, Rollen, Audit)
  staging-seed-plan.md           # fiktive Testdaten (zwei Demo-Tenants)
  supabase-staging-verification.md # Runbook: Migration anwenden + Skripte 1–4 (v0.2.4)
  supabase-staging-results.md    # Verifikationsergebnis klarsa-staging (v0.2.5, bestanden)
  auth-foundation.md             # Auth-Flow, Session/Clients, geschützte Routen, Service-Role-Regeln (v0.2.6)
  app-shell-staging-connection.md # /app-shell ↔ Staging: Env, Fake-Login, RLS-Lesepfad, kein Service-Role (v0.2.7)
  staging-login-test-users.md    # Login-fähige Dashboard-Testnutzer anlegen + via 004 binden (v0.2.7.1)
  app-shell-staging-results.md   # Ergebnis: App-Shell-Login bestanden (Clean24 Demo, owner, Pro; v0.2.7.3)
  clean24-tenant-setup.md        # Clean24 = erster realer Tenant: Config, Billing-Felder (002), Setup (005) (v0.2.8)
  clean24-staging-tenant-results.md # Ergebnis: Clean24-Staging-Tenant verifiziert (owner, Premium, Zähler 0; v0.2.9)
  clean24-lead-inbox-foundation.md # Lead Inbox: geschützte Route, manuelle Erfassung (Session/RLS), Migration 003 (v0.3.0)
  clean24-lead-inbox-results.md  # Ergebnis: Lead Inbox auf Staging verifiziert (Create/List, RLS-Schreibpfad; v0.3.0.1)
  clean24-lead-status-followups.md # Lead-Status-Workflow + Follow-ups: Flow, Felder, Security, Checkliste (v0.3.1)
  clean24-lead-status-followups-results.md # Ergebnis: Status-Update + Follow-ups auf Staging verifiziert (v0.3.1.1)
  clean24-offer-draft-foundation.md  # Offer Engine: manuelle Offerten-Entwürfe, Positionen, Status, Migration 004, Security (v0.3.2)
  clean24-offer-pdf-foundation.md    # Offer PDF-Download + manueller Versand-Entwurf: Generator ohne Assets, RLS/Tenant-Isolation, kein Versand (v0.3.3)
  clean24-job-from-offer-foundation.md # Auftrag aus angenommener Offerte: Ops-Domäne, Duplikat-Guard (Migration 005), /app-shell/jobs, Security (v0.3.4)
  clean24-job-workflow-calendar-foundation.md # Job-Status-Workflow + Termin (scheduled_for) + .ics-Download (ohne Sync), Security (v0.3.5)
  clean24-job-workflow-calendar-results.md # Ergebnis: Job-Workflow + Kalender auf Staging verifiziert (Status, Termin, .ics) (v0.3.5.1)
  clean24-lead-hunter-foundation.md  # Lead Hunter / Opportunity Radar (manuell): Feld-Mapping auf prospects, Vokabulare, Security, kein Scraping (v0.3.6)
  clean24-lead-hunter-scoring.md     # Deterministisches Scoring + Service-Matching (offline, keine KI/API), Score-Tabelle, Boundaries (v0.3.7)
  clean24-lead-hunter-scoring-results.md # Ergebnis: Scoring/Service-Matching auf Staging verifiziert (live, übernehmen, Badges, Save/List) (v0.3.7.1)
  clean24-opportunity-to-lead-foundation.md # Opportunity → Lead Inbox: Promotion, Feld-Mapping, Duplikat-Guard (atomarer Claim), Security (v0.3.8)
  clean24-lead-hunter-source-registry.md # Lead Hunter Quellen-Registry: lead_sources, manuell, Badges (Phase/Aktiv), Settings-Domäne, kein Scraping/Google/ZEFIX/SIMAP (v0.3.9)
  clean24-lead-hunter-source-registry-results.md # Ergebnis: Quellen-Registry auf Staging verifiziert (Register/List, Badges/Vorlagen, RLS Settings-Domäne) (v0.3.9.1)
  clean24-source-to-opportunity-foundation.md # Source→Opportunity-Workflow: „Opportunity vorbereiten", Seed via ?source=, prospects.source_id (Migration 006), manuell, kein Scraping (v0.3.10)
  clean24-source-to-opportunity-results.md # Ergebnis: Source→Opportunity auf Staging verifiziert (Migration 006 + Schema-Reload, Seed-Formular, Quellen-Label gespeichert/gezeigt, RLS sales-Domäne) (v0.3.10.1)
  clean24-swiss-opportunity-radar-map.md # Swiss Opportunity Radar Map: statische Kanton-Radar-Ansicht aus prospects-Daten, Region→Kanton offline, kein Kartenanbieter/API, keine neue Migration (v0.3.11)
  clean24-swiss-opportunity-radar-map-results.md # Ergebnis: Schweiz-Radar auf Staging verifiziert (Stat-Karten/SVG/Regionen/Chips gerendert, Quellen-Labels, Read-only-RLS, kein Karten-API/Geokodierung) (v0.3.11.1)
  clean24-bexio-handoff-foundation.md # bexio-Übergabe: manuelle Rechnungs-Übergabe-Warteschlange (bexio_handoffs), „vorbereiten"/„verrechnet", kopierbare Zusammenfassung, Manage-Domäne, KEINE echte bexio-API/Token, keine neue Migration (v0.3.12)
  clean24-bexio-handoff-results.md # Ergebnis: bexio-Übergabe auf Staging verifiziert (abgeschlossener Job → vorbereiten/Zusammenfassung/verrechnen, owner/admin-Manage-RLS, keine echte bexio-API) (v0.3.12.1)
  clean24-ceo-kpi-dashboard-foundation.md # CEO-/KPI-Dashboard: read-only Owner-Überblick (/app-shell/ceo), Geld-Wirkung/KPI/Trichter/Achtung aus vorhandenen RLS-Daten, reiner kpi.ts-Helper, keine KI/externe API/Schreibvorgänge, keine neue Migration (v0.3.13)
  clean24-ceo-kpi-dashboard-results.md # Ergebnis: CEO-Briefing auf Staging verifiziert (Money/KPI/Trichter/Achtung gerendert + verlinkt, CEO-Karte auf /app-shell, Read-only-RLS, keine KI/externe API) (v0.3.13.1)
  # v0.4.0 Production-Readiness-Gate (Policy/Runbooks, keine Features):
  production-readiness-gate.md       # Hub: Master-Checkliste + GO/NO-GO (aktuell NO-GO) (v0.4.0)
  security-rls-verification-checklist.md # Mandantentrennung, Rollen-/Domänen-Matrix, kein Service-Role in App, How-to-verify (v0.4.0)
  backup-restore-runbook.md          # Backups, PITR, externer Export, Schritt-für-Schritt-Restore + Restore-Test (v0.4.0)
  staging-production-separation.md   # zwei getrennte Projekte/Secrets, Fake-Daten nur Staging, Migrationsfluss (v0.4.0)
  real-data-gate-policy.md           # was vor echten Daten erfüllt sein muss; Entscheidungs-Record (v0.4.0)
  incident-recovery-runbook.md       # Secret-Leak/Datenverlust/Bad-Deploy/Migration/RLS-Regression (v0.4.0)
  clean24-data-handling-policy.md    # Zugriff/Export/Löschung/Audit/Aufbewahrung für Clean24 (v0.4.0)
  clean24-production-tenant-bootstrap.md # Produktions-Tenant-Bootstrap: Platzhalter-UID ersetzen, nur in klarsa-production, keine Fake-/Kundendaten, Verifikation, real-data weiter NO-GO (v0.4.1)
  clean24-production-bootstrap-results.md # Ergebnis: Bootstrap + Vercel-Produktions-Login auf klarsa-production verifiziert (Verifikationszähler, Env ohne Secret-Werte, Owner-Login), real-data weiter NO-GO bis Restore-Test + GO (v0.4.1.1)
  clean24-lead-hunter-results.md     # Ergebnis: Opportunity Radar auf Staging verifiziert (Capture/List, Radar-Karten) (v0.3.6.1)
  clean24-job-from-offer-results.md  # Ergebnis: Job-Erstellung auf Staging verifiziert (Migration 005, Offer→Job, Jobs-Liste, Duplikat-Guard) (v0.3.4.1)
  clean24-offer-pdf-results.md       # Ergebnis: Offer PDF auf Staging verifiziert (Route, Daten/Positionen/Summen, Versand-Entwurf) (v0.3.3.1)
  clean24-offer-draft-results.md     # Ergebnis: Offer Engine auf Staging verifiziert (Migration 004, Create/List/Item/Status) (v0.3.2.1)

supabase/            # DB-Fundament (nur Migrationen/Skripte, keine Credentials/Daten)
  migrations/
    001_klarsa_core_schema.sql           # Enums, 20 Tabellen, Indizes, RLS (rollenbasiert)
    002_clean24_tenant_billing_foundation.sql # additiv: Billing-/Access-Enums + -Felder (v0.2.8)
    003_leads_notes.sql                  # additiv: leads.notes (Lead Inbox) (v0.3.0)
    004_followup_lead_tenant_integrity.sql # additiv/idempotent: unique leads(id,company_id) + Composite FK followup_tasks→leads (F6, v0.3.2)
    005_jobs_one_live_per_offer.sql      # additiv/idempotent: partieller Unique-Index – ein lebender Job pro Offerte (v0.3.4)
    006_prospects_source_id.sql          # additiv/idempotent: prospects.source_id → lead_sources(id) (Source→Opportunity, v0.3.10)
  verification/      # Verifikations-/Setup-Skripte:
    001_verify_schema.sql            # read-only: Schema/RLS prüfen, keine Daten
    002_fake_seed_for_rls_tests.sql  # fiktive Staging-Daten (@example.test)
    003_rls_test_queries.sql         # RLS-Tests (jede Zeile = PASS)
    004_bind_auth_user_to_fake_tenant.sql # Dashboard-Auth-User an Fake-Tenant binden (Login-Tests, v0.2.7.1)
    005_create_clean24_staging_tenant.sql # Clean24-Founder-Tenant-Setup, keine Kundendaten (v0.2.8)
    006_production_readiness_checks.sql # read-only: RLS/Helfer/Policies/audit-append-only-Gate-Checks; sicher auf Staging ODER Produktion (v0.4.0)
  production/        # NUR Produktion (klarsa-production):
    001_create_clean24_production_tenant.sql # idempotenter Clean24-Tenant-Bootstrap (Company/Owner/Konfig), Platzhalter-UID, KEINE Kundendaten/Secrets (v0.4.1)
  README.md          # Anwenden (Staging zuerst), keine Secrets, Security-Gate

.env.local.example   # Env-Template (nur Platzhalter) — echtes .env.local ist ignoriert
```

Das Original-Logo liegt unter `public/brand/klarsa-logo.png`. Eingebunden wird
über `components/Logo.tsx` (`next/image`) eine web-optimierte Kopie
(`public/brand/klarsa-logo-web.png`), damit die Auslieferung schlank bleibt. Das
Favicon (`app/icon.svg`) ist ein „K"-Monogramm in den Klarsa-Farben.

### Paket-Gating

`lib/package-gates.ts` definiert pro Modul den Zugriff je Paket:

| Modul                | Starter | Pro     | Premium |
| -------------------- | ------- | ------- | ------- |
| `leadInbox`          | full    | full    | full    |
| `offerEngine`        | full    | full    | full    |
| `followUp`           | full    | full    | full    |
| `leadHunter`         | locked  | full    | full    |
| `jobOrganizer`       | locked  | full    | full    |
| `marketingAssistant` | locked  | limited | full    |
| `advancedReports`    | locked  | limited | full    |
| `landingPage`        | locked  | locked  | full    |
| `b2bPipeline`        | locked  | locked  | full    |
| `bexio`              | locked  | full    | full    |

Gesperrte Module rendern eine `LockedFeature`-Upgrade-Ansicht; im Demo wechselt
der Upgrade-Button direkt in das passende Paket.

## Paketmodell

| Paket   | Produktname        | Setup     | Monatlich | Fokus                                                                     |
| ------- | ------------------ | --------- | --------- | ------------------------------------------------------------------------- |
| Starter | KI Offer Büro      | CHF 2'490 | CHF 299   | Eingehende Leads, Preise, PDF-Offerten, Follow-ups                        |
| **Pro** | KI Sales Autopilot | CHF 4'990 | CHF 599   | **Empfohlen** – Starter + KI Lead Hunter, Aufträge, bexio Connect, Chef-Report |
| Premium | KI Growth Office   | CHF 7'490 | CHF 999   | Pro + bexio Connect Plus, B2B-Pipeline, Strategie-Reports, höhere Limiten |

Erweiterbar über Add-ons (`lib/addons.ts`). Genaue Limiten und das Gating liegen
zentral in `lib/packages.ts` und `lib/package-gates.ts`.

## Bewusst NICHT enthalten

Bezieht sich auf die öffentliche **Verkaufs-Demo**. Das **Klarsa-Core-Fundament**
(Schema, RLS, Auth-Clients) ist angelegt, aber **ohne Credentials/`.env.local`
inaktiv** und nicht mit echten Daten verbunden.

- Keine **aktive** Supabase-/Datenbank-Anbindung (Schema-Migration + Auth-Fundament vorhanden, ohne Env inaktiv)
- Kein **aktives** Login mit echten Daten (Auth-Fundament ab v0.2.6; ohne Staging-Env inaktiv, build-sicher)
- Keine Zahlungen / kein Stripe
- Kein E-Mail-Versand (Beratungs-CTA öffnet nur einen `mailto:`-Link an `info@klarsa.ch`)
- Keine externen APIs, keine KI-API-Aufrufe, kein Scraping
- Keine echte bexio-API – die bexio-Übergabe ist nur eine Demo
- Kein fertiges Video (Erklärvideo nur als Konzept/Storyboard)
- Keine echten Kundendaten (nur fiktive lokale Demo-/`@example.test`-Staging-Daten)
- Keine öffentliche Clean24-Integration (interner Proof, getrennt)

## Data Safety / Backup-Strategie

**Aktueller Stand (v0.1.x):**

- Reine Frontend-/Demo-Anwendung.
- Speichert keine echten Kundendaten (nur lokale Seed-Daten).
- Code ist über Git-Commits wiederherstellbar.
- Deployment lässt sich später über Vercel zurückrollen (Rollback).
- Echte Kundendaten dürfen erst live gehen, wenn eine Backup-/Recovery-Architektur existiert.

**Produktionsanforderungen (vor echten Kundendaten):**

- Vercel-Rollback für Code-/Deployment-Recovery
- Supabase-Datenbank-Backups
- Point-in-Time-Recovery (PITR) für die Produktion
- Tägliche externe Exporte (ausserhalb von Supabase)
- Backup-Strategie für Storage / Dateien
- Dokumentierte und getestete Restore-Prozedur (Restore-Test)
- Soft-Delete / Restore für Kundendaten
- Audit-Log für kritische Aktionen

## Security & Datenschutz-Anforderungen

Bevor echte Kundendaten produktiv gehen, muss das System umsetzen:

- Authentifizierter Zugriff (Login)
- Rollenbasierte Berechtigungen (RBAC)
- Mandantentrennung über `company_id`
- Supabase Row Level Security (RLS)
- Audit-Logs für kritische Aktionen
- Soft-Delete / Restore
- Eingabevalidierung (Input Validation)
- Rate-Limiting für API-Routen
- Sichere Webhook-Secrets
- Security-Header / Content-Security-Policy (CSP)
- Privater Storage mit signierten URLs (Signed URLs)
- Beschränkung von Dateityp und Dateigrösse
- Malware-/Viren-Scan-Strategie für Uploads
- Verschlüsselte bexio-Tokens
- Kein Logging von Secrets / Tokens
- KI: menschliche Freigabe (Human-Approval) für riskante Aktionen

> **Harte Regel: „No Security = No Customer Data."**
> Kein echtes Kundenkonto, keine Firmendaten, kein bexio-Token, kein Datei-Upload und
> keine echten Lead-/Offerten-/Auftragsdaten gehen live, bevor die Security- und
> Backup-Architektur implementiert ist.

## Lead-Hunter-Architektur

Der KI Lead Hunter **scrapt nicht unkontrolliert das Internet**. Er ist eine
kontrollierte Discovery- und Qualifizierungs-Pipeline:

```
Branchenvorlage → Zielregion → Ziel-Kundentyp → freigegebene Quelle/Provider
→ Query-Generierung → Ergebnis-Normalisierung → Duplikatsprüfung → Anreicherung
→ Lead-Scoring → Quellen-Tracking → Begründung/Erklärung → Nachrichten-Entwurf
→ menschliche Freigabe → CRM-Pipeline
```

**Mögliche Datenquellen (Kandidaten, noch nicht implementiert):**

- Manuelle Importe / CSV
- Freigegebene öffentliche Branchenverzeichnisse
- Google Places / Maps API
- ZEFIX / Handelsregister-Validierung
- Bestehende, kundeneigene Lead-Listen
- Website-/Profil-Signale

**Lead-Qualitätsfelder:**

- `source` – Quelle
- `searchQuery` – verwendete Suchanfrage
- `category` – Kategorie
- `regionMatch` – Regions-Übereinstimmung
- `serviceFit` – Service-Passung
- `score`
- `confidence` – Konfidenz
- `reason` – Begründung, warum relevant
- `suggestedNextAction` – vorgeschlagene nächste Aktion
- `approvalStatus` – Freigabestatus

**Compliance-Regeln:**

- Kein unkontrolliertes Scraping
- Keine automatische Kaltakquise
- Kein Bulk-Spam
- Quelle muss gespeichert werden
- Menschliche Freigabe vor ausgehenden Nachrichten
- Opt-out / Abmeldung muss später behandelt werden

## Klarsa Core (Phase 2) — Multi-Tenant-Plan

Ab **v0.2.0** beginnt das echte Core-System: **Klarsa als Multi-Tenant-SaaS** für
Schweizer KMU. Viele Firmen (Tenants) teilen sich Anwendung und Datenbank, sind
aber strikt über `company_id` getrennt (Supabase RLS).

- **Clean24 Memis GmbH = erster Tenant / Live-Proof** (Branche Reinigung, Schweiz).
  Typisierte Erst-Config: [`lib/tenant-clean24.ts`](lib/tenant-clean24.ts).
- **Abgrenzung:** Der alte, eigenständige **Clean24 Lead Autopilot** bleibt ein
  **getrenntes** System — keine Migration, kein Import, keine Kopplung.
- **Core-Typen:** [`lib/klarsa-core-types.ts`](lib/klarsa-core-types.ts) (Plan,
  vgl. Datenmodell).
- **DB-Schema-Fundament (v0.2.1):**
  [`supabase/migrations/001_klarsa_core_schema.sql`](supabase/migrations/001_klarsa_core_schema.sql)
  (10 Enums, 20 Tabellen, Indizes, RLS + Draft-Policies) und der TS-Spiegel
  [`lib/database-types.ts`](lib/database-types.ts). Nur Migration/Typen — **keine
  Credentials, keine Datenbank, keine Daten**.
- **Foundation-Seite:** `/workspace` (intern, statisch) — zeigt Plan + Tenant +
  Module, mit Warnung „Noch kein Login, keine echten Kundendaten."

**Architektur-Dokumentation** (`docs/`):

| Dokument | Inhalt |
| --- | --- |
| [phase-2-architecture.md](docs/phase-2-architecture.md) | Multi-Tenant-Überblick, Clean24 als Tenant, Module, Implementierungsphasen |
| [data-model.md](docs/data-model.md) | 20 geplante Tabellen, `company_id`-Strategie, Soft-Delete/Audit |
| [supabase-schema-notes.md](docs/supabase-schema-notes.md) | Schema-Design zur Migration: Tabellengruppen, RLS-/Soft-Delete-/Audit-Strategie |
| [supabase-staging-setup.md](docs/supabase-staging-setup.md) | Runbook: Staging-Projekt anlegen, `.env.local`, Migration anwenden, prüfen (v0.2.2) |
| [supabase-staging-verification.md](docs/supabase-staging-verification.md) | Runbook: Migration + Verifikationsskripte 1–4 ausführen, Clean/Reset (v0.2.4) |
| [supabase-staging-results.md](docs/supabase-staging-results.md) | Verifikationsergebnis `klarsa-staging` (2026-06-09, bestanden; v0.2.5) |
| [auth-foundation.md](docs/auth-foundation.md) | Auth-Flow, Session/Clients, Cookie-Strategie, Rollen-Lookup, geschützte Routen, Service-Role-Regeln (v0.2.6) |
| [app-shell-staging-connection.md](docs/app-shell-staging-connection.md) | `/app-shell` ↔ Staging: `.env.local`, Fake-User-Login, RLS-Lesepfad, kein Service-Role für Tenant-Reads (v0.2.7) |
| [staging-login-test-users.md](docs/staging-login-test-users.md) | Login-fähige Testnutzer: Dashboard-Auth-User anlegen (Auto-Confirm) + via `004` an Fake-Tenant binden (v0.2.7.1) |
| [app-shell-staging-results.md](docs/app-shell-staging-results.md) | Ergebnis: App-Shell-Staging-Login bestanden (Clean24 Demo, owner, Pro, RLS-Zähler; 2026-06-09, v0.2.7.3) |
| [clean24-tenant-setup.md](docs/clean24-tenant-setup.md) | Clean24 = erster realer Tenant: Config (Premium, internal_founder), Billing-Felder (Migration 002), Staging-Setup (005) (v0.2.8) |
| [clean24-staging-tenant-results.md](docs/clean24-staging-tenant-results.md) | Ergebnis: Clean24-Staging-Tenant verifiziert (owner, Premium, alle Zähler 0; 2026-06-09, v0.2.9) |
| [clean24-lead-inbox-foundation.md](docs/clean24-lead-inbox-foundation.md) | Lead Inbox `/app-shell/leads`: geschützte manuelle Erfassung via Session/RLS, Migration 003, kein Service-Role/keine externen Quellen (v0.3.0) |
| [clean24-lead-inbox-results.md](docs/clean24-lead-inbox-results.md) | Ergebnis: Lead Inbox auf Staging verifiziert — Create/List für Clean24, RLS-Schreibpfad bestätigt (2026-06-09, v0.3.0.1) |
| [clean24-lead-status-followups.md](docs/clean24-lead-status-followups.md) | Lead-Status-Workflow (kanonischer Flow, nicht starr) + manuelle Follow-ups: Datenfluss, Defense-in-Depth, Verifikations-Checkliste (v0.3.1) |
| [clean24-lead-status-followups-results.md](docs/clean24-lead-status-followups-results.md) | Ergebnis: Status-Update + Follow-up Create/List auf Staging verifiziert — Clean24, RLS-Schreibpfad bestätigt (2026-06-10, v0.3.1.1) |
| [clean24-offer-draft-foundation.md](docs/clean24-offer-draft-foundation.md) | Offer Engine: manuelle Offerten-Entwürfe (optional aus Lead), Positionen + serverseitige Summen, Status-Flow, Datenfluss, Migration 004 (F6-Hardening), Security, Checkliste (v0.3.2) |
| [clean24-offer-pdf-foundation.md](docs/clean24-offer-pdf-foundation.md) | Offer PDF-Download (`/app-shell/offers/[id]/pdf`, RLS/Tenant-Isolation, Generator ohne Library/Asset) + manueller Versand-Entwurf (Kopiertext, kein echter Versand), Datenfluss, Security, Checkliste (v0.3.3) |
| [clean24-offer-pdf-results.md](docs/clean24-offer-pdf-results.md) | Ergebnis: Offer PDF auf Staging verifiziert — Route nach Login, Daten/Positionen/Summen gerendert, Versand-Entwurf vorhanden, kein echter Versand (2026-06-11, v0.3.3.1; PDF-Politur aufgeschoben) |
| [clean24-job-from-offer-foundation.md](docs/clean24-job-from-offer-foundation.md) | Auftrag aus angenommener Offerte: „Auftrag erstellen", Ops-Domäne (`can_write_ops`), Duplikat-Guard (Vorprüfung + Migration 005), `/app-shell/jobs`-Liste, Datenfluss, Security, Checkliste (v0.3.4) |
| [clean24-job-from-offer-results.md](docs/clean24-job-from-offer-results.md) | Ergebnis: Job-Erstellung auf Staging verifiziert — Migration 005 angewendet, angenommene Offerte → Job, Jobs-Liste, Duplikat verhindert, RLS-Schreibpfad bestätigt (2026-06-11, v0.3.4.1) |
| [clean24-job-workflow-calendar-foundation.md](docs/clean24-job-workflow-calendar-foundation.md) | Job-Status-Workflow + Terminplanung (`scheduled_for`, browser→UTC) + `.ics`-Download (`/app-shell/jobs/[id]/ics`, RFC 5545, ohne Library/Sync), Ops-Domäne, Datenfluss, Security, Checkliste (v0.3.5) |
| [clean24-job-workflow-calendar-results.md](docs/clean24-job-workflow-calendar-results.md) | Ergebnis: Job-Workflow & Kalender auf Staging verifiziert — Status-Update, Terminplanung, `.ics`-Download, RLS-Schreibpfad (Ops-Domäne) bestätigt (2026-06-11, v0.3.5.1) |
| [clean24-lead-hunter-foundation.md](docs/clean24-lead-hunter-foundation.md) | Lead Hunter / Opportunity Radar (manuell): `/app-shell/lead-hunter`, Feld-Mapping auf `prospects` (Sales-Domäne `can_write_sales`), Typen/Service-Vokabulare, Radar-Übersicht, Security, **kein Scraping/externe Quelle**, Checkliste (v0.3.6) |
| [clean24-lead-hunter-results.md](docs/clean24-lead-hunter-results.md) | Ergebnis: Opportunity Radar auf Staging verifiziert — manuelle Erfassung + Liste, Radar-Karten aktualisiert, RLS-Schreibpfad (Sales-Domäne) bestätigt, kein Scraping (2026-06-11, v0.3.6.1) |
| [clean24-lead-hunter-scoring.md](docs/clean24-lead-hunter-scoring.md) | Deterministisches Scoring & Service-Matching (offline, keine KI/API): `scoring.ts`, Service-Vokabular, Score-Faktoren-Tabelle, Auto-Fill (client-seitig), Boundaries, Checkliste (v0.3.7) |
| [clean24-lead-hunter-scoring-results.md](docs/clean24-lead-hunter-scoring-results.md) | Ergebnis: Scoring & Service-Matching auf Staging verifiziert — Live-Analyse, „Vorschläge übernehmen", Badges, Save/List, RLS-Schreibpfad bestätigt, keine KI/API/Scraping (2026-06-11, v0.3.7.1) |
| [clean24-opportunity-to-lead-foundation.md](docs/clean24-opportunity-to-lead-foundation.md) | Opportunity → Lead Inbox-Konversion: „In Lead Inbox übernehmen", Feld-Mapping (prospects→leads), bidirektionaler Link, Duplikat-Guard (atomarer Claim + Orphan-Rollback), Sales-Domäne, Security, Checkliste (v0.3.8) |
| [clean24-lead-hunter-source-registry.md](docs/clean24-lead-hunter-source-registry.md) | Lead Hunter Quellen-Registry: kontrollierte, von Menschen freigegebene `lead_sources` manuell registrieren (`/app-shell/lead-hunter/sources`), Feld-Mapping (label/type/enabled/notes), Phasen-Badges (Manuell/Künftige API/Künftiges Register), Settings-Domäne (`can_write_settings` = owner/admin), kein Scraping/Google/ZEFIX/SIMAP, Security, Checkliste (v0.3.9) |
| [clean24-lead-hunter-source-registry-results.md](docs/clean24-lead-hunter-source-registry-results.md) | Ergebnis: Quellen-Registry auf Staging verifiziert — Quelle registrieren + Liste/Übersicht, Badges/Vorlagen, Session-Client-/RLS-Schreibpfad (Settings-Domäne) bestätigt, kein Scraping/keine API, keine echten Daten (2026-06-11, v0.3.9.1) |
| [clean24-source-to-opportunity-foundation.md](docs/clean24-source-to-opportunity-foundation.md) | Source → Opportunity-Workflow: aus registrierter Quelle „Opportunity vorbereiten" → vorausgefülltes Formular (`?source=`), Feld-Seed (source_type + Grund aus label/notes), Rückverknüpfung `prospects.source_id` (additive Migration 006, spiegelt `leads.source_id`), Defense-in-Depth (Quelle = aktiver Mandant), deterministisches Scoring wiederverwendet, kein Scraping/keine API, Security, Checkliste (v0.3.10) |
| [clean24-source-to-opportunity-results.md](docs/clean24-source-to-opportunity-results.md) | Ergebnis: Source → Opportunity auf Staging verifiziert — Migration `006` angewendet (+ Schema-Reload), „Opportunity vorbereiten" → Seed-Formular + Quellen-Kontext, Opportunity gespeichert, „Quelle: <Label>" in der Liste, Session-Client-/RLS-Schreibpfad (sales-Domäne) bestätigt, kein Scraping/keine API, keine echten Daten (2026-06-11, v0.3.10.1) |
| [clean24-swiss-opportunity-radar-map.md](docs/clean24-swiss-opportunity-radar-map.md) | Swiss Opportunity Radar Map-Fundament: geschützte `/app-shell/lead-hunter/radar`, statische/stilisierte Kanton-Radar-SVG + Stat-Karten + Top-Regionen + Service-/Quellen-/Typ-Chips aus vorhandenen `prospects`-Daten, deterministisches Region→Kanton-Offline-Mapping (`swiss-radar.ts`), nur Lesen (Session-Client/RLS), **kein Kartenanbieter/Tiles/Google/ZEFIX/SIMAP/Geokodierung**, keine neue Migration, Security, Checkliste (v0.3.11) |
| [clean24-swiss-opportunity-radar-map-results.md](docs/clean24-swiss-opportunity-radar-map-results.md) | Ergebnis: Schweiz-Radar auf Staging verifiziert — Radar-Route nach Login erreichbar, Stat-Karten + Kanton-Radar-SVG + Top-Regionen + Service-/Quellen-/Typ-Chips gerendert (Quellen-Labels via `prospects.source_id`), Read-only-/RLS-Pfad bestätigt, kein Karten-API/keine Tiles/keine Geokodierung/kein Scraping, keine echten Daten (2026-06-12, v0.3.11.1) |
| [clean24-bexio-handoff-foundation.md](docs/clean24-bexio-handoff-foundation.md) | bexio-Übergabe-Fundament: geschützte `/app-shell/bexio`, **manuelle** Rechnungs-Übergabe-Warteschlange für abgeschlossene Aufträge (`bexio_handoffs`), „Für bexio vorbereiten" (Status `queued`) + „Als verrechnet markieren" (`completed`) + kopierbare Zusammenfassung, Manage-Domäne (`can_manage_company` = owner/admin), **keine echte bexio-API/Token/Netzwerkaufruf/automatische Rechnung**, keine neue Migration, Security, Checkliste (v0.3.12) |
| [clean24-bexio-handoff-results.md](docs/clean24-bexio-handoff-results.md) | Ergebnis: bexio-Übergabe auf Staging verifiziert — `/app-shell/bexio` nach Login erreichbar, abgeschlossener Job in der Warteschlange, „Für bexio vorbereiten" legt `bexio_handoffs` an, kopierbare Zusammenfassung, „Als verrechnet markieren" funktioniert, owner/admin-Manage-/RLS-Pfad bestätigt, keine echte bexio-API/kein Token/Netzwerkaufruf, keine echten Daten (2026-06-12, v0.3.12.1) |
| [clean24-ceo-kpi-dashboard-foundation.md](docs/clean24-ceo-kpi-dashboard-foundation.md) | CEO-/KPI-Dashboard-Fundament: geschützte, **read-only** `/app-shell/ceo` (CEO-Briefing) – Geld-Wirkung (CHF), KPI-Kacheln, Trichter Opportunity→Lead→Offerte→Auftrag→bexio + Conversions, Letzte-7-Tage, Achtung-Karten aus vorhandenen RLS-Daten; reiner deterministischer `kpi.ts`-Helper, **keine KI/externe API/bexio-API/Schreibvorgänge**, keine neue Migration, Security, Checkliste (v0.3.13) |
| [clean24-ceo-kpi-dashboard-results.md](docs/clean24-ceo-kpi-dashboard-results.md) | Ergebnis: CEO-Briefing auf Staging verifiziert — `/app-shell/ceo` nach Login erreichbar (CEO-Karte auf `/app-shell`), Geld-Wirkung + KPI-Kacheln + Trichter + Letzte-7-Tage + Achtung-Karten gerendert und korrekt verlinkt, Read-only-/RLS-Pfad bestätigt, keine Schreibvorgänge/KI/externe API/bexio-API, keine echten Daten (2026-06-12, v0.3.13.1) |
| [production-readiness-gate.md](docs/production-readiness-gate.md) | **v0.4.0 Gate-Hub:** Master-Readiness-Checkliste (Environment/Auth-RLS/Backup-Restore/Data-Handling) + **GO/NO-GO-Entscheid** (aktuell **NO-GO**); harte Regel „No Security = No Customer Data"; Links auf alle Gate-Docs (v0.4.0) |
| [security-rls-verification-checklist.md](docs/security-rls-verification-checklist.md) | Security-/RLS-Verifikation: Mandantentrennung (cross-tenant blockiert), Rollen-/Domänen-Matrix (owner/admin/sales/ops/readonly/superadmin), **kein Service-Role-Client in App-Routen/Actions** (grep-verifiziert), RLS-Posture via `verification/006`, How-to-verify + Sign-off (v0.4.0) |
| [backup-restore-runbook.md](docs/backup-restore-runbook.md) | Backup & Restore: Supabase-Backups, **PITR**, täglicher externer Export, **Schritt-für-Schritt-Restore** (in frisches Projekt) + verpflichtender **Restore-Test**, Vercel-Rollback, Sign-off (v0.4.0) |
| [staging-production-separation.md](docs/staging-production-separation.md) | Staging vs. Produktion: zwei getrennte Supabase-Projekte/Secrets, `.env.local`=nur Staging, Vercel-Env-Trennung, Fake-Seed nie auf Produktion, Migrationsfluss Staging→Produktion (v0.4.0) |
| [real-data-gate-policy.md](docs/real-data-gate-policy.md) | Real-Data-Gate-Policy: was „echte Daten" sind, die 10 Pflichtpunkte vor Produktion, wer freigibt (Inhaber), Decision-Record (aktuell **NO-GO**) (v0.4.0) |
| [incident-recovery-runbook.md](docs/incident-recovery-runbook.md) | Incident-/Recovery-Runbook: Severity, Playbooks für Secret-Leak/Datenverlust/unbefugten Zugriff/Bad-Deploy/Bad-Migration/RLS-Regression, Post-Incident-Review, Drills (v0.4.0) |
| [clean24-data-handling-policy.md](docs/clean24-data-handling-policy.md) | Clean24-Datenrichtlinie: Zugriff (least privilege, kein Service-Role in App), Export (owner/admin, auditiert), Löschung (soft→kontrolliert hart), Audit-Erwartungen (append-only), Aufbewahrung, Betroffenenrechte (v0.4.0) |
| [clean24-production-tenant-bootstrap.md](docs/clean24-production-tenant-bootstrap.md) | Clean24 Produktions-Tenant-Bootstrap: produktionssicheres, idempotentes Skript (`supabase/production/001…`) für Company/Settings/Owner/Service-/Quellen-Konfig; **Platzhalter `CLEAN24_OWNER_AUTH_USER_ID` vor dem Lauf ersetzen, echten UID nie committen**, nur in `klarsa-production`, keine Fake-/Kundendaten, Verifikation, real-data weiter **NO-GO** (v0.4.1) |
| [clean24-production-bootstrap-results.md](docs/clean24-production-bootstrap-results.md) | Ergebnis: Clean24-Produktions-Bootstrap **auf Produktion verifiziert** (2026-06-13) — Skript-Lauf + Verifikationszähler (premium/active/internal_founder/full, services=8, sources=4, owners=1, alle Kundendaten-Zähler=0), Vercel-Produktions-Env **ohne Secret-Werte** + Auth-URL `klarsa.vercel.app`, Redeploy, **Owner-Login erfolgreich**, keine echten Daten; real-data weiter **NO-GO** bis Restore-Test + Inhaber-GO (v0.4.1.1) |
| [clean24-offer-draft-results.md](docs/clean24-offer-draft-results.md) | Ergebnis: Offer Engine auf Staging verifiziert — Migration 004 angewendet, Offer Create/List + Positions-Add + Status-Update für Clean24, RLS-Schreibpfad bestätigt (2026-06-10, v0.3.2.1) |
| [rls-test-plan.md](docs/rls-test-plan.md) | 13 RLS-Testfälle + Rollenmatrix: Mandantentrennung, readonly-Schreibsperre, Rollen-Scoping, Append-only-Audit, kein Anon-Zugriff |
| [staging-seed-plan.md](docs/staging-seed-plan.md) | Fiktive Testdaten (zwei Demo-Tenants) nur für RLS-/Workflow-Tests |
| [security-architecture.md](docs/security-architecture.md) | Auth, RBAC, RLS, Audit, Backup/PITR, „No Security = No Customer Data" |
| [lead-hunter-engine.md](docs/lead-hunter-engine.md) | Kontrollierte Discovery-Pipeline mit Human-Approval |
| [bexio-architecture.md](docs/bexio-architecture.md) | Connect/Connect Plus, verschlüsselte Tokens, Handoff-Queue |

> Reihenfolge ist verbindlich: **keine echten Kundendaten** vor Auth, RLS,
> Audit-Logs und getesteter Backup-/Restore-Architektur.

## Interne nächste Schritte

**v0.1.5 (erledigt)** – finales visuelles QA, zentrale Kontaktadresse
(`info@klarsa.ch`), bereinigtes Wording sowie klarere Demo- und
bexio-Texte.

**v0.1.6 (erledigt)** – Produktions-Voraussetzungen dokumentiert: Data Safety /
Backup-Strategie, Security & Datenschutz und Lead-Hunter-Architektur (siehe oben).

**v0.1.7 (erledigt)** – Public-Rebrand auf **Klarsa** (Marke, Logo, „K"-Favicon,
Kontakt `info@klarsa.ch`, Positionierung „KI-Verkaufsbüro") und Mobile-Politur.

**v0.2.0 (erledigt)** – Start von **Klarsa Core**: Architektur-Docs (`docs/`),
Core-Typen, Erst-Tenant-Config (Clean24), `/workspace`-Foundation. Nur Doku/Typen/
Skelett — kein Backend.

**v0.2.1 (erledigt)** – **Supabase-Schema-Fundament**: erste Migration
(`supabase/migrations/001_klarsa_core_schema.sql`) mit 10 Enums, 20 Tabellen,
Indizes, RLS + Draft-Policies; `supabase/README.md`,
`docs/supabase-schema-notes.md` und TS-Spiegel `lib/database-types.ts`. Ohne
Credentials, ohne Datenbank, ohne echte Daten.

**v0.2.2 (erledigt)** – **Supabase-Staging-Setup + RLS-Testplan** (Plan, keine
Umsetzung): Env-Template `.env.local.example`, Runbooks `supabase-staging-setup.md`,
`rls-test-plan.md` und `staging-seed-plan.md` (fiktive Daten). Ohne Credentials,
ohne Projekt, ohne echte Daten.

**v0.2.3 (erledigt)** – **RLS-Rollen-Härtung**: rollenbasierte Policies (Lesen =
jedes aktive Mitglied, Schreiben je nach Rolle), sieben SECURITY-DEFINER-Helfer,
getrennte Policies je Befehl. `readonly` kann nicht mehr schreiben; `superadmin`
liest firmenübergreifend, schreibt nie. Docs (RLS-Testplan inkl. Rollenmatrix,
Security, Schema-Notizen) aktualisiert. Nur SQL/Docs/Typen, ohne echte Daten.

**v0.2.4 (erledigt)** – **Supabase-Staging-Verifikationsskripte** unter
`supabase/verification/`: `001_verify_schema.sql` (read-only-Prüfung),
`002_fake_seed_for_rls_tests.sql` (fiktive Daten), `003_rls_test_queries.sql`
(RLS-Tests = PASS) plus Runbook `docs/supabase-staging-verification.md`. Nur
SQL/Skripte/Docs, ohne Credentials/Projekt/echte Daten.

**v0.2.5 (erledigt)** – **Staging-Verifikation dokumentiert**: Migration `001`,
Schema-Prüfung, fiktiver Seed und RLS-Tests sind auf `klarsa-staging` bestanden
(2026-06-09, manuelle Ausführung vom Nutzer berichtet). Festgehalten in
`docs/supabase-staging-results.md`. Nur Docs, ohne Credentials/echte Daten.

**v0.2.6 (erledigt)** – **Auth-Fundament + Supabase-Client-Architektur**: lazy
Env-Validierung, Browser-/Server-/Admin-Clients, Session-Helfer, Login-Flow
(`/login`, `/auth/callback`, `/logout`), App-Shell-Vorschau (`/app-shell`) und
gescopte, no-op-sichere Middleware. Build-sicher ohne echte Env. Doku:
`docs/auth-foundation.md`. Keine Credentials/echten Daten.

**v0.2.7 (erledigt)** – **App-Shell an Supabase-Staging angebunden**: `/app-shell`
serverseitig geschützt (`force-dynamic`), Tenant-Kontext + RLS-gefilterte
Modul-Zähler über den Session-Client (`lib/auth/tenant-data.ts`), sichere
Zustände „Setup erforderlich"/„Kein aktiver Mandant". Kein Service-Role für
Tenant-Reads. Doku: `docs/app-shell-staging-connection.md`. Nur fiktive
`@example.test`-Daten.

**v0.2.7.1 (erledigt, Patch)** – **Staging-Login-Testanleitung**: Auth-User im
Dashboard anlegen (Auto-Confirm) + `004_bind_auth_user_to_fake_tenant.sql` (Bind
an Fake-Tenant, idempotent, kein Passwort in SQL), klarere `/login`-Fehlermeldung,
Doku `docs/staging-login-test-users.md`. Nur Docs + Staging-SQL, keine Credentials.

**v0.2.7.2 (erledigt, Patch)** – **Client-Env-Erkennung repariert**: `lib/env.ts`
nutzt statische `process.env.NEXT_PUBLIC_*`-Referenzen (statt `process.env[name]`,
das Next nicht ins Client-Bundle inlinen kann); `/login` ermittelt `isConfigured`
serverseitig und passt es an `LoginForm`, plus Diagnose „Staging env erkannt".
Build bleibt env-frei.

**v0.2.7.3 (erledigt, Patch)** – **App-Shell-Staging-Login verifiziert** (manuell,
2026-06-09): `/login` → `/app-shell` zeigt Tenant Clean24 Demo, Rolle owner, Paket
Pro und RLS-gefilterte fiktive Zähler. Festgehalten in
`docs/app-shell-staging-results.md`. Nur Docs.

**v0.2.8 (erledigt)** – **Clean24-Tenant-Setup-Fundament**: additive Migration
`002` (Billing-/Access-Enums + -Felder auf `companies`), Staging-SQL `005`
(Clean24 als erster realer Tenant: Premium, `internal_founder`, 8 Leistungen, 8
Lead-Quellen – ohne Kundendaten/Auth), Typen + `docs/clean24-tenant-setup.md`.
Migration 001 unverändert.

**v0.2.9 (erledigt)** – **Clean24-Staging-Tenant verifiziert** (manuell,
2026-06-09): Migration `002` + Skript `005` angewendet, Owner-User via `004`
gebunden, Login → `/app-shell` zeigt Clean24 / owner / Premium mit allen Zählern 0
(Config-only). Festgehalten in `docs/clean24-staging-tenant-results.md`. Nur Docs.

**v0.3.0 (erledigt)** – **Clean24 Lead Inbox-Fundament**: geschützte Route
`/app-shell/leads` (force-dynamic), Tenant-Leads-Liste + manuelles Erfassen via
Server-Action und Session-Client (RLS; owner/admin/sales schreiben), additive
Migration `003` (`leads.notes`), Lead-Inbox-Karte verlinkt. Keine externen
Integrationen, kein Service-Role. Doku `docs/clean24-lead-inbox-foundation.md`.

**v0.3.0.1 (erledigt, Patch)** – **Lead Inbox auf Staging verifiziert** (manuell,
2026-06-09): Migration `003` angewendet, Create/List für den Clean24-Tenant
funktioniert, Session-Client-/RLS-Schreibpfad bestätigt, keine echten Kundendaten.
Festgehalten in `docs/clean24-lead-inbox-results.md`. Nur Docs.

**v0.3.1 (erledigt)** – **Lead-Status-Workflow & Follow-up-Fundament**:
Status-Select je Lead (alle 9 Statuswerte, kanonische Reihenfolge, Korrekturen
möglich) + manuelle Follow-ups (`followup_tasks`: Lead, Stufe, Fälligkeit,
Kanal, Titel/Notiz) mit Liste/Leerzustand. Server-Actions + Session-Client
(RLS), Defense-in-Depth-Scoping auf den aktiven Mandanten, serverseitige
Validierung. Null neue Migrationen. Eng-Review vor dem Coding. Doku
`docs/clean24-lead-status-followups.md`.

**v0.3.1.1 (erledigt, Patch)** – **Status & Follow-ups auf Staging verifiziert**
(manuell, 2026-06-10): Status-Update + Follow-up Create/List für den
Clean24-Tenant funktionieren, Session-Client-/RLS-Schreibpfad bestätigt, keine
echten Kundendaten. Festgehalten in
`docs/clean24-lead-status-followups-results.md`. Nur Docs.
*Aufgeschobenes DB-Hardening (nächste sichere Migration):* Composite FK
`followup_tasks(lead_id, company_id) → leads(id, company_id)` (+ `unique
(id, company_id)` auf `leads`), damit der Mandant eines Follow-ups auf
DB-Ebene immer dem Mandanten seines Leads entspricht.

**v0.3.2 (erledigt)** – **Offer Draft-Fundament**: neue geschützte Route
`/app-shell/offers` (Offer Engine) — manuelle Offerten-Entwürfe (optional aus
Lead, Auto-Referenz, Gültig-bis, MwSt), `offer_items` mit serverseitig
berechneten Netto/MwSt/Brutto-Summen, Status-Flow (draft→…→archived, nicht
starr), Liste/Leerzustand. Server-Actions + Session-Client (RLS,
`can_write_sales`), Defense-in-Depth + Lead-/Offerten-Zugehörigkeitsprüfung.
Kein PDF/E-Mail/bexio. Additive **Migration `004`** (idempotent) schliesst das
F6-Hardening (`unique leads(id,company_id)` + Composite FK
`followup_tasks(lead_id,company_id) → leads(id,company_id)`). Doku
`docs/clean24-offer-draft-foundation.md`.

**v0.3.2.1 (erledigt, Patch)** – **Offer Engine auf Staging verifiziert**
(manuell, 2026-06-10): Migration `004` angewendet, Offerten-Create/List +
Positions-Add + Status-Update für den Clean24-Tenant funktionieren,
Session-Client-/RLS-Schreibpfad bestätigt, keine echten Kundendaten.
Festgehalten in `docs/clean24-offer-draft-results.md`. Nur Docs.

**v0.3.3 (erledigt)** – **Offer PDF- & Versand-Fundament**: geschützter
Route-Handler `/app-shell/offers/[id]/pdf` (Session-Client/RLS + `company_id`/
`id`-Scoping, fremde id → 404) liefert ein Offerten-PDF zum Download —
Schweizerdeutsches A4-Layout, erzeugt **ohne PDF-Library/Asset**
(`lib/pdf/offer-pdf.ts`, Standard-Helvetica/WinAnsi, Build env-frei). Pro Offerte
ein **manueller Versand-Entwurf** (Betreff/Text kopieren). Kein echter Versand
(kein SMTP/Gmail/Resend), keine bexio-Übergabe, keine neue Migration. Doku
`docs/clean24-offer-pdf-foundation.md`.

**v0.3.3.1 (erledigt, Patch)** – **Offer PDF auf Staging verifiziert** (manuell,
2026-06-11): PDF-Route nach Login erreichbar, Offerten-Daten/Positionen/Summen
gerendert, manueller Versand-Entwurf vorhanden (Kopiertext), kein echter Versand,
keine echten Kundendaten. Festgehalten in `docs/clean24-offer-pdf-results.md`
(PDF-Design ist Fundament-Niveau, Politur aufgeschoben). Nur Docs.

**v0.3.4 (erledigt)** – **Auftrag-aus-Offerte-Fundament**: aus einer angenommenen
Offerte per „Auftrag erstellen" manuell eine `jobs`-Zeile anlegen (verknüpft via
`offer_id`, Titel aus Kunde+Referenz, Brutto als Wert, Status `planned`).
Ops-Domäne (RLS `can_write_ops`; Sales-User abgewiesen). Duplikat-sicher per
App-Vorprüfung + additiver, idempotenter **Migration `005`** (partieller
Unique-Index: ein lebender Job pro Offerte). Neue Route `/app-shell/jobs` listet
Aufträge (Status, Kunde, Quell-Offerte, Wert). Kein Kalender/E-Mail/bexio. Doku
`docs/clean24-job-from-offer-foundation.md`.

**v0.3.4.1 (erledigt, Patch)** – **Job-Erstellung auf Staging verifiziert**
(manuell, 2026-06-11): Migration `005` angewendet, angenommene Offerte →
„Auftrag erstellen" funktioniert, Job erscheint unter `/app-shell/jobs`, Duplikat
verhindert, Session-Client-/RLS-Schreibpfad bestätigt, keine echten Kundendaten.
Festgehalten in `docs/clean24-job-from-offer-results.md`. Nur Docs.

**v0.3.5 (erledigt)** – **Job-Workflow- & Kalender-Fundament**: Job-Status pflegen
(`planned→…→archived`, nicht starr) + Termin setzen/entfernen (`scheduled_for`,
Browser→UTC-Instant) auf `/app-shell/jobs`; neuer Route-Handler
`/app-shell/jobs/[id]/ics` liefert eine .ics-Datei (RFC 5545, erzeugt ohne
Library/Asset, `lib/ics/job-ics.ts`) zum manuellen Import. Server-Actions +
Session-Client (RLS, Ops-Domäne). Kein Kalender-Sync/E-Mail/bexio, keine neue
Migration. Doku `docs/clean24-job-workflow-calendar-foundation.md`.

**v0.3.5.1 (erledigt, Patch)** – **Job-Workflow & Kalender auf Staging
verifiziert** (manuell, 2026-06-11): Job-Status-Update, Terminplanung
(`scheduled_for`) und `.ics`-Download funktionieren, Session-Client-/RLS-
Schreibpfad (Ops-Domäne) bestätigt, keine echten Kundendaten. Festgehalten in
`docs/clean24-job-workflow-calendar-results.md`. Nur Docs.

**v0.3.6 (erledigt)** – **Lead Hunter- / Opportunity-Radar-Fundament**: neue
geschützte Route `/app-shell/lead-hunter` — Opportunities **manuell erfassen**
(Felder auf bestehendes `prospects`-Schema gemappt: Typ/Region/Quelle/
Service-Potenzial/Score/Grund/Nächste-Aktion/Status) + einfache Radar-Übersicht
(Anzahl, Ø Score, aktiv verfolgt, Typ-Chips), Leerzustand. Server-Action +
Session-Client (RLS, Sales-Domäne `can_write_sales`). **Kein Scraping, keine
Auto-Suche, keine Google-/ZEFIX-/SIMAP-API, keine externen Quellen.** Keine neue
Migration. Doku `docs/clean24-lead-hunter-foundation.md`.

**v0.3.6.1 (erledigt, Patch)** – **Lead Hunter auf Staging verifiziert** (manuell,
2026-06-11): `/app-shell/lead-hunter` nach Login erreichbar, manuelle
Opportunity-Erfassung + Liste funktionieren, Radar-Karten aktualisieren sich,
Session-Client-/RLS-Schreibpfad (Sales-Domäne) bestätigt, kein Scraping/keine
Auto-Suche, keine echten Kundendaten. Festgehalten in
`docs/clean24-lead-hunter-results.md`. Nur Docs.

**v0.3.7 (erledigt)** – **Lead-Hunter-Scoring & Service-Matching-Fundament**:
deterministischer, client-seitiger Helper (`components/lead-hunter/scoring.ts`)
matcht Clean24-Services, erklärt den Score (Typ/Region/Service/Timing/Quelle/
Score) und schlägt eine nächste Aktion vor — live beim Tippen, mit Badges und
„Vorschläge übernehmen" (editierbar). Keine KI/API/Netzwerk/Scraping; rein im
Browser. Liste zeigt Service-Match-Badges. Keine neue Migration. Doku
`docs/clean24-lead-hunter-scoring.md`.

**v0.3.7.1 (erledigt, Patch)** – **Lead-Hunter-Scoring auf Staging verifiziert**
(manuell, 2026-06-11): Live-Scoring/Service-Matching, „Vorschläge übernehmen"
(Score/Grund/Nächste-Aktion), Service-Match-Badges und Opportunity Speichern/
Liste funktionieren, Session-Client-/RLS-Schreibpfad bestätigt, keine KI/API/
Scraping, keine echten Kundendaten. Festgehalten in
`docs/clean24-lead-hunter-scoring-results.md`. Nur Docs.

**v0.3.8 (erledigt)** – **Opportunity → Lead-Inbox-Konversion**: „In Lead Inbox
übernehmen" auf einer Opportunity legt eine verknüpfte `leads`-Zeile an (Felder
gemappt, Status `qualified`, `prospect_id`-Rücklink) und markiert die Opportunity
(`promoted_lead_id`, Status `converted`). Duplikat-sicher per App-Vorprüfung +
atomarem Claim (`promoted_lead_id IS NULL`, Orphan-Rollback). Beide Schreibpfade
Session-Client (RLS, Sales-Domäne). Kein E-Mail/Outreach/Automatik, keine neue
Migration. Doku `docs/clean24-opportunity-to-lead-foundation.md`.

**v0.3.9 (erledigt)** – **Lead-Hunter-Quellen-Registry-Fundament**: neue
geschützte Route `/app-shell/lead-hunter/sources` — owner/admin **registrieren**
**kontrollierte, von Menschen freigegebene** Quellen (Felder auf bestehendes
`lead_sources`-Schema gemappt: Bezeichnung→`label`, Quellen-Typ→`type`,
Aktiv→`enabled`, Notiz→`notes`), Liste mit **Badges** (Aktiv/Inaktiv + Phase
*Manuell*/*Künftige API*/*Künftiges Register*) + Übersicht + Vorlagen-Chips
(Bauprojekt, Praxis/Ärzte, Verwaltung, Ausschreibung, Google/Maps *(später)*,
ZEFIX *(später)*, Empfehlung, Manuell). Server-Action + Session-Client (RLS,
Settings-Domäne `can_write_settings` = owner/admin) mit zusätzlicher
App-Rollenprüfung; andere Rollen sehen Read-only. Verlinkt von
`/app-shell/lead-hunter`. **Kein Scraping, keine Auto-Suche, keine Google-/Maps-/
ZEFIX-/SIMAP-/Handelsregister-Abfrage, keine externen Quellen.** Keine neue
Migration. Doku `docs/clean24-lead-hunter-source-registry.md`.

**v0.3.9.1 (erledigt, Patch)** – **Quellen-Registry auf Staging verifiziert**
(manuell, 2026-06-11): `/app-shell/lead-hunter/sources` nach Login erreichbar,
manuelle Quelle-Registrierung + Liste/Übersicht funktionieren, Aktiv/Inaktiv- und
Phasen-Badges sowie Vorlagen-Chips korrekt, Session-Client-/RLS-Schreibpfad
(Settings-Domäne `can_write_settings` = owner/admin) bestätigt, kein Scraping/
keine API, keine echten Kundendaten. Festgehalten in
`docs/clean24-lead-hunter-source-registry-results.md`. Nur Docs.

**v0.3.10 (erledigt)** – **Source→Opportunity-Workflow**: aus einer registrierten
Quelle (`/app-shell/lead-hunter/sources`) startet „Opportunity vorbereiten" ein
vorausgefülltes Erfassungsformular (`/app-shell/lead-hunter?source=<id>`); die
Quelle wird RLS-gescopt geladen (fremde id → neutraler „nicht gefunden"-Hinweis,
kein Leak), `source_type` + „Warum interessant" (aus `label`/`notes`) werden
vorbefüllt, der Link reist als verstecktes `source_id`. Der Mensch bestätigt/
ergänzt Name/Typ/Region/Service/Score/Grund/Nächste-Aktion und speichert; die
Opportunity wird über `prospects.source_id` mit der Quelle verknüpft (Liste zeigt
dann „Quelle: <Label>"). Deterministisches Scoring (`scoring.ts`) live
wiederverwendet. Server-Action + Session-Client (RLS, `can_write_sales`) mit
Defense-in-Depth (Quelle gehört zum aktiven Mandanten; verstecktes `source_id`
serverseitig gegen den Mandanten geprüft). **Additive, idempotente Migration
`006`** (`prospects.source_id` → `lead_sources(id)`, spiegelt `leads.source_id`;
001–005 unverändert). Kein Auto-Auslesen/Scraping/Google/ZEFIX/SIMAP/KI/externe
API. Doku `docs/clean24-source-to-opportunity-foundation.md`.

**v0.3.10.1 (erledigt, Patch)** – **Source→Opportunity auf Staging verifiziert**
(manuell, 2026-06-11): Migration `006` angewendet + PostgREST-Schema neu geladen,
„Opportunity vorbereiten" öffnet das vorausgefüllte Lead-Hunter-Formular mit
Quellen-Kontext/Banner, Opportunity gespeichert, Zeile zeigt „Quelle: <Label>",
Session-Client-/RLS-Schreibpfad (sales-Domäne) bestätigt, kein Scraping/keine API,
keine echten Kundendaten. Festgehalten in
`docs/clean24-source-to-opportunity-results.md`. Nur Docs.

**v0.3.11 (erledigt)** – **Swiss Opportunity Radar Map-Fundament**: neue
geschützte Route `/app-shell/lead-hunter/radar` visualisiert die erfassten
Opportunities als statische, stilisierte **Kanton-Radar-Karte** (SVG) –
Stat-Karten (Total / Ø Score / High-Score ≥70 / Konvertiert), Kanton-Pins
(Region→Kanton per deterministischem Offline-Keyword-Mapping
`components/lead-hunter/swiss-radar.ts`; Grösse ≈ Anzahl, Farbe ≈ Ø Score),
Top-Regionen-Karten, Service-/Quellen-/Typ-Chips (Service-Match aus `scoring.ts`,
Quellen aus `prospects.source_id`). Nur-Lesen über Session-Client (RLS). **Kein
Kartenanbieter/Kacheln/Google Maps/ZEFIX/SIMAP/Geokodierung/externe Abfrage/
Scraping/KI** – das Kanton-Layout ist stilisiert/lokal. Verlinkt von
`/app-shell/lead-hunter`. **Keine neue Migration** (001–006 unverändert). Doku
`docs/clean24-swiss-opportunity-radar-map.md`.

**v0.3.11.1 (erledigt, Patch)** – **Swiss Opportunity Radar Map auf Staging
verifiziert** (manuell, 2026-06-12): `/app-shell/lead-hunter/radar` nach Login
erreichbar, Stat-Karten + stilisierte Kanton-Radar-SVG + Top-Regionen-Karten +
Service-/Quellen-/Typ-Chips gerendert (Quellen-Labels via `prospects.source_id`),
Read-only-/Session-Client-/RLS-Pfad bestätigt, kein Karten-API/keine Tiles/keine
Geokodierung/kein Scraping/keine Auto-Suche, keine echten Kundendaten. Festgehalten
in `docs/clean24-swiss-opportunity-radar-map-results.md`. Nur Docs.

**v0.3.12 (erledigt)** – **bexio-Übergabe-Fundament**: neue geschützte Route
`/app-shell/bexio` – manuelle Rechnungs-/bexio-Übergabe-Warteschlange für
abgeschlossene Aufträge. Listet `completed`-Jobs mit Kunden-(Lead-)/Offerten-Daten;
`prepareHandoff` („Für bexio vorbereiten") legt eine `bexio_handoffs`-Zeile an
(Status `queued`, Netto/MwSt/Brutto aus Offerte bzw. Job-Wert, `connection_id`
NULL, Duplikat-Guard ein Handoff/Job); `markHandoffInvoiced` („Als verrechnet
markieren") setzt `completed` (idempotent). Je Auftrag eine kopierbare
Zusammenfassung (`handoff-summary.ts` + `HandoffSummary.tsx`).
`getInvoiceHandoffJobs` (Jobs+Offers+Leads+`bexio_handoffs`, 1 Embed).
Server-Actions + Session-Client (RLS, **Manage-Domäne `can_manage_company` =
owner/admin**) mit App-Rollenprüfung; andere Rollen read-only. Die
bexio-Übergabe-Karte auf `/app-shell` verlinkt jetzt. **Keine echte
bexio-API/Token/Netzwerkaufruf/automatische Rechnung/E-Mail. Keine neue Migration**
(bestehende `bexio_handoffs`-Tabelle; 001–006 unverändert). Doku
`docs/clean24-bexio-handoff-foundation.md`.

**v0.3.12.1 (erledigt, Patch)** – **bexio-Übergabe auf Staging verifiziert**
(manuell, 2026-06-12): `/app-shell/bexio` nach Login erreichbar, die
`/app-shell`-bexio-Karte verlinkt dorthin, ein abgeschlossener Auftrag erscheint
in der Warteschlange, „Für bexio vorbereiten" legt eine `bexio_handoffs`-Zeile an
(Status `queued`), die kopierbare Schweizerdeutsche Zusammenfassung wird
gerendert, „Als verrechnet markieren" setzt `completed`, owner/admin-Manage-/
Session-Client-/RLS-Pfad (`can_manage_company`) bestätigt, keine echte
bexio-API/kein Token/Netzwerkaufruf/automatische Rechnung, keine echten
Kundendaten. Festgehalten in `docs/clean24-bexio-handoff-results.md`. Nur Docs.

**v0.3.13 (erledigt)** – **CEO-/KPI-Dashboard-Fundament**: neue geschützte,
**read-only** Route `/app-shell/ceo` („CEO-Briefing") verdichtet die ganze Kette
eines Mandanten zu einem owner-freundlichen Überblick aus vorhandenen,
RLS-gefilterten Daten – Geld-Wirkung (offene Pipeline / angenommene Offerten /
abgeschlossene Aufträge in CHF), KPI-Kacheln (Opportunities/übernommen,
Leads/offen, Offerten/angenommen, Aufträge/abgeschlossen, bexio
vorbereitet/verrechnet), Trichter Opportunity→Lead→Offerte→Auftrag→bexio mit
Übergangsquoten, „Letzte 7 Tage" und Achtung-Karten (Offerten ohne Antwort,
Aufträge ohne bexio-Übergabe, High-Score nicht übernommen, offene Leads ohne
Follow-up – je verlinkt). Reiner deterministischer Helper
`components/ceo/kpi.ts` (`nowIso` vom Aufrufer). Liest nur bestehende
RLS-Reads (`getFollowups` liefert neu `leadId`). Prominente CEO-Briefing-Karte
auf `/app-shell`. **Read-only, keine Schreibvorgänge, keine KI, keine externe
API/bexio-API/Scraping/E-Mail. Keine neue Migration** (001–006 unverändert). Doku
`docs/clean24-ceo-kpi-dashboard-foundation.md`.

**v0.3.13.1 (erledigt, Patch)** – **CEO-/KPI-Dashboard auf Staging verifiziert**
(manuell, 2026-06-12): `/app-shell/ceo` nach Login erreichbar, die
CEO-Briefing-Karte auf `/app-shell` verlinkt dorthin, Geld-Wirkungs-Karten +
KPI-Kacheln + Trichter (Opportunity→Lead→Offerte→Auftrag→bexio) + „Letzte 7 Tage"
+ Achtung-Karten gerendert und korrekt verlinkt, Read-only-/Session-Client-/
RLS-Pfad bestätigt, keine Schreibvorgänge/keine KI/keine externe API/keine
bexio-API/kein E-Mail, keine echten Kundendaten. Festgehalten in
`docs/clean24-ceo-kpi-dashboard-results.md`. Nur Docs.

**v0.4.0 (erledigt)** – **Clean24 Production-Readiness-Gate** (Policy + Runbooks +
read-only Checks; **keine neuen Features, keine echten Daten, keine Secrets**).
Neu in `docs/`: Hub `production-readiness-gate.md` (Master-Checkliste + GO/NO-GO,
aktuell **NO-GO**), `security-rls-verification-checklist.md` (Mandantentrennung,
Rollen-/Domänen-Matrix, **kein Service-Role-Client in App** – grep-verifiziert,
nur in `lib/supabase/admin.ts` definiert), `backup-restore-runbook.md` (Backups/
PITR/externer Export/**Restore-Test**), `staging-production-separation.md`,
`real-data-gate-policy.md` (10 Pflichtpunkte + Decision-Record),
`incident-recovery-runbook.md`, `clean24-data-handling-policy.md`. Dazu read-only
`supabase/verification/006_production_readiness_checks.sql` (RLS/Helfer/Policies/
`audit_logs`-append-only; sicher auf Staging **oder** Produktion). 001–006
unverändert, `004`-Verifikationsskript unangetastet. **Produktion bleibt gesperrt,
bis alle Pflichtpunkte manuell verifiziert + vom Inhaber freigegeben sind.** Doku
`docs/production-readiness-gate.md`.

**v0.4.1 (erledigt)** – **Clean24 Production-Tenant-Bootstrap-Skript**:
`supabase/production/001_create_clean24_production_tenant.sql` (idempotent) legt
auf `klarsa-production` den realen Tenant **Clean24 Memis GmbH** an (Premium /
`internal_founder` / Status `active`, 26 Kantone) + Einstellungen + Service-/
Quellen-**Konfig** und bindet den Inhaber als `owner` (upsert `user_profiles` +
`company_members`). Owner-UID nur als Platzhalter `CLEAN24_OWNER_AUTH_USER_ID`
(einmalig, im `DO`-Block; ohne Ersetzen klarer Abbruch), E-Mail aus `auth.users`,
**kein echter UID/keine Secrets im Repo**. **Keine Kunden-Leads/-Offerten/
-Aufträge/-Prospects, keine Fake-/Demo-Daten; `verification/002–005` laufen nie in
Produktion; `004` unangetastet; 001–006 unverändert.** Doku
`docs/clean24-production-tenant-bootstrap.md`. Echte Daten weiter **NO-GO** bis
Vercel-Produktions-Login + Inhaber-Freigabe.

**v0.4.1.1 (erledigt, Patch)** – **Clean24-Produktions-Bootstrap + Produktions-Login
verifiziert** (manuell, 2026-06-13): Bootstrap-Skript in `klarsa-production`
ausgeführt (Platzhalter nur im SQL-Editor ersetzt), Verifikationsabfrage
erwartungsgemäss (Clean24 Memis GmbH, premium/active/internal_founder/full,
services=8, sources=4, owners=1, alle Kundendaten-Zähler=0), Vercel-Produktions-Env
gesetzt (**ohne Secret-Werte im Repo**) + Auth-URL `https://klarsa.vercel.app`,
Redeploy, **Owner-Login erfolgreich**, `/app-shell` geöffnet, keine echten Daten.
Gate-Stand: Schema/Tenant/Owner/Vercel-Login **done**, Produktion aber weiter
**gesperrt**. Festgehalten in `docs/clean24-production-bootstrap-results.md`;
`docs/production-readiness-gate.md` aktualisiert (A+B abgehakt). Nur Docs.

**v0.4.2 (nächster Schritt)** – **Backup-/Restore-Test-Record**: den **Restore-Test**
gemäss `docs/backup-restore-runbook.md` ausführen (Restore in ein frisches Projekt,
Daten + RLS + Login prüfen), PITR + täglichen externen Export bestätigen und das
Ergebnis festhalten – der **letzte Pflichtpunkt** vor der Inhaber-Freigabe **GO**;
erst danach Clean24-Onboarding mit echten Daten. *Offer-PDF-Politur ist
aufgeschoben, bis der Nutzer sie anfordert.* Echte Daten erst nach diesem Gate.

## Empfohlener nächster Schritt

Der **Architektur-Plan (B)** läuft: v0.2.0 (Docs/Typen) bis v0.4.0 (Clean24
Production-Readiness-Gate) und **v0.4.1/.1.1 (Clean24 Production-Tenant-Bootstrap +
Produktions-Login auf `klarsa-production` verifiziert)** sind erledigt –
Schema/Tenant/Owner/Vercel-Login stehen, Produktion bleibt aber **gesperrt**.
Parallel bleibt **A) Deploy / Visual Review** der Verkaufs-Demo
möglich (Live-Deployment, echtes Postfach `info@klarsa.ch`, PDF-Export,
Erklärvideo).

**Empfehlung:** als Nächstes **v0.4.2 — Backup-/Restore-Test** (gemäss
`docs/backup-restore-runbook.md`: Restore in ein frisches Projekt + Daten/RLS/Login
prüfen, PITR + täglicher Export) – der **letzte Pflichtpunkt** vor der
**Inhaber-Freigabe (GO)**; erst danach Clean24-Onboarding mit echten Daten.
**Offer-PDF-Politur ist aufgeschoben, bis angefordert.** **Voraussetzung vor echten
Kundendaten:** Backup/Restore eingerichtet **und getestet**, **Staging und
Produktion strikt getrennt** (eigene Projekte/Keys), sowie validiertes Auth, RLS
und Security — **nie vor** diesem Gate.

## Phase 2 — Klarsa Core (Plan dokumentiert)

Das Backend-Fundament ist als Architektur-Plan dokumentiert (`docs/`, siehe
„Klarsa Core" oben). Umsetzung schrittweise und separat freizugeben:

- Supabase-Datenmodell (Multi-Tenant pro KMU) — `docs/data-model.md`
- Authentifizierung, RBAC, RLS, Audit, Backup — `docs/security-architecture.md`
- Echte Lead-Erfassung (Web-Formular, Postfach-Anbindung)
- Kontrollierter Lead Hunter — `docs/lead-hunter-engine.md`
- KI-Integration (Scoring, Offerttexte, Outreach, Content) mit Human-Approval
- Echte bexio-Anbindung — `docs/bexio-architecture.md`
- PDF-Generierung der Offerten, E-Mail-/Follow-up-Versand
- Zahlungen & Abo-Verwaltung (Stripe), Limiten-Enforcement

> Aktueller Stand: Die Verkaufs-Demo nutzt ausschliesslich fiktive lokale Daten;
> Klarsa Core existiert bisher nur als Plan (Doku/Typen/Skelett), ohne Backend.
