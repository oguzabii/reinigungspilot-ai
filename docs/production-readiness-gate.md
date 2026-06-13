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
- ✅ **Production project `klarsa-production` created** (separate secrets);
  migrations 001–006 applied; `verification/006` **PASS**; daily backups
  scheduled. (2026-06-13)
- ✅ **Clean24 production tenant + owner binding done** via the bootstrap script
  (config only, **no customer data**) — see
  [`clean24-production-bootstrap-results.md`](./clean24-production-bootstrap-results.md).
- ✅ **Vercel Production env + owner login working** at `https://klarsa.vercel.app`
  (prod env points at `klarsa-production`; `/app-shell` opens for the owner).
- 🟡 **Restore test PREPARED, not yet passed (2026-06-13):** a manual GitHub
  Actions logical restore-test workflow is added
  (`.github/workflows/production-restore-test.yml` +
  [`production-restore-test-github-actions.md`](./production-restore-test-github-actions.md))
  — low-cost (no new Supabase project, no local tools, no prod overwrite). Still
  to do: **run it + record the result**, and confirm **PITR + daily external
  export**. These remain the **blocking** items before owner GO.
- ❌ Several plan controls not yet implemented (audit-log writes wired in,
  rate-limiting, CSP, MFA). Tracked below.

**Therefore: real customer data stays BLOCKED** until the **restore test passes**
and the **owner signs GO** — even though the production tenant + owner login now
work. No real customer data has been added.

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

- [x] Separate **production** Supabase project exists (own ref/URL/keys/DB
      password/JWT secret), distinct from `klarsa-staging`. → doc 4 *(done 2026-06-13)*
- [x] Production secrets live **only** in Vercel/server env — never in the repo,
      never in `.env.local`, never in the client bundle. → doc 4 *(done 2026-06-13)*
- [x] `.gitignore` excludes `.env*` (only `.env.local.example` tracked); a secret
      scan of the repo/history is clean. → doc 4
- [x] Fake `verification/002` seed is **never** run on production; no
      `@example.test` data in production. → doc 4 *(only the production bootstrap ran)*

### B. Auth, RBAC & RLS (mandatory)

- [x] Supabase Auth in production; protected routes redirect when unauthenticated.
      *(owner login works; `/app-shell` opens, 2026-06-13)*
- [x] RLS **enabled on every table**, default deny — `verification/006` PASS on the
      production project. → doc 2 *(PASS on `klarsa-production`)*
- [x] Cross-tenant read/write is blocked — `verification/003` RLS tests PASS. → doc 2
      *(verified on staging — `003` is fake-data / staging-only by design)*
- [x] Role/domain matrix verified: owner/admin (manage), sales, ops, readonly
      (SELECT only), superadmin (cross-tenant read, never write). → doc 2
      *(verified on staging)*
- [x] **No service-role client** in any app route/action (grep clean). → doc 2
      *(verified v0.4.0)*
- [x] `audit_logs` is append-only (no UPDATE/DELETE policy) — `verification/006` PASS.

### C. Backup, restore & recovery (mandatory)

- [x] Supabase automated **backups** enabled on production. *(daily backup
      scheduled, 2026-06-13)*
- [ ] **PITR** enabled on production. → doc 3
- [ ] **Daily external export** (off-Supabase) configured. → doc 3
- [ ] **Restore test PASSED** (restore to a fresh project, verify data + RLS +
      login) and recorded — not just "a backup exists". → doc 3
      *(GitHub Actions workflow prepared 2026-06-13 — run & record to pass)*
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
| Reason | Production tenant + owner login work (2026-06-13); the restore-test **workflow is prepared but not yet run/passed** (PITR / daily external export also pending) |
| Mandatory items complete | No — A + B done; **C/D pending**, restore test is the blocker |
| Restore test passed | No |
| Decided by | _(owner)_ |
| Date | _(pending)_ |

Until this records **GO**, **no real customer data is entered** — the
`klarsa-production` tenant holds **config only** (company, owner, services,
sources). See the binding policy in
[`real-data-gate-policy.md`](./real-data-gate-policy.md).

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
