# ReinigungsPilot AI

Das AI-Vertriebsbüro für Reinigungsfirmen in der Schweiz — der verkaufsstarke,
paketbasierte Master-Demo-Foundation. Dieses Repository ist die **eigenständige,
verkaufsfähige Produkt- und Demo-Basis** (nicht das bestehende Clean24-Projekt).

Phase 1: polierte Frontend-Demo mit lokalen Demo-Daten. Kein Supabase, keine
Authentifizierung, keine externen APIs, kein E-Mail-Versand, keine Zahlungen,
keine AI-API-Aufrufe.

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

| Route   | Zweck                                                          |
| ------- | -------------------------------------------------------------- |
| `/`     | Öffentliche Landingpage (Verkauf): Hero, Problem, Lösung, Module, Pakete, Add-ons, Vergleich, 12-Monats-Plan, CTA |
| `/demo` | Interaktive Sales-Demo mit Paketumschalter (Starter / Pro / Premium) |

## Architektur

Die zentrale Regel: **keine zufälligen Features** — alles ist paketbasiert
(„package-gated"). Limiten und Gating sind **nie** in Komponenten hartcodiert,
sondern liegen in zentralen Config-Dateien.

```
lib/
  packages.ts        # Pakete (Starter/Pro/Premium): Preise + Limiten — Source of Truth
  addons.ts          # Add-on-Katalog mit strukturierten Preisen
  package-gates.ts   # Modul-Gating-Matrix (full | limited | locked) je Paket
  modules.ts         # Demo-Navigation + Modul-Metadaten (Marketing-Übersicht)
  demo-data.ts       # Zentrale Seed-Daten (Muster Reinigung GmbH)
  format.ts          # Deterministische CHF-/Zahlenformatierung (SSR-sicher)
  cn.ts              # className-Helper

components/          # Wiederverwendbare UI-Bausteine
  PackageToggle, PackageCard, LockedFeature, DashboardMetricCard,
  LeadTable, LeadCard, AddOnCard, StatusBadge, ScoreBadge, SectionHeader,
  DemoShell, ModuleHeader, Panel, ComparisonTable, SuccessTimeline, Logo
  modules/           # Demo-Modulansichten (BossDashboard, LeadInbox, …)
  landing/           # Landingpage-Sektionen (Hero, ProblemSection, …)

app/
  layout.tsx         # Root-Layout (de, Systemschrift, Metadaten)
  page.tsx           # Landingpage
  demo/page.tsx      # Demo-Dashboard
  globals.css        # Tailwind v4 Theme (navy-Palette), Basis-Stile
```

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

Gesperrte Module rendern eine `LockedFeature`-Upgrade-Ansicht; im Demo wechselt
der Upgrade-Button direkt in das passende Paket.

## Phase 2 (Ausblick)

- Supabase als Datenbank + Auth (Mehrmandantenfähigkeit pro Reinigungsfirma)
- Echte Lead-Erfassung (Web-Formular-Integration, Postfach-Anbindung)
- AI-Anbindung für Lead-Scoring, Offerttexte, Outreach und Marketing-Content
- PDF-Generierung der Offerten
- E-Mail-/Follow-up-Versand
- Zahlungen & Abo-Verwaltung (Stripe), Add-on-Buchung
- Enforcement der Paket-Limiten gegen echte Nutzungsdaten
- Owner-Reports (wöchentlich/monatlich) mit echten Kennzahlen

> Alle Daten im aktuellen Stand sind fiktiv und dienen ausschliesslich der Demonstration.
