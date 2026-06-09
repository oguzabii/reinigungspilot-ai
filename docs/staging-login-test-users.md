# Klarsa Core — Staging Login Test Users (v0.2.7.1)

> **Status: STAGING / INTERNAL.** How to get a **login-ready** test user for the
> `/app-shell` login test. **No real customer data**, **no shared passwords**,
> **no committed credentials**. Use `@example.test` emails only.

Related: [`app-shell-staging-connection.md`](./app-shell-staging-connection.md),
[`supabase-staging-verification.md`](./supabase-staging-verification.md),
[`staging-seed-plan.md`](./staging-seed-plan.md),
[`../supabase/verification/004_bind_auth_user_to_fake_tenant.sql`](../supabase/verification/004_bind_auth_user_to_fake_tenant.sql).

## Why the seeded users can't log in

The fake users created by `002_fake_seed_for_rls_tests.sql` are inserted directly
into `auth.users` with a placeholder password hash and **no proper identity
rows**. That is fine for **RLS tests** (which simulate users via JWT claims), but
hosted Supabase **GoTrue rejects those logins** — there is no usable password and
the email/identity isn't set up the way the auth server expects.

So for an **interactive login test**, don't reuse the seeded users. Instead:
**create a real auth user in the Dashboard, then bind it to a fake tenant.**

## Preferred method: create the user in the Dashboard

1. Supabase Dashboard → **Authentication → Users → Add user**.
2. Email: a **fake** `@example.test` address, e.g. `owner-a-login@example.test`
   (the `-login` suffix keeps it separate from the seeded `owner-a@example.test`).
3. Set a password you choose for testing. **Do not** reuse a real password and
   **do not** share or commit it.
4. **Enable "Auto Confirm User"** so the email counts as confirmed (no email is
   sent — staging uses no real mailbox).

### Email confirmation in staging

If "Add user" doesn't expose auto-confirm, either:

- toggle it on when adding the user, **or**
- Dashboard → **Authentication → Sign In / Providers → Email** → temporarily
  turn **off** "Confirm email" for the staging project, then create the user.

Never point this at a real mailbox or a real customer address.

## Bind the auth user to a fake tenant

After the auth user exists, bind it to a demo tenant + role with the helper:
[`004_bind_auth_user_to_fake_tenant.sql`](../supabase/verification/004_bind_auth_user_to_fake_tenant.sql).

1. Make sure `002_fake_seed_for_rls_tests.sql` has run (creates the demo tenants).
2. Open `004…sql` in the SQL editor, edit the four variables at the top:

   ```sql
   target_email        := 'owner-a-login@example.test';
   target_company_name := 'Clean24 Demo Tenant';
   target_role         := 'owner';      -- owner|admin|sales|ops|readonly|superadmin
   target_is_active    := true;
   ```

3. Run the block. It upserts `user_profiles` + `company_members` (idempotent) and
   **raises a clear instruction if the auth user doesn't exist yet**. It never
   touches passwords and never inserts into `auth.users`.
4. Repeat (edit + run) for each test user.

### Suggested test matrix

| Dashboard user (create first) | Tenant | Role | active | Expected in `/app-shell` |
| --- | --- | --- | --- | --- |
| `owner-a-login@example.test` | Clean24 Demo Tenant | owner | yes | Company A counts |
| `owner-b-login@example.test` | Muster Service Demo Tenant | owner | yes | Company B counts |
| `readonly-a-login@example.test` | Clean24 Demo Tenant | readonly | yes | Company A counts (read-only) |
| `inactive-a-login@example.test` | Clean24 Demo Tenant | readonly | **no** | "Kein aktiver Mandant" |

## Safety rules

- **Only `@example.test`** emails — never a real customer email.
- **No shared passwords / secrets** in the repo, in docs, or in chat.
- **No raw passwords in SQL**; `004` only binds, it never sets passwords.
- This is **fake staging data** for isolation/login testing — **no real customer
  data**. Real data stays gated by "No Security = No Customer Data".

## Next

Run the full login test flow in
[`app-shell-staging-connection.md`](./app-shell-staging-connection.md): log in as
`owner-a-login` vs `owner-b-login` and confirm each sees only their own tenant's
counts (a live RLS check through the app).
