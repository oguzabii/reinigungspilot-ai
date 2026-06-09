# Klarsa Core — Supabase Schema Notes (v0.2.1)

> **Status: FOUNDATION / DRAFT.** Design notes for
> [`supabase/migrations/001_klarsa_core_schema.sql`](../supabase/migrations/001_klarsa_core_schema.sql).
> No database is connected, no credentials are committed, no real data exists.
> This refines the higher-level plan in [`data-model.md`](./data-model.md); where
> the two differ, **the migration is authoritative** for the database layer.

## Table groups

The 20 tables fall into seven groups:

| Group | Tables | Tenant-scoped? |
| --- | --- | --- |
| Identity & tenant | `companies`, `user_profiles`, `company_members` | companies = root; user_profiles = global; members = scoped |
| Configuration | `industry_presets`, `company_settings`, `company_services`, `pricing_models` | presets = global; rest scoped |
| Leads & prospects | `lead_sources`, `prospects`, `lead_scores`, `leads`, `lead_activities` | scoped |
| Offers | `offers`, `offer_items` | scoped |
| Follow-ups & jobs | `followup_tasks`, `jobs`, `job_notes` | scoped |
| bexio | `bexio_connections`, `bexio_handoffs` | scoped |
| Audit | `audit_logs` | scoped (company_id nullable for system events) |

Enums (10): `package_tier`, `member_role`, `approval_status`, `source_type`,
`lead_status`, `prospect_status`, `offer_status`, `job_status`,
`handoff_status`, `audit_action_type`.

## `company_id` tenant strategy

- **Every business table carries `company_id uuid not null references
  companies(id)`** (on delete cascade). The two exceptions are `user_profiles`
  (one row per person, keyed to `auth.users`) and `industry_presets` (a global
  catalog).
- `companies` is the **tenant root**: it has no `company_id` of its own;
  membership is resolved through `company_members`.
- `audit_logs.company_id` is **nullable** so platform-wide events (e.g. `login`,
  `system`) can be recorded without a tenant.
- Indexes back the hot paths: `company_id`, `status`, `created_at`, `deleted_at`,
  and the composites `(company_id, status)` and `(company_id, created_at)`.

## RLS strategy

- **RLS is enabled on every table.** The model is **default deny**: with RLS on
  and no matching policy, access is refused.
- Two `SECURITY DEFINER` helpers drive the policies:
  - `public.is_member_of(company_id)` — true if the current `auth.uid()` has an
    **active** membership in that company.
  - `public.is_superadmin()` — true if the user has an active `superadmin`
    membership (support-level read access).
  - They are `SECURITY DEFINER` so they bypass RLS on `company_members`,
    avoiding recursive policy evaluation.
- **Standard tenant tables** get one `for all` policy: `using (is_member_of(...)
  or is_superadmin())` and `with check (is_member_of(...))`.
- **Append-only tables** (`lead_scores`, `lead_activities`, `audit_logs`) get
  `select` + `insert` policies only — no `update`/`delete` policy means those
  operations are denied, so history is immutable.
- **Special tables**: `companies` (members + create-by-authenticated),
  `company_members` (you can always see/insert your own membership),
  `user_profiles` (self-service), `industry_presets` (read for all
  authenticated, write for superadmin).
- These are **draft** policies. v0.2.2+ hardens write granularity per
  `member_role` (e.g. `readonly` cannot write, owner-only deletes) and tightens
  onboarding (company creation → first membership).

## Soft-delete strategy

- Data-bearing, user-editable tables carry `deleted_at timestamptz`
  (`companies`, `company_services`, `pricing_models`, `lead_sources`,
  `prospects`, `leads`, `offers`, `jobs`, `job_notes`).
- `deleted_at is null` = active. Application queries filter it out by default;
  **restore** clears it. Restores and deletes are audited.
- Tables that model state differently are intentionally **not** soft-deletable:
  membership uses `is_active`; sources use `enabled`; follow-ups use a `skipped`
  status; append-only tables are never deleted.

## Audit-log strategy

- `audit_logs` is the central, **append-only** trail for security-relevant
  actions, typed by the `audit_action_type` enum (`create`, `update`, `delete`,
  `restore`, `status_change`, `login`, `export`, `handoff`, `system`).
- It stores `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata`
  and a **hashed** IP (`ip_hash`) — **never** raw IPs, secrets or tokens.
- RLS allows `select` (own tenant) and `insert` only; no `update`/`delete`.

## Security-sensitive columns

- `bexio_connections.secret_ref` is a **pointer** to an encrypted token held in a
  separate restricted store — **never** a raw OAuth token, **never** logged.
- No table stores passwords (Supabase Auth owns those) or raw secrets.

## Why no real data yet

The migration is structure only. Loading real customer data now would violate
the hard rule **"No Security = No Customer Data"**: auth, RLS and backup/restore
must be implemented **and verified** first (see
[`security-architecture.md`](./security-architecture.md)). Until then the app
keeps using the local, fictional demo data in `lib/demo-data.ts`.

## Relationship to the TypeScript types

- [`lib/database-types.ts`](../lib/database-types.ts) mirrors this migration at a
  high level (enum unions + per-table row types). It is **hand-written** for now;
  it will later be replaced by Supabase CLI-generated types.
- [`lib/klarsa-core-types.ts`](../lib/klarsa-core-types.ts) is the v0.2.0
  app-domain sketch. It stays as-is; the DB layer in `database-types.ts` is the
  more detailed, authoritative shape and the two converge as Phase 2 progresses.

## Next step

**v0.2.2 — staging Supabase setup + env documentation:** create a staging
project, document the required (untracked) environment variables, apply
`001_klarsa_core_schema.sql` to staging, and run RLS / cross-tenant tests.

## Related documents

- [Phase-2-Architektur](./phase-2-architecture.md)
- [Datenmodell](./data-model.md)
- [Security-Architektur](./security-architecture.md)
- [Lead-Hunter-Engine](./lead-hunter-engine.md)
- [bexio-Architektur](./bexio-architecture.md)
