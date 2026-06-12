# Klarsa Core — Staging vs Production Separation (v0.4.0)

> Explicit rules so **staging and production never mix**: separate projects,
> separate secrets, fake data on staging only, real data on production only.
> No secrets in this doc. Gate:
> [`production-readiness-gate.md`](./production-readiness-gate.md).

## Two separate Supabase projects

| | `klarsa-staging` | `klarsa-production` (to create) |
| --- | --- | --- |
| Purpose | schema/RLS/workflow testing | real Clean24 tenant |
| Data | **fake** `@example.test` only | **real** customer data (after the gate) |
| Project ref / URL | distinct | distinct |
| Anon key | distinct | distinct |
| Service-role key | distinct, **server-only** | distinct, **server-only** |
| DB password / JWT secret | distinct | distinct |
| Backups / PITR | optional | **required** (see backup runbook) |

- [ ] Production is a **separate Supabase project** with its **own** ref, URL,
      anon key, service-role key, DB password and JWT secret. **Never** reuse or
      share staging credentials.
- [ ] Rotating/leaking a staging key never affects production and vice versa.

## Secret & environment separation

- **Local dev (`.env.local`)** points at **staging only**. It is **git-ignored**
  (`.gitignore` excludes `.env*`); only `.env.local.example` (placeholders) is
  tracked. Never put production secrets in local dev.
- **Vercel env:** map **Preview/Development → staging**, **Production →
  production** project. Production secrets live only in Vercel's Production
  environment, never in the repo, never in the client bundle.
- The **service-role key** is server-only (bypasses RLS) — never `NEXT_PUBLIC_*`,
  never logged, never client-side. Only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to the browser.
- [ ] A repo/history secret scan is clean (no URL/anon/service-role/DB password/
      JWT committed). If a secret is ever found: **rotate immediately** and purge.

## Data rules (no crossover)

- [ ] **No real data on staging.** Staging uses only fake `@example.test` data.
- [ ] **No fake data on production.** The fake seed
      [`verification/002_fake_seed_for_rls_tests.sql`](../supabase/verification/002_fake_seed_for_rls_tests.sql)
      and the RLS test seed are **STAGING-ONLY** — never run them on production.
- [ ] `verification/003_rls_test_queries.sql` runs in a rolled-back transaction
      and simulates users; still treat it as a **staging** activity.
- [ ] `verification/006_production_readiness_checks.sql` is **read-only** and safe
      on either environment (structure only, no row reads).

## Migration flow (staging → production)

Migrations are **additive/idempotent** and applied to **staging first**, verified,
then production. (See [`../supabase/README.md`](../supabase/README.md).)

1. Apply the migration(s) on **staging**.
2. Run `verification/001` (schema) and, on a fake-seeded copy, `verification/003`
   (RLS) — expect PASS.
3. Only then apply the **same** migration(s) on **production**, in order.
4. Run `verification/006` (read-only) on production — expect all PASS.
5. Record the production apply (date, migrations, verifier).

> **Do not** apply a migration to production that has not first passed on staging.
> Never edit an already-applied migration (001–006 are immutable); add the next
> numbered migration instead.

## Access separation

- [ ] Production Supabase Dashboard access limited to the owner (+ minimal trusted
      operators); least privilege.
- [ ] Production DB credentials are not shared in chat, tickets, or the repo.
- [ ] CI/automation uses scoped, rotat­able secrets stored in the CI secret store.

## Deploy / branch mapping

- `master` → Vercel **Production** (production Supabase env) — only after the gate.
- Preview branches/PRs → Vercel **Preview** (staging Supabase env).
- A code rollback (Vercel) is independent of the DB; data recovery uses the
  [backup/restore runbook](./backup-restore-runbook.md).

## Sign-off

| Check | Result | Verified by | Date |
| --- | --- | --- | --- |
| Separate production project (own secrets) | _(pending)_ | | |
| Production secrets only in Vercel env | _(pending)_ | | |
| Repo/history secret scan clean | _(pending)_ | | |
| Fake seed never run on production | _(pending)_ | | |
| Migration order staging → production documented | **YES (this doc)** | | 2026-06-12 |
