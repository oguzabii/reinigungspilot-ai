# Klarsa Core — Lead Inbox Foundation (v0.3.0)

> **Status: FOUNDATION (staging).** The first real **write** feature: a protected
> Lead Inbox at `/app-shell/leads` where a logged-in tenant user can **list** and
> **manually create** leads — all through the **session client (RLS)**, never the
> service-role client. **No external intake** (no scraping, no email ingestion, no
> Lead Hunter), **no credentials**, **no real customer data** beyond what a user
> types on staging.

Related: [`app-shell-staging-connection.md`](./app-shell-staging-connection.md),
[`clean24-tenant-setup.md`](./clean24-tenant-setup.md),
[`security-architecture.md`](./security-architecture.md),
[`rls-test-plan.md`](./rls-test-plan.md).

## Route

`/app-shell/leads` — internal (noindex), **`force-dynamic`**, **protected**:

- Supabase env missing → redirect to `/app-shell` (safe setup state).
- No session → redirect to `/login`.
- No active membership → redirect to `/app-shell` ("Kein aktiver Mandant").
- Otherwise → render the active tenant's leads + the create form.

Linked from the **Lead Inbox** card on `/app-shell`.

## What it does

1. **Lists** the active company's leads (`lib/auth/tenant-data.ts` →
   `getLeads`): newest first, soft-deleted excluded, capped at 200. RLS-scoped
   via the session client, so a user only sees their own tenant's rows.
2. **Empty state** when there are no leads yet.
3. **Manual entry** — "Neuen Lead erfassen" form (`components/leads/NewLeadForm.tsx`)
   posts to a **server action** (`app/app-shell/leads/actions.ts` → `createLead`),
   which inserts via the **session** server client. Required: Firma / Name. The
   list refreshes via `revalidatePath`.

### Fields (existing `leads` schema only)

| Form field | Column |
| --- | --- |
| Firma / Name * | `company_name` (required) |
| Kontaktperson | `contact_name` |
| E-Mail | `email` |
| Telefon | `phone` |
| Interesse / Leistung | `service_interest` (datalist from `company_services`) |
| Quelle | `source_type` (enum; whitelisted server-side) |
| Status | `status` (enum; whitelisted, default `new`) |
| Notizen | `notes` (added in migration 003) |

## Migration 003 (lead notes)

`leads` had no notes column, so `supabase/migrations/003_leads_notes.sql`
**additively** adds `notes text` (001/002 unchanged, re-runnable). Apply it on
staging before using the Notizen field:

```
supabase/migrations/003_leads_notes.sql   -- alter table leads add column if not exists notes
```

The column inherits the existing role-aware RLS on `leads` — no new policies.

## Security model

- **Session client only.** Reads and the insert go through
  `lib/supabase/server.ts` (anon key + the user's session cookie), so **RLS
  applies**. The **service-role/admin client is never used** here.
- **Role-aware writes.** The `leads` insert policy is `can_write_sales` —
  owner/admin/sales may create leads; **readonly/ops are rejected by the DB**
  (the form simply shows a save error). Tenant isolation is enforced by RLS, not
  by the app.
- **No external intake.** Leads are entered by hand only. No scraping, no inbound
  email parsing, no Lead Hunter, no third-party APIs.
- **No real customer data** beyond staging test entries; nothing here loosens the
  **"No Security = No Customer Data"** gate.

## No real data yet

This is still staging. Before real customer data: backup/restore must be set up
and tested, **staging and production must be strictly separated** (own projects /
keys), and auth + RLS + security validated — see
[`security-architecture.md`](./security-architecture.md).

## Next step

**v0.3.1 — Lead status & follow-ups:** edit a lead's status from the Inbox and
create follow-up tasks (`followup_tasks`), still manual and RLS-scoped. No
external integrations.
