# Klarsa Core — Incident & Recovery Runbook (v0.4.0)

> A short, practical playbook for the most likely incidents. Goal: contain fast,
> recover from a verified backup, and never make it worse. No secrets here.
> Pairs with [`backup-restore-runbook.md`](./backup-restore-runbook.md) and the
> [gate](./production-readiness-gate.md).

## Severity & response

| Sev | Meaning | Target response |
| --- | --- | --- |
| **S1** | Real customer data exposed/lost, or auth/RLS bypass | Immediately |
| **S2** | Production degraded (bad deploy, partial outage) | Within the hour |
| **S3** | Minor/contained, no data risk | Same day |

First three moves for any incident: **(1) contain** (stop the bleeding),
**(2) preserve evidence** (don't delete logs/data), **(3) record** a timeline.

## Playbooks

### A. Secret / key leak (service-role, anon, DB password, JWT) — S1

1. **Rotate the leaked secret immediately** in Supabase (and any provider) — new
   key/password; the old one stops working.
2. Update the secret in **Vercel env only** (never the repo). Redeploy.
3. If a secret reached git history: remove it and **treat history as
   compromised** — rotate regardless; consider history rewrite + force context.
4. Review `audit_logs` and provider logs for misuse during the exposure window.
5. Post-incident: confirm `.gitignore` covers `.env*`; re-run a repo secret scan.

> The service-role key bypasses RLS — a leak is always **S1**.

### B. Data loss / corruption (bad mass update, dropped rows) — S1/S2

1. **Stop further writes** to the affected area (disable the feature / maintenance
   if needed). Do not "fix" by more ad-hoc writes.
2. Identify the **timestamp** just before the loss.
3. Recover via **PITR** to that timestamp, or restore the latest good backup /
   external dump — **into a fresh project first** (see backup runbook §5).
4. **Verify** the restored copy (`verification/006` PASS, row sanity, RLS, login).
5. Cut over per the backup runbook §5d; record in the restore-test log.

### C. Unauthorized access / suspected breach — S1

1. **Revoke sessions** (Supabase Auth) for affected users; force re-auth.
2. Rotate any potentially exposed secrets (playbook A).
3. Disable the compromised account / membership (`company_members.is_active =
   false`); review its `audit_logs`.
4. Assess scope from `audit_logs` (append-only) + provider logs; preserve them.
5. Notify per the data handling policy / legal obligations
   ([`clean24-data-handling-policy.md`](./clean24-data-handling-policy.md)).

### D. Bad deployment (app broken, but DB fine) — S2

1. **Vercel → Deployments → Promote** the last known-good deployment (rollback).
2. Confirm `/login` → `/app-shell` works and RLS reads are correct.
3. Fix forward on a branch; redeploy through Preview (staging) first.

### E. Bad migration (schema/data wrong after a DB change) — S1/S2

1. Prefer **fix-forward** with the **next** additive/idempotent migration (never
   edit an applied one).
2. If data was damaged, use **PITR** to just before the migration, then re-apply a
   corrected migration on staging first.
3. Re-run `verification/006` (and `003` on staging) after recovery.

### F. RLS regression (tenant isolation broken) — S1

1. **Disable the affected route/feature** immediately if cross-tenant leakage is
   possible.
2. Reproduce with `verification/003` on staging; identify the bad/missing policy.
3. Ship a hotfix migration restoring default-deny + correct per-command policies;
   verify with `verification/006` + `003`.
4. Review `audit_logs` for any cross-tenant access during the window.

## Communication & post-incident

- Keep a simple **timeline** (what, when, who, action).
- For incidents touching real customer data, follow notification duties in
  [`clean24-data-handling-policy.md`](./clean24-data-handling-policy.md).
- **Post-incident review:** root cause, what detection/guard was missing, one
  concrete prevention added to the gate.

## Contacts & drills

- Owner / on-call: _(fill in operationally — not in the repo)_.
- Supabase project + Vercel project: _(refs live in the operator's env)_.
- [ ] Run a recovery **drill** (a restore test, playbook B) before go-live and at
      least quarterly; record it in the
      [backup runbook](./backup-restore-runbook.md) §6.
