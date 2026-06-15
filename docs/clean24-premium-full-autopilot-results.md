# Klarsa Core — Premium Full Autopilot Production Results

> **Status: VERIFIED (Premium Full Autopilot foundation in production).** The
> Clean24 owner deployed v0.5.6 to production and confirmed the **production UI
> changed successfully / as expected**: the package-aware Autopilot positioning
> is visible, the Premium **"Klarsa hat für Sie gearbeitet"** panel and the
> Revenue Autopilot **lanes** render, and the calmer **automation-status**
> language replaced the old manual-warning copy. Everything stays **read-only /
> copy-only** through the **session client (RLS)** — **no real sending, no real
> booking, no real bexio API, no scraping, no real customer data, no committed
> credentials.** `providers.send` and `providers.calendar` remain **not
> connected**.

| | |
| --- | --- |
| **Version** | v0.5.6.1 (verification of v0.5.6) |
| **Date** | 2026-06-15 |
| **Environment** | Production — `https://klarsa.vercel.app` + `klarsa-production` (Supabase) |
| **Tenant** | Clean24 (production owner tenant; premium / `internal_founder`) |
| **Method** | Manual: owner deploys v0.5.6, logs in to production, reviews `/app-shell` and `/app-shell/revenue-autopilot` |
| **Reported by** | Owner |

> **Provenance / honesty note:** recorded from the **owner's manual production
> test**, as reported. It was **not** independently observed or automated from
> this repository, and this repo holds **no connection** to the production project
> (no URL secrets, keys, or service-role access). Production env values live only
> in Vercel/Supabase, never in the repo. This document records a reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| v0.5.6 deployed to production | ✅ reported |
| Production UI changed successfully / as expected | ✅ reported |
| Package-aware **Autopilot positioning** visible (Starter „Digitales Offert-Büro" / Pro „Geführter Sales Autopilot" / Premium „Vollautomatisches AI-Verkaufsbüro") | ✅ reported |
| Premium **"Klarsa hat für Sie gearbeitet"** panel renders for the Premium tenant (status rows + next appointment) | ✅ reported |
| Status rows show **real data with honest "Kanal nicht verbunden" zero-states** (no fabricated numbers) | ✅ reported |
| Revenue Autopilot **lanes** visible (Discovery · Erstkontakt · Nachfassen · Offerten · Termine · Abschluss/bexio) with clear states | ✅ reported |
| Calmer **automation-status** language visible (replaces manual-warning style) | ✅ reported |
| Discovery shows calm operational status (no raw 403/errors) | ✅ reported |
| Read-only / copy-only / session-client / RLS path | ✅ confirmed (no writes) |
| **No real sending** (no email/WhatsApp) | ✅ none |
| **No real booking** (no calendar event) | ✅ none |
| **No real bexio API** | ✅ none |
| `providers.send` / `providers.calendar` **still not connected** | ✅ both `false` |
| Real customer data entered during verification | ✅ none |
| Real customer data committed to repo/docs | ✅ none |

The cockpit and Revenue Autopilot are composed **in memory** from the tenant's
existing RLS-filtered reads (`getCompanySummary` incl. `billingStatus`,
`getProspects`/`getLeads`/`getOffers`/`getJobs`/`getInvoiceHandoffJobs`/
`getFollowups`/`getDiscoveryRuns`) plus the pure helpers
(`components/app-shell/autopilot-tier.ts`, `premium-digest.ts`,
`components/revenue-autopilot/lanes.ts`). The pages perform **no writes** and use
the **anon/session client** only (never service-role).

## Safety confirmations

- ✅ **No real sending.** No SMTP/Gmail/Resend/WhatsApp API; `providers.send` is
  hard-`false`. Outreach/follow-up/offer texts are copy-only drafts.
- ✅ **No real booking.** No calendar API; `providers.calendar` is hard-`false`.
  Appointment lanes show prepared/ready states only.
- ✅ **No real bexio API.** The handoff path is the existing manual queue; no
  token, no network call to bexio.
- ✅ **No scraping.** Discovery uses only the official, approved API/feed on owner
  trigger; a 403/quota shows a calm operational status, never a raw error.
- ✅ **No spam / no hidden mass outreach.** Cold-outreach stays hard-blocked; full
  automation is visible, bounded, package-gated and logged.
- ✅ **No real customer data.** No real companies, projects or contacts were
  entered during this verification, and none were committed to the repo/docs.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No new migration.** Built on existing data + one additive read
  (`CompanySummary.billingStatus`); 001–006 untouched, `verification/004`
  untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Premium Full Autopilot
  inside Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The v0.5.6 **package-aware Premium Full Autopilot foundation** is live in
  **production** after login for the Clean24 tenant, and the production UI changed
  as expected.
- The Premium **"Klarsa hat für Sie gearbeitet"** panel, the package positioning
  and the Revenue Autopilot **lanes** render, with calmer automation-status copy.
- Numbers come from real RLS-scoped data; missing channels show honest
  "Kanal nicht verbunden" states rather than fabricated figures.

## What this does NOT mean

- **No real automation runs yet.** This is the **foundation**: positioning, the
  Premium digest/panel and the lanes are visible, but Klarsa sends nothing, books
  nothing and calls no bexio API. `providers.send` and `providers.calendar` are
  **not connected**.
- The **controlled Clean24 production start stays LIMITED GO** — real Clean24 data
  may enter **only via the production app UI** (no SQL/bulk import, no
  service-role, no customer PII in repo/docs). The **restore test remains
  deferred** and broad rollout stays blocked until it passes and the owner signs a
  full GO (see [`production-readiness-gate.md`](./production-readiness-gate.md) and
  [`clean24-controlled-production-start.md`](./clean24-controlled-production-start.md)).

## Next step

**v0.5.7 — first real automation lane, likely the Approved Discovery Autopilot:**
let Premium run the **approved** discovery source automatically once it is
connected and owner-approved (visible, bounded, logged), switching that lane from
"Bereit für Premium" to "Aktiv". Any send/calendar lane stays foundation-only
until a compliant channel (sender identity + opt-out, or calendar) is configured;
**Cold-Outreach stays blocked** (see
[`clean24-premium-full-autopilot.md`](./clean24-premium-full-autopilot.md)).
