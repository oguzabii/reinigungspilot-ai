# ReinigungsPilot AI

Das AI-Vertriebsbüro für Reinigungsfirmen in der Schweiz — der verkaufsstarke,
paketbasierte Master-Demo-Foundation. Dieses Repository ist die **eigenständige,
verkaufsfähige Produkt- und Demo-Basis** (nicht das bestehende Clean24-Projekt).

## Aktuelle Version

**v0.1.3** — Copy Refinement + Sales Material Pack: verfeinerte deutsche
Verkaufstexte über alle Seiten, ausgebautes Pilotprogramm, vertrauensbildende
FAQ sowie zwei neue Seiten – ein internes Sales-Kit und eine Broschüren-Seite
(Grundlage für ein späteres PDF). Weiterhin reine, paketbasierte Frontend-Demo
mit lokalen Demo-Daten.

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

| Route          | Zweck                                                          |
| -------------- | -------------------------------------------------------------- |
| `/`            | Öffentliche Landingpage (Verkauf): Hero, Trust-Bar, Problem, Lösung (6 Schritte), Module, Pakete, Add-ons, Vergleich, 12-Monats-Plan, Pilot-CTA |
| `/demo`        | Interaktive Sales-Demo mit Paketumschalter (Starter / Pro / Premium), Demo-Story und Modulansichten |
| `/pricing`     | Preisseite: Pakete mit exakten Limiten, „Für wen geeignet?“, enthalten / nicht enthalten, Add-ons, Abgrenzung |
| `/pilot`       | Pilotprogramm: Angebot, für wen (nicht), 60-Tage-Ablauf, Konditionen, Pilotgespräch-CTA |
| `/faq`         | Häufige Fragen und Einwände (Accordion) |
| `/brochure`    | Öffentliche Verkaufsbroschüre (Grundlage für späteres PDF): Problem, Lösung, Module, Pakete, Pilot, Add-ons, 12-Monats-Plan, Abgrenzung |
| `/demo-script` | **Intern** (noindex): Gesprächsleitfaden für die Live-Demo – 5-Minuten-Flow, Paket-Pitches, Einwände, Pilot-Abschluss |
| `/sales-kit`   | **Intern** (noindex): Positionierung, 30s-/2min-Pitch, Cold-E-Mails, Nachrichten, Telefonskript, Einwände, Abschlusssätze |

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
  icon.svg           # Favicon (Brand-Mark)
  page.tsx           # Landingpage
  demo/page.tsx      # Demo-Dashboard
  demo-script/page.tsx # Interner Demo-Leitfaden (noindex)
  globals.css        # Tailwind v4 Theme (navy-Palette), Basis-Stile
```

Der Brand-Mark liegt als wiederverwendbare SVG-Komponente in
`components/LogoMark.tsx` (gleiche Geometrie wie `app/icon.svg`): eine aufsteigende
Sales-Pipeline mit hervorgehobenem Zielknoten.

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

## Paketmodell

| Paket   | Produktname        | Setup     | Monatlich | Fokus                                                                     |
| ------- | ------------------ | --------- | --------- | ------------------------------------------------------------------------- |
| Starter | AI Offer Büro      | CHF 2'490 | CHF 299   | Eingehende Leads, Preise, PDF-Offerten, Follow-ups                        |
| **Pro** | AI Sales Autopilot | CHF 4'990 | CHF 599   | **Empfohlen** – Starter + AI Lead Hunter, Scoring, Aufträge, Chef-Report  |
| Premium | AI Growth Office   | CHF 7'490 | CHF 999   | Pro + B2B-Pipeline, Landingpage, Strategie-Reports, höhere Limiten        |

Erweiterbar über Add-ons (`lib/addons.ts`). Genaue Limiten und das Gating liegen
zentral in `lib/packages.ts` und `lib/package-gates.ts`.

## Bewusst NICHT enthalten (v0.1 / v0.1.1)

- Kein Supabase, keine Datenbank
- Keine Authentifizierung / kein Login
- Keine Zahlungen / kein Stripe
- Kein E-Mail-Versand (Pilot-CTA nutzt nur einen `mailto:`-Platzhalter `kontakt@reinigungspilot.ai`)
- Keine externen APIs, keine AI-API-Aufrufe
- Kein Backend / keine echte Datenpersistenz
- Keine Anbindung an Clean24 (bewusst getrenntes Produkt)

## Interne nächste Schritte

**v0.1.3 (erledigt)** – verfeinerte Verkaufstexte, ausgebautes Pilotprogramm,
vertrauensbildende FAQ, internes Sales-Kit (`/sales-kit`) und Broschüren-Seite
(`/brochure`).

**Nächster Schritt** – weiterhin reine Frontend- / Sales-Readiness-Arbeit:

- Visuelles QA über alle Seiten (Desktop & Mobile)
- Echte Kontaktdaten statt Platzhalter (`kontakt@reinigungspilot.ai`)
- PDF-Export der Broschüre (noch offen)

**Phase 2 (später)** – Backend-Fundament, separat freizugeben:

- Supabase-Datenmodell (Mehrmandantenfähigkeit pro Reinigungsfirma)
- Authentifizierung
- Echte Lead-Erfassung (Web-Formular, Postfach-Anbindung)
- AI-Integration (Scoring, Offerttexte, Outreach, Content)
- PDF-Generierung der Offerten
- E-Mail-/Follow-up-Versand
- Zahlungen & Abo-Verwaltung (Stripe), Limiten-Enforcement

> Alle Daten im aktuellen Stand sind fiktiv und dienen ausschliesslich der Demonstration.
