# Clean24 — Sales-Ready Workflow & Dokumentvorlagen (v0.5.13 → v0.5.17)

Diese Version macht Klarsa für den Clean24-Pilot **abschluss-fähiger**: vom
gewonnenen Auftrag entstehen jetzt **kundenfertige und interne Dokumente** als
PDF — ohne neue Migration, ohne externe Bibliothek, ohne Versand.

## v0.5.17 — Quellen-Verbindungen & Produktionsbereitschaft

Finalisiert die offiziellen, env-gated Quellen (SIMAP, ZEFIX) mit einem ehrlichen
Verbindungs-Status und einem Verbindungstest. **Keine neue Migration, kein
Service-Role, keine Secrets im Repo, keine Scraper/Headless.**

### Verbindungs-Status (ehrlich)

Jede Quelle hat einen klaren Status: **not_configured · access_required ·
configured_not_tested · connected · error.** „Verbunden" wird **nur** nach einem
erfolgreichen, owner-ausgelösten **Verbindungstest** angezeigt – Konfiguration
allein heisst „Konfiguriert", nie „Verbunden". Tests sind zeit-gebunden, geben
nur einen einfachen Status zurück und zeigen **nie** ein Token.

### SIMAP

`lib/discovery/simap.ts`: offizielle SIMAP-API, owner-konfiguriert. Auth wahlweise
**statisches Token** (`SIMAP_API_TOKEN`) **oder** OAuth-Client-Credentials
(`SIMAP_API_CLIENT_ID`/`SIMAP_API_CLIENT_SECRET` + `SIMAP_AUTH_URL`, optional
`SIMAP_SCOPE`) – Token-Tausch zur Laufzeit. `testSimapConnection()` macht einen
gebundenen Test-Request. Treffer werden auf Clean24-relevante Leistungen
gefiltert (Reinigung · Gebäudereinigung · Unterhaltsreinigung · Umzugsreinigung ·
Facility Services · Hauswartung · Baureinigung · Endreinigung · Büroreinigung)
und auf Signale gemappt (Titel · Auftraggeber · Ort · Publikation · Eingabefrist ·
CPV · Quelle). Ohne Zugang: „Zugang erforderlich". **Kein Scraping/Headless.**

### ZEFIX

`lib/discovery/zefix.ts`: offizielle ZEFIX-REST-API. Auth: Bearer-Token **oder**
Basic (`ZEFIX_API_USERNAME`/`ZEFIX_API_PASSWORD`), optional erzwungen via
`ZEFIX_AUTH_MODE` (`token`|`basic`). `testZefixConnection()` macht einen minimalen,
gebundenen Test. **A) Firmenprüfung:** offiziellen Namen/UID/Rechtsform/Sitz
validieren („validiert" / „nicht gefunden" / „Zugang erforderlich"). **B) Neue
Firmen:** nur als begrenzte Suche (kein Bulk-Download, kein Voll-Register-Import);
ohne Zugang „Zugang erforderlich". **Kein Scraping von zefix.ch.**

### Einstellungen → Lead-Quellen

Pro Quelle: Status-Badge, kurze Erklärung und – wo sicher – ein **„Verbindung
testen"**-Button (owner-getriggert, Server-Action, kein Secret im HTML).
Google Places hat keinen Live-Test (Quota-Schonung) und zeigt den Konfig-Status.

### Produktionsbereit?-Checkliste

`/app-shell/settings` (Übersicht) zeigt eine **„Produktionsbereit?"**-Karte:
E-Mail-Versand · Antworten/Reply-Stopp · Google Places · Baugesuche · SIMAP ·
ZEFIX · PDF-Vorlagen · Follow-up-Sequenz · Bereinigung. Einfache Sprache; die
**Umgebungsvariablen-Namen** stehen nur in „Technische Details".

### Lead Radar

SIMAP/ZEFIX zeigen statt blossem „nicht verbunden" jetzt **„Zugang erforderlich"**
+ **„In Einstellungen verbinden"**; konfigurierte Quellen zeigen „Konfiguriert".
Eine Quelle trägt nur bei, wenn sie konfiguriert ist.

### Follow-up-Ehrlichkeit

Die UI ist explizit: **„Automatische Sequenz geplant"**, **„Fällige Follow-ups
manuell senden"** (owner-ausgelöst, Premium + Kanal, gedeckelt, auditiert) und
**Antwort-Stopp manuell** über „Antwort erhalten". Volle automatische
IMAP-Antworterkennung ist **nicht** aktiv und wird nicht behauptet. Der
Cron-Endpunkt ist **Readiness-only** (secret-gated, kein Versand) – echter
Hintergrund-Versand bräuchte einen privilegierten Worker/Service-Role und ist
bewusst nicht enthalten.

### Quellen-Setup (Vercel Production env)

Niemals echte Werte committen — in Vercel → Production env hinterlegen:

- **SIMAP:** `SIMAP_API_BASE_URL` + (`SIMAP_API_TOKEN` **oder**
  `SIMAP_API_CLIENT_ID`/`SIMAP_API_CLIENT_SECRET` + `SIMAP_AUTH_URL` [+ `SIMAP_SCOPE`]).
- **ZEFIX:** `ZEFIX_API_BASE_URL` + (`ZEFIX_API_TOKEN` **oder**
  `ZEFIX_API_USERNAME`/`ZEFIX_API_PASSWORD`) [+ `ZEFIX_AUTH_MODE`].
- **Google Places:** `GOOGLE_PLACES_API_KEY`. **Baugesuche:** `BAUGESUCHE_ZH_SIGNAL_URL`.
- Danach in Einstellungen → Lead-Quellen **„Verbindung testen"**.

### Produktions-QA-Checkliste (v0.5.17)

- Einstellungen → Lead-Quellen: SIMAP/ZEFIX „Verbindung testen" → connected/error
  ehrlich; ohne Zugang „Zugang erforderlich".
- Lead Radar: nicht-verbundene Quellen zeigen „In Einstellungen verbinden".
- Discovery: konfigurierte Quellen tragen bei; Fehler bleiben ruhig.
- Übersicht: „Produktionsbereit?"-Checkliste stimmt; keine Secrets sichtbar.
- `/api/cron/followups` ohne Secret → 404.

**Guardrails v0.5.17:** keine neue Migration, kein Service-Role, keine
Secrets/echten Kundendaten committet, nur offizielle APIs, kein
Scraping/Headless/HTML-Crawling, kein Bulk-/Hintergrund-Versand, keine Buchung,
keine echte bexio-API. **001–007 unverändert; `004` unangetastet.** lint/build
grün.

## v0.5.16 — Usability-Politur, editierbare Offerten, Follow-up-Sequenz

Letzter Politur-Schliff für den täglichen Betrieb. **Keine neue Migration, kein
Service-Role, kein Bulk-/Hintergrund-Versand.**

### Vereinfachter Owner-Flow

Eine gefundene Chance wird ohne Umweg zu Lead → Offerte → Follow-up → Auftrag:

- Auf jeder Kandidaten-Karte (Lead Radar **und** Pipeline): **In Pipeline
  übernehmen** (promotet den Lead und springt in die Pipeline, auf den Lead
  fokussiert) und **Offerte vorbereiten** (promotet bei Bedarf und öffnet das
  Offertenformular **mit vorausgefülltem Lead** — kein Zwang durch die Lead
  Inbox).
- Pipeline-Deep-Links: `?focus=lead:<id>` (Lead nach oben + hervorgehoben +
  Scroll) und `?focus=followups`.

### Editierbare Offerten

`/app-shell/offers/[id]/edit`: Kunde (Name/Adresse/E-Mail/Telefon), Leistung,
Reinigungs-/Übergabedatum, **erste Position (Bezeichnung + Preis)**, MwSt,
Gültig-bis und Notizen ändern. Die Totale werden neu berechnet; **das PDF wird
immer aus den aktuellen DB-Daten erzeugt**, eine Änderung wirkt sofort. Bei
einer bereits **gesendeten** Offerte erscheint der Hinweis: „Änderungen
aktualisieren die PDF-Vorlage. Bereits versendete E-Mails bleiben unverändert."
Buttons: **Offerte bearbeiten · PDF Vorschau · PDF neu öffnen · Zurück zur
Pipeline**. Mehrfach-Positionen/Mengen sind bewusst für später strukturiert
(`offer_items` hat keine Mengen-Spalte — kein Migrationszwang).

### Automatische Follow-up-Sequenz

Owner-Klick **„Automatische Follow-up-Sequenz starten"** legt drei geplante
Schritte an (Schema-konform, keine Migration): **+24 h · +48 h · +5 Tage**. Die
Lead-Karte zeigt **aktiv · aktueller Schritt · nächste fällige Erinnerung**.
Stoppen: **„Sequenz stoppen"** (manuell) oder **„Antwort erhalten"**
(Reply-Stop). **Versand ist getrennt und gated:** nur wenn ein Kanal
konfiguriert ist (Premium), **owner-ausgelöst** über „Fällige jetzt senden",
**pro Lauf gedeckelt (5)**, jeder Versand auditiert (keine Empfänger-PII). Kein
Bulk, kein verstecktes Senden.

**Reply-Stop:** Heute zuverlässig **manuell** (Button „Antwort erhalten"
stoppt die Sequenz). Vollautomatische IMAP-Antworterkennung bleibt vorbereitet
(IMAP-Fundament), benötigt aber IMAP-Polling-Zugang und ist bewusst nicht
aktiviert — es wird **nichts** vorgetäuscht.

**Cron:** `/api/cron/followups` ist vorbereitet und **secret-gated**
(`FOLLOWUP_CRON_SECRET`): ohne Secret 404, mit Secret nur Readiness-JSON,
**kein Versand** (mandantenübergreifender Hintergrund-Versand bräuchte
Service-Role — bewusst nicht genutzt). Vercel-Cron: optionalen `vercel.json`
-Eintrag auf `/api/cron/followups` zeigen lassen.

### Einstellungen (Kategorien)

`/app-shell/settings` ist jetzt **kategorisiert** (Karten): **Allgemein ·
Vertrieb & Automationen · E-Mail & Antworten · Dokumente · Lead-Quellen ·
Bereinigung** — keine lange „System-Health"-Liste mehr. Pro Kategorie nur die
relevanten Status/Optionen. **Keine Secrets.**

### CEO / Finanzen

Die Perioden-Kennzahlen sind jetzt **klickbare Aktionskarten** (Hover, klare
CTA): Gewonnen → Offerten · Offene Offerten → Pipeline · Abgeschlossen →
Aufträge · bexio bereit → Übergabe · Follow-ups offen → Pipeline-Follow-up-Fokus.

### Lead Radar

Aktiv-Gefühl: **„Klarsa sucht aktiv"**, **letzte Suche**, aktive Quellen,
**nächste Quelle**, prominenter **„Neue Leads suchen"**, und **„In Pipeline
übernehmen"** direkt auf den Kandidaten.

### Offerte-PDF-Treue

Vektor-Logo (Blatt + „Clean" + grünes „24" + Swoosh + Tagline; kein Asset
nötig), engere Anlehnung an die Referenz bei Abständen/Typografie, Tabellen-
Spaltentrenner und **fett gesetzte Footer-Labels**. Aus echten Daten; manuelle
und Lead-Offerten nutzen dieselbe Vorlage.

### Produktions-QA-Checkliste (v0.5.16)

- Offerte erstellen → PDF prüfen (Logo, Adresse, Total inkl. Rundung, Footer).
- Offerte bearbeiten → PDF ändert sich entsprechend.
- Kandidat → „Offerte vorbereiten" → Formular mit Lead vorausgefüllt.
- Kandidat → „In Pipeline übernehmen" → Pipeline auf Lead fokussiert.
- Follow-up-Sequenz starten → Schritte/Timing sichtbar; stoppen/„Antwort
  erhalten" funktioniert; Versand nur bei verbundenem Kanal (Premium).
- Einstellungen → Kategorien öffnen/Status korrekt; keine Secrets.
- CEO-Karten klickbar → richtige Zielseiten.

**Guardrails v0.5.16:** keine neue Migration, kein Service-Role, keine
Secrets/echten Kundendaten committet, kein Scraping, kein Bulk-/Hintergrund-
Versand, keine Buchung, keine echte bexio-API. **001–007 unverändert; `004`
unangetastet.** lint/build grün. Referenz-PDFs werden **nicht** committet.

## v0.5.15 — Clean24-Dokumentvorlagen, Lead-Radar-Politur, SIMAP/ZEFIX-Fundament

Kundenseitige Politur und die exakten Clean24-Vorlagen. **Reine UI + Helfer +
zwei neue env-gated Quellen-Adapter, keine neue Migration, kein Versand,
kein Service-Role.**

### Exakte Clean24-PDF-Vorlagen

Alle drei Dokumente sind jetzt an den echten Clean24-Vorlagen ausgerichtet und
werden aus **echten Offerten-/Kundendaten** erzeugt (nicht hartkodiert):

- **Offerte** (`/app-shell/offers/[id]/pdf`, neu aufgebaut in `lib/pdf/offer-pdf.ts`):
  Logo/Kopf, Kunden-Nr./Datum/UID, Absenderzeile, Kundenadresse, Titel
  „Offerte OF-…", Anrede, Service-Einleitung, Positionstabelle
  (#/Beschreibung/Anzahl/Preis/Total), Totale (exkl. MwSt., MwSt. %,
  **Rundungsdifferenz** mit Schweizer 5-Rappen-Rundung, Total inkl. MwSt.),
  Schlusstext, Signatur (Geschäftsführer) und vollständige Firmenfusszeile.
- **Auftragsbestätigung** + **Partner-Einsatzbestätigung**: modernes Karten-
  Design (Navy-Kopf mit vier Mini-Karten, KUNDE/OBJEKT/TERMINE/HINWEIS-Karten,
  Leistungsumfang-Checkliste mit grünen Häkchen, Preisübersicht bzw. Ausführung,
  Abgabegarantie-Karte; Partner zusätzlich „Wichtige Hinweise").
- Technik: geteilter, dependency-freier PDF-Kern (`lib/pdf/pdf-core.ts`, erweitert
  um abgerundete Rechtecke + Kreise), Karten-Layout-Helfer (`lib/pdf/clean24-doc.ts`),
  Firmen-Briefkopf (`lib/pdf/company-profile.ts`, pro Mandant via
  `company_settings.settings.company_profile` überschreibbar — **keine Secrets,
  nur öffentlicher Briefkopf**). Helvetica/WinAnsi, einseitig A4, env-freier Build.

### Lead Radar (kundenfreundlich)

`/app-shell/lead-hunter/radar` führt jetzt mit **„Klarsa sucht neue Leads für
Clean24"**, einfachen **Lead-Quellen-Statuskarten** (Google Places · Baugesuche
Zürich · SIMAP · ZEFIX: Aktiv / Nicht verbunden), den **neuen Chancen**, der
nächsten Aktion und drei Buttons (**Neue Leads suchen · Lead manuell erfassen ·
Lead-Quellen verwalten**). **Keine** rohen Schema-/Spaltendiagnosen, keine
langen Adapter-Fehler, kein „Opportunity Signals" als Hauptsprache — technische
Details liegen hinter **„Technische Details anzeigen"**.

### Lead-Quellen statt „Quellen-Registry"

`/app-shell/lead-hunter/sources` heisst **Lead-Quellen** und ist die
sekundäre/Experten-Seite (vom Lead Radar verlinkt). Manuelle Kanäle zeigen
**„Bereit"** statt irreführend „Aktiv"; Buttons heissen **„Quelle prüfen"** und
**„Lead erfassen"**. Jede Quelle hat einen **Archivieren**-Button (soft, via
`deleted_at` — Prospects behalten ihre `source_id`, nichts bricht).

### Läufe ausblenden

Auf der Discovery-Seite kann der Inhaber einzelne **Läufe ausblenden** (kleines
X) oder **„Alle Läufe ausblenden"**. **UI-Ebene only**: die `audit_logs` werden
**nicht** verändert; der Filter liegt in `company_settings.settings`
(`discoveryRunsHidden`) — keine Migration, kein Eingriff in den Audit-Trail.

### Baugesuche-Mapping-Fix

Der Adapter (`lib/discovery/baugesuche-zh.ts`) erkennt jetzt die echten Feld-
namen des offiziellen ZH-OGD-Feeds: `projectDescription` → Titel,
`municipality_name` → Gemeinde, `publicationDate` → Datum,
`projectLocation_address_*` → Adresse, `buildingContractor`/`projectFramer` →
Bauherrschafts-Kontext. Ohne brauchbare Zeilen erscheint die einfache Meldung
**„Keine passenden Bau-Signale gefunden."** statt einem Schema-Dump.

### SIMAP & ZEFIX (offizielle, env-gated Adapter)

- **SIMAP Ausschreibungen** (`lib/discovery/simap.ts`): öffentliche
  Ausschreibungen passend zu Reinigung/Facility, **nur offizielle API**
  (`SIMAP_API_BASE_URL` + `SIMAP_API_TOKEN`), kein Scraping, Caps + Timeout,
  gefiltert auf relevante Services. Ohne Zugang: „Zugang erforderlich".
- **ZEFIX Firmenprüfung** (`lib/discovery/zefix.ts`): Firmen-Validierung +
  begrenzte Firmensignale, **nur offizielle REST-API** (`ZEFIX_API_BASE_URL` +
  Token oder User/Passwort), kein Bulk-Harvesting/Scraping. Ohne Zugang:
  „Zugang erforderlich". Beide werden in der Registry nur als **aktiv** geführt,
  wenn wirklich konfiguriert.

### Einstellungen/Bereitschaft

`/app-shell/settings` zeigt zusätzlich **SIMAP** und **ZEFIX** (konfiguriert /
Zugang erforderlich) neben Google Places und Baugesuche — nur Status, **keine
Schlüssel**.

**Guardrails v0.5.15:** keine neue Migration, kein Service-Role, keine
Secrets/echten Kundendaten committet, kein Scraping/HTML/PDF/Headless, kein
Bulk-/Hintergrund-Versand, keine Buchung, keine echte bexio-API. **001–007
unverändert; `004` unangetastet.** lint/build grün. Referenz-PDFs werden **nicht**
committet.

## v0.5.14 — Einfacher Verkaufs-Workflow (abgeschlossen)

v0.5.14 vervollständigt die in v0.5.13 dokumentierten Punkte und lässt Klarsa
wie **ein einfaches AI-Verkaufsbüro** wirken – der Inhaber sieht die nächste
beste Aktion, nicht viele technische Module. **Reine UI + ein additiver
Schreibpfad (manuelle Offerte), keine neue Migration, kein Versand.**

- **Finale Navigation (6 Bereiche):** **Cockpit · Lead Radar · Pipeline ·
  Aufträge · CEO / Finanzen · Einstellungen.** Technische Modulnamen (Revenue
  Autopilot, Lead Hunter, Quellen, Offerten, bexio) sind nicht mehr in der
  Hauptnavigation; sie bleiben über In-Page-Links erreichbar (kein 404).
- **Action-first Cockpit:** eine **„Nächste beste Aktion“**-Karte (geld-nächst
  zuerst), ein **kompakter Status-Streifen** (Lead gefunden · Kontakt gefunden ·
  Offerte bereit · Follow-up geplant · Auftrag gewonnen · bexio bereit) und
  **ein** einfacher Verkaufs-Ablauf – keine Wand aus KPI-Karten.
- **Pipeline (`/app-shell/pipeline`):** eine Fläche
  **Lead → Kontakt → Offerte → Follow-up → Auftrag**. Bewertung ist **in der
  Karte eingebettet** (kein eigener „Bewerten“-Tab). Aktionen je Karte: Kontakt
  automatisch finden, E-Mail senden, in Pipeline übernehmen, Offerte erstellen,
  Follow-up planen, Auftrag erstellen, Archivieren – alle über **bestehende**
  Aktionen/Helfer.
- **Manuelle Offerte (`/app-shell/offers/new`):** zwei Modi – **Aus Lead
  übernehmen** und **Manuell erfassen** (Kunde, Adresse, E-Mail, Telefon,
  Leistung/Objekt, Grösse, Reinigungs-/Übergabedatum, Position, Preis, Notizen).
  Der manuell erfasste Kunde wird als Lead gespeichert und bleibt im System –
  damit PDF, Auftrag und Übergabe ihn auflösen. **Wiederverwendet das bestehende
  Offer-/Lead-Schema – keine Migration.**
- **Dokumente im Workflow sichtbar:** Offerte-PDF auf Pipeline-Lead-Karten;
  **Auftragsbestätigung** und **Partner-Einsatzbestätigung** auf Pipeline-Job-
  Karten (zusätzlich zur Aufträge-Seite). Die v0.5.13-PDF-Routen sind
  unverändert – nur verlinkt.
- **CEO / Finanzen mit Perioden:** einfache Umschalter **Heute · Diese Woche ·
  Dieser Monat** (URL-Param `?period=`) mit fünf Kennzahlen: gewonnener Umsatz,
  offene Offerten, abgeschlossene Aufträge, bexio bereit, offene Follow-ups.
  Kein Chart-Framework.
- **Einstellungen/Bereitschaft (`/app-shell/settings`):** Status (verbunden /
  nicht verbunden) für E-Mail-Versand (SMTP/Resend), Antwort-Eingang (IMAP),
  Google Places, Baugesuche Zürich, Dokumentvorlagen; Paket-Stufe; Link zu
  Cleanup/Reset. **Keine Schlüssel/Secrets sichtbar.**
- **Einfache Business-Sprache** statt Modul-Jargon; **Archivieren** pro Karte
  bleibt über `ArchiveButton`/`archiveEntity`.

Neue Routen v0.5.14: `/app-shell/pipeline`, `/app-shell/offers/new`,
`/app-shell/settings`. Neue Helfer: `components/app-shell/sales-flow.ts`
(`salesStageStats` + `nextBestAction`), `components/ceo/period.ts`. Neue UI:
`NextBestAction`, `StatusStrip`, `ManualOfferForm`. Neue Aktion:
`createManualOffer` (Session-Client/RLS). **001–007 unverändert; `004`
unangetastet.** lint/build grün.

## Verkaufs-Ablauf (Ziel)

```
Lead finden → bewerten → Kontakt finden → Offerte → Follow-up
→ Auftrag → Auftragsbestätigung / Partner-Einsatzbestätigung
→ bexio vorbereiten → CEO sieht Umsatz
```

Der Inhaber soll die nächste sinnvolle Aktion sehen und mit wenigen Klicks zum
Geld kommen. Die bestehenden Bereiche (Cockpit, Chancen, Kunden, Offerten,
Aufträge, CEO/Finanzen) bleiben erhalten; diese Version ergänzt den
**Abschluss-Teil** (Dokumente) und glättet die Sprache.

## Dokumentvorlagen (neu in v0.5.13)

Alle Dokumente sind **mandantenbezogen**: Firmenname/Branding kommen aus der
aktiven Firma (RLS-gescopt). Für den Clean24-Tenant entsteht so ein
Clean24-Dokument — **keine echten Firmen-/Kundendaten im Repo**.

Technik: hand-gerollter, **dependency-freier PDF-1.4-Builder**
(`lib/pdf/pdf-core.ts`, geteilt) — Helvetica/Helvetica-Bold (eingebaute Fonts),
WinAnsi/latin1 für ä ö ü ß, einseitig A4, **kein externes Asset, kein Font-Embed,
env-freier Build**. Reads laufen über den **Session-Client (RLS)**, nie
Service-Role. Routen sind `force-dynamic` und liefern nur einen Download.

### A) Offerte — `GET /app-shell/offers/[id]/pdf` (bestehend)
Kundenofferte mit Kopf, Referenz/Datum/Status/Gültig-bis, Empfänger, Positionen,
Zwischensumme, **MwSt 8.1 %**, Total (Brutto), Fusszeile.

### B) Auftragsbestätigung — `GET /app-shell/jobs/[id]/confirmation/pdf` (neu)
Kundendokument nach gewonnener Offerte. Enthält:
- Firmenkopf + Dokumentlabel
- Referenz (`AB-…`), Datum, Quell-Offerte
- Kunde (Name, Kontakt, Adresse)
- Eckdaten: Reinigungsdatum, Übergabe, Objekt/Adresse, Leistung
- Vereinbarter Umfang (Positionen der Quell-Offerte)
- Preisübersicht (Netto, MwSt, vereinbarter Preis)
- **Abgabegarantie**
- Fusszeile (kein automatischer Versand)

### C) Partner-Einsatzbestätigung — `GET /app-shell/jobs/[id]/partner/pdf` (neu)
**Internes** Dokument für den ausführenden Partner/Team. Enthält:
- Kopf + „INTERN – nicht an den Kunden weitergeben"
- Objekt/Ansprechpartner, Reinigungsdatum, Übergabe, Adresse, Leistung,
  Partner/Team, Status
- Auszuführender Umfang (ohne Kundenpreis als Headline)
- **Feste Partner-Hinweise:** Kundenkommunikation läuft über die Firma · keine
  eigenen Angebote an den Kunden · bei Unklarheiten zuerst die Firma
  kontaktieren · Vorher-/Nachher-Fotos empfohlen

Beide neuen Dokumente werden aus **bestehenden Daten** gebaut (Auftrag + Quell-
Offerte als Umfang + Kunde) über `getJobDocumentData()` — **keine neue
Migration, keine neuen Spalten**. „Übergabe" nutzt die Uhrzeit des Termins, sonst
„nach Vereinbarung".

## Offerte → Auftrag

Aufträge entstehen aus gewonnenen Offerten (bestehender Fluss). Auf
**`/app-shell/jobs`** zeigt jede Auftragskarte jetzt:
- Status & Termin pflegen, Termin als **.ics**
- **Auftragsbestätigung (PDF)** und **Partner-Einsatzbestätigung (PDF)** als
  Download
- **Archivieren** pro Auftrag (soft, `deleted_at`)

## Archivieren / Löschen

Unverändert aus v0.5.11: `ArchiveButton` + `archiveEntity` archivieren einzelne
Einträge **soft** (Leads/Chancen/Offerten/Aufträge/Follow-ups; Follow-ups via
Status `skipped`). Kein Hard-Delete. CEO-Cleanup/Reset unter
`/app-shell/ceo/cleanup` bleibt.

## CEO / Finanzen

`/app-shell/ceo` bleibt die Geld-/KPI-Übersicht (Umsatz-Wirkung, Trichter,
letzte 7 Tage). Der Nav-Eintrag heisst neu **„CEO / Finanzen"**. Erweiterte
Perioden (heute/Woche/Monat/Vormonate) sind als nächster Schritt vorgesehen.

## Sprache

Technische Begriffe (RLS, Session-Client, Safe Mode, „kein Versand", „keine
Integration", „manual only") sind in der Inhaber-UI nicht mehr sichtbar (bereits
ab v0.5.11; in v0.5.13 zusätzlich der Restbestand auf `/workspace` geglättet).

## Setup / Bereitschaft (heute nötig)

- **SMTP** für echten Einzelversand (Premium): `SMTP_HOST/PORT/SECURE/USER/PASSWORD/FROM`
- **IMAP** als Eingang-Fundament: `IMAP_*` (vorbereitet, liest noch nicht)
- **Google Places** Discovery: `GOOGLE_PLACES_API_KEY`
- **Baugesuche Zürich**: `BAUGESUCHE_ZH_SIGNAL_URL`
- **SIMAP** (öffentliche Ausschreibungen): `SIMAP_API_BASE_URL` + `SIMAP_API_TOKEN`
  (offizielle API; ohne Zugang „Zugang erforderlich")
- **ZEFIX** (Firmenprüfung): `ZEFIX_API_BASE_URL` + `ZEFIX_API_TOKEN` oder
  `ZEFIX_API_USERNAME`/`ZEFIX_API_PASSWORD` (offizielle REST-API; ohne Zugang
  „Zugang erforderlich")
- **bexio**: manuelle Übergabe-Warteschlange (keine echte bexio-API)

Alle Platzhalter bleiben leer im Repo. Kein Service-Role, keine Secrets.

## In v0.5.14 erledigt (vormals „nächster Schritt")

Die in v0.5.13 dokumentierten offenen Punkte sind jetzt umgesetzt:

- ✅ **Pipeline-Seite** (`/app-shell/pipeline`) als eine Hauptfläche
  Lead → Kontakt → Offerte → Follow-up → Auftrag, Bewertung in der Karte
- ✅ **Manuelle Offerte/Kunde erfassen** (`/app-shell/offers/new` → Lead/Kunde
  wird gespeichert)
- ✅ **Cockpit „Nächste beste Aktion"** als einzelne Aktionskarte
- ✅ **CEO/Finanzen-Perioden** (Heute/Woche/Monat)
- ✅ **Einstellungen/Bereitschaft-Seite** (`/app-shell/settings`)

## Nächster Schritt: Produktions-QA / Sales-Launch

Den fertigen Workflow in Produktion am echten Clean24-Tenant durchspielen
(Lead → Pipeline → Offerte/PDF → Auftrag → Auftragsbestätigung/Partner-Einsatz →
bexio → CEO sieht Umsatz), Perioden und Einstellungen prüfen, dann die
Sales-Launch-Checkliste.

**Guardrails:** keine neue Migration, kein Service-Role, keine Secrets/echten
Kundendaten, kein Scraping/Bulk/Hintergrund-Versand/Buchung, keine echte
bexio-API. **001–007 unverändert; `004` unangetastet.** lint/build grün.
