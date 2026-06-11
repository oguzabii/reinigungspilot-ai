# Klarsa Core — Job from Accepted Offer Staging Results

> **Status: VERIFIED (job creation on staging).** A logged-in Clean24 user
> created a job from an **accepted** offer and saw it in the **`/app-shell/jobs`**
> list — end-to-end through the **session client (RLS)**. Migration `005` (the
> duplicate-job guard) was applied. **No calendar, no email, no bexio, no real
> customer data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-11 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: apply migration `005`, log in, accept an offer → "Auftrag erstellen", review `/app-shell/jobs` |
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
| Migration `005` applied (partial unique index: one live job per offer) | ✅ |
| Accepted offer → **"Auftrag erstellen"** | ✅ succeeded |
| `/app-shell/jobs` opened after login (protected route) | ✅ |
| Created job appears in the Jobs list (status, customer, source offer, value) | ✅ |
| Duplicate-job prevention | ✅ no duplicate created (button → "Auftrag erstellt") |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (ops domain) |
| Real customer data used | ✅ none — staging test entries only |

This extends the verified write surface to the Jobs/ops domain: `insert into
jobs` from an accepted offer, through the **anon/session client** with Row Level
Security enforcing the tenant (`company_id`) and the role (job insert =
`can_write_ops`: owner/admin/ops). The service-role client was not used. The job
was seeded from the offer (`offer_id` link, lead, title, gross value), appeared
in the RLS-filtered `/app-shell/jobs` list (and the `/app-shell` Jobs count),
and the offer's button switched to "Auftrag erstellt" — so no second job can be
created from the same offer.

Migration `005` applied cleanly on staging, confirming the duplicate guard
(partial unique index on `jobs(company_id, offer_id) where offer_id is not null
and deleted_at is null`) is compatible with the live schema and existing data.

## Safety confirmations

- ✅ **No real customer data.** The offer and job were staging test data typed
  by the user; no real customers, references or amounts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No calendar, no email, no external intake.** The job was created
  manually; `scheduled_for` stays null. No calendar event, no email, no bexio
  handover, no third-party API, no upload.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Jobs module inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- Creating a job from an accepted offer works via RLS (ops domain), with the
  job linked back to its source offer.
- Migration `005` is sound on real Supabase — the partial unique index applies
  without breaking existing data and prevents a second live job per offer.
- The defense-in-depth scoping (active-tenant + accepted-status check, plus the
  duplicate pre-check) does not block the legitimate single-tenant path.

## What this does NOT mean

- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.5 — Job workflow / calendar foundation** (job status transitions,
scheduling via `scheduled_for`). Still manual, RLS-scoped, no real customer
data. **Offer PDF polish is deferred** until requested.
