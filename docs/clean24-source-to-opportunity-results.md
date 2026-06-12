# Klarsa Core — Source → Opportunity Workflow Staging Results

> **Status: VERIFIED (Source → Opportunity on staging).** A logged-in Clean24
> user opened the Source Registry, clicked **"Opportunity vorbereiten"** on a
> registered source, landed on the **pre-filled** Lead Hunter form, saved the
> opportunity, and saw it in the list with the **source label** — end-to-end
> through the **session client (RLS)**. **No scraping, no API, no external
> lookup, no real customer data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-11 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Migration** | `006_prospects_source_id.sql` applied; PostgREST schema cache reloaded |
| **Method** | Manual: log in, open the registry, "Opportunity vorbereiten", review the seeded form, save, review the list |
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
| Migration `006` applied on `klarsa-staging` | ✅ |
| PostgREST schema cache reloaded (new column visible) | ✅ |
| `/app-shell/lead-hunter/sources` opened after login | ✅ |
| **"Opportunity vorbereiten"** opens the seeded Lead Hunter form (`?source=<id>`) | ✅ |
| **Source context / banner** appears ("Aus Quelle: …", heading "Opportunity aus Quelle erstellen") | ✅ |
| Form **pre-filled** (Quelle / `source_type` + "Warum interessant" from label + notes) | ✅ |
| Live deterministic analysis still works while typing | ✅ |
| **Opportunity save** (after entering the name) | ✅ succeeded |
| Opportunity row shows **"Quelle: \<source label\>"** (the registered source) | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (sales domain, `can_write_sales`) |
| Scraping / external API / auto-search used | ✅ none — manual workflow only |
| Real customer data used | ✅ none — staging test entries only |

Migration `006` adds the optional `prospects.source_id` (FK to `lead_sources`,
mirroring `leads.source_id`). After applying it on staging, the PostgREST schema
cache was reloaded so the new column + the embedded `lead_sources(label)` join
resolve. The opportunity write still goes through the **anon/session client**
with Row Level Security enforcing the tenant (`company_id`) and the role
(`can_write_sales`); the service-role client was not used. The form was seeded
only from the source the user clicked (loaded RLS-scoped, active tenant), the
human entered the company name and saved, and the stored `source_id` surfaced as
the "Quelle: \<label\>" chip on the list — closing the loop.

## Safety confirmations

- ✅ **No scraping, no API, no auto-search.** Nothing is fetched, scraped or
  queried — Google/Maps, ZEFIX, SIMAP and Handelsregister remain future, gated
  phases that make **no** network request today.
- ✅ **No real customer data.** The source + opportunity were staging test data
  typed by the user; no real companies, projects or contacts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **Human in control.** The form is only pre-filled; the person enters the
  name, reviews, and clicks save. Nothing auto-submits, no external discovery.
- ✅ **Migration is additive.** `006` only adds an optional column + index;
  001–005 untouched; no RLS change; no backfill.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Lead Hunter inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The end-to-end manual workflow works on a live Postgres: registry →
  "Opportunity vorbereiten" → seeded form → save → linked opportunity.
- Migration `006` applies cleanly and the `prospects.source_id` link +
  `lead_sources(label)` embed work via RLS (session client, sales domain).
- The source link is persisted and shown back, with no automation or external
  lookup involved.

## What this does NOT mean

- **No automated discovery exists.** The workflow only helps a human turn an
  *approved* source into a *manually entered* opportunity — there is no
  scraping, web search, or registry lookup, and no AI/LLM call.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.11 — Swiss Opportunity Radar Map foundation** (visualise opportunities by
region/canton on a Swiss map; static/manual, built on the data we already have —
incl. the new source link). Still manual, RLS-scoped, no real customer data.
**Offer PDF polish remains deferred** until requested.
