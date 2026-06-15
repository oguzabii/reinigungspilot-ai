# Klarsa

Das KI-Verkaufsbüro für Schweizer KMU — der verkaufsstarke, paketbasierte
Master-Demo-Foundation. Dieses Repository ist die **eigenständige,
verkaufsfähige Produkt- und Demo-Basis**. Clean24 dient ausschliesslich als
interner Pilot/Proof und ist hier nicht öffentlich integriert.

## Aktuelle Version

**v0.5.7** — **Approved Discovery Autopilot (erster echter Automatik-Lane).**
`/app-shell/revenue-autopilot/discovery` ist jetzt der **Approved Discovery
Autopilot**: Klarsa findet über **offizielle, freigegebene Quellen** passende
Chancen und erstellt – **wenn die Richtlinie es erlaubt** – automatisch **kalte
Kandidaten**. **Nur Discovery: kein Outreach, kein E-Mail/WhatsApp, keine
Buchung, keine bexio-API, kein Scraping.** **Keine neue Migration.** (1) **Nur
offizielle Adapter** (`SIGNAL_ADAPTERS`): **Google Places** (env
`GOOGLE_PLACES_API_KEY`) + **Baugesuche Zürich** (env `BAUGESUCHE_ZH_SIGNAL_URL`,
offizieller CSV/JSON-Feed); SIMAP/ZEFIX bleiben geplant. (2) **Package-Gating**:
Starter gesperrt (Upgrade-Hinweis, Offert-Büro bleibt nutzbar), Pro **geführt**
(startet selbst, Auto-Erstellung nur per Richtlinie), Premium/internal_founder
**vollautomatik-fähig** – server-seitig erzwungen. (3) **Auto-Create-Policy**
wiederverwendet (`company_settings.settings.autopilot.autoCreateColdCandidates`,
Owner-Toggle): AUS → nur Vorschau, EIN → kalte `prospects` via **Session-Client +
RLS** (nie Service-Role, nie Lead/Kunde). (4) **Dedupe + Caps**: Name+Region-
Abgleich gegen bestehende Prospects, Batch-Dedupe, `MAX_CREATE_PER_RUN = 15`;
klares Ergebnis **Gefunden · Neu erstellt · Bereits vorhanden · Übersprungen ·
Fehler**, jeder Lauf im Audit. (5) **Status/letzter Lauf/nächste Aktion** auf der
Discovery-Seite; der **Discovery-Lane** auf Revenue Autopilot zeigt „Letzter
Lauf: X". (6) **Ruhige Fehler** („Quelle momentan nicht erreichbar … Klarsa hat
nichts geändert"), keine HTTP-Codes in der UI. Entdeckte Kandidaten fliessen über
den bestehenden `prospects`-Pfad in **Lead Hunter/Radar**. **Kein Service-Role,
keine Secrets, kein Scraping/Versand/Buchung/bexio-API. 001–006 unverändert;
`004` unangetastet.** Neu: `docs/clean24-approved-discovery-autopilot.md`.
lint/build grün. **Nächster Schritt: v0.5.8 — Outreach Autopilot (gated):
konformer Versand-/Kalender-Kanal für sichere Kategorien, Cold-Outreach bleibt
gesperrt.**

**v0.5.6** — **Package-aware Premium Full Autopilot (Foundation).** Klarsa bleibt
**paket-bewusst** und zeigt drei ehrliche Autonomie-Stufen:
**Starter = „Digitales Offert-Büro"**, **Pro = „Geführter Sales Autopilot"**,
**Premium = „Vollautomatisches AI-Verkaufsbüro"** (`components/app-shell/autopilot-tier.ts`).
**Reine UI/Copy/Foundation, keine neue Migration.** (1) **Cockpit `/app-shell`**:
Premium-Tenants sehen das Panel **„Klarsa hat für Sie gearbeitet"**
(`PremiumAutopilotPanel`) mit Status-Zeilen (Firmen geprüft, Chancen gefunden,
Erstkontakte, Antworten, Offerten, Termine) + **nächstem Termin** – aus **echten,
RLS-gescopten Daten** (`buildPremiumDigest`); fehlt ein Kanal, steht da ein
**ehrlicher „Kanal nicht verbunden"-Zustand statt erfundener Zahlen**. (2)
**Revenue Autopilot** = **Command Center** mit **Autopilot-Lanes** (Discovery ·
Erstkontakt · Nachfassen · Offerten · Termine · Abschluss/bexio), jede mit klarem
Status: **Aktiv · Wartet auf Freigabe · Kanal nicht verbunden · Bereit für
Premium · Premium-Funktion · Nächste Aktion geplant**. (3) **Package-Gating**:
auf Nicht-Premium „Premium-Funktion" / „Im Pro-Paket vorbereitet, im
Premium-Paket automatisierbar" / „Upgrade für Vollautomatik" – Standard/Pro
wirken **nicht kaputt**. (4) **Automation-Status-Copy** ersetzt manuelle
Warnungen (keine technischen Begriffe in der Inhaber-UI). (5) **Discovery**:
ruhiger Betriebsstatus bei 403 (kein roher Fehler), Hinweis, dass Premium die
Discovery automatisch ausführt, sobald eine freigegebene Quelle verbunden ist.
**Volle Automatik ist sichtbar, gebunden, protokolliert und paket-gated. Kein
Spam, keine versteckte Massen-Kontaktaufnahme, keine stille Buchung, kein
Cold-Outreach, kein Service-Role, keine Secrets, keine echten Sendungen/Buchungen
(send/calendar heute nicht verbunden), kein echter bexio-API. 001–006 unverändert;
`004` unangetastet.** Neu: `docs/clean24-premium-full-autopilot.md`. lint/build grün.
**Nächster Schritt:** erster realer Automatik-Lane – am wahrscheinlichsten
**Gmail/Kalender** oder eine **freigegebene Discovery-Quelle** (Versand-Kanal mit
Absender-Identität + Opt-out bzw. Kalender), dann den Lane von „Bereit für
Premium" auf „Aktiv" schalten – nur für sichere Kategorien, Cold-Outreach bleibt
gesperrt.

> **v0.5.6.1:** Premium Full Autopilot in Produktion **verifiziert** (2026-06-15)
> — der Inhaber hat v0.5.6 deployed und bestätigt, dass sich die Produktions-UI
> wie erwartet geändert hat: paket-bewusste Autopilot-Positionierung, das
> Premium-Panel **„Klarsa hat für Sie gearbeitet"** und die Revenue-Autopilot-
> **Lanes** sind sichtbar, mit ruhigerer Automation-Status-Sprache. **Kein echtes
> Senden/Buchen, kein echter bexio-API; `providers.send` und `providers.calendar`
> weiterhin nicht verbunden; keine echten Kundendaten committed.** Docs-only —
> `docs/clean24-premium-full-autopilot-results.md`. **Nächster Schritt: v0.5.7 —
> erster realer Automatik-Lane, voraussichtlich Approved Discovery Autopilot.**
> 001–006 unverändert; `004` unangetastet.

**v0.5.5** — **Workspace vereinfacht & Produktions-Kopie bereinigt.** Klarsa
beantwortet jetzt sofort: „Wo ist heute Geld – und was tue ich als Nächstes?".
**Reine UI/Copy/Navigation, keine neue Migration.** (1) **Produktions-Login**
zeigt vertrauensvolle, umgebungsabhängige Kopie (`getKlarsaEnv()`): „Zugang zum
geschützten Klarsa-Arbeitsbereich." + „Mandantengetrennt. Geschützt. Für den
täglichen Betrieb." — **Staging-Warnungen nur noch in Staging/Dev**, keine
„Demo/keine echten Kundendaten"-Sprache mehr in Produktion. (2) **Navigation auf
6 Bereiche** verschlankt: **Cockpit · Chancen · Kunden · Offerten · Aufträge ·
Chefansicht** (Chancen bündelt Revenue Autopilot/Lead Hunter/Radar/Quellen,
Aufträge bündelt Aufträge/bexio) — **keine Funktion entfernt**. (3) **`/app-shell`
ist das Geld-Cockpit** („Heute Geld holen" + Top-Aktionen + 3 grosse Karten:
Neue Chancen finden / Kunden nachfassen / Aufträge abschliessen & verrechnen).
(4) **Revenue Autopilot** als **Command Center** positioniert („Klarsa
priorisiert, was heute Geld bringt." · Freigabe-Fluss **vorbereiten → prüfen →
freigeben → senden**). (5) Neue, geteilte **`GroupStations`**-Leiste erklärt die
Chancen-/Aufträge-Stationen einfach und konsistent (Quellen = woher Chancen
kommen, Lead Hunter = erfassen/qualifizieren, Radar = Geografie, Revenue
Autopilot = heutige Aktionen). (6) Schlanke Empty-States, veraltete
„kein PDF"-Offerten-Kopie korrigiert. (7) Öffentlicher **Footer**: „Demo-Version"/
„Alle Daten sind fiktiv" → „Das KI-Verkaufsbüro für Schweizer KMU" /
„Beispieldaten zur Veranschaulichung". **Kein Service-Role, keine Secrets, kein
Scraping/Versand/Buchung, keine bexio-API, keine echten/erfundenen Kundendaten.
001–006 unverändert; `004` unangetastet.** Neu:
`docs/clean24-workspace-simplification.md`. lint/build grün.

**v0.5.4.2** — **Baugesuche-CSV-Grössenlimit erhöht.** Die offizielle Kanton-Zürich-
Baugesuche-CSV ist ≈8 MB, der bisherige Text-Schutz lag bei 4 MB und konnte den
Feed abschneiden. `MAX_TEXT_CHARS` in `lib/discovery/baugesuche-zh.ts` wurde auf
**≈12 MB** angehoben (knapp über der Dateigrösse). **Alle übrigen Caps unverändert**
(8 s Timeout, max. ≈2000 Zeilen gescannt, max. 10 Signale), kein Scraping/HTML/PDF/
Headless, kein Service-Role, keine Migration, keine Secrets. **001–006 unverändert;
`004` unangetastet.** lint/build grün.

**v0.5.4.1** — **Baugesuche Zürich-Adapter: offizieller CSV-Feed unterstützt.** Die
validierte offizielle Kanton-Zürich-Quelle „Baugesuche im Kanton Zürich" ist ein
**CSV-Download**; der Adapter (`lib/discovery/baugesuche-zh.ts`) unterstützt nun
**CSV zusätzlich zu JSON**: Auto-Erkennung via `content-type`/`.csv`-Endung,
**dependency-freier** Server-CSV-Parser (Delimiter `;`/`,` automatisch, Quotes mit
`""`-Escapes, eingebettete Zeilenumbrüche, CRLF), Caps (≈2000 Zeilen, ≈12-MB-Text-
Schutz [offizielle CSV ≈8 MB], 8 s Timeout, max. 10 Signale, neuestes Quelldatum zuerst). **Flexibles,
defensives Feld-Mapping** deutscher Spalten (Bauvorhaben/Vorhaben/Beschreibung,
Gemeinde/Ort, Strasse/Adresse/Lage, Art/Kategorie, Publikationsdatum/Eingangsdatum,
URL). Unbekanntes Schema → **`unsupported_schema`** mit **erkannten Spaltennamen**
als sicherer Diagnose (nur Spaltennamen, keine Werte/Secrets) auf der Signals-Seite.
Konfiguration via **`BAUGESUCHE_ZH_SIGNAL_URL`** (z. B.
`https://daten.statistik.zh.ch/ogd/daten/ressourcen/KTZH_00002982_00006183.csv`).
**Timing ehrlich:** Quelldatum = Baugesuch-/Publikationsdatum (exakt, als das
beschriftet, was es ist), **kein erfundenes Fertigstellungsdatum** – Fertigstellung
bleibt geschätzt. **Kein Scraping/HTML/PDF/Headless, kein Service-Role, keine neue
Migration, kein Schlüssel/Secret im Repo.** **001–006 unverändert; `004`
unangetastet.** lint/build grün.

**v0.5.4 Fundament — Baugesuche Zürich Signal-Adapter (erste reale Quelle, env-gated).**
Der erste **echte** offizielle Signal-Quellen-Adapter: **Baugesuche Zürich**
(`lib/discovery/baugesuche-zh.ts`, **server-only**). Er macht aus offiziellen
Bauprojekt-/Baugesuch-Datensätzen Opportunity-Signale (Bauprojekt → Service-
Potenzial Bauendreinigung/Fensterreinigung/Hauswartung; MFH/Wohnbau → Umzugs-/
Treppenhaus-/Fensterreinigung/Hauswartung; Gewerbe/Büro → Büro-/Fensterreinigung).
**Vollständig implementiert, aber standardmässig `not_configured`**: läuft nur, wenn
der Inhaber `BAUGESUCHE_ZH_SIGNAL_URL` auf einen **validierten offiziellen** Open-
Data-JSON-Endpoint setzt (optional `BAUGESUCHE_ZH_API_KEY`). **Kein hardcodierter/
geratener Endpoint, nur offizielle JSON-API – KEIN Scraping/HTML/PDF/Headless**,
Trefferlimit 10, Timeout, Key nie geloggt/im Client. **Ehrliches Timing:** ein
Quelldatum (Baugesuch-/Publikationsdatum) gilt als **exakt** und wird als das
bezeichnet, was es ist (kein erfundenes Fertigstellungsdatum); ohne Datum
**geschätzt**. Auf `/app-shell/revenue-autopilot/signals` zeigt das Quellen-
Bereitschafts-Panel Baugesuche als **live** (Aktiv/Nicht konfiguriert); bei
Konfiguration rendert eine **„Bau-Signale (live)"**-Sektion mit Karten (Quelle/
Titel/Region/Warum-jetzt/Services/Konfidenz/Timing-Güte/nächste Aktion + „Quelle
öffnen" + **„Als Opportunity erstellen"** via bestehende `createOpportunity`-RLS-
Aktion). Revenue Autopilot zeigt die Baugesuche-Bereitschaft. **KEINE neue
Migration** (Signale zur Laufzeit; `opportunity_signals`/007 erst wenn validierte
Quelle live + täglich genutzt). Kein Service-Role, keine Secrets im Repo
(Platzhalter leer). Neu: `docs/clean24-baugesuche-signal-adapter.md`. **Aus Signalen
kein Auto-Kontakt/Versand/Buchung.** **LIMITED GO bleibt. 001–006 unverändert; `004`
unangetastet.** lint/build grün.

> **v0.5.3.1:** Opportunity Signal Engine in Produktion verifiziert — Inhaber
> öffnete `/app-shell/revenue-autopilot/signals`, Signal-Karten rendern aus
> bestehenden Produktions-Prospects (Quelle/Typ/Warum-jetzt/Service/Konfidenz/
> Timing-Güte/nächste Aktion), Cross-Links funktionieren, ehrliches Timing, keine
> echten Kundendaten — `docs/clean24-opportunity-signal-engine-results.md`.

**v0.5.3.1 Detail — Opportunity Signal Engine in Produktion verifiziert.** Der Inhaber
hat sich in der Produktion (`https://klarsa.vercel.app`) angemeldet und
`/app-shell/revenue-autopilot/signals` geöffnet: Signal-Karten rendern aus den
bestehenden Produktions-Kandidaten/Prospects und zeigen **Quelle, Signal-Typ,
„Warum jetzt?", Service-Potenzial, Konfidenz, Timing-Fenster + Güte
(exakt/geschätzt/unbekannt) und nächste Aktion / Lead-Hunter-Link**; die Links zu
Signals aus **Revenue Autopilot / Discovery / Radar / Lead Hunter** funktionieren.
**Inferred/unbekanntes Timing ist ehrlich beschriftet, keine exakten
Bauabschluss-Daten erfunden, kein Auto-Outreach/Anruf/Buchung/Scraping, keine echten
Kundendaten erfasst.** **Docs-only** (neu
`docs/clean24-opportunity-signal-engine-results.md`;
`clean24-opportunity-signal-engine.md` mit **VERIFIED**-Abschnitt). Ehrlicher Scope:
die „Warum jetzt?"-Intelligenz läuft über **bestehende Kandidaten** – echte
offizielle **Baugesuche/SIMAP/ZEFIX**-Timing-Adapter (+ Migration 007) bleiben die
**nächste, gated Phase**. **LIMITED GO bleibt. 001–006 unverändert; `004`
unangetastet.**

**v0.5.3 Fundament — Opportunity Signal Engine „Warum jetzt?".** Klarsa geht
von „hier sind Firmen" zu „hier sind zeitkritische Umsatz-Chancen und warum sie
zählen". Neu: (1) eine **Opportunity Signal Engine**
(`components/revenue-autopilot/signals.ts`, rein/deterministisch) macht aus jedem
Kandidaten ein **Signal** mit **Signal-Typ** (Bauprojekt/Verwaltung/Ausschreibung/
Neugründung/Betrieb), **Warum-jetzt**, **Service-Potenzial**, **Konfidenz**,
**Timing-Fenster + Güte (exakt/geschätzt/unbekannt)** und **nächster Aktion**; (2)
neue Route `/app-shell/revenue-autopilot/signals` (Signal-Karten + Quellen-
Bereitschaft); (3) **Adapter-Architektur** (`lib/discovery/adapters.ts`): saubere
Schnittstelle für künftige offizielle Quellen – **Stubs** Baugesuche/SIMAP/ZEFIX
(`phase:"planned"`, `not_configured`, **kein Scraping**), Google Places als einzige
**live** Stützquelle; (4) **vorbereiteter Cron** (`app/api/autopilot/discovery-cron`),
**standardmässig deaktiviert** (ohne `CRON_SECRET` 404, secret-gated, **keine
Schreibvorgänge** – autonome Schreibvorgänge bräuchten Service-Role, der gesperrt
ist; kein `vercel.json`-Cron). **Ehrliches Timing:** ohne offizielle Datumsquelle ist
das Timing **geschätzt** oder **unbekannt** – nie als exakter Fertigstellungs-/
Fristtermin. **Aus Signalen entsteht KEIN automatischer Kontakt/Versand/Buchung** –
Übernahme im Lead Hunter. Integriert (Banner „Neue Signale gefunden" + Links von
Discovery/Radar/Lead Hunter). **KEINE neue Migration** (Signale aus `prospects`
berechnet; `opportunity_signals`/Migration 007 erst mit erster live Quelle, dokumentiert).
Kein Service-Role, kein Key/Secret im Repo (`GOOGLE_PLACES_API_KEY`/`CRON_SECRET`
leere Platzhalter). Neu: `docs/clean24-opportunity-signal-engine.md`. **LIMITED GO
bleibt. 001–006 unverändert; `004` unangetastet.** lint/build grün.

**v0.5.2 Fundament — Automatic Discovery + Safe Autopilot Rules.** Klarsa wird
automatischer – **kontrolliert per Richtlinie**, keine Spam-Maschine. Neu: (1) eine
**Autopilot Rules Engine** (`components/revenue-autopilot/policy.ts`, rein/
deterministisch) entscheidet pro **Kontakt-Kategorie** (Inbound/Opt-in, Bestandskunde,
freigegebener Kontakt, **kalt entdeckt**), was automatisch erlaubt ist; (2)
**Automatische Discovery** über die **offizielle** Google-Places-API
(`lib/discovery/google-places.ts`, env-gated `GOOGLE_PLACES_API_KEY`,
owner-initiiert, **kein Cron**, hartes Trefferlimit 10, **kein Scraping**); (3)
**Autopilot Control Center** – `/app-shell/revenue-autopilot/discovery` (Lauf,
Kandidaten, Audit) und `/app-shell/revenue-autopilot/policy` (Policy-Matrix +
Hard-Blocked-Liste + Owner-Toggles), plus Automatik-Sektion + Safe-Mode-Banner auf
`/app-shell/revenue-autopilot`. Kalt entdeckte Betriebe werden – **nur wenn der Owner
den Toggle aktiviert** (Default AUS) – automatisch als **kalte Prospects** erstellt
(`source_type='google'`, nicht kontaktiert, **Cold-Outreach gesperrt**). **Voll
automatischer Cold-Outreach, Auto-Anrufe und stille Buchung sind hart gesperrt**;
Auto-Nachrichten nur für sichere Kategorien **und** nur mit konfiguriertem,
konformem Versand-Provider (keiner aktiv → nur Entwurf). **KEINE neue Migration**
(Discovery → `prospects`, Toggles → `company_settings.settings` jsonb, Audit →
`audit_logs`/`discovery_run`), kein Service-Role, fehlender Key → „nicht
konfiguriert" (App läuft weiter), **kein Key im Repo**. Neu:
`docs/clean24-automatic-discovery-autopilot-rules.md`. **LIMITED GO bleibt**: echte
Daten nur über die App-UI (owner-getriggert), Restore-Test weiter aufgeschoben.
**001–006 unverändert; `004` unangetastet.** lint/build grün.

> **v0.5.1.1:** Controlled Source Execution in Produktion verifiziert — Inhaber
> öffnete `/app-shell/lead-hunter/sources/[id]/execute`, die 5-Schritte-Worklist
> rendert, Recherche-Links öffnen die eigene Browser-Suche (kein Scraping), Capture
> trägt nicht-PII-Kontext, „Quelle aktiv" sichtbar, keine echten Kundendaten erfasst
> — `docs/clean24-controlled-source-execution-results.md`.

> **v0.5.1 Fundament:** Neue geschützte, dynamische Route
> `/app-shell/lead-hunter/sources/[id]/execute` – ein geführtes Quellen-
> Abarbeitungs-Cockpit, integriert in Revenue Autopilot, Quellen-Registry und Lead
> Hunter („Quelle abarbeiten"-CTAs, „Quelle aktiv"-Banner). Reine Helper
> (`source-queue.ts` erweitert um `sourceTaskFor`, neue `ResearchTools.tsx`), keine
> neue Migration, kein Service-Role/Scraping/Versand/Buchung —
> `docs/clean24-controlled-source-execution.md`.

> **v0.5.1 Fundament:** Neue geschützte, dynamische Route
> `/app-shell/lead-hunter/sources/[id]/execute` – ein geführtes Quellen-
> Abarbeitungs-Cockpit, integriert in Revenue Autopilot, Quellen-Registry und Lead
> Hunter („Quelle abarbeiten"-CTAs, „Quelle aktiv"-Banner). Reine Helper
> (`source-queue.ts` erweitert um `sourceTaskFor`, neue `ResearchTools.tsx`), keine
> neue Migration, kein Service-Role/Scraping/Versand/Buchung —
> `docs/clean24-controlled-source-execution.md`.

**Fundament-Details (v0.5.1):** Geführtes Quellen-Abarbeitungs-Cockpit als
5-Schritte-Worklist — **Ziel** (z. B.
„Heute ≈5 Liegenschaftsverwaltungen recherchieren"), **Recherchieren** über
**vom Nutzer geöffnete** Such-Links (Google / Google Maps / ZEFIX / Website – reine
`<a href>`-Links, **kein `fetch`/Scraping/API/Server-Sammeln**, Klarsa liest keine
Ergebnisse aus), **Qualifizieren** (Checkliste, lokale Merkhilfe, nichts
gespeichert), **Erfassen** (Button → vorausgefülltes „Opportunity aus
Quelle"-Formular mit **nicht-PII**-Kontext source/service/region; erstellt nichts
automatisch) und **Kontakt vorbereiten** (generische Kopier-Entwürfe E-Mail /
WhatsApp / Telefon / Termin). **Revenue Autopilot**, **Quellen-Registry** und
**Lead Hunter** sind integriert („Quelle abarbeiten"-CTAs, „Quelle aktiv"-Banner).
Reine Helper (`source-queue.ts` erweitert um `sourceTaskFor`, neue
`ResearchTools.tsx`), **keine neue Migration**, kein Service-Role, keine externe
API/KI, kein Scraping, kein Versand/keine Buchung. Menschliche Freigabe ist
erzwungen: jeder Schritt = **recherchieren → qualifizieren → erfassen → selbst
senden**. Neu: `docs/clean24-controlled-source-execution.md`. **Kontrollierter
Clean24-Produktionsstart bleibt LIMITED GO** – echte Daten ausschliesslich über die
App-UI. **001–006 unverändert; `004` unangetastet.** lint/build grün.

> **v0.5.0.1:** Revenue Autopilot in Produktion verifiziert — Inhaber-Login auf
> `https://klarsa.vercel.app`, `/app-shell/revenue-autopilot` lädt nach Login,
> **Autopilot** in der Navigation aktiv, Clean24-Kontext sichtbar, Seite +
> Guarded-Automation-Hinweis + „Nächste Schritte für Umsatz"-Karte gerendert,
> **keine echten Kundendaten erfasst** — `docs/clean24-revenue-autopilot-results.md`.

**Fundament (v0.5.0):** Neue geschützte Route
`/app-shell/revenue-autopilot` als Command Center „Heute Geld holen": priorisierte
**Umsatz-Aktionen**, eine **Source Execution Queue** (pro aktiver
`lead_sources`-Quelle ein konkreter, menschen­grosser Recherche-Schritt mit Link
ins vorausgefüllte „Opportunity aus Quelle"-Formular), **heisse Chancen** mit
**Erstkontakt-Entwürfen** (E-Mail / WhatsApp-SMS / Telefon-Skript / Follow-up),
**offene Leads** mit **Nachricht + Terminvorschlag/-bestätigung** und
**Offerten-Nachfass**. Alle Texte sind **reine Kopier-Entwürfe** in
Schweizerdeutsch – **nichts wird gesucht, gesendet oder gebucht**. Reine,
deterministische Helper (`components/revenue-autopilot/*`: `source-queue.ts`,
`outreach.ts`, `appointment.ts`, `DraftChannels.tsx`), additive Read-Funktion
`getCompanySettings`, **keine neue Migration**, kein Service-Role, keine externe
API/KI/Scraping, kein Versand/keine Buchung. Der Autopilot ist in der Navigation,
im Cockpit und im CEO-Briefing verlinkt (Anzahl offener Aktionen). Menschliche
Freigabe ist erzwungen: jeder Schritt = **vorbereitet → kopieren → prüfen → selbst
senden**. Neu: `docs/clean24-revenue-autopilot-foundation.md`. Der **kontrollierte
Clean24-Produktionsstart bleibt LIMITED GO** – echte Daten ausschliesslich über die
App-UI. **001–006 unverändert; `004` unangetastet.** lint/build grün.

> **v0.4.3:** Produktions-UX- & Radar-Sichtbarkeits-Politur — `AppShellNav`
> (persistente Navigation über die ganze Umsatz-Kette), **Schweiz-Radar immer
> sichtbar** (auch bei 0 Opportunities; premium dunkler Radar mit
> CH-Silhouette/Sweep + ehrlicher „Erste Opportunity erfassen"-CTA), Cockpit mit
> Autopilot-Nächste-Aktionen + Umsatz-Kette, premium Empty-States, CEO Geld-/
> Next-Action-Fokus, UI-only Autopilot-Helper. Keine neue Migration, kein
> Service-Role/Secrets/Scraping/Versand/Buchung — `docs/clean24-revenue-autopilot-roadmap.md`.

> **v0.4.2:** Kontrollierter Clean24-Produktionsstart (LIMITED GO — nur
> Inhaber-Nutzung via UI, Restore-Test aufgeschoben/Risiko akzeptiert; kein
> breiter Rollout/SQL-Import/Kunden-PII) — `docs/clean24-controlled-production-start.md`.

> **v0.4.1/.1.1:** Clean24 Production-Tenant-Bootstrap
> (`supabase/production/001…`, idempotent, Platzhalter-UID, **Config-only**) +
> Vercel-Produktions-Login auf `klarsa-production` **verifiziert** (2026-06-13) —
> `docs/clean24-production-bootstrap-results.md`. (v0.4.2-prep: read-only
> GitHub-Actions-Restore-Test-Workflow vorbereitet, noch nicht ausgeführt.)

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
> v0.4.1/.1.1 (Clean24 Production-Tenant-Bootstrap-Skript + Produktions-Login verifiziert — produktionssicher, idempotent, Platzhalter-UID, keine Kundendaten; real-data weiter NO-GO bis Restore-Test + GO),
> v0.4.2-prep (manueller GitHub-Actions-Restore-Test-Workflow vorbereitet — Gate-Utility, read-only gegen Produktion, kein neues Supabase-Projekt; noch nicht ausgeführt),
> **v0.4.2 (kontrollierter Clean24-Produktionsstart, LIMITED GO — nur Inhaber-Nutzung via UI, Restore-Test aufgeschoben/Risiko akzeptiert; kein breiter Rollout/kein SQL-Import/keine Kunden-PII)**.
> **Clean24 Memis GmbH** = **erster Tenant / Live-Proof** – erst nach dem Auth-/
> RLS-/Backup-Gate.

> Öffentliche Marke = **Klarsa**. Das interne Repo/Paket heisst weiterhin
> `reinigungspilot-ai`. Der alte, eigenständige **Clean24 Lead Autopilot** bleibt
> ein **getrenntes** System und wird nicht eingebunden.

> **Nächster Schritt:** Der Inhaber **validiert einen offiziellen Baugesuche-
> Zürich-Open-Data-Endpoint** (Quelle + Nutzungsbedingungen prüfen), setzt
> `BAUGESUCHE_ZH_SIGNAL_URL` in der Umgebung und testet die live Bau-Signale über
> die App-UI; danach **v0.5.4.1** (Produktionsverifikation). Sobald die Quelle live
> + täglich genutzt wird: **additive Migration 007** (`opportunity_signals`,
> persistente Signale/Dedup/Status, echtes/teils exaktes Timing). Erst **nach
> expliziter Freigabe** danach: SIMAP/ZEFIX-Adapter, konformer **Versand-Provider**,
> **Kalender** (Buchung nur nach Bestätigung) und ein **Inbound-Kanal**. Bis dahin:
> **Cold-Outreach/Auto-Anrufe/stille Buchung gesperrt**, kein erfundenes
> Fertigstellungsdatum, kein Auto-Versand aus Signalen.

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
| `/login`        | **Intern** (noindex): Login (Supabase Auth). **Umgebungsabhängige Kopie (v0.5.5):** Produktion zeigt vertrauensvolle Texte („Zugang zum geschützten Klarsa-Arbeitsbereich" · „Mandantengetrennt. Geschützt."), **Staging-Warnung nur in Staging/Dev** (`getKlarsaEnv()`). Inaktiv ohne Env |
| `/app-shell`    | **Intern** (noindex, **dynamisch/geschützt**): **Geld-Cockpit** – **paket-bewusst (v0.5.6)**: Premium-Tenants sehen das Panel **„Klarsa hat für Sie gearbeitet"** (Status-Zeilen + nächster Termin, echte RLS-Daten, ehrliche „Kanal nicht verbunden"-Zustände); andere sehen das Geld-Cockpit (Hero „Heute Geld holen", Top-Next-Actions, **3 grosse Karten**, Umsatz-Kette, CEO) + Premium-Teaser. Positionierungs-Chip je Paket. Ohne Env: „Setup erforderlich". Navigation in **6 Bereiche** |
| `/app-shell/revenue-autopilot` | **Intern** (noindex, **dynamisch/geschützt**): **Revenue Autopilot · Command Center (v0.5.6)** – **Autopilot-Lanes** (Discovery · Erstkontakt · Nachfassen · Offerten · Termine · Abschluss/bexio) mit Status **Aktiv / Wartet auf Freigabe / Kanal nicht verbunden / Bereit für Premium / Premium-Funktion / Nächste Aktion geplant**; paket-bewusster Header, Automation-Status-Copy. Darunter Source-Queue, heisse Chancen, Leads, Offerten-Nachfass (Kopier-Entwürfe). **Kein Auto-Versand/Buchung** (send/calendar nicht verbunden), keine neue Migration |
| `/app-shell/revenue-autopilot/discovery` | **Intern** (noindex, **dynamisch/geschützt**): **Approved Discovery Autopilot (v0.5.7)** – owner/admin-initiierter Lauf über **offizielle, freigegebene Quellen** (Google Places `GOOGLE_PLACES_API_KEY`, Baugesuche Zürich `BAUGESUCHE_ZH_SIGNAL_URL`; **kein Scraping/HTML/PDF/Headless, kein Cron**, Trefferlimit 10). **Package-gated** (Starter gesperrt, Pro geführt, Premium vollautomatik-fähig), Status/letzter Lauf/nächste Aktion, **Dedupe + Cap** (`MAX_CREATE_PER_RUN=15`), Ergebnis **Gefunden/Neu erstellt/Bereits vorhanden/Übersprungen/Fehler**, optional Auto-Erstellung **kalter** Prospects (`source_type='google'`/`other`, Outreach gesperrt), ruhige Fehler, Lauf-Audit. Session-Client/RLS, kein Service-Role |
| `/app-shell/revenue-autopilot/policy` | **Intern** (noindex, **dynamisch/geschützt**): **Autopilot-Richtlinien** – Policy-Matrix je Kontakt-Kategorie (was automatisch erlaubt/gesperrt + warum), Hard-Blocked-Liste (Cold-Outreach/Auto-Anruf/stille Buchung/Scraping), Provider-Status, **Owner-Toggles** für sichere Modi (in `company_settings.settings` jsonb, `can_write_settings` = owner/admin). Session-Client/RLS, kein Service-Role |
| `/app-shell/revenue-autopilot/signals` | **Intern** (noindex, **dynamisch/geschützt**): **Opportunity Signals** „Warum jetzt?" – aus erfassten/entdeckten Kandidaten berechnete Signale (Typ, Warum-jetzt, Service-Potenzial, Konfidenz, **Timing-Güte exakt/geschätzt/unbekannt**, nächste Aktion) + Quellen-Bereitschaft (Adapter-Stubs). Nur Lesen (Session-Client/RLS), **kein Auto-Versand/Buchung/Scraping**, keine neue Migration |
| `/api/autopilot/discovery-cron` | **Intern** (Route-Handler, **dynamisch**): **vorbereiteter** Discovery/Signal-Cron – **standardmässig deaktiviert**: ohne `CRON_SECRET` → 404, sonst `Authorization: Bearer`-geprüft; führt **keine** Discovery/**keine Schreibvorgänge** aus (autonome Writes bräuchten Service-Role = gesperrt). Kein `vercel.json`-Cron, nichts geplant |
| `/app-shell/ceo` | **Intern** (noindex, **dynamisch/geschützt**): **CEO-Briefing** – **read-only** KPI-Überblick über die Kette (Geld-Wirkung CHF, KPI-Kacheln, Trichter Opportunity→Lead→Offerte→Auftrag→bexio, Letzte 7 Tage, Achtung-Karten) aus vorhandenen RLS-Daten. Keine Schreibvorgänge/KI/externe API/bexio-API/Scraping |
| `/app-shell/leads` | **Intern** (noindex, **dynamisch/geschützt**): Lead Inbox – Tenant-Leads anzeigen, manuell erfassen, **Status pflegen** und **Follow-ups planen** (Server-Actions, Session-Client/RLS). Kein Versand, keine externen Integrationen |
| `/app-shell/lead-hunter` | **Intern** (noindex, **dynamisch/geschützt**): Lead Hunter / Opportunity Radar – Opportunities **manuell erfassen** + Radar-Übersicht + **deterministisches Service-Matching/Scoring** (live) + **„In Lead Inbox übernehmen"** (Promotion zu `leads`) + **„Opportunity aus Quelle"** (vorausgefülltes Formular via `?source=<id>`, verknüpft `prospects.source_id`) + Links zur **Quellen-Registry** und zum **Schweiz-Radar** (Server-Actions, Session-Client/RLS). Kein Scraping/Auto-Suche/KI/externe Quellen |
| `/app-shell/lead-hunter/radar` | **Intern** (noindex, **dynamisch/geschützt**): Lead Hunter **Schweiz-Radar** – statische, stilisierte Kanton-Radar-Karte aus erfassten Opportunities (Stat-Karten, Kanton-SVG-Pins, Top-Regionen, Service-/Quellen-/Typ-Chips), nur Lesen (Session-Client/RLS). Kein Kartenanbieter/Google/ZEFIX/SIMAP/Geokodierung/externe Abfrage |
| `/app-shell/lead-hunter/sources` | **Intern** (noindex, **dynamisch/geschützt**): Lead Hunter **Quellen-Registry** – kontrollierte, von Menschen freigegebene Lead-Quellen **manuell registrieren** + Liste mit Badges (Aktiv/Inaktiv + Phase) + **„Quelle abarbeiten"** (Execution-Cockpit) + **„Opportunity vorbereiten"** je Quelle (Server-Action, Session-Client/RLS, Settings-Domäne `can_write_settings` = owner/admin). Kein Scraping/Google/ZEFIX/SIMAP/Auto-Abfrage |
| `/app-shell/lead-hunter/sources/[id]/execute` | **Intern** (noindex, **dynamisch/geschützt**): **Controlled Source Execution** – geführtes Quellen-Abarbeitungs-Cockpit (Ziel → Recherchieren → Qualifizieren → Erfassen → Kontakt vorbereiten). Recherche-Links sind **vom Nutzer geöffnete** `<a href>`-Links (Google/Maps/ZEFIX/Website), Capture-Button → vorausgefülltes Formular (nicht-PII source/service/region), generische Kopier-Entwürfe. Nur Lesen (Session-Client/RLS). **Kein `fetch`/Scraping/API/Versand/Buchung**, keine neue Migration |
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
  auth/tenant-data.ts  # RLS-gescopte Tenant-Reads (Firma, Zähler, Leads, Follow-ups [inkl. leadId], Offerten, Jobs, Opportunities/getProspects, Quellen/getLeadSources + getLeadSourceById, bexio-Übergaben/getInvoiceHandoffJobs, getCompanySettings, getAutopilotPolicy, getDiscoveryRuns) via Session-Client
  discovery/google-places.ts # SERVER-ONLY: offizielle Google-Places-Text-Search (env-gated GOOGLE_PLACES_API_KEY, lazy/Build-sicher, Timeout, Trefferlimit, kein Scraping, Key nie geloggt/im Client) (v0.5.2)
  discovery/adapters.ts # Signal-Quellen-Adapter: SignalAdapter-Interface + Registry; google_places + baugesuche live, SIMAP/ZEFIX = Stubs (phase 'planned'/not_configured); offizielle Quellen + GO erforderlich (v0.5.3, baugesuche live v0.5.4)
  discovery/baugesuche-zh.ts # SERVER-ONLY: Baugesuche-Zürich-Adapter – offizieller Open-Data-Endpoint (env BAUGESUCHE_ZH_SIGNAL_URL, kein hardcodierter Endpoint), CSV (dependency-freier Parser, ;/,-Delimiter/Quotes/Caps) + JSON/GeoJSON → RawSignal, defensives Feld-Mapping, unsupported_schema-Diagnose (Spaltennamen), Timing exakt-nur-mit-Quelldatum; kein Scraping/HTML/PDF/Headless, Timeout/Limit, Key nie geloggt (v0.5.4, CSV v0.5.4.1)
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
  app-shell/AppShellNav.tsx # persistente App-Navigation über die ganze Umsatz-Kette (Client, usePathname, aktiver Status) (v0.4.3, Autopilot ergänzt v0.5.0)
  app-shell/AutopilotCard.tsx # „Nächste Schritte für Umsatz" (reine Helper-Ableitung aus CeoKpis; optionaler ctaHref zum Revenue Autopilot) (v0.4.3/v0.5.0)
  app-shell/autopilot.ts  # reiner Helper: priorisierte Umsatz-Aktionen aus CeoKpis (keine externe API/Versand/Scraping/Buchung) (v0.4.3)
  app-shell/ChainStepper.tsx # Umsatz-Kette als geordnete Stationen über die RLS-Zähler (v0.4.3)
  app-shell/EmptyState.tsx # geteilter Premium-Empty-State (Icon/Titel/Beschreibung/CTA) (v0.4.3)
  revenue-autopilot/source-queue.ts # reine Funktion: Source Execution Queue + sourceTaskFor (aktive lead_sources → Ziel/Recherche-Keyword/Service/Links), kein Lookup/Scraping/API (v0.5.0, erweitert v0.5.1)
  revenue-autopilot/outreach.ts # reine Funktion: Schweizerdeutsche Outreach-Entwürfe (E-Mail/WhatsApp/Telefon-Skript/Follow-up), nur Text, kein Versand (v0.5.0)
  revenue-autopilot/appointment.ts # reine Funktion: Termin-Entwürfe (Vorschlag/Bestätigung, Platzhalter-Zeitfenster), kein Kalender/keine Buchung (v0.5.0)
  revenue-autopilot/DraftChannels.tsx # Client: Kopier-Only Mehrkanal-Entwurfsansicht (Kanalwechsel + „Kopieren"; nur Clipboard, kein Netzwerk) (v0.5.0)
  revenue-autopilot/ResearchTools.tsx # Client: Suchbegriff/Region-Inputs → vom Nutzer geöffnete Such-Links (Google/Maps/ZEFIX/Website) + Capture-CTA (nicht-PII source/service/region); kein fetch/Scraping/API/Server-Sammeln (v0.5.1)
  revenue-autopilot/policy.ts # reine Autopilot Rules Engine: Lead-Kategorien + Safe-Mode-Toggles + Provider-Status → Policy-Verdikte (Cold-Outreach/Auto-Buchung hart gesperrt); keine Aktion, nur Entscheidung (v0.5.2)
  revenue-autopilot/SafeModeBanner.tsx # „Autopilot Safe-Mode aktiv"-Banner (Cold-Outreach/Anrufe/stille Buchung/Scraping gesperrt) (v0.5.2)
  revenue-autopilot/signals.ts # reine Opportunity Signal Engine: Kandidat → Signal (Typ/Warum-jetzt/Service/Konfidenz/Timing-Güte exakt-geschätzt-unbekannt/nächste Aktion), buildSignalsFromProspects + signalFromRawSignal (Adapter-Signale, v0.5.4) + categoryForSignalType; keine KI/API/Netzwerk, ehrliches Timing (v0.5.3)

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
      sources/       # Quellen-Registry: page.tsx (Liste, Badges, Übersicht, owner/admin-Formular, „Quelle abarbeiten" + „Opportunity vorbereiten") + actions.ts (createLeadSource; Settings-Domäne) (v0.3.9)
        [id]/execute/ # Controlled Source Execution: page.tsx (geführtes Cockpit – Ziel/Recherche-Links/Qualifizierung/Erfassen/Kontakt-Entwürfe; nur Lesen, kein fetch/Scraping/Versand/Buchung) (v0.5.1)
      radar/         # Schweiz-Radar: page.tsx (Stat-Karten, Kanton-Radar-SVG, Top-Regionen, Service-/Quellen-/Typ-Chips; nur Lesen, kein Kartenanbieter) (v0.3.11)
    offers/          # Offer Engine: page.tsx (Liste, Positionen, Summen, Status, PDF, Versand-Entwurf, Auftrag erstellen) + actions.ts (createOffer, updateOfferStatus, addOfferItem)
      [id]/pdf/route.ts  # geschützter Route-Handler: Offerten-PDF (Session-Client/RLS, sonst 404) (v0.3.3)
    jobs/            # Aufträge: page.tsx (Liste, Status, Termin) + actions.ts (createJobFromOffer, updateJobStatus, updateJobSchedule; Ops-Domäne)
      [id]/ics/route.ts  # geschützter Route-Handler: Termin-.ics (Session-Client/RLS, sonst 404) (v0.3.5)
    bexio/           # bexio-Übergabe: page.tsx (Bereit/Vorbereitet/Verrechnet, kopierbare Zusammenfassung) + actions.ts (prepareHandoff, markHandoffInvoiced; Manage-Domäne, keine echte bexio-API) (v0.3.12)
    ceo/             # CEO-Briefing: page.tsx (read-only KPI-Überblick, Geld-Wirkung, Trichter, Achtung-Karten; Autopilot-Nächste-Aktionen + Link) (v0.3.13/v0.5.0)
    revenue-autopilot/ # Revenue Autopilot: page.tsx (Command Center – Umsatz-Aktionen, Automatik-Sektion, Source Execution Queue, heisse Chancen + Outreach-Entwürfe, Leads + Termin-Entwürfe, Offerten-Nachfass; nur Lesen/Session-Client/RLS, kein Versand/keine Buchung/kein Scraping) (v0.5.0)
      discovery/ # Automatische Discovery: page.tsx (Lauf/Kandidaten/Audit) + RunDiscoveryForm.tsx (Client) + actions.ts (runDiscovery; owner/admin, offizielle Places-API, Dedupe, optional kalte Prospects, audit_logs) (v0.5.2)
      policy/    # Autopilot-Richtlinien: page.tsx (Policy-Matrix/Hard-Blocked/Provider/Toggles) + PolicyToggles.tsx (Client) + actions.ts (updateAutopilotPolicy; owner/admin, company_settings.settings jsonb) (v0.5.2)
      signals/   # Opportunity Signals: page.tsx (Signal-Karten + Quellen-Bereitschaft + live Baugesuche-Sektion bei Konfiguration) + CreateSignalOpportunityButton.tsx (Client, „Als Opportunity erstellen" via bestehende createOpportunity-Aktion); nur Lesen, kein Auto-Versand/Buchung (v0.5.3, Baugesuche v0.5.4)
  api/autopilot/discovery-cron/ # route.ts: vorbereiteter, secret-gated, standardmässig deaktivierter Cron (404 ohne CRON_SECRET, keine Writes/Discovery) (v0.5.3)
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
  production-restore-test-github-actions.md # Low-Cost-Restore-Test via manuellem GitHub-Actions-Workflow (.github/workflows/production-restore-test.yml): Dump→throwaway-Postgres→Verify, kein neues Projekt/keine lokalen Tools/kein Prod-Overwrite/kein Artefakt/keine Secrets; nur public-Schema (Limitation dokumentiert) (v0.4.2-prep)
  clean24-controlled-production-start.md # Kontrollierter Produktionsstart: LIMITED GO (nur Inhaber-Nutzung via UI), Restore-Test aufgeschoben/Risiko akzeptiert, kein SQL-Import/kein breiter Rollout/keine Kunden-PII, Entscheidungs-Record (v0.4.2)
  clean24-revenue-autopilot-roadmap.md # Revenue-Autopilot-Roadmap: Source Execution Queue, Discovery/Outreach/Follow-up/Termin-Assistenten, Human-Approval-Regeln, Legal-Guardrails, freigegebene Quellen, gated Gmail/Calendar/Google/ZEFIX/SIMAP-Pfade (v0.4.3)
  clean24-revenue-autopilot-foundation.md # Revenue-Autopilot-Fundament: was v0.5.0 hinzufügt, was manuell bleibt, Human-Approval-Durchsetzung, Guardrails, tägliche Clean24-Nutzung, gated nächste Phase (v0.5.0; VERIFIED-Abschnitt v0.5.0.1)
  clean24-revenue-autopilot-results.md # Ergebnis: Revenue Autopilot in Produktion verifiziert (Route lädt, Autopilot-Nav aktiv, Seite/Guarded-Hinweis/Karte gerendert, keine echten Kundendaten) (v0.5.0.1)
  clean24-controlled-source-execution.md # Controlled Source Execution: geführtes Cockpit (/sources/[id]/execute), Ziel/Recherche-Links (vom Nutzer geöffnet, kein fetch/Scraping)/Qualifizierung/Erfassen (nicht-PII)/Kontakt-Entwürfe, warum kein Scraping/Versand, real-data nur über UI, gated nächste Phase (v0.5.1; VERIFIED v0.5.1.1)
  clean24-controlled-source-execution-results.md # Ergebnis: Controlled Source Execution in Produktion verifiziert (Cockpit/Worklist, Recherche-Links = eigene Suche, Capture nicht-PII, „Quelle aktiv", kein Auto-Versand/Buchung, keine echten Kundendaten) (v0.5.1.1)
  clean24-automatic-discovery-autopilot-rules.md # Automatic Discovery + Autopilot Rules: Lead-Kategorien, Policy-Matrix, Hard-Blocks (Cold-Outreach/Auto-Anruf/stille Buchung/Scraping), offizielle Places-API (env-gated/owner-initiiert/kein Cron), Auto-Erstellung kalter Kandidaten, Message-/Termin-Architektur (kein Versand/Buchung), Audit, gated Provider-Phase (v0.5.2)
  clean24-opportunity-signal-engine.md # Opportunity Signal Engine „Warum jetzt?": Signal-Modell (Typ/Warum-jetzt/Service/Konfidenz/Timing exakt-geschätzt-unbekannt/nächste Aktion), Klassifizierung + Service-Vorschlag, inferred-vs-exakt, Adapter-Architektur (Baugesuche/SIMAP/ZEFIX-Stubs), vorbereiteter deaktivierter Cron, Promote via bestehende Aktion, Migration 007 dokumentiert-nicht-angewendet, gated Quell-Phase (v0.5.3; VERIFIED v0.5.3.1)
  clean24-opportunity-signal-engine-results.md # Ergebnis: Opportunity Signal Engine in Produktion verifiziert (Signal-Karten aus Prospects: Quelle/Typ/Warum-jetzt/Service/Konfidenz/Timing-Güte/nächste Aktion, Cross-Links, ehrliches Timing, kein Auto-Outreach/Scraping, keine echten Kundendaten) (v0.5.3.1)
  clean24-baugesuche-signal-adapter.md # Baugesuche-Zürich-Adapter: erste reale Signal-Quelle (env-gated/owner-konfiguriert, kein geratener Endpoint), **offizieller CSV-Feed** (KTZH_…csv) + JSON, dependency-freier CSV-Parser, defensives Feld-Mapping, unsupported_schema-Diagnose, exakt-nur-mit-Quelldatum (kein erfundenes Fertigstellungsdatum), kein Scraping/HTML/PDF, „Als Opportunity erstellen", Migration 007 dokumentiert-nicht-angewendet (v0.5.4; CSV v0.5.4.1)
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
| [production-restore-test-github-actions.md](docs/production-restore-test-github-actions.md) | Low-Cost-Restore-Test via manuellem GitHub-Actions-Workflow [`.github/workflows/production-restore-test.yml`]: read-only `pg_dump` der Produktion → throwaway-Postgres auf dem Runner → Verify (20 Tabellen/RLS/8 Helfer/Policies/audit-append-only + Clean24-Zähler services=8/sources=4/owners=1/Kundendaten=0); **kein neues Supabase-Projekt, keine lokalen Tools, kein Prod-Overwrite, kein Artefakt-Upload, keine Secrets im Log**; Setup (Session-Pooler-Secret `KLARSA_PROD_DB_URL`), Limitation (nur `public`-Schema; Supabase-managed via PITR), real-data weiter **NO-GO** (v0.4.2-prep) |
| [clean24-controlled-production-start.md](docs/clean24-controlled-production-start.md) | Kontrollierter Clean24-Produktionsstart: **LIMITED GO** (nur Inhaber-Nutzung **über die App-UI**), Restore-Test **aufgeschoben** + Backup-/Restore-**Risiko akzeptiert**; **kein SQL-/Bulk-Import, kein Service-Role, keine Kunden-PII in Repo/Docs**, kein breiter Rollout/kein externes Onboarding; „limited & monitored", Restore-Test vor Skalierung; Entscheidungs-Record (v0.4.2) |
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

**v0.4.2-prep (erledigt)** – **Manueller GitHub-Actions-Restore-Test-Workflow**:
`.github/workflows/production-restore-test.yml` (nur `workflow_dispatch`,
`permissions: contents: read`) macht einen **read-only** `pg_dump` des Produktions-
`public`-Schemas (Secret `KLARSA_PROD_DB_URL` = Supabase Session Pooler), restored
in einen **throwaway**-Postgres-Service auf dem Runner (Stubs für
`auth.uid()`/`auth.users`/Rollen; Daten via `--disable-triggers`) und verifiziert
Schema/RLS/8 Helfer/Policies/`audit_logs`-append-only **plus** Clean24-Zähler
(services=8, sources=4, owners=1, leads/offers/jobs/prospects=0). **Kein neues
Supabase-Projekt, keine lokalen Tools, kein Prod-Overwrite, kein Artefakt-Upload,
keine Secrets im Log; Dump nur in `/tmp`, am Ende gelöscht.** Validiert das
**App-eigene `public`-Schema** (Supabase-managed via Supabase-Backups/PITR –
ehrlich dokumentiert). Doku `docs/production-restore-test-github-actions.md`,
Runbook ergänzt. **Restore-Test damit vorbereitet, aber noch nicht bestanden.**

**v0.4.2 (erledigt)** – **Kontrollierter Clean24-Produktionsstart (LIMITED GO).**
Der Inhaber startet die kontrollierte, begrenzte echte Nutzung und erfasst die
**eigenen** Clean24-Daten **nur über die Produktions-App-UI**; der **Restore-Test
ist aufgeschoben**, das Backup-/Restore-**Risiko bewusst akzeptiert**. Gate: vollem
NO-GO → **LIMITED GO** (nur Inhaber-Nutzung). **Kein breiter Rollout, kein externes
Onboarding, kein SQL-/Bulk-Import, kein Service-Role, keine Kunden-PII in
Repo/Docs/Prompts.** Nur Governance/Docs (kein Code/Feature/echte Daten). Doku
`docs/clean24-controlled-production-start.md`; `production-readiness-gate.md` +
`real-data-gate-policy.md` aktualisiert.

**Nächster Schritt** – **erste echte Clean24-Daten über die UI** erfassen
(**limited & monitored**, kleine Menge, RLS prüfen), kein SQL-Import. **Vor
breiterem Rollout / vollem GO** nachzuholen: den vorbereiteten **Restore-Test**
ausführen (Workflow + `KLARSA_PROD_DB_URL`-Secret) und in
`docs/clean24-backup-restore-test-results.md` festhalten, PITR + täglichen externen
Export bestätigen, dann Inhaber-**GO**. *Offer-PDF-Politur ist aufgeschoben, bis
der Nutzer sie anfordert.*

## Empfohlener nächster Schritt

Der **Architektur-Plan (B)** läuft: v0.2.0 (Docs/Typen) bis v0.4.1/.1.1 (Clean24
Production-Tenant-Bootstrap + Produktions-Login verifiziert) und **v0.4.2
(kontrollierter Produktionsstart, LIMITED GO)** sind erledigt – der **Inhaber**
nutzt jetzt **kontrolliert** die Produktion (eigene Daten **nur via UI**), breiter
Rollout bleibt **gesperrt**. Parallel bleibt **A) Deploy / Visual Review** der
Verkaufs-Demo möglich (Live-Deployment, echtes Postfach `info@klarsa.ch`,
PDF-Export, Erklärvideo).

**Empfehlung:** als Nächstes **erste echte Clean24-Daten über die UI** (limited &
monitored, kein SQL-Import); **vor breiterem Rollout** den **Restore-Test**
ausführen (Workflow aus v0.4.2-prep) + PITR/Export bestätigen → vollem
**Inhaber-GO**.
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
