# Klarsa Core — Real-Data Gate Policy (v0.4.0)

> **Binding policy:** real Clean24 customer data is **blocked** from the system
> until the production readiness gate is fully met, manually verified, and signed
> off by the owner. This is the enforcement statement behind
> [`production-readiness-gate.md`](./production-readiness-gate.md) and the hard
> rule **"No Security = No Customer Data."**

## What counts as "real customer data"

Any non-fictional data about real people/companies, including:

- Real leads, prospects, offers, jobs, contacts, addresses, phone numbers,
  emails.
- Real bexio tokens / connections, invoices, or financial figures.
- Any uploaded customer file.
- Any production tenant record for **Clean24 Memis GmbH** beyond the
  config-only founder setup.

Fictional `@example.test` staging data is **not** real data and is allowed on
staging only.

## The gate (all mandatory before real data)

Production data entry/import is permitted **only when every item is true and
recorded**:

1. **Production project** exists, separate from staging, with its own secrets.
   → [`staging-production-separation.md`](./staging-production-separation.md)
2. **Auth** live; protected routes deny unauthenticated access.
3. **RLS** enabled on every table, default deny; `verification/006` **PASS** on
   production; cross-tenant tests (`verification/003`) **PASS** on staging.
   → [`security-rls-verification-checklist.md`](./security-rls-verification-checklist.md)
4. **Role/domain matrix** verified (owner/admin, sales, ops, readonly,
   superadmin); **no service-role** client in any app route/action.
5. **`audit_logs` append-only** (no UPDATE/DELETE policy).
6. **Backups + PITR** enabled, **daily external export** configured, and the
   **restore test PASSED**. → [`backup-restore-runbook.md`](./backup-restore-runbook.md)
7. **Secrets** only in server/Vercel env; repo/history secret scan clean.
8. **Soft-delete/restore** in place; hard delete only via a controlled, audited
   process. → [`clean24-data-handling-policy.md`](./clean24-data-handling-policy.md)
9. **Incident/recovery runbook** reviewed.
   → [`incident-recovery-runbook.md`](./incident-recovery-runbook.md)
10. **Data handling policy** for the Clean24 tenant acknowledged (access, export,
    deletion, audit, retention).

> Items explicitly **not required** to flip this gate (but recommended soon):
> MFA, rate-limiting, CSP, full audit-write wiring, storage/malware scan, bexio
> token encryption (only when those features are switched on). They must not be
> used as a reason to bypass items 1–10.

## Who decides

- **Owner** signs the GO/NO-GO. Admins may prepare evidence but do not flip the
  gate alone.
- The decision is recorded below and in
  [`production-readiness-gate.md`](./production-readiness-gate.md).

## Controlled-start exception (v0.4.2 — LIMITED GO)

The owner has authorised a **LIMITED GO** for controlled use ahead of the full
gate, **accepting** the deferred-restore-test risk — see
[`clean24-controlled-production-start.md`](./clean24-controlled-production-start.md).
Under this exception:

- **Allowed:** the **owner** entering **their own** Clean24 production data
  **through the production app UI** (authenticated session, RLS).
- **Not allowed:** SQL imports, bulk imports, any DB-side insert of customer
  rows, service-role data entry, or **customer data in commits, docs, or
  prompts**.
- **Scope:** controlled **owner** use only — **no broad rollout, no external
  customer onboarding**.
- The **restore test remains required before scaling**; a future full **GO**
  supersedes this exception.

## Until the gate is GO

- **Outside** the controlled-start exception above, the system runs on
  **staging** with **fake `@example.test`** data only.
- No real Clean24 data is **imported** (SQL/bulk) or connected — the only real
  data permitted is **owner UI entry** under the v0.4.2 exception.
- The public sales demo (v0.1.7) stays fictional (`Muster Service GmbH`).
- The old standalone **Clean24 Lead Autopilot** stays separate — no migration,
  import, or coupling.

## Decision record

| Date | Version | Decision | Mandatory items complete | Restore test | Signed by |
| --- | --- | --- | --- | --- | --- |
| 2026-06-12 | v0.4.0 | **NO-GO** | No | Not run | _(owner — pending)_ |
| 2026-06-13 | v0.4.2 | **LIMITED GO** (controlled owner use, UI only) | A + B (C/D deferred) | **Deferred** (risk accepted) | Owner |

> Add a new row (never edit a prior one) each time the decision is re-evaluated.
> Real customer data may enter on a row that records **GO**, or — **via the app
> UI only** — under a **LIMITED GO** controlled-start row. Never via SQL/import
> while a LIMITED GO exception is in effect.
