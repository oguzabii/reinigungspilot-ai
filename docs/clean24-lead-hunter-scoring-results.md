# Klarsa Core — Lead Hunter Scoring & Service Matching Staging Results

> **Status: VERIFIED (scoring + service matching on staging).** A logged-in
> Clean24 user saw the live deterministic analysis, applied the suggestions,
> and captured an opportunity at `/app-shell/lead-hunter` — end-to-end through
> the **session client (RLS)**. **No AI, no API, no scraping, no real customer
> data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-11 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, type signals, watch the analysis, apply suggestions, save + review the list at `/app-shell/lead-hunter` |
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
| `/app-shell/lead-hunter` opened after login (protected route) | ✅ |
| **Live scoring / service matching** updates while typing | ✅ |
| **"Vorschläge übernehmen"** fills reason / next action / score | ✅ |
| Suggested **score / reason / next action** shown | ✅ |
| **Service-Match badges** appear (form + list rows) | ✅ |
| Opportunity **save + list** | ✅ succeeded |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (sales domain) |
| AI / API / scraping used | ✅ none — deterministic, client-side only |
| Real customer data used | ✅ none — staging test entries only |

The analysis is computed **in the browser** by the deterministic helper
(`components/lead-hunter/scoring.ts`) — no network request, no AI, no API. The
save still goes through the **anon/session client** with Row Level Security
enforcing the tenant (`company_id`) and the role (`can_write_sales`:
owner/admin/sales). The service-role client was not used. The captured
opportunity appearing in the RLS-filtered list, with the same Service-Match
badges recomputed deterministically from the stored fields, closes the loop.

## Safety confirmations

- ✅ **No AI, no API, no scraping.** The scoring and service matching are a pure,
  offline, client-side computation; the analysis makes **no** network request.
- ✅ **No real customer data.** The opportunity was staging test data typed by
  the user; no real companies, projects or contacts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **Human in control.** Suggestions only applied on an explicit "übernehmen";
  nothing hidden, no auto-submit, no external discovery, no spam, no email.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Lead Hunter inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The deterministic service matching and score explanation render live and apply
  correctly to the form fields.
- The capture write still works via RLS (sales domain), and the list recomputes
  the same badges from the stored fields.
- No automation or external lookup is involved — the "smarter" radar stays
  manual and offline.

## What this does NOT mean

- **No automated discovery exists.** The analysis only helps assess *manually
  captured* opportunities — there is no scraping, web search, or registry
  lookup, and no AI/LLM call.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.8 — Opportunity → Lead Inbox conversion** (promote a qualified
opportunity into a `leads` row via `promoted_lead_id`). A **source registry**
(`lead_sources`) can follow later. Still manual, RLS-scoped, no real customer
data. **Offer PDF polish remains deferred** until requested.
