# Klarsa Core — Job from Accepted Offer (v0.3.4)

> **Status: FOUNDATION (staging).** Lets a user **manually create a job from an
> accepted offer** and adds a protected **`/app-shell/jobs`** list. Writes go
> through the **session client (RLS)** — jobs are the **ops domain**
> (owner/admin/ops) — never the service-role client. **No calendar, no email,
> no bexio, no external integration, no real customer data.** One additive,
> idempotent migration (`005`) prevents duplicate jobs per offer.

Related: [`clean24-offer-draft-foundation.md`](./clean24-offer-draft-foundation.md),
[`clean24-offer-pdf-foundation.md`](./clean24-offer-pdf-foundation.md),
[`security-architecture.md`](./security-architecture.md),
[`data-model.md`](./data-model.md).

## What it does

- **Create job from offer** (`createJobFromOffer`): on an offer with status
  **`accepted`**, the Offer Engine shows an **"Auftrag erstellen"** button. The
  action verifies the offer belongs to the active tenant and is accepted, then
  inserts a `jobs` row seeded from the offer:
  - `offer_id` = the source offer (the link), `lead_id` = the offer's lead,
  - `title` = `"<Kunde> – Offerte <Referenz>"` (or `"Auftrag zu Offerte
    <Referenz>"` without a lead),
  - `value_chf` = the offer's gross total, `status` = `planned` (default).
- **No duplicates:** an offer can have at most **one live job**. The action
  pre-checks, and migration `005` adds a partial unique index as the real guard
  (so the check-then-insert race can't create two). The button turns into an
  **"Auftrag erstellt"** chip once a job exists.
- **Jobs list** at **`/app-shell/jobs`** (`force-dynamic`, protected): the
  active tenant's jobs, newest first, with status badge, customer (lead name),
  source offer reference and value. Empty state links back to the Offer Engine.
  The Jobs card on `/app-shell` now opens this route.

### Uses the existing schema (migration 001)

`jobs` already had everything needed — no new columns:

| Field | Column | Note |
| --- | --- | --- |
| Source offer | `jobs.offer_id` | FK → offers (existing) |
| Customer | `jobs.lead_id` | carried over from the offer |
| Title | `jobs.title` | derived from customer + reference |
| Value | `jobs.value_chf` | offer gross total |
| Status | `jobs.status` | `job_status` enum, default `planned` |

`job_status` = `planned · confirmed · in_progress · completed · cancelled ·
archived` (display-only badges in v0.3.4).

## Roles (important)

Jobs are the **ops domain**: `INSERT` is gated by `can_write_ops`
(**owner / admin / ops**). A **sales-only** user can create and accept offers
but **cannot** create a job — RLS rejects the insert and the action returns a
clear German message ("… erfordert Ops, Admin oder Owner"). Reading jobs
(`SELECT`) is allowed for any active member (`can_read_company`), so the
"Auftrag erstellt" state is visible to everyone, including sales.

## Data flow

```
/app-shell/offers  (accepted offer)
  └─ CreateJobButton ─▶ createJobFromOffer (server action)
        verify offer: active tenant + not deleted + status 'accepted'
        pre-check: no live job for this offer already
        insert jobs (offer_id, lead_id, title, value, status 'planned')
        RLS: can_write_ops (owner/admin/ops)  ·  migration 005 unique index
        revalidate /app-shell/offers + /app-shell/jobs

/app-shell/jobs  (force-dynamic, protected)
  └─ getJobs ── jobs + embedded offers(reference) + leads(company_name)
                (1 PostgREST query, no N+1, max 100), RLS-scoped

/app-shell/offers list
  └─ getOffers now also embeds jobs(id, deleted_at) → hasJob flag, so the
     button shows "Auftrag erstellen" vs "Auftrag erstellt"
```

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** job insert = `can_write_ops`; reads = `can_read_company`. A
  sales-only user is rejected by the DB, not by the UI.
- **Defense in depth:** the source offer is verified to belong to the **active**
  company and to be `accepted`; the job is scoped to the active company.
- **Duplicate guard:** app pre-check **plus** the migration-005 partial unique
  index (`jobs(company_id, offer_id) where offer_id is not null and deleted_at
  is null`). A `23505` from the index is surfaced as the same friendly message.
- **No automation:** creating a job does nothing else — no calendar event, no
  email, no bexio, no external call. `scheduled_for` stays null.

## Migration 005

`supabase/migrations/005_jobs_one_live_per_offer.sql` (additive, idempotent,
does NOT touch 001-004): a **partial unique index** so a tenant has at most one
non-deleted job per offer. Soft-deleting a job frees the offer to get a new one.
Precondition (already true for app data): no offer currently has two live jobs —
a check query is in the file header.

## Manual verification checklist (staging, fake data only)

1. In the Offer Engine, set an offer to **Angenommen** → an **"Auftrag
   erstellen"** button appears on that offer only.
2. Click it → success; the button becomes **"Auftrag erstellt"**; the job shows
   up at `/app-shell/jobs` with the customer, source offer and value.
3. Reload the offers page → the offer still shows "Auftrag erstellt" (no second
   button) — no duplicate possible.
4. A **non-accepted** offer shows **no** button.
5. As `readonly-a-login@example.test`: no write is possible (reads still work).
   As a **sales-only** user: the button appears but creating returns the
   permission message (jobs need ops/admin/owner).
6. `/app-shell` Jobs card count reflects the created job; the card opens
   `/app-shell/jobs`.
7. Unauthenticated: `/app-shell/jobs` redirects to `/login`.

## NOT in scope (v0.3.4)

- Editing/deleting jobs or changing job status from the UI (workflow version).
- Scheduling / calendar (`scheduled_for` is left null), team assignment.
- Email, bexio handover, or any external integration.
- Auto-creating a job when an offer becomes accepted (creation stays manual).

## Next step

**v0.3.5 — Job workflow / calendar foundation** (job status transitions,
scheduling) **or Offer PDF polish** (letterhead, typography, layout). Still
manual, RLS-scoped, no real customer data — real data only after verified
backup/restore, strict staging/production separation, and validated
auth/RLS/security.
