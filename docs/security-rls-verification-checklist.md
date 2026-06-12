# Klarsa Core — Security / RLS Verification Checklist (v0.4.0)

> A hands-on checklist to **verify** (not just describe) tenant isolation,
> role-based write domains, and that the app never uses the RLS-bypassing
> service-role client. Run on a project (staging first, then production) and
> sign off. Requirements source: [`security-architecture.md`](./security-architecture.md);
> test cases: [`rls-test-plan.md`](./rls-test-plan.md); gate:
> [`production-readiness-gate.md`](./production-readiness-gate.md).

## How to run

1. **Structure (read-only):** run
   [`../supabase/verification/006_production_readiness_checks.sql`](../supabase/verification/006_production_readiness_checks.sql)
   in the project's SQL editor — every row must be **PASS** (INFO rows are
   context). Safe on staging or production (no writes, no row reads).
2. **Behavioural RLS (staging only):** run
   [`../supabase/verification/003_rls_test_queries.sql`](../supabase/verification/003_rls_test_queries.sql)
   on a project seeded with fake data
   ([`002_fake_seed_for_rls_tests.sql`](../supabase/verification/002_fake_seed_for_rls_tests.sql))
   — every line must print **PASS**. Do **not** run the fake seed on production.
3. **Code (no service-role in app):** run the grep below — it must return only
   the definition file.

## 1. Tenant isolation (`company_id`)

- [ ] Every business table carries `company_id` and is RLS-scoped to the caller's
      active company (membership in `company_members`, active only).
- [ ] A member of company A **cannot read** company B's rows (cross-tenant SELECT
      test in `003`).
- [ ] A member of company A **cannot write** company B's rows (cross-tenant
      INSERT/UPDATE/DELETE test in `003`).
- [ ] Anonymous (no session) gets **no rows** from any business table.
- [ ] App actions add defense-in-depth `.eq("company_id", activeCompanyId)` and
      verify linked rows (lead/offer/job/source) belong to the active tenant
      before writing (already the pattern across `app/app-shell/**/actions.ts`).

## 2. Role & write-domain matrix

Reads = any **active** member of the company (or superadmin). Writes depend on
role, enforced **server-side by RLS** (per-command policies; DELETE uses the
write predicate, so `readonly` has SELECT only).

| Role | Can write | Verify |
| --- | --- | --- |
| `owner` / `admin` | everything (settings, services, pricing, **lead_sources**, members, company, **bexio**) + all operational | `can_manage_company` / `can_write_settings` |
| `sales` | leads, prospects, offers, offer_items, followup_tasks (+ append lead_scores/lead_activities) | `can_write_sales` |
| `ops` | jobs, job_notes, followup_tasks | `can_write_ops` |
| `readonly` | **nothing** — SELECT only | write attempts rejected |
| `superadmin` | **nothing** — cross-tenant **read** only | never writes |

Checklist:

- [ ] `readonly` user: every INSERT/UPDATE/DELETE is rejected; SELECT works.
- [ ] `sales` user: can write leads/prospects/offers/offer_items/follow-ups;
      **cannot** write jobs (ops), settings, lead_sources, or bexio_handoffs.
- [ ] `ops` user: can write jobs/job_notes/follow-ups; **cannot** write
      leads/offers (sales) or settings.
- [ ] `owner`/`admin`: can write settings, `lead_sources` (Source Registry), and
      `bexio_handoffs` (bexio handoff); these are NOT writable by sales/ops.
- [ ] `superadmin`: can read across companies but **no** write anywhere.

> **App-domain mapping (matches RLS):** leads/prospects/offers = sales
> (`can_write_sales`); jobs = ops (`can_write_ops`); follow-ups = sales **or**
> ops; `lead_sources` = settings (`can_write_settings`, owner/admin);
> `bexio_handoffs` = manage (`can_manage_company`, owner/admin). The CEO-Briefing
> (`/app-shell/ceo`) is **read-only** (no writes at all).

## 3. RLS posture (structural — `verification/006`)

- [ ] RLS **enabled** on all 20 tables (no table with `relrowsecurity = false`).
- [ ] Every table has ≥1 policy (**default deny** — no policy means no access).
- [ ] All 8 helper functions present (`member_role_for`, `can_read_company`,
      `can_manage_company`, `can_write_sales`, `can_write_ops`,
      `can_write_settings`, `can_superadmin`, `set_updated_at`).
- [ ] `audit_logs` is **append-only**: SELECT + INSERT policies, **no** UPDATE/
      DELETE — not even for `owner`.

## 4. No service-role (RLS-bypassing) client in app code

The service-role key **bypasses RLS**. It must exist only in the server-only
helper and must **not** be imported by any route or server action.

```bash
# Must return ONLY lib/supabase/admin.ts (the definition) — never an app/ file.
grep -rn "createAdminClient\|lib/supabase/admin" app/ lib/auth/
```

- [ ] The grep returns no `app/**` or `lib/auth/**` usage — only the definition
      in `lib/supabase/admin.ts` (referenced by comments in
      `server.ts`/`browser.ts`/`env.ts`).
- [ ] All tenant reads use `lib/supabase/server.ts` (session/anon, RLS-respecting);
      all writes go through server actions using the same session client.
- [ ] `createAdminClient()` (`lib/supabase/admin.ts`) throws in a browser context
      and if the key is missing; never `"use client"` on a file importing it.
- [ ] No service-role key, anon key, URL, DB password, or JWT secret is committed
      anywhere in the repo or history.

> **Verified at v0.4.0:** the grep returns only `lib/supabase/admin.ts`,
> `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `lib/env.ts` (all
> definitions/comments) — **no app route or server action uses the service-role
> client.**

## 5. Auth & session

- [ ] No access without a valid session — `/app-shell/**` redirects to `/login`
      when unauthenticated (already enforced; every page is `force-dynamic`).
- [ ] Session cookies are `HttpOnly`/secure (Supabase SSR defaults).
- [ ] Password policy + email verification enabled in the production project.
- [ ] (Recommended) MFA/2FA for owner/admin once available.

## Sign-off

| Item | Project | Result | Verified by | Date |
| --- | --- | --- | --- | --- |
| `verification/006` all PASS | _(staging)_ | _(pending)_ | | |
| `verification/006` all PASS | _(production)_ | _(pending)_ | | |
| `verification/003` all PASS | _(staging)_ | _(pending)_ | | |
| Role matrix (readonly/sales/ops/owner/superadmin) | _(staging)_ | _(pending)_ | | |
| No service-role in app (grep) | _(repo)_ | **PASS (v0.4.0)** | | 2026-06-12 |

No real customer data until this checklist passes on the production project — see
[`real-data-gate-policy.md`](./real-data-gate-policy.md).
