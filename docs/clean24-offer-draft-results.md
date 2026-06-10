# Klarsa Core — Offer Draft Staging Results

> **Status: VERIFIED (Offer Engine on staging).** A logged-in Clean24 user
> created and listed manual offer drafts, added line items, and moved offers
> through their status at `/app-shell/offers` — end-to-end through the
> **session client (RLS)**. Migration `004` (deferred F6 hardening) was applied.
> **No real customer data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-10 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: apply migration `004`, log in, create + list offers, add items, change status at `/app-shell/offers` |
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
| Migration `004` applied (unique `leads(id, company_id)` + composite FK) | ✅ |
| `/app-shell/offers` opened after login (protected route) | ✅ |
| Offer draft **create** ("Neue Offerte erstellen") | ✅ succeeded |
| Offer **list** shows the created offer(s) with totals | ✅ |
| Line item **add** (recomputed Netto/MwSt/Brutto) | ✅ succeeded |
| Offer **status** update (e.g. Entwurf → Bereit) | ✅ succeeded, persists on reload |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (all three writes) |
| Real customer data used | ✅ none — staging test entries only |

This extends the verified write surface to the Offer Engine: `insert into
offers`, `insert into offer_items`, and `update offers … set status`, all
through the **anon/session client** with Row Level Security enforcing the
tenant (`company_id`) and the role (offers/offer_items writes =
`can_write_sales`: owner/admin/sales). The service-role client was not used.
Totals were computed server-side; the offer appearing in the RLS-filtered list
(and the `/app-shell` Offer Engine count) closes the loop read-side as well.

Migration `004` applied cleanly on staging, confirming the deferred v0.3.1
review finding **F6** hardening is compatible with the live schema: the
composite FK `followup_tasks(lead_id, company_id) → leads(id, company_id)` and
the `unique (id, company_id)` constraint on `leads` were added without
rejecting any existing rows.

## Safety confirmations

- ✅ **No real customer data.** Entries are staging test data typed by the user;
  no real offers, references, amounts or customers.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No PDF, no sending, no external intake.** Offers were drafted manually —
  no PDF rendering, no email, no bexio handover, no third-party APIs, no uploads.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Offer Engine inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The Offer Engine create / add-item / status-change writes work via RLS, with
  server-computed totals.
- Migration `004` (F6 hardening) is sound on real Supabase — the composite FK
  and unique constraint apply without breaking existing data.
- The defense-in-depth scoping (every write `.eq("company_id", activeCompanyId)`
  plus lead/offer tenant pre-checks) does not block the legitimate
  single-tenant path.

## What this does NOT mean

- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.3 — Offer PDF / Offer sending foundation:** render an offer to PDF and
prepare the sending path — still manual-trigger, RLS-scoped, no real customer
data.
