# Klarsa Core — RLS Test Plan (v0.2.3)

> **Status: PLAN.** Test cases for the Row Level Security of
> [`../supabase/migrations/001_klarsa_core_schema.sql`](../supabase/migrations/001_klarsa_core_schema.sql).
> Run against a **staging** project with the **fake** dataset from
> [`staging-seed-plan.md`](./staging-seed-plan.md). No real data.

**v0.2.3 update:** RLS is now **role-aware** (was membership-only). Reads are open
to any active member; **writes depend on `member_role`**, so **readonly users can
no longer modify tenant data** (closes the main v0.2.2 gap). Each case below is
marked **enforced** or **TARGET** (future refinement).

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
- Fake users (all active unless noted), see [`staging-seed-plan.md`](./staging-seed-plan.md):
  `USER_A_OWNER`, `USER_A_ADMIN`, `USER_A_SALES`, `USER_A_OPS`, `USER_A_READONLY`,
  `USER_A_INACTIVE` (member of A, `is_active = false`), `USER_B_OWNER`,
  `USER_SUPERADMIN` (superadmin membership in A).
- Each company has its own fake `leads`, `prospects`, `offers`, `jobs`, etc.

## Role × write-scope matrix (v0.2.3)

Read = any active member (`can_read_company`). Writes per the migration's helper
functions. `W` = insert/update/delete, `I` = insert-only (append-only), `R` =
read-only, `—` = no access.

| Table group | owner | admin | sales | ops | readonly | superadmin |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| **Read** (every table) | R | R | R | R | R | R¹ |
| `leads`, `prospects`, `offers`, `offer_items` | W | W | W | — | — | — |
| `lead_scores`, `lead_activities` (append) | I | I | I | — | — | — |
| `followup_tasks` | W | W | W | W | — | — |
| `jobs`, `job_notes` | W | W | — | W | — | — |
| `company_settings`, `company_services`, `pricing_models`, `lead_sources` | W | W | — | — | — | — |
| `company_members`, `companies` (update/delete) | W | W | — | — | — | — |
| `bexio_connections`, `bexio_handoffs` | W² | W² | — | — | — | — |
| `audit_logs` | I | I | I | I | I³ | — |

¹ Superadmin read is **cross-tenant** (support) but **no write anywhere**.
² Plus system/service-role writes (bypass RLS) for queued handoffs.
³ `audit_logs` insert is permitted for any active member but is normally written
by the server; it is **append-only** (no update/delete for anyone).

## Test cases

### T1 — User A sees only Company A  ·  *enforced*
- **As:** `USER_A_OWNER`. **Do:** `select count(*) from leads;` (and offers/jobs).
- **Expect:** only Company A rows; **zero** Company B rows.

### T2 — User B sees only Company B  ·  *enforced*
- **As:** `USER_B_OWNER`. **Do:** `select count(*) from leads;`.
- **Expect:** only Company B rows; zero Company A rows.

### T3 — User A cannot read/update/delete Company B rows  ·  *enforced*
- **As:** `USER_A_OWNER`.
- **Read:** `select * from leads where company_id='<COMPANY_B>';` → **0 rows**.
- **Update/Delete** targeting Company B → **0 rows affected** (rows invisible).
- **Insert into B:** `insert into leads (company_id, company_name, source_type)
  values ('<COMPANY_B>','x','manual');` → **rejected** by `with check`.

### T4 — Inactive member cannot access company rows  ·  *enforced*
- **As:** `USER_A_INACTIVE` (`is_active = false`). **Do:** `select count(*) from leads;`.
- **Expect:** **0 rows** — `member_role_for()` only returns a role for active
  members, so `can_read_company()` is false.

### T5 — Readonly cannot modify  ·  **enforced (NEW in v0.2.3)**
- **As:** `USER_A_READONLY` (role `readonly` in Company A).
- **Select:** `select count(*) from leads;` → **succeeds** (reads Company A).
- **Update:** `update leads set status='won' where company_id='<COMPANY_A>';` →
  **rejected / 0 rows** (`with check` = `can_write_sales` is false for readonly).
- **Insert:** `insert into leads (company_id, company_name, source_type) values
  ('<COMPANY_A>','x','manual');` → **rejected**.
- **Delete:** `delete from leads where company_id='<COMPANY_A>';` → **rejected**.
- Repeat on `offers`, `jobs`, `company_settings` → all writes **rejected**; reads OK.

### T6 — Owner/Admin can manage tenant data  ·  *enforced*
- **As:** `USER_A_OWNER`, then `USER_A_ADMIN`.
- **Do:** insert + update + soft-delete a Company A lead/offer/job; update
  `company_settings`; add a `company_members` row.
- **Expect:** all succeed for Company A (owner/admin have broad write).

### T7 — Superadmin support read, no write  ·  *enforced*
- **As:** `USER_SUPERADMIN`.
- **Read:** `select count(*) from leads;` → sees **both** A and B (support read,
  via `can_superadmin()` in `can_read_company`).
- **Write (any company, incl. A):** `update leads set status='won' …;` →
  **rejected**. All write predicates (`can_write_*`, `can_manage_company`)
  **exclude** superadmin. Confirms support is strictly **read-only**.

### T8 — `audit_logs` is append-only  ·  *enforced*
- **As:** `USER_A_OWNER`.
- **Insert:** allowed for own company. **Update/Delete:** **rejected** (no
  update/delete policy). Same for `lead_scores`, `lead_activities`.

### T9 — Soft-deleted rows excluded from normal queries  ·  *query-layer (convention)*
- **Setup:** `update leads set deleted_at = now() where id='<LEAD>';` (as owner).
- **Do:** standard app query `… where company_id='<COMPANY_A>' and deleted_at is null;`.
- **Expect:** the soft-deleted row is **excluded**; `… deleted_at is not null`
  still finds it (restorable).
- **Note:** base RLS does **not** auto-hide soft-deleted rows — exclusion is a
  query convention (or a future view/policy). See "Remaining refinements".

### T10 — No anonymous access to tenant tables  ·  *enforced*
- **As:** `anon` (no session). **Do:** `select count(*) from leads;` (any tenant table).
- **Expect:** **0 rows / denied**. `auth.uid()` is null → `member_role_for()` is
  null → `can_read_company()` false → default deny. `industry_presets` also
  requires `auth.uid() is not null`, so anon cannot read the catalog either.

### T11 — Sales role scope  ·  *enforced (NEW)*
- **As:** `USER_A_SALES`.
- **Allowed:** insert/update `leads`, `prospects`, `offers`, `offer_items`,
  `followup_tasks`; insert `lead_scores`, `lead_activities`.
- **Rejected:** writes to `jobs`, `job_notes`, `company_settings`,
  `company_services`, `pricing_models`, `lead_sources`, `bexio_connections`,
  `company_members`. Reads of all of these still succeed.

### T12 — Ops role scope  ·  *enforced (NEW)*
- **As:** `USER_A_OPS`.
- **Allowed:** insert/update `jobs`, `job_notes`, `followup_tasks`.
- **Rejected:** writes to `leads`, `prospects`, `offers`, `company_settings`,
  `bexio_connections`. Reads still succeed.

### T13 — Settings & bexio are owner/admin only  ·  *enforced (NEW)*
- **As:** `USER_A_SALES`, then `USER_A_OPS`, then `USER_A_READONLY`.
- **Do:** write `company_settings`, `company_services`, `pricing_models`,
  `lead_sources`, `bexio_connections`, `company_members`.
- **Expect:** all **rejected**. Then as `USER_A_OWNER`/`USER_A_ADMIN` → **allowed**.

## Coverage summary

| # | Test | Status |
| --- | --- | --- |
| T1 | A sees only A | ✅ enforced |
| T2 | B sees only B | ✅ enforced |
| T3 | A cannot R/U/D B | ✅ enforced |
| T4 | inactive member denied | ✅ enforced |
| T5 | **readonly cannot modify** | ✅ **enforced (v0.2.3)** |
| T6 | owner/admin manage | ✅ enforced |
| T7 | superadmin read-only | ✅ enforced |
| T8 | audit_logs append-only | ✅ enforced |
| T9 | soft-deleted excluded | ✅ at query layer (not base RLS) |
| T10 | no anonymous access | ✅ enforced |
| T11 | sales role scope | ✅ enforced |
| T12 | ops role scope | ✅ enforced |
| T13 | settings/bexio owner/admin only | ✅ enforced |

## Remaining refinements (future, optional)

- **Owner-only destructive ops:** currently `owner` *and* `admin` can delete /
  manage. If desired, restrict hard delete / restore to `owner` only.
- **Onboarding RPC:** first owner membership of a new company is created by a
  privileged path (service role / SECURITY DEFINER RPC), added with the auth work.
- **Soft-delete at DB layer:** optionally hide `deleted_at is not null` rows via a
  view/policy instead of only by query convention (T9).

## Hard rule

This runs on **fake** staging data only. **No real customer data** until auth,
RLS and backup/restore are verified —
[`security-architecture.md`](./security-architecture.md).
