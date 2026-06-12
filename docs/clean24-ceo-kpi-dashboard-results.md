# Klarsa Core — CEO / KPI Dashboard Staging Results

> **Status: VERIFIED (CEO-Briefing on staging).** A logged-in Clean24 user
> opened `/app-shell/ceo` (via the CEO-Briefing card on `/app-shell`); the
> money-impact cards, KPI tiles, the funnel
> (Opportunity → Lead → Offerte → Auftrag → bexio), the "Letzte 7 Tage" row and
> the attention cards all rendered from the existing data and linked to the right
> screens — **read-only**, through the **session client (RLS)**. **No writes, no
> AI, no external API, no scraping, no email, no real bexio API, no real customer
> data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-12 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, open the CEO-Briefing from the App-Shell card, review money/KPI/funnel/attention |
| **Reported by** | User |

> **Provenance / honesty note:** recorded from the **user's manual test**, as
> reported. It was **not** independently observed or automated from this
> repository, and this repo holds **no connection** to the staging project (no
> URL, keys, or service-role access). The local `.env.local` (staging values)
> lives only on the user's machine and is git-ignored. This document records a
> reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| `/app-shell/ceo` opens after login (protected route) | ✅ |
| `/app-shell` shows the **CEO-Briefing** link card → `/app-shell/ceo` | ✅ |
| **Money-impact cards** render (open pipeline / accepted offers / completed jobs, CHF) | ✅ |
| **KPI tiles** render (opps/promoted, leads/open, offers/accepted, jobs/completed, handoffs queued/completed) | ✅ |
| **Funnel** Opportunity → Lead → Offerte → Auftrag → bexio renders (with conversion %) | ✅ |
| **"Letzte 7 Tage"** section renders | ✅ |
| **Attention cards** render and link to the right screens | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Read-only / session-client / RLS path | ✅ confirmed (no writes/actions) |
| AI summary / external API / scraping / email / real bexio API | ✅ none |
| Real customer data used | ✅ none — staging test entries only |

The briefing is computed **in memory** by the pure helper
(`components/ceo/kpi.ts`, `computeCeoKpis`) from the RLS-filtered lists
(`getProspects`/`getLeads`/`getOffers`/`getJobs`/`getInvoiceHandoffJobs`/
`getFollowups`) plus a request-time timestamp — no clock inside the helper, no
AI, no network. The page performs **no writes** and uses the **anon/session
client** only (never service-role). The attention cards link to the Offer Engine,
the bexio handoff, the Lead Hunter and the Lead Inbox respectively, closing the
owner-action loop.

## Safety confirmations

- ✅ **Read-only.** No actions, inserts, updates or deletes anywhere on the page;
  reads are RLS-scoped to the active tenant.
- ✅ **No AI.** The KPIs are a deterministic, offline computation; no LLM/AI call,
  no recommendations from external models.
- ✅ **No external integration.** No external API, no scraping, no email, no
  upload, and **no real bexio API** (the handoff figures come from the existing
  `bexio_handoffs` rows, not from bexio).
- ✅ **No real customer data.** All figures derive from staging test entries; no
  real companies, projects or contacts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No new migration.** Built on existing data; 001–006 untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the CEO-Briefing inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The protected CEO-Briefing route and the App-Shell card work after login for
  the Clean24 tenant, read-only through the session client (RLS).
- The full overview renders from existing data across the whole chain (money,
  KPIs, funnel, 7-day activity, attention), with attention cards linking to the
  right screens.
- No writes, automation, AI, or external lookup is involved.

## What this does NOT mean

- **No AI and no automation exist.** The briefing is a deterministic, static view
  of *existing* data — no AI summary, no recommendations, no external feeds.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.4.0 — Clean24 live production readiness** (the security/backup gate:
verified backup/restore, strict staging/production separation, validated
auth/RLS/security — **before** any real customer data). **Offer PDF polish
remains deferred** until requested.
