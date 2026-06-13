# Klarsa Core — GitHub Actions Logical Restore Test (v0.4.2 prep)

> A **low-cost, manual** way to run the production restore test without local
> tools and **without creating another Supabase project**. A manual GitHub
> Actions workflow dumps the production `public` schema, restores it into a
> **throwaway Postgres on the runner**, and verifies the application schema +
> Clean24 config survive the round-trip. **Read-only against production, never
> overwrites anything, never uploads the dump, prints no secrets.** Part of the
> [production readiness gate](./production-readiness-gate.md);
> see also the [backup/restore runbook](./backup-restore-runbook.md).

Workflow: [`../.github/workflows/production-restore-test.yml`](../.github/workflows/production-restore-test.yml)

## Why this approach

- **No new Supabase project** → no extra cost. The restore target is an
  **ephemeral local Postgres** that lives only for the duration of one CI run.
- **No local tools** (no pg_dump/pg_restore/Docker on your machine) — the
  GitHub-hosted Ubuntu runner provides them.
- **No production overwrite** — production is only ever **read** (`pg_dump`).
- The dump never leaves the runner: `/tmp` only, **no artifact upload**, deleted
  at the end, runner destroyed afterwards.

## One-time setup — add the GitHub Actions secret

1. Get the production connection string from Supabase → `klarsa-production` →
   **Settings → Database → Connection string**. Use the **Session Pooler** URI
   (not the Transaction Pooler / port 6543) — the session pooler is IPv4-friendly
   and supports `pg_dump`. Append `?sslmode=require` if it isn't already present.
2. In GitHub → repo **Settings → Secrets and variables → Actions → New
   repository secret**:
   - **Name:** `KLARSA_PROD_DB_URL`
   - **Value:** the Session Pooler URI (includes the DB password).
3. **Never** paste this URL into chat, a PR, an issue, the repo, or `.env.local`.
   It is a secret. If it ever leaks, rotate the DB password in Supabase.

> The throwaway target's credentials (`postgres:postgres@localhost`) are **not**
> secrets — that container is local to the runner and destroyed with it.

## How to run

1. GitHub → **Actions** tab → **"Production restore test (manual)"**.
2. **Run workflow** (it is `workflow_dispatch` only — never runs automatically).
3. Watch the logs. The job fails (red ✗) if any check fails; it succeeds (green
   ✓) when all checks pass.

## What PASS means

The workflow checks, on the restored copy:

**a) Application restore integrity** — proves the migrations' objects round-trip:
- `public` has all **20** tables, **RLS enabled on every one**, each with ≥1
  policy (default deny),
- the **8** role-aware helper functions exist,
- `audit_logs` is **append-only** (no UPDATE/DELETE/ALL policy).

**b) Clean24 bootstrap config** — proves the tenant data round-trips with **no
customer data**:
- `company_services = 8`, `lead_sources = 4`, `owners = 1`,
- `leads = 0`, `offers = 0`, `jobs = 0`, `prospects = 0`.

A green run = the production backup of the **application-owned schema + Clean24
config** is **restorable and intact**.

## Honest limitations

- **Scope: the application-owned `public` schema only.** A full `pg_dump` of a
  Supabase database does **not** restore onto plain Postgres — the
  Supabase-managed `auth`, `storage`, `realtime`, `extensions` schemas, their
  extensions (pgsodium, pg_graphql, …) and roles (`anon`, `authenticated`,
  `service_role`, …) do not exist there. Those are **platform** concerns,
  recovered via **Supabase's own backups / PITR** — not this test.
- To restore the `public` dump, the workflow creates **minimal stubs**:
  `auth.uid()/role()/jwt()`, an empty `auth.users` table (the `user_profiles` FK
  target), and the Supabase roles as `NOLOGIN`. Data is loaded with **FK triggers
  disabled** (the stub `auth.users` stays empty by design).
- Therefore this validates **our migrations + our data** (the part Klarsa owns
  and is most likely to need to restore), and **complements** — does not replace
  — Supabase's managed backup/PITR for the full platform schema.
- It uses the **Session Pooler**; the dump is logical (not a physical/PITR
  restore).

## Real data stays NO-GO

A green workflow is **necessary but not sufficient**. Real Clean24 customer data
remains **NO-GO** until:

- this restore test **passes** and the result is recorded
  (`clean24-backup-restore-test-results.md`, then the gate's checklist + GO/NO-GO
  are updated), **and**
- PITR + a daily external export are confirmed, **and**
- the **owner signs GO** in
  [`production-readiness-gate.md`](./production-readiness-gate.md) /
  [`real-data-gate-policy.md`](./real-data-gate-policy.md).

## Next step

Add the `KLARSA_PROD_DB_URL` secret, run the workflow, and record the result.
When it passes and the owner signs GO, real-data onboarding can proceed. **Offer
PDF polish remains deferred** until requested.
