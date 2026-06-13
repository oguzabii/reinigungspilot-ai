# Klarsa Core — Clean24 Production Tenant Bootstrap (v0.4.1)

> **Status: RUN & VERIFIED on production (2026-06-13).** The script ran on
> `klarsa-production`; the verification query returned the expected config-only
> result (owner bound, all customer-data counts 0), and the owner logged in at
> `https://klarsa.vercel.app`. No real customer data. Real-data go-live is still
> **NO-GO** until the restore test + owner GO. Result:
> [`clean24-production-bootstrap-results.md`](./clean24-production-bootstrap-results.md).

> **PRODUCTION ONLY.** A production-safe script that sets up the **Clean24 Memis
> GmbH** tenant on the `klarsa-production` project: the company row, settings,
> the owner membership, package/access/billing status, and the company's own
> service/source **config** catalog. **No customer data** (no leads, prospects,
> offers, jobs, follow-ups), **no fake/demo/staging data**, **no credentials**,
> **no real auth UID in the repo**. Part of the production readiness gate
> ([`production-readiness-gate.md`](./production-readiness-gate.md)).

Script: [`../supabase/production/001_create_clean24_production_tenant.sql`](../supabase/production/001_create_clean24_production_tenant.sql)

## Before you run

1. **Migrations applied.** `klarsa-production` already has migrations 001–006
   applied (confirmed) and `verification/006_production_readiness_checks.sql`
   returned PASS.
2. **Owner auth user exists.** The production owner user was created manually in
   **Supabase → Authentication → Users** on `klarsa-production`. Copy its
   **User UID** (a UUID).
3. **Replace the placeholder.** In a local working copy of the script, replace
   the token **`CLEAN24_OWNER_AUTH_USER_ID`** (it appears once, in the
   owner-binding `DO` block) with that UUID — keep the single quotes.
   - **Never commit the real UID back into the repo.** The committed copy keeps
     the placeholder. If you forget to replace it, the script **fails loudly**
     (invalid uuid) and the owner-binding step changes nothing.
4. **Right project.** Run it in the **SQL editor of `klarsa-production` only**.

## What it does (idempotent)

Re-running updates rows in place (fixed config UUIDs + on-conflict upserts):

| Table | Effect |
| --- | --- |
| `companies` | Clean24 Memis GmbH — **Premium**, `billing_status = internal_founder`, `access_status = full`, `billing_provider = internal`, `status = active`, all 26 cantons |
| `company_settings` | default VAT 8.10, `sender_name = Clean24`, **no** sender email (no email sending) |
| `company_services` | Clean24's own service catalog (config) |
| `lead_sources` | minimal, human-approved source baseline (config): Manuell, Empfehlung, Website Anfrage, Verwaltung |
| `user_profiles` | a profile row for the owner auth user (email read from `auth.users`, **not** hardcoded) |
| `company_members` | the **owner** membership (`role = 'owner'`, active) |

It writes **no** customer records: leads, prospects, offers, jobs, follow-ups,
scores, audit rows and bexio tokens are all left untouched.

## Do NOT run the staging/fake scripts on production

These are **STAGING ONLY** and must never run on `klarsa-production`:

- `supabase/verification/002_fake_seed_for_rls_tests.sql` (fake `@example.test` data)
- `supabase/verification/003_rls_test_queries.sql` (fake-data RLS tests)
- `supabase/verification/004_bind_auth_user_to_fake_tenant.sql` (fake-tenant bind)
- `supabase/verification/005_create_clean24_staging_tenant.sql` (staging tenant)

The read-only `supabase/verification/006_production_readiness_checks.sql` is safe
on either environment (structure only, no row reads).

See [`staging-production-separation.md`](./staging-production-separation.md).

## Verify after running

Run the **read-only** verification query at the bottom of the script. Expect:

- `tier = premium`, `status = active`, `billing_status = internal_founder`.
- `owners = 1` (the owner membership exists and is active).
- `services > 0`, `sources > 0` (config present).
- `leads / offers / jobs / prospects = 0` — **no customer data**.

Spot-check in the app later (after Vercel production env is wired): logging in as
the owner shows the Clean24 tenant with all module counts at 0.

## Still NO-GO for real customer data

Setting up the tenant config + owner is **not** the green light for real data.
Real customer leads/offers/jobs/contacts/bexio data remain **blocked** until:

- Vercel **Production** env points at `klarsa-production` and owner login works.
- The full [real-data gate](./real-data-gate-policy.md) is met: backups + PITR +
  **restore test passed**, RLS/role checks verified on production
  ([`security-rls-verification-checklist.md`](./security-rls-verification-checklist.md)),
  and the **owner signs GO** in
  [`production-readiness-gate.md`](./production-readiness-gate.md).

Until then: tenant **config** only, no customer data. The old standalone
**Clean24 Lead Autopilot** stays separate (no import/coupling).

## Next step

Wire Vercel **Production** to `klarsa-production` (server-only secrets), confirm
owner login at `/app-shell`, complete the gate's mandatory items, and record the
**GO** decision before any real Clean24 data is entered.
