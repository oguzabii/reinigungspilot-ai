# Klarsa Core — Lead Inbox Staging Results

> **Status: VERIFIED (Lead Inbox on staging).** A logged-in Clean24 user used the
> protected `/app-shell/leads` route to **manually create and list leads** —
> end-to-end through the **session client (RLS)**. **No real customer data, no
> committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-09 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: apply migration `003`, log in, create + list leads at `/app-shell/leads` |
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
| Migration `003` applied (`leads.notes`) | ✅ |
| `/app-shell/leads` opened after login (protected route) | ✅ |
| Manual lead **create** ("Neuen Lead erfassen") | ✅ succeeded |
| Lead **list** shows the created lead(s) | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed |
| Real customer data used | ✅ none — staging test entries only |

This is the first verified **write** path in Klarsa Core: login → session →
server action → `insert into leads` through the **anon/session client**, with
Row Level Security enforcing both the tenant (`company_id`) and the role
(`can_write_sales`: owner/admin/sales). The service-role client was not used.
The created lead appearing in the RLS-filtered list (and in the `/app-shell`
Lead-Inbox count) closes the loop read-side as well.

## Safety confirmations

- ✅ **No real customer data.** Entries are staging test data typed by the user;
  no real leads, contacts, emails or phone numbers.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No external intake.** Leads were entered manually — no scraping, no email
  ingestion, no Lead Hunter, no third-party APIs, no uploads.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Lead Inbox inside Klarsa
  Core; the separate legacy system remains untouched.

## What this verifies

- Migration `003` is sound on real Supabase (the Notizen field works).
- The protected route guard, tenant context and the **RLS write + read path**
  work end-to-end for the Clean24 founder tenant.

## What this does NOT mean

- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.1 — Lead status workflow + follow-up foundation:** change a lead's status
from the Inbox and create `followup_tasks` — still manual, RLS-scoped, no
external integrations.
