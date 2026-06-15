# Klarsa v0.5.6 — Package-aware Premium Full Autopilot

**Ziel:** Klarsa bleibt **paket-bewusst**. Dasselbe Produkt zeigt drei ehrliche
Autonomie-Stufen, und der Inhaber versteht sofort, **was Klarsa für ihn tut**.
Diese Version legt die **Produkt-Grundlage, UI, Copy, Docs und das interne
Betriebsmodell** für das vollautomatische Premium-Verkaufsbüro – **ohne**
Standard/Pro zu brechen und **ohne** echte Automatik ohne verbundenen Kanal.

**Reine UI/Copy/Foundation. Keine neue Migration. Kein Service-Role, keine
Secrets, keine echten/erfundenen Kundendaten.**
`supabase/verification/004_bind_auth_user_to_fake_tenant.sql` bleibt
**unangetastet**.

---

## Standard vs. Pro vs. Premium

| Paket        | Positionierung                       | Was Klarsa tut                                                                 |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------------- |
| **Starter**  | **Digitales Offert-Büro**            | Anfragen bündeln, Preise rechnen, PDF-Offerten, Follow-up-Erinnerungen.       |
| **Pro**      | **Geführter Sales Autopilot**        | Führt den Inhaber, bereitet Aktionen vor, entwirft Outreach, zeigt Chancen.   |
| **Premium**  | **Vollautomatisches AI-Verkaufsbüro**| Findet Firmen, kontaktiert, fasst nach, bereitet/sendet Offerten (wenn Kanäle verbunden), koordiniert Termine, zeigt bestätigte nächste Aktionen/Termine. |

Die Logik liegt zentral in `components/app-shell/autopilot-tier.ts`
(`autopilotTier`, `isPremiumExperience`, `tierRank`). Premium = Tier `premium`
**oder** der interne Founder-Tenant (Clean24, `billing_status =
internal_founder`).

## Was „Premium Full Autopilot" bedeutet

Der Premium-Inhaber öffnet Klarsa und sieht: **„Klarsa hat für Sie gearbeitet."**
Beispiel-Ziel:

- 14 Firmen geprüft
- 6 passende Chancen gefunden
- 4 Erstkontakte gesendet
- 2 Antworten erhalten
- 1 Offerte versendet
- 1 Termin bestätigt
- **Nächster Termin:** Dienstag 10:00, Adresse, Kontakt, Thema

Das ist die **Ziel-Erfahrung**. Klarsa zeigt sie schon heute – aber **ehrlich**:
echte Zahlen, wo Daten existieren, und ruhige „Kanal nicht verbunden"-Zustände,
wo noch ein Kanal fehlt. **Keine erfundenen Zahlen.**

## Was bereits UI/Foundation ist (v0.5.6)

- **Cockpit `/app-shell`** – Premium-Tenants sehen das Panel **„Klarsa hat für
  Sie gearbeitet"** (`PremiumAutopilotPanel`) mit Status-Zeilen (Firmen geprüft,
  Chancen gefunden, Erstkontakte, Antworten, Offerten, Termine) + **nächstem
  Termin**. Daten aus `buildPremiumDigest` (real, RLS-gescopt). Non-Premium sehen
  das Geld-Cockpit + einen **Premium-Teaser**.
- **Revenue Autopilot `/app-shell/revenue-autopilot`** – das **Command Center**
  mit **Autopilot-Lanes** (`components/revenue-autopilot/lanes.ts` +
  `AutopilotLanes`): Discovery · Erstkontakt · Nachfassen · Offerten · Termine ·
  Abschluss/bexio. Jede Lane zeigt einen ehrlichen Status:
  **Aktiv · Wartet auf Freigabe · Kanal nicht verbunden · Bereit für Premium ·
  Premium-Funktion · Nächste Aktion geplant.**
- **Package-Gating** – wo Vollautomatik auf Nicht-Premium erscheint:
  „Premium-Funktion" / „Im Pro-Paket vorbereitet, im Premium-Paket
  automatisierbar" / „Upgrade für Vollautomatik". Standard/Pro wirken **nicht
  kaputt** – sie zeigen den Wert, den sie liefern (vorbereitet/geführt).
- **Automation-Status-Copy** statt manueller Warnungen
  (`SafeModeBanner` + Cockpit-/Autopilot-Hinweise): „Autopilot sichtbar und
  kontrolliert", „Klarsa arbeitet nach Paket und Freigabe-Regeln",
  „Premium-Vollautomatik wird kanalweise aktiviert". **Keine technischen
  Implementierungsbegriffe** in der Inhaber-UI.

## Was noch verbundene Kanäle braucht

Diese Lanes sind **vorbereitet**, schalten aber erst mit einem **konform
konfigurierten Kanal** auf „Aktiv":

- **Erstkontakt / Nachfassen / Offerten-Versand** → **Versand-Kanal**
  (`providers.send`, heute `false`). Ohne Kanal: Entwürfe „Wartet auf Freigabe"
  bzw. „Bereit für Premium".
- **Antworten erhalten** → **Posteingang-Kanal** (heute nicht verbunden →
  ehrliche Null).
- **Termine** → **Kalender-Kanal** (`providers.calendar`, heute `false`).
- **Discovery** → **freigegebene Quelle** (`providers.discovery`:
  `GOOGLE_PLACES_API_KEY` und/oder `BAUGESUCHE_ZH_SIGNAL_URL`).

Heute gilt: `send = false`, `calendar = false`. Nichts wird real gesendet oder
gebucht.

## Zukünftiger Pfad: Gmail / Kalender / Versand-Provider

Der **nächste reale Automatik-Schritt** (separat, gesondert freizugeben):

1. **Versand-Provider** (Gmail API / SMTP / Resend) mit **Absender-Identität +
   Opt-out** → schaltet Erstkontakt/Nachfassen/Offerten-Versand für **sichere
   Kategorien** (Inbound/Opt-in, Bestand, freigegeben) frei. **Cold-Outreach
   bleibt gesperrt.**
2. **Kalender** (Google/Microsoft) → Terminvorschläge werden koordiniert;
   **Buchung nur nach Bestätigung/Slot-Wahl des Kunden** – nie still.
3. **Posteingang** → Antworten erfassen → „Antworten erhalten" wird real.

Jeder Kanal wird **kanalweise** aktiviert, mit Owner-Toggles (bestehende
`company_settings.settings.autopilot`) und sichtbarem Audit.

## Approved Discovery Source Path

- Nur **offizielle, freigegebene** Quellen: Google Places API (env
  `GOOGLE_PLACES_API_KEY`) und der offizielle Baugesuche-Zürich-Feed (env
  `BAUGESUCHE_ZH_SIGNAL_URL`). **Kein Scraping, kein HTML/PDF, kein Headless.**
- Läuft heute **auf Owner-Auslösung** (kein aktiver Cron). Premium kann Läufe
  später **automatisch** ausführen, sobald die Quelle verbunden und freigegeben
  ist – sichtbar protokolliert.
- Provider-Fehler (z. B. **403** Zugriff/Kontingent) werden als **ruhiger
  Betriebsstatus** gezeigt, nie als roher Fehler: „Discovery-Quelle ist momentan
  nicht erreichbar … Klarsa hat nichts geändert."

## Sicherheits-Grenzen (hart, nicht verhandelbar)

- **Kein Spam, keine versteckte Massen-Kontaktaufnahme.** Automatik nur für
  sichere Kategorien **und** nur mit konfiguriertem, konformem Versand-Kanal.
  **Cold-Outreach ist hart gesperrt.**
- **Keine stille Terminbuchung** – nur nach Kundenbestätigung.
- **Sichtbar & protokolliert.** Jede automatische Aktion ist im Audit
  (`audit_logs`) und in den Lanes nachvollziehbar – **gebundene** Automatik,
  keine Black Box.
- **Kein** Service-Role in App-Routen/Actions; alle Reads/Writes laufen
  RLS-gescopt über den Session-Client. **Kein** echter bexio-API-Aufruf.
- **Paket-gated:** Standard/Pro lösen nie still Premium-Verhalten aus.

---

## Geänderte/neue Dateien

**Neu**

- `components/app-shell/autopilot-tier.ts` – Paket-Positionierung + Premium-Erkennung
- `components/app-shell/premium-digest.ts` – „Klarsa hat für Sie gearbeitet"-Digest (pur)
- `components/app-shell/PremiumAutopilotPanel.tsx` – Premium-Panel
- `components/revenue-autopilot/lanes.ts` – Autopilot-Lanes-Modell (pur)
- `components/revenue-autopilot/AutopilotLanes.tsx` – Lanes-Darstellung
- `docs/clean24-premium-full-autopilot.md`

**Geändert**

- `lib/auth/tenant-data.ts` – `CompanySummary` um `billingStatus` ergänzt (additiver Read)
- `app/app-shell/page.tsx` – Positionierungs-Chip, Premium-Panel/Teaser, Automation-Status-Hinweis
- `app/app-shell/revenue-autopilot/page.tsx` – Command-Center-Lanes, paket-bewusster Header
- `components/revenue-autopilot/SafeModeBanner.tsx` – Automation-Status-Copy
- `app/app-shell/revenue-autopilot/discovery/{page,actions}.ts(x)` – ruhiger 403-Status, Premium-Auto-Discovery-Hinweis
- `README.md`

## Nächster Schritt

**Erster realer Automatik-Lane** – am wahrscheinlichsten **Gmail/Kalender** oder
eine **freigegebene Discovery-Quelle**: Versand-Kanal mit Absender-Identität +
Opt-out konfigurieren (oder Kalender verbinden), dann den entsprechenden Lane von
„Bereit für Premium" auf „Aktiv" schalten – für **sichere Kategorien**, mit
sichtbarem Audit. Cold-Outreach bleibt gesperrt.
