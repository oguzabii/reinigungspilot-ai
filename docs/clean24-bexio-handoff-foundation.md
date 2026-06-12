# Klarsa Core — bexio Handoff Foundation (v0.3.12)

> A **manual** invoice/bexio handoff queue for completed jobs: a protected
> **`/app-shell/bexio`** route lists completed jobs with their customer + offer
> data, lets owner/admin **prepare** a handoff and later mark it **invoiced**,
> and produces a **copyable** invoice summary to enter into bexio by hand.
> **NO real bexio API, no token, no network call, no automatic invoice creation,
> no email.** All reads/writes go through the **session client (RLS)** —
> `bexio_handoffs` is the **bexio domain: owner/admin only** (`can_manage_company`).
> Never the service-role client. **No new migration** (uses the existing
> `bexio_handoffs` table from migration 001), no real customer data.

Related: [`bexio-architecture.md`](./bexio-architecture.md) (the future real
integration), [`clean24-job-from-offer-foundation.md`](./clean24-job-from-offer-foundation.md)
and [`clean24-job-workflow-calendar-foundation.md`](./clean24-job-workflow-calendar-foundation.md)
(jobs), [`clean24-offer-draft-foundation.md`](./clean24-offer-draft-foundation.md)
(offer totals), [`security-architecture.md`](./security-architecture.md).

## Where it sits in the chain

The locked product chain is **Lead Hunter → Opportunity Radar → Lead Inbox →
Follow-up → Offer → Job → Invoice/bexio**. This is the last hop: once a job is
**completed**, its customer + amount data is prepared for invoicing. Until the
real bexio integration exists, that hop is **manual** — a controlled queue that
stages the data and produces a copyable summary; a human enters it into bexio.

## What it does

- **Ready list:** completed jobs (`status = completed`) without a handoff yet,
  with customer (lead), service, location, job date, and the offer total.
- **"Für bexio vorbereiten"** (`prepareHandoff`): creates a `bexio_handoffs` row
  for the job (status **queued** = *Vorbereitet*), copying net/VAT/gross from the
  linked offer (or the job value as gross with the standard 8.1% VAT as
  fallback), `connection_id = NULL` (no real connection), `invoice_draft_ref` =
  the offer reference. **One handoff per job** (app-level guard).
- **"Als verrechnet markieren"** (`markHandoffInvoiced`): flips a prepared
  handoff to status **completed** (= *Verrechnet*) with `sent_at`. Idempotent.
- **Copyable summary** (`HandoffSummary`): a Swiss-German plain-text block —
  customer, contact, service, address/location, job date, reference, and
  net / VAT / gross — to paste into bexio. Pure client-side clipboard; nothing is
  sent.
- **Overview cards:** ready / prepared / invoiced counts (+ prepared total).
- **Role-aware:** only owner/admin see the action buttons; other members get a
  read-only view (they can still read + copy the summary).
- Linked from the **bexio Übergabe** card on `/app-shell`.

### Status mapping (`handoff_status`, migration 001)

The manual UI produces two of the enum values; the others still render if present
(e.g. from seed data):

| UI state | `handoff_status` | Label |
| --- | --- | --- |
| Prepared / in queue | `queued` | Vorbereitet |
| Invoiced | `completed` | Verrechnet |
| (also rendered) | `not_ready` / `ready` / `sent` / `failed` | Nicht bereit / Bereit / Übermittelt / Fehler |

### Data inputs (all existing, RLS-filtered)

`getInvoiceHandoffJobs(companyId)` joins, in one embedded PostgREST query:

| Shown | From |
| --- | --- |
| Job title / status / value / date / location | `jobs` |
| Net / VAT / gross / reference | `offers` (via `jobs.offer_id`) |
| Customer name / contact / email / phone / region / service | `leads` (via `jobs.lead_id`) |
| Existing handoff (status, amounts, ref) | `bexio_handoffs` (via `job_id`) |

**No new columns, no migration** — `bexio_handoffs` already carries
`status`, `net_chf`, `vat_rate_pct`, `gross_chf`, `invoice_draft_ref`,
`queued_at`, `sent_at`.

## Data flow

```
/app-shell/bexio (force-dynamic, protected)
  ├─ reads (session client, RLS):
  │    getInvoiceHandoffJobs ── jobs + offers + leads + bexio_handoffs (active tenant)
  │    getCompanySummary
  ├─ split: ready (completed, no handoff) / prepared (queued) / invoiced (completed)
  ├─ owner/admin → action buttons; else read-only
  ├─ PrepareHandoffButton ─▶ prepareHandoff   (insert bexio_handoffs, status queued)
  └─ MarkInvoicedButton   ─▶ markHandoffInvoiced (update status -> completed)
        RLS: can_manage_company (owner/admin); company-scoped; NO bexio API
```

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** `bexio_handoffs` writes = `can_manage_company` (owner/admin);
  reads = any active member. A sales/ops/readonly user's write is rejected.
- **Defense in depth:** both actions re-check the caller's role for the active
  company and scope every read/write to `company_id = activeCompanyId`; the
  prepare action verifies the job belongs to the tenant and is **completed**, and
  refuses a second handoff for the same job.
- **No bexio API / no secrets:** there is **no** real bexio connection, OAuth,
  token, `secret_ref`, or network call. `connection_id` is left `NULL`. Nothing
  is transmitted; no invoice is created anywhere.
- **No automation / no external source:** no email, no upload, no scraping, no
  AI. The summary is copied by a human.

## Manual verification checklist (staging, fake data only)

1. From `/app-shell`, the **bexio Übergabe** card opens `/app-shell/bexio`.
2. A job set to **Abgeschlossen** (on `/app-shell/jobs`) appears under **Bereit
   zur Übergabe** with its customer + offer total.
3. As owner/admin: **"Für bexio vorbereiten"** moves it to **Vorbereitet**
   (status `queued`); the overview counts update.
4. **"Als verrechnet markieren"** moves it to **Verrechnet** (status `completed`).
5. The **summary** expands and copies (customer, service, net/VAT/gross,
   reference) — nothing is sent.
6. Preparing the same job twice is refused (one handoff per job).
7. As a `sales`/`readonly` member: the buttons are hidden; a forced submit is
   rejected by RLS.
8. Unauthenticated: `/app-shell/bexio` redirects to `/login`.

## NOT in scope (v0.3.12)

- **Any real bexio integration** — no API, OAuth, token, sync, or invoice
  creation. `bexio_connections` is untouched; `connection_id` stays `NULL`.
- Editing handoff amounts, re-opening an invoiced handoff, or deleting a handoff.
- Email/PDF of the invoice, payment tracking, or a CEO/KPI dashboard.
- Real customer data.

## Next step

**v0.3.13 — CEO / KPI dashboard** (a read-only overview across the chain: leads,
opportunities, offers, jobs, handoffs) **or bexio handoff staging verification**.
Still manual, RLS-scoped, no real customer data — real data only after verified
backup/restore, strict staging/production separation, and validated
auth/RLS/security. **Offer PDF polish remains deferred** until requested.
