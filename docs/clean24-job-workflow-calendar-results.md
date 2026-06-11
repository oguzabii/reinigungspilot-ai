# Klarsa Core — Job Workflow & Calendar Staging Results

> **Status: VERIFIED (job workflow + calendar on staging).** A logged-in Clean24
> user changed a job's status, set its schedule, and downloaded the `.ics` from
> **`/app-shell/jobs`** — end-to-end through the **session client (RLS)**, ops
> domain. **No calendar sync, no email, no bexio, no real customer data, no
> committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-11 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, change job status, set `scheduled_for`, download the `.ics` at `/app-shell/jobs` |
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
| `/app-shell/jobs` opened after login (protected route) | ✅ |
| Job **status** update (e.g. Geplant → Bestätigt) | ✅ succeeded, persists on reload |
| **Scheduling** (`scheduled_for`) set via the date/time control | ✅ succeeded |
| **`.ics` download** (`/app-shell/jobs/[id]/ics`) | ✅ succeeded, imports as a calendar event |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (ops domain) |
| Real customer data used | ✅ none — staging test entries only |

This confirms the v0.3.5 ops-domain writes (`update jobs … set status` and
`update jobs … set scheduled_for`) work through the **anon/session client** with
Row Level Security enforcing the tenant (`company_id`) and the role
(`can_write_ops`: owner/admin/ops). The service-role client was not used. The
`.ics` route returned a valid iCalendar file (generated dependency-free in
`lib/ics/job-ics.ts`), scoped to the active tenant's own job, which imported
into a calendar app — confirming the **calendar foundation** (import-by-file,
**no sync**) works end-to-end.

## Safety confirmations

- ✅ **No real customer data.** The job, status and schedule were staging test
  data typed by the user; no real customers, dates or amounts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No calendar sync, no email, no external intake.** The `.ics` is a
  download the user imports manually — no Google/Outlook/CalDAV sync, no email,
  no bexio handover, no third-party API, no upload.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Jobs module inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- Job status transitions and scheduling write correctly via RLS (ops domain).
- The dependency-free `.ics` generator is sound on real data and the protected
  route is tenant-scoped (only the active tenant's job is emitted).
- The defense-in-depth scoping (active-tenant + soft-delete filter) does not
  block the legitimate single-tenant path.

## What this does NOT mean

- No real calendar **sync** exists — the `.ics` is import-by-file only.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.6 — Lead Hunter / Opportunity Radar foundation** (manual opportunity
capture, RLS-scoped). Still manual, no real customer data. **Offer PDF polish
remains deferred** until requested.
