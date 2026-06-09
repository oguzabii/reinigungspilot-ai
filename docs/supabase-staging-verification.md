# Klarsa Core — Supabase Staging Verification (v0.2.4)

> **Status: RUNBOOK.** Step-by-step to apply migration `001` to a **staging**
> Supabase project and verify it with the scripts in `supabase/verification/`.
> **No production data, no committed credentials, no real customer data.**

Related: [`../supabase/README.md`](../supabase/README.md),
[`supabase-staging-setup.md`](./supabase-staging-setup.md),
[`rls-test-plan.md`](./rls-test-plan.md),
[`supabase-schema-notes.md`](./supabase-schema-notes.md),
[`security-architecture.md`](./security-architecture.md).

## Latest verification status

✅ **`klarsa-staging` verified (2026-06-09).** Migration `001`, schema
verification, fake seed, and the RLS tests all ran successfully (manual SQL
Editor execution, reported by the user). Full record:
**[supabase-staging-results.md](./supabase-staging-results.md)**.

## Scripts (run in this order)

| # | File | Purpose |
| --- | --- | --- |
| 1 | `supabase/migrations/001_klarsa_core_schema.sql` | Create enums, tables, functions, RLS policies |
| 2 | `supabase/verification/001_verify_schema.sql` | **Read-only** checks: enums/tables/functions/RLS/policies exist, no data yet |
| 3 | `supabase/verification/002_fake_seed_for_rls_tests.sql` | Insert **fake** tenants/users/data (staging only) |
| 4 | `supabase/verification/003_rls_test_queries.sql` | Run RLS tests; every line should print **PASS** |

## Step 1 — Create the staging project (manually)

Follow [`supabase-staging-setup.md`](./supabase-staging-setup.md): create a
project named **`klarsa-staging`**, region near Switzerland, strong DB password
in your password manager. Copy the API keys into a **local** `.env.local` (from
`.env.local.example`) — never into the repo. Use a STAGING project; **no
production data**.

## Step 2 — Apply migration `001`

In the staging project's SQL editor (or via `supabase db push`), run
`supabase/migrations/001_klarsa_core_schema.sql` **once** (written for a fresh DB).

## Step 3 — Verify the schema (read-only)

Run `supabase/verification/001_verify_schema.sql`. It returns a small table; the
`status` column must be **PASS** for every check (plus a few `INFO` rows):

- enums = 10, tables = 20, helper functions = 8
- RLS enabled on all required tables
- every required table has ≥ 1 policy
- **no customer/tenant data** (run this before the seed)

If anything reads **FAIL**, fix the migration before continuing.

## Step 4 — Create the 8 fake auth users

The RLS tests need users. `002` can insert them directly into `auth.users`
(staging-only) — acceptable in a throwaway project. If your Supabase version
rejects the direct insert, instead create them via **Dashboard → Authentication →
Add user**, using these exact emails (any password):

```
owner-a@example.test      admin-a@example.test    sales-a@example.test
ops-a@example.test        readonly-a@example.test inactive-a@example.test
owner-b@example.test      superadmin@example.test
```

The rest of `002` resolves users **by email**, so either path works.

## Step 5 — Seed fake data

Run `supabase/verification/002_fake_seed_for_rls_tests.sql`. It is idempotent
(`on conflict do nothing`) and inserts only synthetic data: two demo tenants
("Clean24 Demo Tenant", "Muster Service Demo Tenant"), the 8 members, and a few
fake leads/prospects/offers/jobs. **All `@example.test` emails, no real data.**

## Step 6 — Run the RLS tests

Run `supabase/verification/003_rls_test_queries.sql` **as a whole**. It runs in a
single transaction that is rolled back (nothing persists). Read the **NOTICE
messages** — every line must print **PASS**:

- T1/T2 tenant isolation · T3 readonly cannot write · T4 sales scope ·
  T5 ops scope · T6 inactive denied · T7 anonymous denied · T8 audit append-only ·
  T9 superadmin read-only.

Cross-reference the expected behaviour in [`rls-test-plan.md`](./rls-test-plan.md).

> If you see `permission denied for table`, the `authenticated`/`anon` API roles
> are missing table grants (Supabase normally adds these automatically). Grant
> usage/SELECT to those roles, then re-run.

## Step 7 — Record results (v0.2.5)

Capture the PASS/FAIL output (and any fixes) as the verification record for
v0.2.5. Do **not** paste credentials or real data into the record.

## Never use production data

Staging holds **fake data only**. Do not import real leads, customers, emails,
phone numbers or bexio tokens. Real data is gated by **"No Security = No Customer
Data"** — see [`security-architecture.md`](./security-architecture.md).

## Clean / reset staging (if needed)

**Targeted reset** — remove only the fake seed (companies cascade to their tenant
data; audit rows are cleared first because `audit_logs.company_id` is `on delete
set null`):

```sql
delete from public.audit_logs
  where company_id in ('00000000-0000-0000-0000-0000000000a1',
                       '00000000-0000-0000-0000-0000000000b1');
delete from public.companies
  where id in ('00000000-0000-0000-0000-0000000000a1',
               '00000000-0000-0000-0000-0000000000b1');  -- cascades members/leads/offers/jobs/…
delete from public.user_profiles where email like '%@example.test';
delete from auth.users        where email like '%@example.test';
```

**Full reset** — for a throwaway staging project, the simplest reset is to drop
and recreate the public schema, then re-apply the migration:

```sql
drop schema public cascade;
create schema public;
-- then re-run 001_klarsa_core_schema.sql
```

(Only ever do this on **staging**.)

## Next step

**v0.2.5 — apply the migration to staging and record verification results**, or
start the **auth foundation**. Still no real customer data.
