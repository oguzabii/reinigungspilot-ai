# Clean24 — Sales-Ready Workflow & Dokumentvorlagen (v0.5.13 → v0.5.14)

Diese Version macht Klarsa für den Clean24-Pilot **abschluss-fähiger**: vom
gewonnenen Auftrag entstehen jetzt **kundenfertige und interne Dokumente** als
PDF — ohne neue Migration, ohne externe Bibliothek, ohne Versand.

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
