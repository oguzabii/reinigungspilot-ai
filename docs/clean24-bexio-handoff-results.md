# Klarsa Core — bexio Handoff Staging Results

> **Status: VERIFIED (bexio handoff on staging).** A logged-in Clean24
> owner/admin opened `/app-shell/bexio`, a completed job appeared in the handoff
> queue, **"Für bexio vorbereiten"** created a manual `bexio_handoffs` row, the
> copyable Swiss-German invoice summary rendered, and **"Als verrechnet
> markieren"** completed it — all through the **session client (RLS, manage
> domain)**. **No real bexio API, no OAuth, no token, no network call, no sync,
> no automatic invoice creation, no real customer data, no committed
> credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-12 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, open bexio handoff from the App-Shell card, prepare a completed job, copy the summary, mark invoiced |
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
| `/app-shell/bexio` opens after login (protected route) | ✅ |
| The `/app-shell` **bexio Übergabe** card links to `/app-shell/bexio` | ✅ |
| A **completed** job appears under **Bereit zur Übergabe** | ✅ |
| **"Für bexio vorbereiten"** creates/updates a manual `bexio_handoffs` row (status `queued`) | ✅ |
| **Copyable** Swiss-German invoice summary renders (customer / service / net-VAT-gross / reference) | ✅ |
| **"Als verrechnet markieren"** flips the handoff to `completed` | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Owner/admin manage-domain / session-client / RLS write path | ✅ confirmed (`can_manage_company`) |
| Real bexio API / OAuth / token / network call / sync / auto-invoice | ✅ none |
| Real customer data used | ✅ none — staging test entries only |

The handoff write goes through the **anon/session client** with Row Level
Security enforcing the tenant (`company_id`) and the **manage** role
(`can_manage_company`: owner/admin only — distinct from the sales/ops domains).
The service-role client was not used. `connection_id` stays `NULL` (no real bexio
connection), nothing is transmitted, and no invoice is created anywhere — the
summary is copied by a human and entered into bexio by hand. The status moving
`queued → completed` closes the manual loop.

## Safety confirmations

- ✅ **No real bexio API.** No OAuth, token, `secret_ref`, sync, webhook, or
  network call; `connection_id` left `NULL`. `bexio_connections` untouched.
- ✅ **No automatic invoice creation.** Nothing is created in bexio; the summary
  is pasted by a human.
- ✅ **No real customer data.** The job/offer/lead were staging test data; no
  real companies, projects or contacts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **Manage domain enforced.** Writes require owner/admin via RLS; a
  sales/ops/readonly user's write is rejected by the DB.
- ✅ **No new migration.** Uses the existing `bexio_handoffs` table; 001–006
  untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the bexio handoff inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The protected handoff route and the App-Shell card work after login for an
  owner/admin of the Clean24 tenant.
- The manual lifecycle works on a live Postgres: completed job → prepare
  (`queued`) → copyable summary → mark invoiced (`completed`), all RLS-scoped via
  the session client (manage domain).
- No bexio API, token, network call, or automatic invoicing is involved.

## What this does NOT mean

- **No real bexio integration exists.** The queue only stages invoice/customer
  data for *manual* entry — there is no API, OAuth, token, sync, or invoice
  creation, and no email.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.13 — CEO / KPI dashboard foundation** (a read-only overview across the
chain: leads, opportunities, offers, jobs, handoffs). Still manual, RLS-scoped,
no real customer data. **Offer PDF polish remains deferred** until requested.
