# Klarsa Core — Lead Hunter / Opportunity Radar Staging Results

> **Status: VERIFIED (Opportunity Radar on staging).** A logged-in Clean24 user
> captured an opportunity manually and saw it in the list, with the radar
> overview cards updating — end-to-end through the **session client (RLS)**,
> sales domain. **No scraping, no external source, no email, no real customer
> data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-11 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, capture an opportunity, review the list + radar cards at `/app-shell/lead-hunter` |
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
| Manual **"Opportunity erfassen"** (capture) | ✅ succeeded |
| Opportunity **list** shows the captured opportunity | ✅ |
| **Radar overview** cards update (total, Ø score, actively pursued, type chips) | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (sales domain) |
| Real customer data used | ✅ none — staging test entries only |

This confirms the v0.3.6 manual capture path: `insert into prospects` through
the **anon/session client** with Row Level Security enforcing the tenant
(`company_id`) and the role (`can_write_sales`: owner/admin/sales). The
service-role client was not used. The opportunity appearing in the RLS-filtered
list, and the radar overview aggregates (computed from that list) updating,
closes the loop read-side as well.

## Safety confirmations

- ✅ **No real customer data.** The opportunity was staging test data typed by
  the user; no real companies, projects or contacts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No scraping, no auto-search, no external source.** The opportunity was
  entered by hand — no Google/ZEFIX/SIMAP API, no registries, no feeds, no
  scraping, no email, no upload, no spam.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Lead Hunter inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- Manual opportunity capture and listing work via RLS (sales domain).
- The radar overview aggregates (total, average score, actively pursued,
  per-type counts) compute correctly from the RLS-filtered list.
- The defense-in-depth scoping (active-company `company_id`) does not block the
  legitimate single-tenant path.

## What this does NOT mean

- **No automated discovery exists** — there is no scraping, web search, or
  registry lookup. Capture stays manual until that is explicitly built and
  gated.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.7 — Lead Hunter scoring / service matching** (a richer score + a
structured service-match model) **or a source registry** (`lead_sources`). Still
manual, no real customer data. **Offer PDF polish remains deferred** until
requested.
