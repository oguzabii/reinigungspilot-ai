# Klarsa Core — Production Readiness Gate (v0.4.0)

> **Status: GATE — NOT READY for production data.** This is the single entry
> point that turns the [security plan](./security-architecture.md) into an
> actionable, signed-off gate. **No real Clean24 customer data may enter the
> system until every mandatory item below is manually verified and signed off.**
> This document and its companions are **policy + runbooks only** — no new
> product features, no real data, no credentials, no external integrations.

## The hard rule

> **"No Security = No Customer Data."** No real customer account, company data,
> bexio token, file upload, or real lead/offer/job/contact data goes live before
> the controls in this gate are implemented **and tested**. This rule overrides
> every feature wish. (See [`security-architecture.md`](./security-architecture.md).)

## Where we are (honest current state)

- ✅ The full `/app-shell` foundation chain is built and **staging-verified** on
  `klarsa-staging` (Lead Inbox → Lead Hunter/Radar/Sources/Source→Opportunity/
  Swiss Radar → Offers/PDF → Jobs/ICS → bexio handoff → CEO-Briefing).
- ✅ Role-aware RLS (7 SECURITY DEFINER helpers, per-command policies) verified on
  staging (`docs/supabase-staging-results.md`).
- ✅ App uses the **session/anon client only** — the service-role client is never
  imported by any route or server action (see the RLS checklist).
- ❌ **No production Supabase project yet.** No backups/PITR enabled. **No restore
  test performed.** No staging↔production separation in place operationally.
- ❌ Several plan controls are not yet implemented (audit-log writes wired in,
  rate-limiting, CSP, MFA). These are tracked below.

**Therefore: production use is BLOCKED.** Staging + fake `@example.test` data only.

## Companion documents (read these)

| # | Document | Covers |
| --- | --- | --- |
| 1 | this file | Master checklist + GO/NO-GO decision |
| 2 | [security-rls-verification-checklist.md](./security-rls-verification-checklist.md) | Tenant isolation, role/domain matrix, no service-role in app, how to verify |
| 3 | [backup-restore-runbook.md](./backup-restore-runbook.md) | Backups, PITR, external export, **step-by-step restore + restore test** |
| 4 | [staging-production-separation.md](./staging-production-separation.md) | Two projects, env/secrets separation, migration flow |
| 5 | [real-data-gate-policy.md](./real-data-gate-policy.md) | What must be true before real Clean24 data; sign-off |
| 6 | [incident-recovery-runbook.md](./incident-recovery-runbook.md) | Secret leak, data loss, bad deploy/migration, RLS regression |
| 7 | [clean24-data-handling-policy.md](./clean24-data-handling-policy.md) | Export, deletion, access, audit, retention for the Clean24 tenant |

Requirements source: [`security-architecture.md`](./security-architecture.md).
RLS tests: [`rls-test-plan.md`](./rls-test-plan.md). Schema/apply:
[`../supabase/README.md`](../supabase/README.md).

## Master readiness checklist

Each item is **manually verified** and dated by the **owner** before go-live.
"Mandatory" items block production data; "recommended" items should follow soon.

### A. Environment & separation (mandatory)

- [ ] Separate **production** Supabase project exists (own ref/URL/keys/DB
      password/JWT secret), distinct from `klarsa-staging`. → doc 4
- [ ] Production secrets live **only** in Vercel/server env — never in the repo,
      never in `.env.local`, never in the client bundle. → doc 4
- [ ] `.gitignore` excludes `.env*` (only `.env.local.example` tracked); a secret
      scan of the repo/history is clean. → doc 4
- [ ] Fake `verification/002` seed is **never** run on production; no
      `@example.test` data in production. → doc 4

### B. Auth, RBAC & RLS (mandatory)

- [ ] Supabase Auth in production; protected routes redirect when unauthenticated.
- [ ] RLS **enabled on every table**, default deny — `verification/006` PASS on the
      production project. → doc 2
- [ ] Cross-tenant read/write is blocked — `verification/003` RLS tests PASS. → doc 2
- [ ] Role/domain matrix verified: owner/admin (manage), sales, ops, readonly
      (SELECT only), superadmin (cross-tenant read, never write). → doc 2
- [ ] **No service-role client** in any app route/action (grep clean). → doc 2
- [ ] `audit_logs` is append-only (no UPDATE/DELETE policy) — `verification/006` PASS.

### C. Backup, restore & recovery (mandatory)

- [ ] Supabase automated **backups** enabled on production.
- [ ] **PITR** enabled on production. → doc 3
- [ ] **Daily external export** (off-Supabase) configured. → doc 3
- [ ] **Restore test PASSED** (restore to a fresh project, verify data + RLS +
      login) and recorded — not just "a backup exists". → doc 3
- [ ] Code/deploy **rollback** path (Vercel) confirmed. → doc 3
- [ ] [Incident/recovery runbook](./incident-recovery-runbook.md) reviewed. → doc 6

### D. Data handling & operations (mandatory)

- [ ] [Clean24 data handling policy](./clean24-data-handling-policy.md)
      acknowledged: access, export, deletion, audit, retention. → doc 7
- [ ] Soft-delete/restore in place for customer tables (`deleted_at`); hard delete
      only via a controlled, audited process.
- [ ] No secrets/tokens in logs; only **hashed** IPs; error logs redact sensitive
      fields.

### E. Recommended before/soon after go-live

- [ ] MFA/2FA for owner/admin (when available).
- [ ] Rate-limiting on login + write/expensive routes.
- [ ] Server-side input validation at every action boundary; CSP/security headers.
- [ ] Audit-log writes wired into create/update/delete/export/restore actions.
- [ ] Private storage + signed URLs + file-type/size limits + malware scan (only
      when uploads are enabled).
- [ ] Encrypted bexio tokens via `secret_ref`; no token logging (only when bexio
      Connect is enabled). → [`bexio-architecture.md`](./bexio-architecture.md)

## GO / NO-GO decision

Production onboarding of the first real tenant (**Clean24 Memis GmbH**) is
**GO** only when **all mandatory items (A–D)** are checked, dated and signed by
the owner, **and** the restore test passed.

| Field | Value |
| --- | --- |
| Decision | **NO-GO (current)** |
| Reason | No production project / no backups / no restore test yet |
| Mandatory items complete | No |
| Restore test passed | No |
| Decided by | _(owner)_ |
| Date | _(pending)_ |

Until this records **GO**, the system runs on **staging with fake data only**.
See the binding policy in [`real-data-gate-policy.md`](./real-data-gate-policy.md).

## NOT in scope (v0.4.0)

- No new product features, no real data, no credentials/secrets/tokens.
- No real bexio API/OAuth, no external integrations, scraping, email, uploads, or
  AI API calls.
- No changes to migrations 001–006 (this is policy + read-only checks only).

## Next step

Work the mandatory checklist (create the production project, enable backups +
PITR, run the **restore test**, confirm separation, run `verification/006` on
production). When all pass and the owner signs **GO**, onboard Clean24. Offer PDF
polish remains deferred until requested.
