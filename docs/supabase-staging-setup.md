# Klarsa Core — Supabase Staging Setup (v0.2.2)

> **Status: PLAN / RUNBOOK.** Step-by-step guide to stand up a **staging**
> Supabase project and apply the schema foundation. **No real customer data**,
> **no committed credentials**. This prepares — but does not perform — the actual
> project creation (that is v0.2.3).

Related: [`../supabase/README.md`](../supabase/README.md),
[`supabase-schema-notes.md`](./supabase-schema-notes.md),
[`rls-test-plan.md`](./rls-test-plan.md),
[`staging-seed-plan.md`](./staging-seed-plan.md),
[`security-architecture.md`](./security-architecture.md).

## Goal & scope

Create an **isolated, throwaway staging environment** to validate the schema, RLS
and workflows **before** any production project and **before** any real data. If
staging is ever wiped, nothing of value is lost.

## Prerequisites

- A Supabase account with permission to create projects.
- Node.js + the repo checked out locally.
- (Optional) the Supabase CLI: `npm i -g supabase`.
- This repo's `.env.local.example` (template) — you will copy it to `.env.local`.

## Step 1 — Create the Supabase staging project

1. In the Supabase dashboard, **New project**.
2. Name it per the convention below, e.g. **`klarsa-staging`**.
3. Choose a region close to Switzerland (e.g. `eu-central-1` / Frankfurt).
4. Generate a strong database password and store it in your password manager
   (never in the repo).
5. Wait for provisioning to finish.

## Step 2 — Save credentials (only in `.env.local`, Vercel env later)

1. Copy the template and fill it in **locally**:

   ```bash
   cp .env.local.example .env.local
   ```

2. From **Project Settings → API**, copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon/public key.
   - `SUPABASE_SERVICE_ROLE_KEY` — the service-role key (**server-only**, bypasses
     RLS; never expose to the client, never log).
   - `SUPABASE_PROJECT_REF` — the project ref.
   - `KLARSA_ENV=staging`.

3. **Do not commit `.env.local`.** It is git-ignored; only the
   `.env.local.example` template (placeholders) is tracked.

4. **Later (deployment):** the same keys go into **Vercel → Project → Settings →
   Environment Variables** for the *Preview/Staging* environment — never into the
   repo. Mark the service-role key as a server-side (non-public) variable.

> If a key ever leaks or is committed: rotate it in Supabase immediately and
> scrub it from git history.

## Step 3 — Apply migration `001_klarsa_core_schema.sql`

Target the **staging** project only.

**Option A — Supabase CLI:**

```bash
supabase login
supabase link --project-ref "$SUPABASE_PROJECT_REF"
supabase db push        # applies supabase/migrations/001_klarsa_core_schema.sql
```

**Option B — SQL editor:** open the staging project's SQL editor and run
`supabase/migrations/001_klarsa_core_schema.sql` once (it is written for a fresh
database).

## Step 4 — Verify tables, enums, functions, RLS

Run these read-only checks in the SQL editor (expected counts in comments):

```sql
-- 20 tables in public
select count(*) from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE';   -- expect 20

-- 10 enums
select count(*) from pg_type t
join pg_namespace n on n.oid = t.typnamespace
where t.typtype = 'e' and n.nspname = 'public';                 -- expect 10

-- helper functions exist
select proname from pg_proc
where proname in ('is_member_of','is_superadmin','set_updated_at');  -- expect 3

-- RLS enabled on every public table (expect 0 rows = none missing)
select c.relname
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false;

-- policies are present
select schemaname, tablename, count(*) policies
from pg_policies where schemaname = 'public'
group by 1, 2 order by 2;
```

Then run the functional checks in [`rls-test-plan.md`](./rls-test-plan.md) using
the fake dataset in [`staging-seed-plan.md`](./staging-seed-plan.md).

## Step 5 — Never use real customer data (yet)

Staging is for **fake** data only (see the seed plan). Do **not** import real
leads, customers, emails, phone numbers or bexio tokens. Real data is gated by
the hard rule **"No Security = No Customer Data"** and only allowed after auth,
RLS and backup/restore are verified — see
[`security-architecture.md`](./security-architecture.md).

## Staging naming convention

| Thing | Convention | Example |
| --- | --- | --- |
| Supabase project | `klarsa-staging` | `klarsa-staging` |
| (future) production | `klarsa-prod` | `klarsa-prod` |
| Env marker | `KLARSA_ENV` | `staging` / `production` |
| Vercel env | Preview = staging, Production = prod | — |
| Test tenants | `* Demo Tenant` (clearly fake) | `Clean24 Demo Tenant` |
| Test user emails | `<role>-<tenant>@example.test` | `owner-a@example.test` |

Keep staging and production **strictly separate**: separate projects, separate
keys, separate Vercel environments. Never point staging at production data.

## Next step

**v0.2.3 — actually create the staging project and verify the migration**, or
begin the **auth/RLS implementation plan**. Still no real data.
