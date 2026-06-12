# Klarsa Core — Swiss Opportunity Radar Map Staging Results

> **Status: VERIFIED (Swiss radar on staging).** A logged-in Clean24 user opened
> `/app-shell/lead-hunter/radar`, and the stat cards, the stylised canton radar
> SVG, the top-region cards and the service/source/type chips all rendered from
> the existing opportunities — read-only, through the **session client (RLS)**.
> **No map provider, no external tiles, no geocoding, no scraping, no
> auto-search, no API, no real customer data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-12 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, open the radar from Lead Hunter, review stats / SVG / region cards / chips |
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
| `/app-shell/lead-hunter/radar` opens after login (protected route) | ✅ |
| Reached via the **Schweiz-Radar** link card on `/app-shell/lead-hunter` | ✅ |
| **Stat cards** render (Total / Ø Score / High-Score ≥70 / Konvertiert) | ✅ |
| **Stylised canton radar SVG** renders (pins by canton) | ✅ |
| **Top-region cards** render (count + Ø score badge) | ✅ |
| **Source labels** appear where linked through `prospects.source_id` | ✅ |
| **Service-match / source / type chips** render | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Read-only / session-client / RLS path | ✅ confirmed (no writes) |
| Map API / external tiles / geocoding used | ✅ none — stylised local layout |
| Scraping / auto-search used | ✅ none |
| Real customer data used | ✅ none — staging test entries only |

The radar is computed **in memory** from `getProspects(companyId)` (the
RLS-filtered opportunities) — region text is mapped to a canton by the
deterministic offline keyword table in `components/lead-hunter/swiss-radar.ts`,
and the SVG is rendered server-side with no client fetch. The page performs
**no writes** and uses the **anon/session client** only (never service-role). The
source-label chips confirm the v0.3.10 `prospects.source_id` link surfaces in the
visualisation; the service chips reuse the deterministic `scoring.ts` matcher.

## Safety confirmations

- ✅ **No map provider / tiles / geocoding.** The canton layout is a stylised,
  local SVG approximation — no Google Maps, no tile server, no projection, no
  geocoding, **no** network request.
- ✅ **No scraping, no auto-search, no API.** The radar only visualises data the
  tenant already entered by hand.
- ✅ **No real customer data.** The opportunities were staging test data typed by
  the user; no real companies, projects or contacts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **Read-only.** The page has no actions/inserts/updates; reads are RLS-scoped
  to the active tenant.
- ✅ **No new migration.** Built on existing `prospects` data; 001–006 untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Lead Hunter inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The protected radar route and the Lead-Hunter link work after login for the
  Clean24 tenant, read-only through the session client (RLS).
- The full visualisation renders from existing data: stats, canton radar SVG,
  top regions, and service/source/type chips — including the source link from
  v0.3.10.
- No automation, map provider, or external lookup is involved.

## What this does NOT mean

- **No real map and no automated discovery exist.** The radar is a stylised
  visualisation of *manually entered* opportunities — there is no map API, no
  geocoding, no scraping, no web search, and no AI/LLM call.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.12 — bexio handoff foundation** (queue a manual handoff, no real bexio
API) **or a Lead Hunter source execution plan** (how a human works an approved
source into opportunities, step by step, ahead of any automation). Still manual,
RLS-scoped, no real customer data. **Offer PDF polish remains deferred** until
requested.
