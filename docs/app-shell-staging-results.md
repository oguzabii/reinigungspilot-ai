# Klarsa Core — App-Shell Staging Login Results

> **Status: VERIFIED (app-shell login, staging).** A logged-in user reached the
> protected `/app-shell` and saw their tenant context + RLS-filtered fake data,
> end-to-end against the `klarsa-staging` project. **No real customer data, no
> committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-09 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual login in the browser (`/login` → `/app-shell`) |
| **Reported by** | User |

> **Provenance / honesty note:** recorded from the **user's manual test**, as
> reported. It was **not** independently observed or automated from this
> repository, and this repo holds **no connection** to the staging project (no
> URL, keys, or service-role access). The local `.env.local` (staging values)
> lives only on the user's machine and is git-ignored. This document records a
> reported outcome.

## Result

| Check | Outcome |
| --- | --- |
| Login at `/login` | ✅ succeeded |
| `/app-shell` opened (protected route) | ✅ yes |
| Tenant shown | ✅ **Clean24 Demo** |
| Role shown | ✅ **owner** |
| Package tier shown | ✅ **Pro** |
| RLS-filtered fake counts | ✅ shown (below) |

### Counts shown (RLS-scoped, fake staging data)

| Module | Count |
| --- | --- |
| Lead Inbox | 2 |
| Lead Hunter | 1 |
| Offer Engine | 1 |
| Follow-ups | 1 |
| Jobs | 1 |
| bexio Übergabe | 0 |
| Reports | planned (—) |

These exactly match the fake seed (`002_fake_seed_for_rls_tests.sql`) for the
**Clean24 Demo Tenant** (Company A): 2 leads, 1 prospect, 1 offer, 1 follow-up
task, 1 job, 0 bexio handoffs. That the app shows precisely the seeded values —
and only Company A's — confirms the **login → session → tenant context →
RLS-scoped read** path works end-to-end through the session/anon client (no
service-role).

## Safety confirmations

- ✅ **No real customer data.** All values come from the fake `@example.test`
  staging seed ("Clean24 Demo Tenant"); no real Clean24 or customer data.
- ✅ **No production data used.** Verification ran against the throwaway
  `klarsa-staging` project only.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT. The
  staging values live only in the user's local, git-ignored `.env.local`.
- ✅ **Not the old Clean24 Lead Autopilot.** "Clean24 Demo" is a fake staging
  test tenant inside Klarsa, unrelated to the separate, untouched legacy system.

## What this verifies

- The protected `/app-shell` correctly requires a session and loads the signed-in
  user's tenant, role and package from staging.
- RLS isolation holds **through the app**: the user sees only their own tenant's
  rows (mirrors RLS tests T1/T2, now via a real login).

## What this does NOT mean

- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after auth + RLS + verified
  backup/restore (see [`security-architecture.md`](./security-architecture.md)).
- The app shell still reads via the session/anon client only (never service-role).

## Next step

**v0.2.8 — Clean24 tenant setup foundation** (still staging/fake) or auth role /
onboarding hardening. No real data before the security/backup gate.
