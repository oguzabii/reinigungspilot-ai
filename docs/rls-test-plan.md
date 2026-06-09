# Klarsa Core — RLS Test Plan (v0.2.2)

> **Status: PLAN.** Test cases for the Row Level Security of
> [`../supabase/migrations/001_klarsa_core_schema.sql`](../supabase/migrations/001_klarsa_core_schema.sql).
> Run against a **staging** project with the **fake** dataset from
> [`staging-seed-plan.md`](./staging-seed-plan.md). No real data.

Each case marks whether it is **enforced by the current v0.2.1 draft policies**
or is a **TARGET** that needs the role-based hardening planned for v0.2.3+. Being
explicit about this gap is the point of the test plan.

## How to simulate users (SQL editor)

RLS keys off `auth.uid()`. To act as a given user, set the JWT claims and switch
to the `authenticated` role within a transaction:

```sql
begin;
-- Act as user A (owner of company A)
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '<USER_A_OWNER_ID>', 'role', 'authenticated')::text,
  true);
set local role authenticated;

-- ... run the test queries here; results are RLS-filtered ...

rollback;  -- never persist test mutations
```

Anonymous (no session):

```sql
begin;
set local role anon;
select set_config('request.jwt.claims', '', true);
-- ... queries should return nothing for tenant tables ...
rollback;
```

> Application-level tests can do the same via the Supabase JS client by signing
> in as each fake user and issuing real queries.

## Fixtures (from the seed plan)

- **Company A** = "Clean24 Demo Tenant"; **Company B** = "Muster Service Demo Tenant".
- Users (fake): `USER_A_OWNER`, `USER_A_READONLY`, `USER_A_INACTIVE` (member of A,
  `is_active = false`), `USER_B_OWNER`, `USER_SUPERADMIN` (superadmin membership).
- Each company has its own fake `leads`, `prospects`, `offers`, `jobs`, etc.

## Test cases

### T1 — User A sees only Company A  ·  *enforced now*
- **As:** `USER_A_OWNER`.
- **Do:** `select count(*) from leads;` (and offers/jobs/prospects).
- **Expect:** only Company A rows; **zero** Company B rows.

### T2 — User B sees only Company B  ·  *enforced now*
- **As:** `USER_B_OWNER`.
- **Do:** `select count(*) from leads;`.
- **Expect:** only Company B rows; zero Company A rows.

### T3 — User A cannot read/update/delete Company B rows  ·  *enforced now*
- **As:** `USER_A_OWNER`.
- **Read:** `select * from leads where company_id = '<COMPANY_B>';` → **0 rows**.
- **Update:** `update leads set status='won' where company_id='<COMPANY_B>';` →
  **0 rows affected** (rows invisible; `using` fails).
- **Delete:** `delete from leads where company_id='<COMPANY_B>';` → **0 rows**.
- **Insert into B:** `insert into leads (company_id, company_name, source_type)
  values ('<COMPANY_B>', 'x', 'manual');` → **rejected** by `with check`.

### T4 — Inactive member cannot access company rows  ·  *enforced now*
- **As:** `USER_A_INACTIVE` (membership row has `is_active = false`).
- **Do:** `select count(*) from leads;`.
- **Expect:** **0 rows** — `is_member_of()` requires `is_active = true`.

### T5 — Readonly cannot modify  ·  **TARGET (v0.2.3)**
- **As:** `USER_A_READONLY` (role `readonly` in Company A).
- **Do:** `update leads set status='won' where company_id='<COMPANY_A>';`.
- **Target expect:** **rejected** (no write for `readonly`).
- **Current behavior:** **allowed** — the v0.2.1 draft policy checks *membership
  only*, not role. Close this with per-role `with check` (write requires role in
  `owner|admin|sales|ops`). Until then, this case is expected to FAIL.

### T6 — Owner/Admin can manage tenant data  ·  *enforced now (read/write)*
- **As:** `USER_A_OWNER` (repeat with an `admin`).
- **Do:** insert + update + soft-delete a Company A lead/offer/job.
- **Expect:** all succeed for Company A. (Note: under the draft policy any active
  member can write; role granularity arrives with T5's hardening.)

### T7 — Superadmin support read  ·  *enforced now*
- **As:** `USER_SUPERADMIN`.
- **Read:** `select count(*) from leads;` → sees **both** A and B (support read).
- **Write into a non-member company:** `insert into leads (company_id, …) values
  ('<COMPANY_A>', …);` → **rejected** (the `with check` is membership-only; read
  is allowed via `is_superadmin()`, write is not). Confirms *read-only* support.

### T8 — `audit_logs` is append-only  ·  *enforced now*
- **As:** `USER_A_OWNER`.
- **Insert:** allowed for own company.
- **Update:** `update audit_logs set action='login' where company_id='<COMPANY_A>';`
  → **rejected** (no update policy).
- **Delete:** `delete from audit_logs where company_id='<COMPANY_A>';` →
  **rejected** (no delete policy). Same applies to `lead_scores`, `lead_activities`.

### T9 — Soft-deleted rows excluded from normal queries  ·  *query-layer (convention)*
- **Setup:** soft-delete a Company A lead: `update leads set deleted_at = now()
  where id = '<LEAD>';`.
- **Do:** the standard app query `select * from leads where company_id='<COMPANY_A>'
  and deleted_at is null;`.
- **Expect:** the soft-deleted row is **excluded**; `... and deleted_at is not
  null` still finds it (restorable).
- **Note:** base RLS does **not** auto-hide soft-deleted rows — exclusion is a
  query convention (or a future view/policy). This test verifies the convention,
  not RLS itself.

### T10 — No anonymous access to tenant tables  ·  *enforced now*
- **As:** `anon` (no session).
- **Do:** `select count(*) from leads;` (and any tenant table).
- **Expect:** **0 rows / denied**. `auth.uid()` is null → `is_member_of()` false →
  default deny. `industry_presets` also requires `auth.uid() is not null`, so anon
  cannot read the catalog either.

## Coverage summary

| # | Test | Status vs. current schema |
| --- | --- | --- |
| T1 | A sees only A | ✅ enforced |
| T2 | B sees only B | ✅ enforced |
| T3 | A cannot R/U/D B | ✅ enforced |
| T4 | inactive member denied | ✅ enforced |
| T5 | readonly cannot modify | ⏳ target (v0.2.3 role hardening) |
| T6 | owner/admin manage | ✅ enforced (role granularity pending) |
| T7 | superadmin support read | ✅ enforced (read-only) |
| T8 | audit_logs append-only | ✅ enforced |
| T9 | soft-deleted excluded | ✅ at query layer (not base RLS) |
| T10 | no anonymous access | ✅ enforced |

## Gaps to close (v0.2.3 hardening)

- **Per-role writes (T5):** replace the single `for all` membership policy with
  role-aware `with check` (e.g. `readonly` → no write; `owner`/`admin` → manage
  members/settings/deletes; `sales`/`ops` → operational writes).
- **Owner-only destructive ops:** restrict hard delete / restore to `owner`/`admin`.
- **Optional soft-delete RLS:** consider a policy/view so `deleted_at is not null`
  rows are hidden by default at the DB layer, not only by query convention.
- Re-run this full plan after hardening; all rows should read ✅.

## Hard rule

This runs on **fake** staging data only. **No real customer data** until auth,
RLS (incl. the T5 hardening) and backup/restore are verified —
[`security-architecture.md`](./security-architecture.md).
