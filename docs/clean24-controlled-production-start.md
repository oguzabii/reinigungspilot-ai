# Klarsa Core — Clean24 Controlled Production Start (v0.4.2)

> **Status: LIMITED GO — controlled Clean24 owner use only.** The owner has
> decided to begin **limited, monitored** real production use, entering their own
> Clean24 business data **through the production app UI**, while the **restore
> test is deferred** and the residual backup/restore **risk is explicitly
> accepted**. This is **not** a broad rollout: no external/other-tenant
> onboarding, and **no SQL/bulk import of customer data**, until the restore test
> passes. Governs together with
> [`production-readiness-gate.md`](./production-readiness-gate.md) and
> [`real-data-gate-policy.md`](./real-data-gate-policy.md).

| | |
| --- | --- |
| **Date** | 2026-06-13 |
| **Decision** | LIMITED GO for controlled Clean24 owner use |
| **Decided by** | Owner (Clean24 Memis GmbH) |
| **Restore test** | **Deferred** (workflow prepared, not yet run/passed) |
| **Risk** | Known backup/restore risk **accepted** for the controlled start |

## What is verified (production)

- `klarsa-production` schema applied (migrations 001–006); readiness check
  (`verification/006`) **PASS**; daily Supabase backup visible.
- Clean24 production **tenant + owner binding** verified (config only) —
  [`clean24-production-bootstrap-results.md`](./clean24-production-bootstrap-results.md).
- Vercel **Production env + owner login** verified at `https://klarsa.vercel.app`
  (`/app-shell` opens for the owner).

## The decision (honest)

- The **restore test is deferred.** A daily Supabase backup exists, but it has
  **not yet been restore-validated** (the GitHub Actions workflow is prepared but
  not run — [`production-restore-test-github-actions.md`](./production-restore-test-github-actions.md)).
- The **owner accepts** the resulting residual risk: should data loss occur
  before the restore test is validated, recovery relies on the (un-tested)
  Supabase daily backup. The owner accepts this for **limited early use of their
  own data**.
- Therefore the gate moves from full NO-GO to **LIMITED GO** — scoped strictly to
  controlled owner use.

## Rules for the controlled start

**Allowed**
- The **owner** entering **their own** Clean24 business data **through the
  production app UI** (`https://klarsa.vercel.app`) — leads, offers, jobs,
  follow-ups, etc., created the normal way via the authenticated session (RLS).
- Limited, **monitored** first use (a handful of real records to validate the
  real workflow end-to-end).

**Not allowed**
- **No SQL seed/import** of customer data — production data must enter **only**
  through the app UI. (The `supabase/production/001…` script remains
  **config-only**; never extend it with customer rows.)
- **No bulk import** and **no broad rollout** — no external/other-customer/other-
  tenant onboarding until the restore test passes.
- **No service-role** for data entry; no DB-side inserts of customer rows.
- **No customer PII anywhere in the repo, docs, commit messages, or prompts** —
  no names, addresses, phone numbers, or emails. This document and all docs
  describe **policy only**, never real data.
- No staging/fake scripts (`verification/002–005`) on production; no bexio API.

## First production use — limited & monitored

- Start with a **small number** of real records via the UI.
- **Monitor**: confirm RLS scoping (only Clean24 sees its data), check the CEO
  briefing / counts look right, watch for errors.
- Keep a manual note (outside the repo) of what was entered, so it can be
  re-created if needed before the restore test is validated.

## Still required before scaling

- **Run the restore test** (the prepared GitHub Actions workflow) and **record**
  the result (`clean24-backup-restore-test-results.md`), confirm **PITR + a daily
  external export**, then the owner records a full **GO**.
- Only **after** that may the rollout broaden (more volume, additional
  users/customers, or any future safe import feature).

## Decision record

| Date | Version | Decision | Restore test | Risk accepted | Decided by |
| --- | --- | --- | --- | --- | --- |
| 2026-06-13 | v0.4.2 | **LIMITED GO** (controlled Clean24 owner use, UI only) | Deferred | Yes | Owner |

> A future row records the full **GO** once the restore test passes. Real
> customer data only ever enters via the **app UI** — never via SQL/import while
> this controlled-start exception is in effect.
