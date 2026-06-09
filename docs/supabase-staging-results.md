# Klarsa Core — Supabase Staging Verification Results

> **Status: VERIFIED (staging).** The schema migration and RLS verification were
> run successfully against a manually created Supabase **staging** project.

| | |
| --- | --- |
| **Date** | 2026-06-09 |
| **Environment** | `klarsa-staging` (Supabase staging project) |
| **Migration** | `supabase/migrations/001_klarsa_core_schema.sql` |
| **Executed via** | Supabase SQL Editor (manual) |
| **Reported by** | User |

> **Provenance / honesty note:** These results are recorded from the **user's
> manual execution** in the Supabase SQL Editor, as reported. They were **not**
> independently observed or automated from this repository, and this repo holds
> **no connection** to the staging project (no URL, keys, or service-role
> access). This document is a record of a reported outcome.

## Results

| # | Step | Script | Result |
| --- | --- | --- | --- |
| 1 | Apply schema migration | `migrations/001_klarsa_core_schema.sql` | ✅ Applied successfully |
| 2 | Verify schema (read-only) | `verification/001_verify_schema.sql` | ✅ Passed |
| 3 | Apply fake seed | `verification/002_fake_seed_for_rls_tests.sql` | ✅ Applied successfully |
| 4 | Run RLS test queries | `verification/003_rls_test_queries.sql` | ✅ Passed |

### 1. Migration applied successfully
`001_klarsa_core_schema.sql` ran on a fresh `klarsa-staging` database: 10 enums,
20 tables, 8 helper functions, indexes, and the role-aware RLS policies were
created without errors.

### 2. Schema verification passed
`001_verify_schema.sql` reported **PASS** for all checks: all 10 enums, 20
tables and 8 helper functions present; RLS enabled on every required table;
every required table has ≥ 1 policy; and **no customer/tenant data** present
prior to seeding.

### 3. Fake seed applied successfully
`002_fake_seed_for_rls_tests.sql` inserted the synthetic staging dataset (two
demo tenants and eight `@example.test` users mapped to all roles, plus a few
fake leads/prospects/offers/jobs) without errors.

### 4. RLS test queries passed
`003_rls_test_queries.sql` reported **PASS** for every test case:

- T1 / T2 — tenant isolation (user A sees only company A; user B only company B)
- T3 — readonly cannot insert/update/delete
- T4 — sales role can write sales tables (and is blocked from jobs)
- T5 — ops role can write job tables (and is blocked from leads)
- T6 — inactive member is denied
- T7 — anonymous access is denied
- T8 — `audit_logs` is append-only (insert allowed; update/delete blocked)
- T9 — superadmin reads across companies but cannot write (read-only support)

This confirms the role-aware RLS from v0.2.3 behaves as designed on a live
PostgreSQL/Supabase instance.

## Safety confirmations

- ✅ **Fake seed contains no real customer data.** All records are synthetic:
  emails on the reserved `@example.test` domain, tenant names "Clean24 Demo
  Tenant" / "Muster Service Demo Tenant", placeholder phone numbers, and
  `bexio_connections.secret_ref` left `NULL`.
- ✅ **No production data was used.** Verification ran only against the throwaway
  `klarsa-staging` project with fake data.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, database password, or
  JWT secret. Those live only in the user's local `.env.local` (git-ignored) and
  the Supabase dashboard.
- ✅ **Not the old Clean24 Lead Autopilot.** "Clean24 Demo Tenant" is a fake
  staging test tenant inside Klarsa, unrelated to the separate, untouched legacy
  system.

## What this verifies

- The migration is syntactically and structurally sound on real Supabase.
- The multi-tenant `company_id` isolation and **role-aware** write boundaries are
  enforced by RLS in practice (not only by design).

## What this does NOT mean

- No authentication is wired up; no Supabase client is connected to the app.
- No real customer data exists or is approved — the hard rule **"No Security =
  No Customer Data"** still applies (auth + RLS + backup/restore must be in place
  and verified). See [`security-architecture.md`](./security-architecture.md).
- Staging is throwaway and can be reset anytime (see the verification runbook).

## Next step

**v0.2.6 — Auth foundation + Supabase client architecture** (recommended), so
that login, sessions and RLS context exist **before** any real tenant data.
Runbook for re-verifying: [`supabase-staging-verification.md`](./supabase-staging-verification.md).
