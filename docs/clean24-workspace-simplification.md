# Klarsa v0.5.5 — Workspace-Vereinfachung & saubere Produktions-Kopie

**Ziel:** Klarsa ist mächtig geworden, der Arbeitsbereich wirkte aber überladen
und der Produktions-Login wie eine Staging-/Demo-Umgebung. Der Inhaber soll
Klarsa öffnen und sofort verstehen:

> **„Wo ist heute Geld – und was soll ich als Nächstes tun?"**

Diese Version ist **reine UI/Copy/Navigation** — **keine neue Migration**, kein
Service-Role, keine Secrets, kein Scraping/Versand/Buchung, keine echten/erfundenen
Kundendaten. `supabase/verification/004_bind_auth_user_to_fake_tenant.sql` bleibt
**unangetastet**.

---

## 1. Produktions-Login: vertrauensvolle Kopie

`app/login/page.tsx` zeigt jetzt **umgebungsabhängige** Texte über
`getKlarsaEnv()` (`lib/env.ts`, liest `KLARSA_ENV`, Default `development`):

- **Untertitel (immer):** „Zugang zum geschützten Klarsa-Arbeitsbereich."
- **Produktion** (`KLARSA_ENV=production`): grüne Vertrauens-Zeile
  „Mandantengetrennt. Geschützt. Für den täglichen Betrieb." (ShieldCheck).
- **Staging/Dev** (alles andere): die bisherige ehrliche Warnung
  „Staging-Testzugang nur für interne Entwicklung. Keine echten Kundendaten."
- **Metadata-Beschreibung** ist neutral/vertrauensvoll — **kein**
  „Staging/Demo/keine echten Kundendaten" mehr (Seite bleibt `noindex`).

Damit sagt die Produktion **nicht** mehr Staging/Demo; Staging-Warnungen bleiben
genau dort, wo sie hingehören.

## 2. Vereinfachte Navigation (6 Bereiche statt 9 Stationen)

`components/app-shell/AppShellNav.tsx` gruppiert das Produkt in sechs
klar benannte Bereiche:

| Bereich         | Route                          | Bündelt                                              |
| --------------- | ------------------------------ | --------------------------------------------------- |
| **Cockpit**     | `/app-shell`                   | Tages-Übersicht                                     |
| **Chancen**     | `/app-shell/revenue-autopilot` | Revenue Autopilot · Lead Hunter · Radar · Quellen   |
| **Kunden**      | `/app-shell/leads`             | Lead Inbox & Follow-ups                             |
| **Offerten**    | `/app-shell/offers`            | Offer Engine                                         |
| **Aufträge**    | `/app-shell/jobs`              | Aufträge · bexio-Übergabe                           |
| **Chefansicht** | `/app-shell/ceo`               | CEO-Briefing                                         |

**Keine Funktionalität entfernt** — die gebündelten Stationen werden auf jeder
Gruppen-Seite über die neue Komponente `components/app-shell/GroupStations.tsx`
sichtbar gemacht (siehe Punkt 5). Weniger sichtbarer Lärm, gleiche Reichweite.

## 3. `/app-shell` = das tägliche Geld-Cockpit

`app/app-shell/page.tsx`:

- **Hero:** „Heute Geld holen" / „Klarsa zeigt die wichtigsten Umsatz-Aktionen
  für heute."
- **Top-Next-Actions** (`AutopilotCard`, aus den eigenen RLS-Daten).
- **Drei grosse Karten** als die drei Wege zu Umsatz:
  1. **Neue Chancen finden** → `/app-shell/revenue-autopilot`
  2. **Kunden nachfassen** → `/app-shell/leads`
  3. **Aufträge abschliessen & verrechnen** → `/app-shell/jobs`
- Darunter weiterhin die **Umsatz-Kette** und das **CEO-Briefing**.

## 4. Revenue Autopilot = das Gehirn, nicht „noch ein Modul"

`app/app-shell/revenue-autopilot/page.tsx` ist als **Command Center**
positioniert:

- Hero: „Klarsa priorisiert, was heute Geld bringt."
- Menschliche Freigabe bleibt explizit:
  **vorbereiten → prüfen → freigeben → senden.**
- Kein Auto-Versand/Buchung/Scraping — die Schutz-Hinweise bleiben.

## 5. Konsistente „Chancen"-Gruppierung (und „Aufträge")

Neue, geteilte, server-seitige Komponente
`components/app-shell/GroupStations.tsx` rendert eine kompakte Stations-Leiste mit
**einer einfachen Erklärung pro Station** und Hervorhebung der aktiven Station:

**Chancen** (auf Revenue Autopilot, Lead Hunter, Radar, Quellen):

- **Quellen** = woher die Chancen kommen
- **Lead Hunter** = Chancen erfassen & qualifizieren
- **Radar** = Geografie sichtbar machen
- **Revenue Autopilot** = entscheidet die heutigen Aktionen

**Aufträge** (auf Aufträge, bexio): Arbeit ausführen & terminieren → abschliessen
& verrechnen. So bleibt **bexio** trotz schlankerer Top-Navigation einen Klick
entfernt. Die redundanten „← Lead Hunter"-Rücklinks auf Radar/Quellen wurden
durch diese Leiste ersetzt.

## 6. Schlanke Empty-States & ehrliche Produktions-Kopie

- Empty-States bleiben **kurz, handlungsorientiert, eine Erklärung + ein CTA**
  und enthalten in Produktion **keine** Staging-/Demo-Sprache.
- `app/app-shell/offers/page.tsx`: veraltete „kein PDF"-Aussage korrigiert
  (PDF-Download existiert) — kein „Demo/unfertig"-Eindruck mehr.

## 7. Öffentliche Footer-/Demo-Wortwahl

`components/landing/SiteFooter.tsx` (öffentliche Marketing-Seiten):

- „© 2026 Klarsa · Demo-Version" → „© 2026 Klarsa · Das KI-Verkaufsbüro für
  Schweizer KMU".
- „Alle Daten sind fiktiv …" → „Muster Service GmbH und ihre Kennzahlen sind
  **Beispieldaten zur Veranschaulichung**." (Spaltentitel „Demo-Unternehmen" →
  „Beispielbetrieb".)

Ehrlich (Beispieldaten bleiben als solche gekennzeichnet), aber das **echte
Produkt wirkt nicht mehr wie eine Wegwerf-Demo**.

---

## Geänderte Dateien

**Neu**

- `components/app-shell/GroupStations.tsx`
- `docs/clean24-workspace-simplification.md`

**Geändert**

- `app/login/page.tsx` (umgebungsabhängige Vertrauens-Kopie)
- `components/app-shell/AppShellNav.tsx` (6 Bereiche)
- `app/app-shell/page.tsx` (Geld-Cockpit, Hero, 3 Karten)
- `app/app-shell/revenue-autopilot/page.tsx` (Command-Center-Positionierung + Band)
- `app/app-shell/lead-hunter/page.tsx` (Chancen-Band)
- `app/app-shell/lead-hunter/radar/page.tsx` (Chancen-Band, Rücklink ersetzt)
- `app/app-shell/lead-hunter/sources/page.tsx` (Chancen-Band, Rücklink ersetzt)
- `app/app-shell/jobs/page.tsx` (Aufträge-Band)
- `app/app-shell/bexio/page.tsx` (Aufträge-Band)
- `app/app-shell/offers/page.tsx` (veraltete „kein PDF"-Kopie korrigiert)
- `components/landing/SiteFooter.tsx` (Footer-Wortwahl)
- `README.md` (Version, Routen, kein-Migration-Hinweis, nächster Schritt)

## Guardrails (eingehalten)

- **Keine Migration.** 001–006 unverändert; **`004` unangetastet** (weder
  gestaged noch verändert noch revertiert).
- **Kein** Service-Role in App-Routen/Actions; **keine** Secrets/Env-Werte/
  `.env.local` im Repo; **keine** echten oder erfundenen Produktions-/Kundendaten.
- **Kein** Scraping, **kein** automatischer E-Mail-/WhatsApp-Versand, **keine**
  automatische Buchung, **keine** bexio-API — Verhalten unverändert, nur
  Navigation/Copy/UI.
- `npm run lint` und `npm run build` grün.

## Nächster Schritt

Inhaber öffnet die Produktion (`https://klarsa.vercel.app`), prüft den neuen
Login-Text, das Cockpit „Heute Geld holen", die sechs Bereiche und die
Chancen-/Aufträge-Leisten; danach **v0.5.5.1** (Produktionsverifikation). Die
gated Roadmap (Baugesuche live + Migration 007, SIMAP/ZEFIX, Versand-Provider,
Kalender) bleibt unverändert.
