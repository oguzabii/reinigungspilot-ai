# Klarsa Core — Clean24 Data Handling Policy (v0.4.0)

> How real **Clean24 Memis GmbH** tenant data is accessed, exported, deleted,
> audited and retained **once the [real-data gate](./real-data-gate-policy.md) is
> GO**. Until then this is policy only — no real data exists. Swiss-KMU /
> Swiss-DSG + GDPR-aligned in spirit; align specifics with legal counsel before
> go-live.

## Scope & roles

- Applies to the production **Clean24** tenant: leads, prospects, offers, jobs,
  follow-ups, customer contacts, and (later) bexio tokens / uploads.
- Tenant isolation via `company_id` + RLS — Clean24 data is only ever visible to
  active Clean24 members (see
  [`security-rls-verification-checklist.md`](./security-rls-verification-checklist.md)).
- The old standalone **Clean24 Lead Autopilot** is a **separate** system — no
  import, migration, or coupling.

## Access (least privilege)

- Reads: any **active** Clean24 member (RLS-scoped). Writes: by role
  (owner/admin manage; sales; ops; readonly = none; superadmin = read-only).
- Sensitive actions (export, hard delete, bexio connect, role changes) are
  **owner/admin only** and **audited**.
- **No service-role** client for routine tenant access — app routes/actions use
  the session/anon client (RLS). Service-role is server-only and reserved for
  controlled system jobs.
- Production Dashboard/DB credentials limited to the owner + minimal operators.

## Export

- Who: **owner/admin** only; every export is recorded in `audit_logs`
  (`action`, `actor_user_id`, `entity_type`, time, hashed IP — never secrets).
- What: the tenant's own rows only (RLS-scoped); never another tenant's data.
- Where: delivered to an **encrypted, access-controlled** destination; not posted
  in chat/tickets/repo. Operational dumps follow the
  [backup runbook](./backup-restore-runbook.md) and its retention.
- Subject-access requests (a person asking for their data) are fulfilled as a
  scoped, audited export.

## Deletion

- **Soft-delete by default:** "delete" sets `deleted_at`; standard queries hide
  it; **restore** by owner/admin. Every delete/restore is audited.
- **Hard delete** only via a controlled, documented process (e.g. a DSG/GDPR
  erasure request) — owner/admin initiated, audited, and irreversible. Confirm
  legal basis and retention obligations before hard-deleting.
- Erasure requests: locate all of the subject's rows (leads/contacts/offers/
  jobs/follow-ups), soft-delete then hard-delete per process, and record
  completion in the audit trail.

## Audit expectations

- `audit_logs` is **append-only** (no UPDATE/DELETE — enforced by RLS; verified
  by `verification/006`).
- Logged events: login-relevant events, create/update/**delete/restore**,
  **export**, bexio handoff/connect, approvals, role changes.
- Each entry: `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata`,
  **hashed** IP (`ip_hash` — never the raw IP), `created_at`. **Never** secrets,
  tokens, or passwords in logs.
- Retention per legal/data-protection requirements; immutable.

> **Implementation note:** the `audit_logs` table + append-only policy exist
> (migration 001). Wiring audit **writes** into every create/update/delete/export
> action is a recommended item on the [gate](./production-readiness-gate.md)
> (section E) and should be completed as real data is onboarded.

## Data minimisation & protection

- Collect only what the sales/ops workflow needs; no unnecessary personal data.
- Secrets/tokens never stored in app tables in clear text (bexio tokens via
  encrypted `secret_ref` when enabled); **never** logged.
- IPs stored only as a hash (`ip_hash`); no raw IPs.
- Transport over TLS; secrets only in server/Vercel env.

## Retention

- Define retention windows per data class (leads, offers, jobs, audit logs,
  backups/exports) before go-live; document and enforce.
- Backups/exports follow the [backup runbook](./backup-restore-runbook.md)
  retention; expired copies are securely destroyed.

## Subject rights (summary)

- **Access / portability:** scoped, audited export (owner/admin).
- **Rectification:** edit via the app (audited).
- **Erasure:** soft-delete → controlled hard-delete process (audited).
- Track requests and completion; align timelines with applicable law.

## Sign-off

| Item | Status | Owner | Date |
| --- | --- | --- | --- |
| Access model (least privilege, no service-role in app) | **defined** | | 2026-06-12 |
| Export process (owner/admin, audited, encrypted) | _(pending go-live)_ | | |
| Deletion process (soft → controlled hard, audited) | _(pending go-live)_ | | |
| Audit writes wired into actions | _(recommended, pending)_ | | |
| Retention windows defined | _(pending)_ | | |

No real Clean24 data is handled under this policy until the
[real-data gate](./real-data-gate-policy.md) records **GO**.
