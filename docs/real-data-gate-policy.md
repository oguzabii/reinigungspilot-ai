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

## Until the gate is GO

- The system runs on **staging** with **fake `@example.test`** data only.
- No real Clean24 data is imported, typed, or connected.
- The public sales demo (v0.1.7) stays fictional (`Muster Service GmbH`).
- The old standalone **Clean24 Lead Autopilot** stays separate — no migration,
  import, or coupling.

## Decision record

| Date | Version | Decision | Mandatory items complete | Restore test | Signed by |
| --- | --- | --- | --- | --- | --- |
| 2026-06-12 | v0.4.0 | **NO-GO** | No | Not run | _(owner — pending)_ |

> Add a new row (never edit a prior one) each time the decision is re-evaluated.
> Real customer data may enter **only** on a row that records **GO**.
