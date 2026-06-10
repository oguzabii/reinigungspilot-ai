# Klarsa Core — Lead Status & Follow-ups (v0.3.1)

> **Status: FOUNDATION (staging).** Extends the Lead Inbox (`/app-shell/leads`)
> with a **status workflow** per lead and **manually planned follow-up tasks** —
> all through the **session client (RLS)**, never the service-role client.
> **No automatic sending**, no external integrations, no real customer data.
> **Zero new migrations** (001/002/003 untouched — the existing schema already
> had everything).

Related: [`clean24-lead-inbox-foundation.md`](./clean24-lead-inbox-foundation.md),
[`clean24-lead-inbox-results.md`](./clean24-lead-inbox-results.md),
[`security-architecture.md`](./security-architecture.md),
[`rls-test-plan.md`](./rls-test-plan.md).

## Status workflow

Canonical flow (the `lead_status` enum from migration 001, presented in this
order):

```
new ──> qualified ──> offer_ready ──> offer_sent ──> waiting_reply
                                                          │
                                          ┌───────────────┤
                                          v               v
                                    followup_due ──> won / lost / archived
```

**Transitions are intentionally NOT strictly enforced** — the select offers all
nine statuses in flow order, so users can correct misclicks (explicit over
clever; a strict state machine can come with later automation). The change is
written by the `updateLeadStatus` server action.

## Follow-ups

A follow-up is a **manually planned task** linked to a lead — nothing is sent.
It reuses the `followup_tasks` table from migration 001 as-is:

| Form field | Column | Rule |
| --- | --- | --- |
| Lead * | `lead_id` | must belong to the **active** tenant (server-verified) |
| Stufe * | `stage` | `24h` \| `48h` \| `5d_final` (DB check constraint) |
| Fällig am * | `due_at` | required, validated server-side, stored as ISO/UTC |
| Kanal | `channel` | optional (E-Mail / Telefon / WhatsApp / Andere) |
| Titel / Notiz * | `note` | required — acts as the title in the list |

New follow-ups start as `status = 'planned'`. The list shows due date (UTC),
title, status badge, linked lead and stage, sorted by due date (soonest first,
capped at 100). Completing/editing follow-ups is **not** in v0.3.1 (see below).

> Timezone note: the **browser** converts the user's local wall-clock input into
> a real instant (`due_at_iso`, ISO/UTC) so the server's timezone never
> reinterprets it; the server falls back to a strictly shape-checked
> `datetime-local` value. The list displays UTC (marked); local-timezone display
> polish can come with the workflow version.

## Data flow

```
/app-shell/leads (force-dynamic, protected)
  ├─ reads (session client, RLS):
  │    getLeads ──────────────── leads (active tenant, max 200)
  │    getFollowups ──────────── followup_tasks + embedded leads(company_name)
  │    getCompanySummary/Labels   (1 PostgREST query, no N+1, max 100)
  ├─ LeadStatusForm ──▶ updateLeadStatus (server action)
  │     whitelist status ▸ update leads
  │     .eq(id).eq(company_id = ACTIVE tenant)   ← defense in depth
  │     RLS: can_write_sales (readonly/ops ⇒ 0 rows ⇒ clear error)
  └─ NewFollowupForm ─▶ createFollowup (server action)
        validate stage/due_at/note
        verify lead belongs to ACTIVE tenant     ← defense in depth
        insert followup_tasks (status 'planned')
        RLS: can_write_sales OR can_write_ops
```

## Security model

- **Session client only** for every read and write; the service-role/admin
  client is never used for tenant data.
- **RLS first:** `leads` update = `can_write_sales` (owner/admin/sales);
  `followup_tasks` insert = sales **or** ops. `readonly` is rejected by the DB
  and sees a calm German error.
- **Defense in depth (eng-review findings):** RLS allows a user who belongs to
  *several* companies to write in any of them — so every write is additionally
  scoped to the **active** company (`.eq("company_id", activeCompanyId)`), and
  `createFollowup` verifies the linked lead belongs to the active tenant before
  inserting (no composite FK enforces `followup.company_id = lead.company_id`).
- **Validation server-side:** status/stage whitelists, required+valid `due_at`,
  required `note`; errors never leak DB internals.
- **No sending, no automation:** creating a follow-up changes nothing else (no
  silent status flips, no email).

## Manual verification checklist (staging, fake data only)

1. Login as Clean24 owner → `/app-shell/leads` loads.
2. Change a lead's status → badge updates after save; reload persists.
3. Create a follow-up (lead + stage + due date + title) → appears in the list,
   sorted by due date; counter in the header increases.
4. Submit the follow-up form with an empty/invalid date or empty title → clear
   German error, nothing saved.
5. Empty state: a tenant without follow-ups shows "Noch keine Follow-ups."
6. As `readonly-a-login@example.test` (fake demo tenant): status save and
   follow-up create are **rejected** with the permission error; reads still work.
7. `/app-shell` Follow-ups module count reflects the created tasks.
8. Unauthenticated: `/app-shell/leads` redirects to `/login` (unchanged).

## NOT in scope (v0.3.1)

- Completing/editing/deleting follow-ups (workflow version).
- Strict status-transition enforcement (needs the automation context).
- Auto-setting `followup_due` on the lead when a follow-up is created (no magic).
- `offer_id` linkage — offers arrive with **v0.3.2 Offer Draft foundation**.
- **DB-level tenant-link integrity** (review finding F6): add
  `unique (id, company_id)` on `leads` + composite FK
  `(lead_id, company_id) → leads (id, company_id)` on `followup_tasks` in the
  **next migration** — closes the TOCTOU window the server-side check narrows.
- Tenant switcher for multi-membership users (membership order is now
  deterministic; an explicit switcher should land before any user gets a second
  membership).
- Any email/sending, reminders, or external integrations (hard rule).

## Next step

**v0.3.2 — Offer Draft foundation.** Real customer data remains gated: verified
backup/restore + strict staging/production separation + validated
auth/RLS/security first.
