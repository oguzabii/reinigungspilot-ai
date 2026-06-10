# Klarsa Core — Offer Draft Foundation (v0.3.2)

> **Status: FOUNDATION (staging).** Adds a protected **Offer Engine**
> (`/app-shell/offers`): create **manual offer drafts** (optionally from a lead),
> add line items, see live totals, and move an offer through its status — all
> through the **session client (RLS)**, never the service-role client.
> **No PDF, no email/sending, no bexio, no external integration, no real
> customer data.** One additive migration (`004`) for deferred integrity.

Related: [`clean24-lead-status-followups.md`](./clean24-lead-status-followups.md),
[`clean24-lead-inbox-foundation.md`](./clean24-lead-inbox-foundation.md),
[`security-architecture.md`](./security-architecture.md),
[`data-model.md`](./data-model.md).

## Why a separate route

The Lead Inbox (`/app-shell/leads`) already carries leads, status and
follow-ups. Offers are a distinct module with their own list, status workflow
and line items, so they live at their own protected route **`/app-shell/offers`**
(linked from the Offer Engine card on `/app-shell`). Same guards as the Lead
Inbox: `force-dynamic`, redirect to `/login` without a session and to
`/app-shell` without an active tenant.

## What it does

- **Create offer draft** (`createOffer`): optional source lead (verified to
  belong to the active tenant), optional reference (auto-generated `OF-…` if
  blank), optional `valid_until` date, VAT rate (default 8.10% Swiss), and an
  optional first line item. New offers start as `status = 'draft'`.
- **Add line item** (`addOfferItem`): label + amount (+ optional detail) on an
  existing offer; totals are recomputed server-side.
- **Change status** (`updateOfferStatus`): draft → ready → sent → accepted /
  declined / expired → archived. Transitions are **not** strictly enforced so
  corrections stay possible.
- **List** offers (newest first, capped at 100) with linked lead, status badge,
  line items and Netto / MwSt / Brutto totals.

### Status flow

```
draft → ready → sent → accepted
                     ↘ declined
                     ↘ expired   → archived
```

### Offer fields (existing `offers` / `offer_items` schema from migration 001)

| Form field | Column | Rule |
| --- | --- | --- |
| Aus Lead | `offers.lead_id` | optional; if set, must belong to the active tenant |
| Referenz | `offers.reference` | optional → auto `OF-YYYYMMDD-XXXX`; unique per tenant |
| Gültig bis | `offers.valid_until` | optional `date`, shape-checked |
| MwSt-Satz % | `offers.vat_rate_pct` | default 8.10, clamped 0–100 |
| Position / Betrag | `offer_items.label` / `amount_chf` | label + amount together, or neither |
| (Totals) | `total_net_chf` / `total_gross_chf` | computed server-side, never client-trusted |

Totals: `net = Σ item amounts`, `gross = round(net × (1 + vat/100), 2)`.
Recomputed on every item change — the browser never sets the stored totals.

## Data flow

```
/app-shell/offers (force-dynamic, protected)
  ├─ reads (session client, RLS):
  │    getLeads ───────── leads (active tenant) → "Aus Lead" dropdown
  │    getOffers ──────── offers + embedded leads(company_name) + offer_items(...)
  │                       (1 PostgREST query, no N+1, max 100)
  ├─ NewOfferForm ──▶ createOffer (server action)
  │     verify optional lead belongs to ACTIVE tenant  ← defense in depth
  │     insert offers (status 'draft') [+ optional first offer_item]
  │     RLS: can_write_sales (owner/admin/sales)
  ├─ AddOfferItemForm ─▶ addOfferItem (server action)
  │     verify parent offer belongs to ACTIVE tenant   ← defense in depth
  │     insert offer_items, recompute + persist totals
  └─ OfferStatusForm ─▶ updateOfferStatus (server action)
        whitelist status ▸ update offers
        .eq(id).eq(company_id = ACTIVE tenant).is(deleted_at, null)
        RLS: readonly ⇒ 0 rows ⇒ clear error
```

## Security model

- **Session client only** for every read and write; the service-role/admin
  client is never used for tenant data.
- **RLS first:** `offers` and `offer_items` writes = `can_write_sales`
  (owner/admin/sales); `readonly` is rejected by the DB and sees a calm German
  error.
- **Defense in depth:** every write is scoped to the active company
  (`.eq("company_id", activeCompanyId)`), and the optional source lead / the
  parent offer are verified to belong to the active tenant before they are
  referenced.
- **Server-side validation & computation:** status whitelist, amount/VAT
  parsing and clamping, date shape-check, and **totals computed on the server**
  (the client never sets `total_*`). Unique-reference collisions return a
  friendly message, not a DB error.
- **No PDF, no sending, no bexio, no external integration.** Creating or editing
  an offer changes nothing outside the tenant's own rows.

## Migration 004 — deferred integrity hardening

`supabase/migrations/004_followup_lead_tenant_integrity.sql` (additive,
idempotent, does NOT touch 001/002/003) closes the v0.3.1 review finding **F6**:

- `unique (id, company_id)` on `leads` (FK target; `id` is already the PK, so it
  rejects nothing).
- composite FK `followup_tasks(lead_id, company_id) → leads(id, company_id)`
  `on delete cascade`, so a follow-up's tenant must equal its lead's tenant at
  the database level. The pre-existing single-column `lead_id` FK is left in
  place (both enforce; harmless).

Precondition (already true for app-created data): every `followup_tasks` row
has `company_id` equal to its lead's `company_id`. A check query is included in
the migration header. **Not yet** extended to `offers.lead_id` (nullable,
`on delete set null`) — the app already verifies the lead's tenant on create;
a composite FK there can come with the offers workflow version.

## Manual verification checklist (staging, fake data only)

1. Login → open **Offer Engine** from `/app-shell` → `/app-shell/offers` loads.
2. Create an offer **without** a lead and **without** a reference → appears with
   an auto `OF-…` reference, status **Entwurf**, totals 0.00.
3. Create an offer **from a lead** with a first position (label + amount) →
   linked lead shown, Netto/MwSt/Brutto computed from the amount + VAT.
4. Add a line item to an existing offer → it appears and the totals increase.
5. Change an offer's status (e.g. Entwurf → Bereit) → badge updates after save;
   reload persists.
6. Try an empty amount / label-without-amount → clear German error, nothing
   saved. Re-use an existing reference → "Referenz existiert bereits".
7. As `readonly-a-login@example.test`: create / add item / status change are
   **rejected** with the permission error; reads still work.
8. `/app-shell` Offer Engine count reflects the created offers.
9. Unauthenticated: `/app-shell/offers` redirects to `/login`.

## NOT in scope (v0.3.2)

- Editing/deleting offers or line items (workflow version).
- Strict status-transition enforcement.
- Per-item quantity/unit price (only a flat `amount_chf` per item today).
- A composite FK on `offers(lead_id, company_id)` (offers' lead link is
  nullable; deferred).
- **PDF rendering and email/sending** — that is the next step.
- Any bexio handover or external integration (hard rule).

## Next step

**v0.3.3 — Offer PDF / Offer sending foundation:** render an offer to PDF and
prepare the sending path (still manual-trigger, no real customer data). Real
customer data remains gated behind verified backup/restore, strict
staging/production separation, and validated auth/RLS/security.
