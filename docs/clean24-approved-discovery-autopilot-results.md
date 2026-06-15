# Klarsa Core — Approved Discovery Autopilot Production Results

> **Status: VERIFIED (Approved Discovery Autopilot in production).** The Clean24
> owner deployed v0.5.7 and confirmed the **production UI changed as expected**:
> `/app-shell/revenue-autopilot/discovery` opens after login as the **Approved
> Discovery Autopilot** with status, freigegebene Quellen, last run, the
> source-aware run, and the **Gefunden / Neu erstellt / Bereits vorhanden /
> Übersprungen / Fehler** breakdown. Discovery uses **official adapters only**
> (Google Places, Baugesuche Zürich) — **no scraping/HTML/PDF/headless** — and
> **no outreach, no email/WhatsApp, no calendar booking, no bexio API.** Cold
> candidates are created **only** when the `autoCreateColdCandidates` policy is ON,
> through the **session client (RLS)** — never service-role, never as
> leads/customers. **No real customer data committed.**

| | |
| --- | --- |
| **Version** | v0.5.7.1 (verification of v0.5.7) |
| **Date** | 2026-06-15 |
| **Environment** | Production — `https://klarsa.vercel.app` + `klarsa-production` (Supabase) |
| **Tenant** | Clean24 (production owner tenant; premium / `internal_founder`) |
| **Method** | Manual: owner deploys v0.5.7, logs in, opens **Revenue Autopilot → Discovery**, reviews the Approved Discovery Autopilot |
| **Reported by** | Owner |

> **Provenance / honesty note:** recorded from the **owner's manual production
> test**, as reported. It was **not** independently observed or automated from
> this repository, and this repo holds **no connection** to the production project
> (no URL secrets, keys, or service-role access). Production env values
> (`GOOGLE_PLACES_API_KEY`, `BAUGESUCHE_ZH_SIGNAL_URL`) live only in
> Vercel/Supabase, never in the repo. This document records a reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| v0.5.7 deployed to production / UI changed as expected | ✅ reported |
| `/app-shell/revenue-autopilot/discovery` opens after login (protected route) | ✅ reported |
| **Approved Discovery Autopilot** UI visible (Status · Freigegebene Quellen · Letzter Lauf · Lauf starten · Nächste Aktion) | ✅ reported |
| **Source-aware** run works (source picker), or production changed as expected | ✅ reported |
| Official adapter path visible where configured (Google Places / Baugesuche Zürich) | ✅ reported (per configured source) |
| **Preview mode** when `autoCreateColdCandidates` is OFF — results shown, nothing created | ✅ reported |
| **Auto-create** creates cold candidates (prospects) when policy is ON | ✅ reported — where owner tested with a connected source + toggle ON |
| Created candidates appear in **Lead Hunter / Radar** (existing prospects path) | ✅ reported — where tested |
| Dedupe / per-run cap / audit visible (Gefunden · Neu erstellt · Bereits vorhanden · Übersprungen · Fehler; „Letzte Läufe") | ✅ reported |
| **Package gating** (Starter locked / Pro guided / Premium full-auto capable) | ✅ as designed (Clean24 = Premium) |
| Calm provider errors (no raw HTTP codes in UI) | ✅ reported |
| Session-client / RLS path, no writes outside the run insert | ✅ confirmed |
| **No outreach / email / WhatsApp / calendar / bexio API** | ✅ none |
| **No scraping / HTML / PDF / headless** | ✅ none |
| Real customer data entered during verification / committed to repo | ✅ none |

The page reads tenant data RLS-scoped (`getCompanySummary` incl. `tier` +
`billingStatus`, `getAutopilotPolicy`, `getProspects`, `getDiscoveryRuns`) and the
run uses the official adapters (`lib/discovery/google-places.ts`,
`lib/discovery/baugesuche-zh.ts`) + the **session/anon client** only (never
service-role). Auto-create inserts cold `prospects` (`status='raw'`) only when the
policy toggle is ON; every run is written to `audit_logs`
(`entity_type='discovery_run'`).

## Safety confirmations

- ✅ **Discovery only.** No outreach, no email/WhatsApp, no calendar booking, no
  bexio API. Cold candidates are never contacted (cold-outreach hard-blocked).
- ✅ **Official sources only.** Google Places API + official Baugesuche Zürich
  feed; **no scraping, no HTML/PDF parsing, no headless browser**, no arbitrary
  websites.
- ✅ **Policy-gated auto-create.** OFF → preview only (nothing created); ON →
  cold `prospects` via the session client (RLS). Never service-role, never
  leads/customers.
- ✅ **Dedupe + caps + audit.** Name+region dedupe vs existing + in-batch,
  `MAX_CREATE_PER_RUN = 15`, every run logged; clear result breakdown.
- ✅ **Package-gated.** Starter is locked (upgrade state, Offert-Büro stays
  usable); Pro guided; Premium full-auto capable — enforced server-side.
- ✅ **No real customer data.** No real companies/contacts were committed to the
  repo/docs during this verification.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon/service-role key, project ref, API key, password, or JWT.
- ✅ **No new migration.** Additive read only (`DiscoveryRunLog.source`); 001–006
  untouched, `verification/004` untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Approved Discovery
  Autopilot inside Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The Approved Discovery Autopilot is live in **production** after login for the
  Clean24 tenant, and the production UI changed as expected.
- The source-aware run, package gating, policy-gated auto-create, dedupe/caps and
  the result/audit breakdown behave as designed, using official adapters only.
- Created cold candidates surface in Lead Hunter/Radar via the existing prospects
  path (where the owner tested with a connected source + auto-create ON).

## What this does NOT mean

- **No outreach exists.** Discovery produces **cold candidates** only; Klarsa
  contacts no one, sends nothing and books nothing. Send/calendar channels remain
  **not connected**.
- **Auto-create depends on configuration.** It only creates candidates when an
  approved source is connected **and** the owner has turned `autoCreateColdCandidates`
  ON; otherwise the run is preview-only.
- The **controlled Clean24 production start stays LIMITED GO** — real data only via
  the production app UI (no SQL/bulk import, no service-role, no customer PII in
  repo/docs). The **restore test remains deferred** and broad rollout stays blocked
  until it passes and the owner signs a full GO (see
  [`production-readiness-gate.md`](./production-readiness-gate.md) and
  [`clean24-controlled-production-start.md`](./clean24-controlled-production-start.md)).

## Next step

**v0.5.8 — Outreach Autopilot foundation:** the first **compliant send channel**
(Gmail/SMTP/Resend with sender identity + opt-out) and/or **calendar**, to move
the Erstkontakt / Nachfassen / Termine lanes from "Bereit für Premium" to "Aktiv"
— **only for safe categories** (Inbound/Opt-in, existing, approved), with human
approval. **Cold-Outreach stays blocked** (see
[`clean24-approved-discovery-autopilot.md`](./clean24-approved-discovery-autopilot.md)).
