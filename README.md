# Klarsa

Das KI-Verkaufsbüro für Schweizer KMU — der verkaufsstarke, paketbasierte
Master-Demo-Foundation. Dieses Repository ist die **eigenständige,
verkaufsfähige Produkt- und Demo-Basis**. Clean24 dient ausschliesslich als
interner Pilot/Proof und ist hier nicht öffentlich integriert.

## Aktuelle Version

**v0.2.0** — Start von **Klarsa Core** als Multi-Tenant-SaaS (Architektur-Phase).
Dieser Schritt liefert **nur Dokumentation, Typen und ein statisches Skelett** —
**kein** Backend: kein Supabase, kein Auth, keine bexio-API, kein E-Mail-Versand,
kein Scraping, keine echten Kundendaten. Neu: Architektur-Docs unter `docs/`,
Core-Typen (`lib/klarsa-core-types.ts`), Erst-Tenant-Config
(`lib/tenant-clean24.ts`) und die interne Foundation-Seite `/workspace`.
**Clean24 Memis GmbH** ist der **erste Tenant / Live-Proof** in Klarsa. Die
verkaufsfähige Frontend-Demo (v0.1.7) bleibt unverändert bestehen.

> Öffentliche Marke = **Klarsa**. Das interne Repo/Paket heisst weiterhin
> `reinigungspilot-ai`. Der alte, eigenständige **Clean24 Lead Autopilot** bleibt
> ein **getrenntes** System und wird nicht eingebunden.

> **Nächster Schritt:** v0.2.1 — Supabase-Schema-Fundament (Tabellen + RLS +
> Soft-Delete + Audit). **Keine echten Daten** vor Auth, RLS, Security und Backup.

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
| `/workspace`    | **Intern** (noindex): Klarsa App Foundation – Architektur-Plan, Clean24 als erster Tenant, geplante Module. Noch kein Login, keine echten Kundendaten |

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
  # Klarsa Core (Phase 2, nur Typen/Config — kein Backend):
  klarsa-core-types.ts # Multi-Tenant-Domänentypen (Plan, vgl. docs/data-model.md)
  tenant-clean24.ts    # Erst-Tenant-Config: Clean24 Memis GmbH (ohne Secrets/echte Daten)

components/          # Wiederverwendbare UI-Bausteine
  PackageToggle, PackageCard, LockedFeature, DashboardMetricCard,
  LeadTable, LeadCard, AddOnCard, StatusBadge, ScoreBadge, SectionHeader,
  DemoShell, ModuleHeader, Panel, ComparisonTable, SuccessTimeline, Logo
  modules/           # Demo-Modulansichten (BossDashboard, LeadInbox, …)
  landing/           # Landingpage-Sektionen (Hero, ProblemSection, …)

app/
  layout.tsx         # Root-Layout (de, Systemschrift, Metadaten)
  icon.svg           # Favicon (Brand-Mark)
  page.tsx           # Landingpage
  demo/  pricing/  beratung/  faq/  brochure/   # öffentliche Seiten
  demo-script/  sales-kit/  video-script/       # interne Seiten (noindex)
  workspace/         # interne Klarsa-App-Foundation (noindex, statisch)
  globals.css        # Tailwind v4 Theme (navy-Palette), Basis-Stile

docs/                # Klarsa Core Architektur-Plan (Phase 2)
  phase-2-architecture.md  data-model.md  security-architecture.md
  lead-hunter-engine.md    bexio-architecture.md
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

- Kein Supabase, keine Datenbank
- Keine Authentifizierung / kein Login
- Keine Zahlungen / kein Stripe
- Kein E-Mail-Versand (Beratungs-CTA öffnet nur einen `mailto:`-Link an `info@klarsa.ch`)
- Keine externen APIs, keine KI-API-Aufrufe, kein Scraping
- Keine echte bexio-API – die bexio-Übergabe ist nur eine Demo
- Kein fertiges Video (Erklärvideo nur als Konzept/Storyboard)
- Kein Backend / keine echte Datenpersistenz
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
- **Foundation-Seite:** `/workspace` (intern, statisch) — zeigt Plan + Tenant +
  Module, mit Warnung „Noch kein Login, keine echten Kundendaten."

**Architektur-Dokumentation** (`docs/`):

| Dokument | Inhalt |
| --- | --- |
| [phase-2-architecture.md](docs/phase-2-architecture.md) | Multi-Tenant-Überblick, Clean24 als Tenant, Module, Implementierungsphasen |
| [data-model.md](docs/data-model.md) | 20 geplante Tabellen, `company_id`-Strategie, Soft-Delete/Audit |
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

**v0.2.1 (nächster Schritt)** – **Supabase-Schema-Fundament**: Tabellen + RLS +
Soft-Delete + `audit_logs` gemäss `docs/data-model.md` und
`docs/security-architecture.md`. Migrationen ohne echte Daten.

## Empfohlener nächster Schritt

Der **Architektur-Plan (B)** ist mit v0.2.0 gestartet (siehe `docs/`). Parallel
bleibt **A) Deploy / Visual Review** der Verkaufs-Demo möglich (Live-Deployment,
echtes Postfach `info@klarsa.ch`, PDF-Export, Erklärvideo).

**Empfehlung:** als Nächstes **v0.2.1 — Supabase-Schema-Fundament** (Tabellen +
RLS + Soft-Delete + Audit), strikt nach dem Datenmodell. Erst danach Auth und
schrittweise echte Tenant-Daten von Clean24 — nie vor der Security-/Backup-Basis.

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
