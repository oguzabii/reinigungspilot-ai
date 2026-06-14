# Klarsa Core — Opportunity Signal Engine Production Results

> **Status: VERIFIED (Opportunity Signal Engine in production).** The Clean24
> owner logged in to production (`https://klarsa.vercel.app`) and opened
> `/app-shell/revenue-autopilot/signals`. The signal cards rendered from existing
> production candidates/prospects, each showing source, signal type, "Warum
> jetzt?", suggested service(s), confidence, timing window + timing güte, and the
> next action / Lead Hunter link. The page is **read-only** through the **session
> client (RLS)** — **no scraping, no automatic outreach/calls/booking, no
> fabricated exact dates, no real customer data entered.**

| | |
| --- | --- |
| **Version** | v0.5.3.1 (verification of v0.5.3) |
| **Date** | 2026-06-14 |
| **Environment** | Production — `https://klarsa.vercel.app` + `klarsa-production` (Supabase) |
| **Tenant** | Clean24 (production owner tenant) |
| **Method** | Manual: owner logs in, opens Opportunity Signals, reviews the cards + cross-links |
| **Reported by** | Owner |

> **Provenance / honesty note:** recorded from the **owner's manual production
> test**, as reported. It was **not** independently observed or automated from
> this repository, and this repo holds **no connection** to the production project
> (no URL secrets, keys, or service-role access). Production env values live only
> in Vercel/Supabase, never in the repo. This document records a reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| `/app-shell/revenue-autopilot/signals` opens after login (protected route) | ✅ |
| Signal cards render from existing production candidates/prospects | ✅ |
| Card shows **source** | ✅ |
| Card shows **signal type** (Bauprojekt/Verwaltung/Ausschreibung/Neugründung/Betrieb) | ✅ |
| Card shows **"Warum jetzt?"** | ✅ |
| Card shows **suggested service(s)** | ✅ |
| Card shows **confidence** | ✅ |
| Card shows **timing window + timing güte** (exakt/geschätzt/unbekannt) | ✅ |
| Card shows **next action / Lead Hunter link** | ✅ |
| Links to Signals from Revenue Autopilot / Discovery / Radar / Lead Hunter usable | ✅ |
| Inferred/unknown timing honestly labelled (no fabricated exact dates) | ✅ |
| Scraping / automatic outreach / calls / booking | ✅ none |
| Read-only / session-client / RLS path | ✅ confirmed (no writes) |
| Real customer data entered during verification | ✅ none |

The signals are computed **in memory** by the pure engine
(`components/revenue-autopilot/signals.ts`, `buildSignalsFromProspects`) from the
RLS-filtered `prospects` — no AI, no API, no network, no clock. The page performs
**no writes** and uses the **anon/session client** only (never service-role).

## Safety confirmations

- ✅ **Honest timing.** No source provides a date yet, so every signal is labelled
  **Geschätzt (inferred)** or **Unbekannt** — never a fabricated construction
  completion or tender deadline.
- ✅ **Read-only.** No inserts/updates/deletes on the page; reads are RLS-scoped to
  the active tenant. Promotion happens via the existing Lead Hunter flow.
- ✅ **No scraping.** Signals are computed from existing rows; the planned
  Baugesuche/SIMAP/ZEFIX adapters remain **stubs** (`not_configured`, no fetch).
- ✅ **No automatic outreach / calls / booking.** A signal triggers no contact of
  any kind; the only action is opening the Lead Hunter.
- ✅ **No real customer data.** No real companies, projects or contacts were
  entered during this verification.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No new migration.** Computed from existing data; 001–006 untouched,
  `verification/004` untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Opportunity Signal Engine
  inside Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The protected Opportunity Signals route works in **production** after login for
  the Clean24 tenant, read-only through the session client (RLS).
- Signal cards render from real production candidates with the full "why now"
  framing (source, type, why-now, services, confidence, timing güte, next action),
  and the cross-links from Revenue Autopilot / Discovery / Radar / Lead Hunter
  work.
- Timing is honestly labelled inferred/unknown; no exact dates are fabricated; no
  automation (outreach/calls/booking/scraping) is involved.

## What this does NOT mean

- **Exact, source-backed timing is not live yet.** The "why now" intelligence runs
  over **existing candidates**; real Baugesuche/SIMAP/ZEFIX timing needs the first
  **official source adapter** + persisted signals (migration 007) — a separate,
  gated step requiring an explicit owner GO and source validation.
- The **controlled Clean24 production start stays LIMITED GO** — real Clean24 data
  may enter **only via the production app UI** (no SQL/bulk import, no
  service-role, no customer PII in repo/docs). The **restore test remains
  deferred** and broad rollout / external onboarding stays blocked until it passes
  and the owner signs a full GO (see
  [`production-readiness-gate.md`](./production-readiness-gate.md) and
  [`clean24-controlled-production-start.md`](./clean24-controlled-production-start.md)).

## Next step

**Controlled daily production usage** of Discovery + Opportunity Signals via the
app UI. Then, **only on explicit owner GO + source validation**, the first
**official signal source** (Baugesuche/Bauprojekt open data or SIMAP) with
**additive migration 007** (`opportunity_signals`) and real — sometimes exact —
timing; followed by compliant send/calendar providers and an inbound channel (see
[`clean24-opportunity-signal-engine.md`](./clean24-opportunity-signal-engine.md)
and [`clean24-revenue-autopilot-roadmap.md`](./clean24-revenue-autopilot-roadmap.md)).
