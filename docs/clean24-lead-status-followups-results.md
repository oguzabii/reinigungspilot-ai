# Klarsa Core — Lead Status & Follow-ups Staging Results

> **Status: VERIFIED (status workflow + follow-ups on staging).** A logged-in
> Clean24 user changed lead statuses and created/listed manual follow-up tasks
> at `/app-shell/leads` — end-to-end through the **session client (RLS)**. **No
> real customer data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-10 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, change a lead's status, create + list follow-ups at `/app-shell/leads` |
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
| `/app-shell/leads` opened after login (protected route) | ✅ |
| Lead **status update** (e.g. new → qualified) | ✅ succeeded, persists on reload |
| Follow-up **create** ("Follow-up erstellen": lead, stage, due date, title) | ✅ succeeded |
| Follow-up **list** shows the task (due-sorted, linked lead, status badge) | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (both writes) |
| Real customer data used | ✅ none — staging test entries only |

This extends the first verified write path (v0.3.0.1, lead create) to the two
v0.3.1 writes: `update leads … set status` and `insert into followup_tasks`,
both through the **anon/session client** with Row Level Security enforcing the
tenant (`company_id`) and the role (leads update = `can_write_sales`;
follow-up insert = `can_write_sales OR can_write_ops`). The service-role client
was not used. Status and follow-up rows appearing in the RLS-filtered lists
(and the `/app-shell` Follow-ups count) close the loop read-side as well.

## Safety confirmations

- ✅ **No real customer data.** Entries are staging test data typed by the user;
  no real leads, contacts, due dates or notes.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No external intake or sending.** Status and follow-ups were entered
  manually — no scraping, no email ingestion/sending, no reminders, no
  third-party APIs, no uploads.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Lead Inbox inside Klarsa
  Core; the separate legacy system remains untouched.

## What this verifies

- The status workflow (whitelist of all nine `lead_status` values, transitions
  not strictly enforced so corrections work) writes correctly via RLS.
- Manual follow-up tasks (`followup_tasks`: stage, due date, channel, note,
  linked lead) create and list correctly via RLS, with the linked lead resolved
  through the embedded `leads(company_name)` query.
- The defense-in-depth scoping (every write `.eq("company_id", activeCompanyId)`
  plus the lead-belongs-to-active-tenant pre-check) does not block the
  legitimate single-tenant path.

## What this does NOT mean

- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).
- The deferred DB hardening is still open: a composite FK
  `followup_tasks(lead_id, company_id) → leads(id, company_id)` (plus
  `unique (id, company_id)` on `leads`) belongs in the next safe migration to
  guarantee at the database level that a follow-up's tenant always matches its
  lead's tenant (today the server-side pre-check narrows, but does not close,
  the TOCTOU window).

## Next step

**v0.3.2 — Offer Draft foundation:** offer drafts linked to leads — still manual,
RLS-scoped, no external integrations, no PDF/sending.
