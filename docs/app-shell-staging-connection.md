# Klarsa Core — App Shell ↔ Supabase Staging (v0.2.7)

> **Status: STAGING / INTERNAL.** Connects the protected `/app-shell` to a
> Supabase **staging** project using the **fake** `@example.test` tenants/users
> from the verification seed. Proves login → session → tenant context → an
> **RLS-scoped read path** end-to-end. **No real customer data**, **no committed
> credentials**, **no service-role for tenant reads**.

Related: [`auth-foundation.md`](./auth-foundation.md),
[`supabase-staging-verification.md`](./supabase-staging-verification.md),
[`staging-seed-plan.md`](./staging-seed-plan.md),
[`rls-test-plan.md`](./rls-test-plan.md),
[`security-architecture.md`](./security-architecture.md).

## Required `.env.local` values

Copy [`../.env.local.example`](../.env.local.example) to `.env.local` (git-ignored)
and fill in the **staging** values from Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://<staging-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SERVICE_ROLE_KEY=<staging service-role key>   # server-only; NOT used for tenant reads
SUPABASE_PROJECT_REF=<staging-ref>
KLARSA_ENV=staging
```

- `.env.local` is **never committed**. The repo only ships placeholders.
- Without these values the app shell shows a safe **"Setup erforderlich"** state
  and the build stays green (env is read lazily, the page is `force-dynamic`).
- The **service-role key** stays server-only and is **not** used by the app shell
  (see below). It exists only for future trusted system tasks.

## Create / log in the fake Supabase users

The app shell needs a signed-in user that has an active membership. Use the fake
users from the seed (all `@example.test`):

1. Apply migration + verification scripts per
   [`supabase-staging-verification.md`](./supabase-staging-verification.md)
   (`001` → verify → `002` fake seed). `002` creates the 8 fake auth users (or
   create them via **Dashboard → Authentication** with the same emails).
2. Set a known password for the user(s) you want to test with (Dashboard →
   Authentication → user → "Send recovery"/"Update password"), since `002`'s
   direct insert stores an unusable password hash.
3. Go to `/login`, sign in with e.g. `owner-a@example.test`.

Suggested test users (from [`staging-seed-plan.md`](./staging-seed-plan.md)):

| User | Tenant | Role | Expectation in `/app-shell` |
| --- | --- | --- | --- |
| `owner-a@example.test` | Clean24 Demo Tenant | owner | sees Company A counts |
| `owner-b@example.test` | Muster Service Demo Tenant | owner | sees Company B counts |
| `readonly-a@example.test` | Clean24 Demo Tenant | readonly | sees Company A counts (read-only) |
| `inactive-a@example.test` | Clean24 Demo Tenant | sales (inactive) | "Kein aktiver Mandant" |

## How RLS is verified through the app

`/app-shell` is **server-protected** and reads only through the **anon/session**
client (`lib/supabase/server.ts`), so every query carries the user's session and
**RLS applies**:

1. **No session** → redirect to `/login`.
2. **Session, no active membership** → safe "Kein aktiver Mandant" state.
3. **Session + membership** → loads the active company summary and the per-module
   counts (`prospects`, `leads`, `offers`, `jobs`, `followup_tasks`,
   `bexio_handoffs`) via `lib/auth/tenant-data.ts`.

Because RLS filters every read, **user A sees only Company A's counts and user B
sees only Company B's** — without the app filtering anything itself. Logging in as
`owner-a` vs `owner-b` and comparing the numbers is a live, end-to-end RLS check
that mirrors tests T1/T2 in [`rls-test-plan.md`](./rls-test-plan.md).

## Why the service role is NOT used for tenant reads

The service-role key **bypasses RLS** and can read every tenant's data. Using it
for app reads would defeat the entire isolation model. Therefore:

- The app shell uses **only** the session client; tenant isolation is enforced by
  the database (RLS), not by application code.
- `lib/supabase/admin.ts` (service role) is server-only and reserved for trusted
  system tasks (e.g. future onboarding/cron) — **never** for rendering a user's
  view.
- This is defense in depth: even a bug in the app cannot leak another tenant's
  rows, because the session never has permission to read them.

## No real customer data rule

Staging holds **fake** data only (`@example.test`, "… Demo Tenant"). **No real
Clean24 or customer data** flows here. Real data remains gated by **"No Security
= No Customer Data"** — auth + RLS + verified backup/restore first
([`security-architecture.md`](./security-architecture.md)). Clean24 becomes the
first real tenant only **after** that gate.

## Next step

**v0.2.8 — Clean24 tenant setup foundation** (still on staging/fake data) **or**
**auth role/onboarding hardening** (per-role write enforcement already in RLS;
add the onboarding RPC for the first owner membership, and protected-route role
checks). No real data before the security/backup gate.
