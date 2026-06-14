# Clean24 Baugesuche Zürich Signal Adapter (v0.5.4 · CSV support v0.5.4.1)

> Status: **adapter implemented, `not_configured` by default** (v0.5.4); **official
> CSV feed supported** (v0.5.4.1). Extends the Opportunity Signal Engine
> (`docs/clean24-opportunity-signal-engine.md`).
> Guardrail level: **maximum** — first real external signal source; official feed
> only (CSV or JSON), owner-configured, no scraping, no fabricated dates.

## 0. v0.5.4.1 — official CSV feed

The validated official Kanton Zürich dataset ("Baugesuche im Kanton Zürich") is a
**CSV download**. The adapter now supports **CSV in addition to JSON**:

- Configure it via the env var **`BAUGESUCHE_ZH_SIGNAL_URL`** (server-only). The
  validated official CSV URL is, for example:
  `https://daten.statistik.zh.ch/ogd/daten/ressourcen/KTZH_00002982_00006183.csv`
- The adapter **auto-detects** CSV by the response `content-type` (contains `csv`)
  or a `.csv` URL ending; otherwise it parses JSON.
- CSV is parsed **server-side**, dependency-free: delimiter auto-detected
  (`;` or `,`), quoted values with `""` escapes and embedded newlines, CRLF.
- **Caps:** at most ~2000 data rows scanned, a 4 MB text guard, the 8 s request
  timeout, and at most 10 signals returned (newest source date first).
- If the schema is not recognised (no title/Bauvorhaben field), the adapter
  returns **`unsupported_schema`** and the Signals page shows the **detected
  column names** as a safe diagnostic (column names only — never row values or
  secrets) so the owner can verify the field mapping.

**No scraping, no HTML parsing, no PDF parsing, no headless browser** — only the
official CSV/JSON body is read.

## 1. What v0.5.4 adds

The first **real** official signal-source adapter: **Baugesuche Zürich**
(`lib/discovery/baugesuche-zh.ts`). It turns official building-permit /
construction-project records into opportunity signals
(*"this project suggests cleaning potential — Baureinigung, Fensterreinigung,
Endreinigung, Hauswartung"*) with a why-now reason and an honest timing güte.

The adapter is **fully implemented and runnable**, but it is **`not_configured`
by default**: it runs only when the owner sets `BAUGESUCHE_ZH_SIGNAL_URL` to a
**validated official** open-data endpoint.

## 2. What source is used

**Owner-configured, official JSON open data only.** We deliberately do **not**
hardcode or guess an endpoint (the coding environment cannot verify a specific
URL, its schema, or its terms of service). The owner points the adapter at a
*validated* official source via env:

- `BAUGESUCHE_ZH_SIGNAL_URL` — the official endpoint (required to activate)
- `BAUGESUCHE_ZH_API_KEY` — optional bearer token, if the source requires one

Candidate official sources the owner can validate (examples, **not** asserted as
working endpoints here):

- **opendata.swiss** — Kanton Zürich / Stadt Zürich building / project datasets
- **Kanton Zürich** geo/open-data (GIS / OGC API Features / WFS → GeoJSON)
- **Stadt Zürich Open Data** (`data.stadt-zuerich.ch`) construction datasets

The owner must check that the chosen endpoint is **official, machine-readable
JSON, and its terms of service permit this use** before configuring it.

### Hard source rules
- **Official open-data / API JSON ONLY.**
- **NO** website scraping, **NO** HTML parsing, **NO** PDF parsing, **NO** headless
  browser, **NO** random-website fetching.
- Hard result cap (10), request timeout (8 s), key never logged / never to client.

## 3. Are there exact dates? Is timing inferred?

- A record's **source date** (e.g. Eingangs-/Publikations-/Entscheid­datum) — when
  present — is treated as **exact** and labelled as **what it is**: a *Baugesuch
  date*, **not** a completion date (e.g. *"Baugesuch-Datum 2026-05-12 (exakt).
  Endreinigung folgt später — Zeitpunkt schätzen."*).
- The cleaning-relevant timing (project completion / Endreinigung) is **never**
  fabricated. When a record has **no** date, timing is **inferred** ("geschätzt").
- So: **exact** = a real source date exists (labelled honestly); otherwise
  **inferred** / **unknown**. We never invent a completion date.

## 4. How Baugesuche signals are generated

1. The adapter fetches the configured endpoint (CSV **or** JSON, capped, timed
   out), auto-detecting CSV by content-type / `.csv` URL.
2. It accepts either **CSV** (semicolon/comma, quoted values) or a **documented
   JSON shape**: a GeoJSON `FeatureCollection` (`features[].properties`), a plain
   array of records, or `{ records }` / `{ results }`. Keys are lowercased so the
   same mapping works for both.
3. Per record it reads documented keys defensively (common German aliases):
   `title` (bauvorhaben/vorhaben/beschreibung/projekt/bezeichnung/zweck), `region`
   (gemeinde/ort/municipality/region), `place` (strasse/adresse/lage/standort),
   `type` (art/kategorie/bauart/projekttyp), `date` (publikationsdatum/publikation/
   eingangsdatum/datum/entscheiddatum), `url` (url/link). Records without a title
   are skipped; if nothing maps, the run is `unsupported_schema` with the detected
   column names surfaced safely.
4. Each record → `RawSignal` (`signalType: "construction"`, suggested services,
   timing). The pure engine (`signals.ts → signalFromRawSignal`) adds the why-now
   framing, a deterministic confidence and the timing güte.

## 5. Service-potential mapping

From the project text (canonical Clean24 vocabulary):

- **Neubau / Umbau / Sanierung** → Bauendreinigung, Fensterreinigung, Hauswartung
- **Mehrfamilienhaus / Wohnbau** → Umzugsreinigung, Fensterreinigung,
  Treppenhausreinigung, Hauswartung
- **Gewerbe / Büro** → Büroreinigung, Fensterreinigung, Hauswartung

(*"Baureinigung"/"Endreinigung"* map to the canonical **Bauendreinigung**;
*"Unterhaltsreinigung"* maps to **Hauswartung/Büroreinigung**.)

## 6. UI

`/app-shell/revenue-autopilot/signals`:

- **Source-readiness** panel shows **Baugesuche Zürich** as **live** — *Aktiv*
  when configured, *Nicht konfiguriert* otherwise (with the official-endpoint
  explanation).
- When configured, a **"Bau-Signale · Baugesuche Zürich (live)"** section renders
  the signal cards. Each card shows **source, project/title, location/region,
  why now, suggested services, confidence, timing güte, next action**, a **"Quelle
  öffnen"** link (if the record has a URL), and a **"Als Opportunity erstellen"**
  action.
- The Revenue Autopilot shows the Baugesuche **readiness** (bereit / nicht
  konfiguriert). The Radar links to the Signals page.

## 7. Promote a signal to opportunity

A Baugesuche signal is **not** yet a prospect, so the card offers **"Als
Opportunity erstellen"**. It submits to the **existing** `createOpportunity`
server action (session client + RLS, sales domain) with the signal context
(title, region, suggested service, why-now + source + timing). **No automatic cold
outreach, no sending, no booking** — the human clicks; the prospect is created and
can then be worked in the Lead Hunter.

## 8. Data model — no migration

Runtime adapter signals are **sufficient** for v0.5.4: when configured, signals
are fetched + rendered at request time (capped/timed). **No migration is added.**
Persisting Baugesuche signals (dedup, status, survive reloads) becomes worthwhile
once a validated source is live and used daily — that is the documented additive
**migration 007 (`opportunity_signals`)** step, applied **only** then.

## 9. What is NOT implemented

- No specific hardcoded endpoint (owner-configured, validated source only).
- No PDF/HTML/scraping ingestion of any kind.
- No persistence of Baugesuche signals yet (runtime only) → migration 007 later.
- No automatic outreach/booking from signals; no cron run (the prepared cron stays
  disabled — see the signal-engine doc).

## 10. Hard guardrails (reaffirmed)

- **No service-role** in app routes/actions; session client + RLS only.
- **No secrets/keys in the repo** (`BAUGESUCHE_ZH_SIGNAL_URL` / `_API_KEY` are
  empty placeholders); never logged, never to the client.
- **No customer data/PII in repo/docs**; no SQL seed/import; **no fake data, no
  fabricated completion dates**.
- **No uncontrolled scraping, no spam, no automatic cold outreach/calls, no silent
  booking, no real bexio API.**
- **Old Clean24 Lead Autopilot** untouched.
