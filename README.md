# ReinigungsPilot AI

Das AI-Verkaufsbüro für Schweizer KMU — der verkaufsstarke, paketbasierte
Master-Demo-Foundation. Dieses Repository ist die **eigenständige,
verkaufsfähige Produkt- und Demo-Basis**. Clean24 dient ausschliesslich als
interner Pilot/Proof und ist hier nicht öffentlich integriert.

## Aktuelle Version

**v0.1.4** — Repositionierung auf Schweizer KMU plus bexio- und Video-Konzepte:
Reinigung ist nur noch die erste Branchenvorlage, der öffentliche Pilot wurde
durch eine Beratungsseite ersetzt, bexio Connect ist ab Pro Kernfunktion (Demo,
keine echte API) und ein 1-Minuten-Erklärvideo ist als Konzept angelegt.
Weiterhin reine, paketbasierte Frontend-Demo mit lokalen Demo-Daten.

### Strategie

- **Positionierung:** AI-Verkaufsbüro für Schweizer KMU – Dienstleister, Handwerk, Reinigung, Umzug, Gartenbau, Hauswartung, Maler/Gipser, lokale Service-Betriebe.
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
| `bexio`              | locked  | full    | full    |

Gesperrte Module rendern eine `LockedFeature`-Upgrade-Ansicht; im Demo wechselt
der Upgrade-Button direkt in das passende Paket.

## Paketmodell

| Paket   | Produktname        | Setup     | Monatlich | Fokus                                                                     |
| ------- | ------------------ | --------- | --------- | ------------------------------------------------------------------------- |
| Starter | AI Offer Büro      | CHF 2'490 | CHF 299   | Eingehende Leads, Preise, PDF-Offerten, Follow-ups                        |
| **Pro** | AI Sales Autopilot | CHF 4'990 | CHF 599   | **Empfohlen** – Starter + AI Lead Hunter, Aufträge, bexio Connect, Chef-Report |
| Premium | AI Growth Office   | CHF 7'490 | CHF 999   | Pro + bexio Connect Plus, B2B-Pipeline, Strategie-Reports, höhere Limiten |

Erweiterbar über Add-ons (`lib/addons.ts`). Genaue Limiten und das Gating liegen
zentral in `lib/packages.ts` und `lib/package-gates.ts`.

## Bewusst NICHT enthalten

- Kein Supabase, keine Datenbank
- Keine Authentifizierung / kein Login
- Keine Zahlungen / kein Stripe
- Kein E-Mail-Versand (Beratungs-CTA nutzt nur einen `mailto:`-Platzhalter `kontakt@reinigungspilot.ai`)
- Keine externen APIs, keine AI-API-Aufrufe, kein Scraping
- Keine echte bexio-API – die bexio-Übergabe ist nur eine Demo
- Kein fertiges Video (Erklärvideo nur als Konzept/Storyboard)
- Kein Backend / keine echte Datenpersistenz
- Keine öffentliche Clean24-Integration (interner Proof, getrennt)

## Interne nächste Schritte

**v0.1.4 (erledigt)** – Repositionierung auf Schweizer KMU, Branchenvorlagen,
`/beratung` statt `/pilot`, bexio Connect ab Pro (Demo) und Video-Storyboard
(`/video-script`).

**Nächster Schritt** – weiterhin reine Frontend- / Sales-Readiness-Arbeit:

- Visuelles QA über alle Seiten (Desktop & Mobile)
- Echte Kontaktdaten statt Platzhalter (`kontakt@reinigungspilot.ai`)
- PDF-Export der Broschüre und Produktion des Erklärvideos (noch offen)

**Phase 2 (später)** – Backend-Fundament, separat freizugeben:

- Supabase-Datenmodell (Mehrmandantenfähigkeit pro KMU)
- Authentifizierung
- Echte Lead-Erfassung (Web-Formular, Postfach-Anbindung)
- AI-Integration (Scoring, Offerttexte, Outreach, Content)
- Echte bexio-Anbindung (sowie weitere Buchhaltung wie CashCtrl)
- PDF-Generierung der Offerten
- E-Mail-/Follow-up-Versand
- Zahlungen & Abo-Verwaltung (Stripe), Limiten-Enforcement

> Alle Daten im aktuellen Stand sind fiktiv und dienen ausschliesslich der Demonstration.
