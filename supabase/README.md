# Klarsa Core — Supabase

Database foundation for **Klarsa Core**, the multi-tenant SaaS layer of Klarsa.
This folder contains **schema migrations only** — structure, not data.

> **Status (v0.2.2):** schema foundation + **staging setup plan**. Still **no
> database is connected**, **no credentials are committed**, and **no real
> customer data** exists. The migration is applied first to a throwaway
> **staging** project, validated with the RLS test plan, before anything else.

## Contents

```
supabase/
  migrations/
    001_klarsa_core_schema.sql   # enums, 20 tables, indexes, RLS + draft policies
  README.md                      # this file
```

Design rationale and table groups: see
[`../docs/supabase-schema-notes.md`](../docs/supabase-schema-notes.md). The
TypeScript mirror of the schema is [`../lib/database-types.ts`](../lib/database-types.ts).

## Staging setup & testing (v0.2.2)

Before any production project or real data, the migration is applied to a
throwaway **staging** project and validated. Three runbooks cover this:

| Doc | Purpose |
| --- | --- |
| [supabase-staging-setup.md](../docs/supabase-staging-setup.md) | Create the staging project, fill `.env.local`, apply the migration, verify tables/enums/functions/RLS |
| [rls-test-plan.md](../docs/rls-test-plan.md) | 10 RLS tests (tenant isolation, inactive member, append-only audit, no anon access, role-hardening gaps) |
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
- No seed data, no real customer data, no bexio API, no file storage.
- Not linked to the old standalone **Clean24 Lead Autopilot** (separate system).

## Next step

**v0.2.3 — create the staging project + verify the migration**, or begin the
**auth/RLS implementation plan**. Use the runbooks above (setup → seed → RLS
tests). Still no real customer data until auth, RLS and backup/restore are
verified.
