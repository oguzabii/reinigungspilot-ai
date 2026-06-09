# Klarsa Core — Supabase

Database foundation for **Klarsa Core**, the multi-tenant SaaS layer of Klarsa.
This folder contains **schema migrations and verification scripts only** —
structure and tests, not data.

> **Status (v0.2.5):** schema + verification scripts **verified on staging**.
> `klarsa-staging` ran the migration, schema verification, fake seed and RLS
> tests **successfully** (2026-06-09, manual SQL Editor execution reported by the
> user) — see [`../docs/supabase-staging-results.md`](../docs/supabase-staging-results.md).
> Still **no database is connected to the app**, **no credentials are
> committed**, and **no real customer data** exists (fake `@example.test` data
> only).

## Contents

```
supabase/
  migrations/
    001_klarsa_core_schema.sql       # enums, 20 tables, indexes, RLS (role-aware)
  verification/
    001_verify_schema.sql            # read-only: enums/tables/functions/RLS/policies + no-data
    002_fake_seed_for_rls_tests.sql  # FAKE staging data (two demo tenants, @example.test users)
    003_rls_test_queries.sql         # RLS test cases (every line should print PASS)
  README.md                          # this file
```

Design rationale and table groups: see
[`../docs/supabase-schema-notes.md`](../docs/supabase-schema-notes.md). The
TypeScript mirror of the schema is [`../lib/database-types.ts`](../lib/database-types.ts).

## Staging setup, verification & testing

Before any production project or real data, the migration is applied to a
throwaway **staging** project and validated. Run order:

1. `migrations/001_klarsa_core_schema.sql` — apply the schema.
2. `verification/001_verify_schema.sql` — read-only checks (enums/tables/
   functions/RLS/policies exist; no data yet).
3. `verification/002_fake_seed_for_rls_tests.sql` — insert **fake** test data.
4. `verification/003_rls_test_queries.sql` — RLS tests (expect all **PASS**).

Runbooks and references:

| Doc | Purpose |
| --- | --- |
| [supabase-staging-setup.md](../docs/supabase-staging-setup.md) | Create the staging project, fill `.env.local`, apply the migration, verify |
| [supabase-staging-verification.md](../docs/supabase-staging-verification.md) | **End-to-end runbook** for the four scripts above + clean/reset |
| [rls-test-plan.md](../docs/rls-test-plan.md) | 13 RLS tests + role matrix (tenant isolation, readonly write-block, role scoping, append-only audit, no anon access) |
| [staging-seed-plan.md](../docs/staging-seed-plan.md) | Fake-only dataset (two demo tenants, fake users) to exercise RLS + workflows |

Environment template: [`../.env.local.example`](../.env.local.example) (placeholders
only). Copy to `.env.local` (git-ignored) for staging; never commit real values.

## No credentials are committed

This repository contains **no** Supabase URL, anon key, service-role key,
database password, JWT secret, or any other secret. The `.gitignore` excludes
`.env*` — only the placeholder template `.env.local.example` is tracked. Copy it
to `.env.local` (git-ignored) and fill in real values there; configuration later
also goes into Vercel environment variables, never into the repo. The
**service-role key is server-only** (it bypasses RLS) and must never reach the
client or any log.

If you ever find a secret in this folder, treat it as an incident: rotate the
key and remove it from history.

## How to apply migrations (later)

> Do **not** apply this to a project that holds real data. The first target is a
> throwaway **staging** project.

The migration targets Supabase (it references `auth.users` and `auth.uid()`).

**Option A — Supabase CLI (recommended later):**

```bash
# 1. Install + log in (no secrets stored in the repo)
npm i -g supabase
supabase login

# 2. Link to a STAGING project (its ref/keys live only in your shell/env)
supabase link --project-ref <staging-project-ref>

# 3. Apply migrations to staging
supabase db push
```

**Option B — manual:** open the Supabase SQL editor of the **staging** project
and run `migrations/001_klarsa_core_schema.sql` once (it is written for a fresh
database).

After applying, verify:

- RLS is **enabled** on every table (`select relname, relrowsecurity from pg_class …`).
- A non-member cannot read another company's rows (cross-tenant test).
- `auth.users` exists (Supabase project) so `user_profiles` FK resolves.

## Staging first, production later

1. **Staging** — apply migration, run RLS/cross-tenant tests, iterate.
2. **Security review** — confirm the checklist in
   [`../docs/security-architecture.md`](../docs/security-architecture.md).
3. **Backups** — enable backups + PITR, run a **restore test**.
4. **Production** — only then create the production project and onboard the
   first real tenant (Clean24).

## Hard rule: "No Security = No Customer Data."

**Real customer data goes live only after auth, RLS and backup/restore are
verified.** No real leads, offers, jobs, customer records, bexio tokens or file
uploads before that — see [`../docs/security-architecture.md`](../docs/security-architecture.md).

## What this is NOT (yet)

- No connected database, no environment, no deployment.
- No auth wiring, no API routes, no Supabase client in the app.
- No real/committed data, no bexio API, no file storage. The only seed is a
  **fake, staging-only** script (`verification/002`, `@example.test` data).
- Not linked to the old standalone **Clean24 Lead Autopilot** (separate system).

## Next step

**v0.2.6 — Auth foundation + Supabase client architecture** (recommended): login,
sessions and RLS context, so that authenticated access exists **before** any real
tenant data. Staging schema/RLS are already verified (v0.2.5). Still no real
customer data until auth, RLS and backup/restore are verified.
