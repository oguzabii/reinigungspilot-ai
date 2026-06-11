# Klarsa Core — Job Workflow & Calendar Foundation (v0.3.5)

> **Status: FOUNDATION (staging).** Extends **`/app-shell/jobs`** with a manual
> **status workflow** and **scheduling** (`scheduled_for`), plus a protected
> **`.ics` download** so a scheduled job can be imported into the user's own
> calendar. All writes go through the **session client (RLS)** — jobs are the
> **ops domain** (owner/admin/ops) — never the service-role client. **No
> calendar sync, no Google/Outlook API, no email, no bexio, no external
> integration, no real customer data. No new migration** (uses existing
> columns).

Related: [`clean24-job-from-offer-foundation.md`](./clean24-job-from-offer-foundation.md),
[`clean24-offer-pdf-foundation.md`](./clean24-offer-pdf-foundation.md),
[`security-architecture.md`](./security-architecture.md),
[`data-model.md`](./data-model.md).

## What it does

- **Status workflow** (`updateJobStatus`): a per-job select in canonical flow
  order — `planned · confirmed · in_progress · completed · cancelled ·
  archived`. Transitions are **not** strictly enforced (corrections stay
  possible). Written via the session client; jobs are the ops domain, so a
  sales-only user is rejected with a clear "erfordert Ops, Admin oder Owner".
- **Scheduling** (`updateJobSchedule`): a per-job `datetime-local` input sets
  `scheduled_for`. The **browser** converts the chosen local time to a real
  instant (`scheduled_iso`), so the server timezone never reinterprets
  wall-clock input. "**Termin setzen**" sets it; "**Entfernen**" clears it. An
  empty submit errors instead of silently wiping the date.
- **Calendar foundation — `.ics` download** at **`GET /app-shell/jobs/[id]/ics`**
  (`force-dynamic`, protected): generates an iCalendar VEVENT for the job's
  scheduled time. The user downloads the file and imports it into their own
  calendar. **This is import-by-file only — there is no sync.**
- The list shows status, **scheduled date/time (UTC)**, customer, source offer
  and value.

### Uses the existing schema (migration 001) — no new migration

| Feature | Column | Note |
| --- | --- | --- |
| Status | `jobs.status` | `job_status` enum (existing) |
| Schedule | `jobs.scheduled_for` | `timestamptz` (existing) |
| Location (in the .ics) | `jobs.location` | `text` (existing) |

## The .ics file (no dependency, no asset)

`lib/ics/job-ics.ts` hand-writes a valid **RFC 5545** `VCALENDAR` with one
`VEVENT`: CRLF line breaks, 75-octet line folding, and proper text escaping
(`\\ ; , \n`). `DTSTART`/`DTEND` are emitted in UTC basic format
(`YYYYMMDDTHHMMSSZ`); the default event length is 60 minutes. The job status
maps to the iCalendar `STATUS` (`planned → TENTATIVE`, `cancelled/archived →
CANCELLED`, else `CONFIRMED`). There is **no library, no network call, no
sync** — the builder is pure (the route passes `now`), which keeps the build
env-free and the output deterministic.

## Data flow

```
/app-shell/jobs  (force-dynamic, protected)
  ├─ getJobs ── jobs + embedded offers(reference) + leads(company_name)
  │             (1 PostgREST query, no N+1, max 100), RLS-scoped
  ├─ JobStatusForm ───▶ updateJobStatus  (session client, RLS can_write_ops)
  │     whitelist status ▸ update jobs .eq(id).eq(company_id).is(deleted_at,null)
  └─ JobScheduleForm ─▶ updateJobSchedule (session client, RLS can_write_ops)
        intent 'set'  → validate browser-computed instant → scheduled_for = it
        intent 'clear'→ scheduled_for = null
        (empty submit → error, never a silent wipe)

GET /app-shell/jobs/[id]/ics  (route handler, force-dynamic)
  ├─ session / active-tenant guards (else redirect)
  ├─ getJobById(companyId, id)   ← session client, RLS + company scoping
  │     not found → 404 ; no scheduled_for → 404 "Kein Termin gesetzt"
  └─ buildJobIcs(...) → Response  (text/calendar, attachment, no-store)
```

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** status and schedule writes = `can_write_ops` (owner/admin/ops);
  reads (and the .ics) = any active member. A sales-only / readonly user cannot
  write and is told so calmly.
- **Defense in depth:** every write is scoped to the active company
  (`.eq("company_id", activeCompanyId)`) and excludes soft-deleted rows; the
  .ics route only ever emits the active tenant's own job (a foreign id → 404).
- **Timezone-safe scheduling:** the instant is computed in the browser and
  stored as UTC; the list shows UTC explicitly.
- **No automation / no sync:** the .ics is a download the user imports manually.
  No calendar API, no email, no bexio, no webhook, no external call.

## Manual verification checklist (staging, fake data only)

1. Open `/app-shell/jobs` → each job shows a status select and a "Termin"
   control.
2. Change a job's status (e.g. Geplant → Bestätigt) → badge updates after save;
   reload persists.
3. Set a "Termin" (date + time) → the job shows the scheduled date/time (UTC);
   a **"Termin (.ics)"** download appears.
4. Download the .ics → it imports into a calendar app as one event with the job
   title, customer, source offer, value and (if set) location.
5. "Entfernen" clears the schedule; the .ics link disappears; an empty "Termin
   setzen" submit shows an error (no silent wipe).
6. As a **sales-only** / `readonly` user: status and schedule writes are
   rejected with the permission message; reads (and the .ics for a scheduled
   job) still work.
7. Edit the .ics URL to **another tenant's** job id → **404**.
8. Unauthenticated: `/app-shell/jobs` and the .ics route redirect to `/login`.

## NOT in scope (v0.3.5)

- Real calendar **sync** (Google/Outlook/CalDAV) or subscription feeds.
- Strict status-transition enforcement; per-status side effects.
- Editing job title/value/location, team assignment, or job notes.
- Email, bexio handover, or any external integration.

## Next step

**v0.3.6 — Lead Hunter / Opportunity Radar foundation** (manual opportunity
capture, RLS-scoped) **or calendar integration** (a real, gated sync path).
Still manual, RLS-scoped, no real customer data — real data only after verified
backup/restore, strict staging/production separation, and validated
auth/RLS/security.
