# Klarsa Core — Backup & Restore Runbook (v0.4.0)

> Step-by-step backup, point-in-time-recovery (PITR), external export, and a
> **mandatory restore test** for the **production** Supabase project. A backup
> you have never restored is not a backup. No secrets in this doc — all refs,
> keys and connection strings live only in the operator's env / Vercel.
> Gate: [`production-readiness-gate.md`](./production-readiness-gate.md).

## Principles

- **Restore-tested, not just configured.** "A backup exists" is not enough; the
  **restore procedure must be executed and pass** before go-live (and on a
  cadence after).
- **Restore to a NEW project first.** Never restore over a live production DB on
  a hunch — restore to a throwaway project, verify, then decide on cutover.
- **Defense in depth:** Supabase backups + PITR **and** an independent daily
  export stored **off** Supabase.

## 1. Supabase automated backups (production)

1. Supabase Dashboard → the **production** project → **Database → Backups**.
2. Confirm scheduled **daily** backups are enabled (plan-dependent).
3. Record: backup frequency, retention window, last successful backup time.
4. Set a calendar reminder to check backup health weekly.

## 2. Point-in-Time Recovery (PITR)

1. Dashboard → **Database → Backups → Point in Time** (requires a plan that
   supports PITR).
2. Enable PITR; note the **retention window** (e.g. 7 days) and the smallest
   recovery granularity.
3. PITR lets you recover to a specific timestamp — essential for "undo a bad
   migration / mass mistake at 14:32".

## 3. Daily external export (off Supabase)

Keep an independent copy outside Supabase (provider-failure / account-loss
protection). Run from a trusted operator machine / CI secret context — **never**
commit the connection string.

```bash
# Logical dump of the production database (custom format).
# The connection string comes from the operator's env, NOT the repo.
pg_dump "$KLARSA_PROD_DB_URL" -Fc -f "klarsa-prod-$(date +%F).dump"

# Store the dump in encrypted, access-controlled, off-Supabase storage
# (e.g. a private bucket with versioning). Apply the agreed retention.
```

- [ ] Daily export scheduled (cron / CI) with success/failure alerting.
- [ ] Exports encrypted at rest, access-controlled, retention applied.
- [ ] Export **excludes nothing critical** (schema + data of business tables).

## 4. Storage backup

- Currently there are **no file uploads** (no Storage buckets in use). When
  uploads are enabled, add a Storage backup (bucket copy/versioning) to this
  runbook — see [`security-architecture.md`](./security-architecture.md) §10/§12.

## 5. Restore procedure (step-by-step)

> Goal: produce a working copy of the data and prove the app + RLS work against
> it, before any cutover.

### 5a. Restore from a Supabase backup / PITR

1. Dashboard → production project → **Database → Backups**.
2. Choose the backup (or PITR timestamp) to restore.
3. Restore into a **new** target (a fresh project or Supabase's restore target) —
   do **not** overwrite the live production DB as a first move.
4. Wait for completion; note the restored timestamp.

### 5b. Restore from the external dump (provider-independent)

```bash
# Restore the logical dump into a FRESH, empty target project.
pg_restore --clean --if-exists --no-owner \
  -d "$KLARSA_RESTORE_TARGET_DB_URL" "klarsa-prod-YYYY-MM-DD.dump"
```

### 5c. Verify the restored database

- [ ] Row counts for key tables (`companies`, `leads`, `offers`, `jobs`,
      `bexio_handoffs`) match the expected pre-incident numbers (sanity).
- [ ] Run [`../supabase/verification/006_production_readiness_checks.sql`](../supabase/verification/006_production_readiness_checks.sql)
      → all **PASS** (RLS on, helpers present, audit_logs append-only).
- [ ] Point a **staging** app build at the restored DB (its own `.env.local`) and
      confirm: login works, `/app-shell` shows the right tenant, a tenant only
      sees its own rows (RLS intact).
- [ ] Spot-check the most recent records exist and are correct.

### 5d. Cutover (only if replacing production)

- [ ] Put the app in maintenance / brief read-only if needed.
- [ ] Repoint production env (Vercel) to the verified restored DB **or** promote
      it per Supabase's restore flow.
- [ ] Re-run `verification/006` against the now-live DB → all PASS.
- [ ] Announce recovery; record in the incident log
      ([`incident-recovery-runbook.md`](./incident-recovery-runbook.md)).

## 6. Restore TEST (mandatory before go-live, then on a cadence)

A scheduled drill that executes §5a–5c against a **throwaway** target — proving
the backups are usable.

- [ ] Perform a full restore to a fresh project from (a) a Supabase backup and
      (b) the external dump.
- [ ] §5c verification passes on the restored copy.
- [ ] Record the result below. **Cadence:** before go-live, then at least
      quarterly and after any major schema change.

| Date | Source (backup / PITR / dump) | Result | RLS check (006) | Verified by |
| --- | --- | --- | --- | --- |
| _(pending)_ | | NOT YET RUN | | |

## 7. Code / deployment rollback (Vercel)

- App code/deploys roll back independently of the database via **Vercel →
  Deployments → Promote a previous deployment**.
- A code rollback does **not** undo data changes — use DB restore/PITR for data.
- Keep DB migrations **additive/idempotent** so a code rollback stays compatible
  with the current schema (the project's standing rule).

## Sign-off

- [ ] Backups enabled · [ ] PITR enabled · [ ] Daily external export ·
      [ ] **Restore test PASSED** · [ ] Vercel rollback confirmed.

Until the restore test passes, the [real-data gate](./real-data-gate-policy.md)
stays **closed**.
