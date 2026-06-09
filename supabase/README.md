# Klarsa Core — Supabase

Database foundation for **Klarsa Core**, the multi-tenant SaaS layer of Klarsa.
This folder contains **schema migrations only** — structure, not data.

> **Status (v0.2.1):** schema foundation. **No database is connected**, **no
> credentials are committed**, and **no real customer data** exists. The
> migration is a plan to be applied later, in a **staging** project first.

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

## No credentials are committed

This repository contains **no** Supabase URL, anon key, service-role key,
database password, JWT secret, or any other secret. The `.gitignore` excludes
`.env*`. When a project is created later, configuration goes into untracked
environment variables (documented in v0.2.2), never into the repo.

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

**v0.2.2 — Supabase staging setup + env documentation:** create a staging
project, document required environment variables (untracked), apply this
migration to staging and run the RLS/cross-tenant tests.
