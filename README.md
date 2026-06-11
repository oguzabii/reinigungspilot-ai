# Klarsa

Das KI-Verkaufsbüro für Schweizer KMU — der verkaufsstarke, paketbasierte
Master-Demo-Foundation. Dieses Repository ist die **eigenständige,
verkaufsfähige Produkt- und Demo-Basis**. Clean24 dient ausschliesslich als
interner Pilot/Proof und ist hier nicht öffentlich integriert.

## Aktuelle Version

**v0.3.4** — **Auftrag-aus-Offerte-Fundament.** Aus einer **angenommenen**
Offerte (`accepted`) lässt sich in der Offer Engine per **„Auftrag erstellen"**
manuell ein **Job** anlegen: die Server-Action prüft, dass die Offerte zum
aktiven Mandanten gehört und angenommen ist, und legt eine `jobs`-Zeile an
(verknüpft via `offer_id`, mit Lead, Titel aus Kunde+Referenz, Brutto als Wert,
Status `planned`). Jobs sind die **Ops-Domäne** (RLS `can_write_ops` —
owner/admin/ops; ein reiner Sales-User wird sauber abgewiesen). **Keine
Duplikate:** App-Vorprüfung **plus** additive, idempotente **Migration `005`**
(partieller Unique-Index: ein lebender Job pro Offerte) — der Button wird danach
zu „Auftrag erstellt". Neue geschützte Route **`/app-shell/jobs`** listet die
Aufträge (Status, Kunde, Quell-Offerte, Wert). **Kein Kalender, keine E-Mail,
keine bexio-Übergabe, keine externen Integrationen, keine echten Daten.** 001–004
unverändert. **v0.3.4.1 (Patch):** auf Staging **verifiziert** (2026-06-11,
manuell): Migration `005` angewendet, angenommene Offerte → „Auftrag erstellen"
funktioniert, Job erscheint unter `/app-shell/jobs`, Duplikat verhindert,
Session-Client/RLS-Schreibpfad bestätigt, keine echten Daten —
`docs/clean24-job-from-offer-results.md`. Die Verkaufs-Demo (v0.1.7) bleibt
unverändert.

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
> **v0.3.4/.4.1 (Auftrag-aus-Offerte-Fundament + Migration 005, auf Staging verifiziert)**.
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
| `/app-shell`    | **Intern** (noindex, **dynamisch/geschützt**): authentifizierter Tenant-Arbeitsbereich – Redirect ohne Session, RLS-gefilterte Staging-Zähler, kein Service-Role-Lesen. Ohne Env: „Setup erforderlich" |
| `/app-shell/leads` | **Intern** (noindex, **dynamisch/geschützt**): Lead Inbox – Tenant-Leads anzeigen, manuell erfassen, **Status pflegen** und **Follow-ups planen** (Server-Actions, Session-Client/RLS). Kein Versand, keine externen Integrationen |
| `/app-shell/offers` | **Intern** (noindex, **dynamisch/geschützt**): Offer Engine – Offerten-Entwürfe manuell erstellen (optional aus Lead), Positionen + Netto/MwSt/Brutto, **Status pflegen**, **PDF-Download** + manueller Versand-Entwurf (Server-Actions, Session-Client/RLS). Kein echter Versand/bexio |
| `/app-shell/offers/[id]/pdf` | **Intern** (noindex, **dynamisch/geschützt**): Route-Handler – generiert das Offerten-PDF (Session-Client/RLS, nur eigene Offerte, sonst 404). Ohne Abhängigkeit/Asset, kein Versand |
| `/app-shell/jobs` | **Intern** (noindex, **dynamisch/geschützt**): Auftragsliste – aus angenommenen Offerten erstellte Jobs (Status, Kunde, Quell-Offerte, Wert). Session-Client/RLS. Kein Kalender/E-Mail/bexio |
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
  auth/tenant-data.ts  # RLS-gescopte Tenant-Reads (Firma, Modul-Zähler, Leads, Follow-ups, Offerten inkl. getOfferById) via Session-Client
  pdf/offer-pdf.ts     # abhängigkeitsfreier PDF-1.4-Generator (Standard-Helvetica/WinAnsi, keine Assets) (v0.3.3)

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

app/
  layout.tsx         # Root-Layout (de, Systemschrift, Metadaten)
  icon.svg           # Favicon (Brand-Mark)
  page.tsx           # Landingpage
  demo/  pricing/  beratung/  faq/  brochure/   # öffentliche Seiten
  demo-script/  sales-kit/  video-script/       # interne Seiten (noindex)
  workspace/         # interne App-Foundation (noindex, statisch)
  app-shell/         # geschützter Tenant-Arbeitsbereich (noindex, force-dynamic, Session+RLS)
    leads/           # Lead Inbox: page.tsx (Liste, Status, Follow-ups) + actions.ts (createLead, updateLeadStatus, createFollowup)
    offers/          # Offer Engine: page.tsx (Liste, Positionen, Summen, Status, PDF, Versand-Entwurf, Auftrag erstellen) + actions.ts (createOffer, updateOfferStatus, addOfferItem)
      [id]/pdf/route.ts  # geschützter Route-Handler: Offerten-PDF (Session-Client/RLS, sonst 404) (v0.3.3)
    jobs/            # Aufträge: page.tsx (Liste) + actions.ts (createJobFromOffer; Ops-Domäne, Duplikat-sicher) (v0.3.4)
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
  verification/      # Verifikations-/Setup-Skripte:
    001_verify_schema.sql            # read-only: Schema/RLS prüfen, keine Daten
    002_fake_seed_for_rls_tests.sql  # fiktive Staging-Daten (@example.test)
    003_rls_test_queries.sql         # RLS-Tests (jede Zeile = PASS)
    004_bind_auth_user_to_fake_tenant.sql # Dashboard-Auth-User an Fake-Tenant binden (Login-Tests, v0.2.7.1)
    005_create_clean24_staging_tenant.sql # Clean24-Founder-Tenant-Setup, keine Kundendaten (v0.2.8)
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

**v0.3.5 (nächster Schritt)** – **Job-Workflow / Kalender-Fundament**
(Job-Statusübergänge, Terminplanung `scheduled_for`). Manuell, RLS-gescopt.
*Offer-PDF-Politur ist aufgeschoben, bis der Nutzer sie anfordert.* Echte Daten
erst nach dem Backup-/Trennungs-Gate.

## Empfohlener nächster Schritt

Der **Architektur-Plan (B)** läuft: v0.2.0 (Docs/Typen) bis v0.3.3/.3.1 (Offer
PDF- & Versand-Fundament) und **v0.3.4/.4.1 (Auftrag-aus-Offerte-Fundament +
Migration 005, auf Staging verifiziert)** sind erledigt. Parallel bleibt
**A) Deploy / Visual Review** der Verkaufs-Demo möglich (Live-Deployment, echtes
Postfach `info@klarsa.ch`, PDF-Export, Erklärvideo).

**Empfehlung:** als Nächstes **v0.3.5 — Job-Workflow / Kalender-Fundament**
(manuell, RLS-gescopt). **Offer-PDF-Politur ist aufgeschoben, bis angefordert.**
**Voraussetzung vor echten Kundendaten:** Backup/Restore eingerichtet und
getestet, **Staging und Produktion strikt getrennt** (eigene Projekte/Keys),
sowie validiertes Auth, RLS und Security — **nie vor** diesem Gate.

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
