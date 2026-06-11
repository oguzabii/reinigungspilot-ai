# Klarsa Core — Opportunity → Lead Inbox Conversion (v0.3.8)

> **Status: FOUNDATION (staging).** Lets a user **manually promote a qualified
> opportunity** from the Opportunity Radar into the **Lead Inbox**: an **"In
> Lead Inbox übernehmen"** button on each opportunity creates a linked `leads`
> row. Writes go through the **session client (RLS)** — both prospects and leads
> are the **sales domain** (owner/admin/sales) — never the service-role client.
> **No email, no automation, no outreach, no scraping, no external API, no real
> customer data. No new migration** (uses existing columns).

Related: [`clean24-lead-hunter-foundation.md`](./clean24-lead-hunter-foundation.md),
[`clean24-lead-hunter-scoring.md`](./clean24-lead-hunter-scoring.md),
[`clean24-lead-inbox-foundation.md`](./clean24-lead-inbox-foundation.md),
[`security-architecture.md`](./security-architecture.md).

## What it does

- **Promote** (`promoteOpportunity`): on an opportunity row, **"In Lead Inbox
  übernehmen"** verifies the opportunity belongs to the active tenant and is not
  already promoted, then inserts a `leads` row from its fields and links the two.
- **No duplicates:** the action pre-checks `promoted_lead_id`, **and** the claim
  is atomic — the prospect update only succeeds while `promoted_lead_id` is
  still null. If a concurrent promotion wins the race, the just-created lead is
  rolled back (soft-deleted) so there is never a second lead. Once promoted, the
  button becomes a **"Bereits im Lead Inbox"** chip.
- **Bidirectional link:** the new lead points back to its source
  (`leads.prospect_id`), and the opportunity records the result
  (`prospects.promoted_lead_id`) and moves to status **Konvertiert**.

### Field mapping (opportunity → lead) — existing columns, no migration

| Opportunity (`prospects`) | Lead (`leads`) |
| --- | --- |
| `name` | `company_name` |
| `region` | `region` |
| `source_type` | `source_type` |
| `search_query` (service potential) | `service_interest` |
| `reason` + `suggested_message` | `notes` (combined) |
| — | `status` = `qualified` |
| `id` | `prospect_id` (back-link) |

The opportunity is updated: `promoted_lead_id` = the new lead's id, and
`status` = `converted`.

## Data flow

```
/app-shell/lead-hunter (opportunity row)
  └─ PromoteOpportunityButton ─▶ promoteOpportunity (server action)
        load prospect: active tenant + not deleted + not already promoted
        insert leads (status 'qualified', prospect_id = source)   ← session client, RLS
        atomically claim prospect:
          update prospects set promoted_lead_id = lead.id, status = 'converted'
          where id = … and company_id = … and promoted_lead_id IS NULL
        lost the race? → soft-delete the orphan lead, report "bereits übernommen"
        RLS: can_write_sales (owner/admin/sales) for BOTH writes
        revalidate /app-shell/lead-hunter + /app-shell/leads
```

The promoted lead then appears in the **Lead Inbox** (`/app-shell/leads`) like
any other lead — with its status, notes and the carried-over fields.

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** both the lead insert and the prospect update are gated by
  `can_write_sales` (owner/admin/sales). A `readonly` user is rejected by the DB.
- **Defense in depth:** the opportunity is verified to belong to the **active**
  company before promotion; both writes are scoped to the active company.
- **Duplicate-safe:** app pre-check **plus** an atomic conditional update
  (`promoted_lead_id IS NULL`); the orphan lead is rolled back on a lost race.
  No DB migration needed.
- **No automation / no outreach:** promoting creates an internal lead and
  nothing else — no email, no message, no external call, no scraping. The lead
  is then worked manually in the Lead Inbox.

## Manual verification checklist (staging, fake data only)

1. On `/app-shell/lead-hunter`, an un-promoted opportunity shows **"In Lead
   Inbox übernehmen"**.
2. Click it → success; the button becomes **"Bereits im Lead Inbox"**; a new
   lead appears in `/app-shell/leads` with the company name, region, service
   interest, source and notes carried over, status **Qualifiziert**.
3. Reload `/app-shell/lead-hunter` → the opportunity still shows "Bereits im
   Lead Inbox" (status **Konvertiert**) — no second button, no duplicate.
4. As `readonly-a-login@example.test`: promotion is rejected (reads still work).
5. The promoted lead in the Lead Inbox behaves like any manual lead (status,
   follow-ups, offer, …).
6. Unauthenticated: the route redirects to `/login`.

## NOT in scope (v0.3.8)

- Editing the mapping before promotion, or choosing the initial lead status
  (it is `qualified`).
- Un-promoting / re-linking, or bulk promotion.
- A source registry (`lead_sources`) — comes later.
- Email, outreach, bexio, or any external integration. No real customer data.

## Next step

**v0.3.9 — Source Registry foundation** (`lead_sources` as the catalog of
allowed, human-approved sources) **or Lead → Offer workflow polish**. Still
manual, RLS-scoped, no real customer data — real data only after verified
backup/restore, strict staging/production separation, and validated
auth/RLS/security.
