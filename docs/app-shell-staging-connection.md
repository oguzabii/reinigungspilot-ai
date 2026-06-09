# Klarsa Core — App Shell ↔ Supabase Staging (v0.2.7)

> **Status: STAGING / INTERNAL.** Connects the protected `/app-shell` to a
> Supabase **staging** project using the **fake** `@example.test` tenants/users
> from the verification seed. Proves login → session → tenant context → an
> **RLS-scoped read path** end-to-end. **No real customer data**, **no committed
> credentials**, **no service-role for tenant reads**.

Related: [`auth-foundation.md`](./auth-foundation.md),
[`staging-login-test-users.md`](./staging-login-test-users.md),
[`supabase-staging-verification.md`](./supabase-staging-verification.md),
[`staging-seed-plan.md`](./staging-seed-plan.md),
[`rls-test-plan.md`](./rls-test-plan.md),
[`security-architecture.md`](./security-architecture.md).

## Latest verification status

✅ **Login verified (2026-06-09).** A logged-in user reached `/app-shell` and saw
the **Clean24 Demo** tenant (role **owner**, package **Pro**) with RLS-filtered
fake counts that match the seed — login → session → tenant context → RLS read,
end-to-end (manual test, reported by the user). Full record:
**[app-shell-staging-results.md](./app-shell-staging-results.md)**.

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

## Login test flow (exact steps)

> The users seeded by `002` are **not login-ready** in hosted Supabase. For an
> interactive login, **create the auth user in the Dashboard, then bind it** to a
> fake tenant. Full guide: [`staging-login-test-users.md`](./staging-login-test-users.md).

1. **Prereqs:** apply `001` → `001_verify` → `002` (fake seed) per
   [`supabase-staging-verification.md`](./supabase-staging-verification.md), and
   set `.env.local` (above).
2. **Create the auth user:** Dashboard → **Authentication → Users → Add user**,
   email `owner-a-login@example.test`, set a test password, enable **"Auto Confirm
   User"**. (Never a real email; never share the password.)
3. **Bind it to a tenant:** run
   [`004_bind_auth_user_to_fake_tenant.sql`](../supabase/verification/004_bind_auth_user_to_fake_tenant.sql)
   with `target_email = 'owner-a-login@example.test'`, `target_company_name =
   'Clean24 Demo Tenant'`, `target_role = 'owner'`, `target_is_active = true`.
4. **Log in:** open `/login`, sign in with that email + password.
5. **Open `/app-shell`:** you should see the **Clean24 Demo Tenant** shell with
   role `owner`, the package tier, and RLS-scoped counts.

Repeat for more users to prove isolation:

| Dashboard user | Tenant | Role | active | Expected in `/app-shell` |
| --- | --- | --- | --- | --- |
| `owner-a-login@example.test` | Clean24 Demo Tenant | owner | yes | Company A counts |
| `owner-b-login@example.test` | Muster Service Demo Tenant | owner | yes | Company B counts (no A rows) |
| `readonly-a-login@example.test` | Clean24 Demo Tenant | readonly | yes | Company A counts (read-only) |
| `inactive-a-login@example.test` | Clean24 Demo Tenant | readonly | **no** | "Kein aktiver Mandant" |

If login fails, `/login` now shows: *"Login fehlgeschlagen. Prüfen Sie E-Mail,
Passwort und ob der Testbenutzer in Supabase bestätigt ist."* — usually the user
isn't confirmed (re-create with Auto Confirm) or the password is wrong.

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
