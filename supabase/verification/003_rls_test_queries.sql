-- =============================================================================
-- Klarsa Core — RLS test queries (run AFTER 002 fake seed, on STAGING)
-- =============================================================================
-- Exercises the role-aware RLS from migration 001 using the fake users/tenants
-- seeded by 002. Read-only in effect: everything runs inside ONE transaction
-- that is ROLLED BACK at the end, and write tests use savepoints — so nothing
-- persists. No credentials, no real data.
--
-- HOW TO RUN: execute the WHOLE file at once in the Supabase SQL editor. Results
-- are emitted as NOTICE messages (see the "Messages"/output panel). Every test
-- prints "PASS" or "FAIL". A correct run prints PASS for every line.
--
-- Mechanism: each test sets `request.jwt.claims` (so auth.uid() = the test user,
-- resolved by @example.test email) and switches to the `authenticated`/`anon`
-- role so RLS applies (the SQL-editor superuser bypasses RLS otherwise).
--
-- NOTE: requires the `authenticated`/`anon` roles to have table grants (Supabase
-- default). If you get "permission denied for table", the API grants are missing.
-- =============================================================================

begin;

-- ---- T1: user A (owner) sees only company A -------------------------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'owner-a@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
do $$
declare v int; f int;
begin
  select count(*), count(*) filter (where company_id <> '00000000-0000-0000-0000-0000000000a1')
    into v, f from public.leads;
  if v > 0 and f = 0 then raise notice 'T1 A sees only A (leads): PASS (% visible, 0 foreign)', v;
  else raise notice 'T1 A sees only A (leads): FAIL (% visible, % foreign)', v, f; end if;
end $$;

-- ---- T2: user B (owner) sees only company B -------------------------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'owner-b@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
do $$
declare v int; f int;
begin
  select count(*), count(*) filter (where company_id <> '00000000-0000-0000-0000-0000000000b1')
    into v, f from public.leads;
  if v > 0 and f = 0 then raise notice 'T2 B sees only B (leads): PASS (% visible, 0 foreign)', v;
  else raise notice 'T2 B sees only B (leads): FAIL (% visible, % foreign)', v, f; end if;
end $$;

-- ---- T3: readonly cannot insert/update/delete -----------------------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'readonly-a@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
savepoint t3;
do $$
begin
  begin
    insert into public.leads (company_id, company_name, source_type)
      values ('00000000-0000-0000-0000-0000000000a1', 'RLS readonly insert', 'manual');
    raise notice 'T3a readonly INSERT lead: FAIL (allowed)';
  exception when others then raise notice 'T3a readonly INSERT lead: PASS (rejected)'; end;

  begin
    update public.leads set status = 'won' where id = '00000000-0000-0000-0000-00000000a101';
    if found then raise notice 'T3b readonly UPDATE lead: FAIL (allowed)';
    else raise notice 'T3b readonly UPDATE lead: PASS (no row updated)'; end if;
  exception when others then raise notice 'T3b readonly UPDATE lead: PASS (rejected)'; end;

  begin
    delete from public.leads where id = '00000000-0000-0000-0000-00000000a101';
    if found then raise notice 'T3c readonly DELETE lead: FAIL (allowed)';
    else raise notice 'T3c readonly DELETE lead: PASS (no row deleted)'; end if;
  exception when others then raise notice 'T3c readonly DELETE lead: PASS (rejected)'; end;
end $$;
rollback to savepoint t3;

-- ---- T4: sales can write sales tables (not ops tables) ---------------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'sales-a@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
savepoint t4;
do $$
begin
  begin
    insert into public.leads (company_id, company_name, source_type)
      values ('00000000-0000-0000-0000-0000000000a1', 'RLS sales insert', 'manual');
    raise notice 'T4a sales INSERT lead: PASS (allowed)';
  exception when others then raise notice 'T4a sales INSERT lead: FAIL (rejected: %)', sqlerrm; end;

  begin
    insert into public.offers (company_id, reference, status)
      values ('00000000-0000-0000-0000-0000000000a1', 'OF-RLS-SALES', 'draft');
    raise notice 'T4b sales INSERT offer: PASS (allowed)';
  exception when others then raise notice 'T4b sales INSERT offer: FAIL (rejected: %)', sqlerrm; end;

  begin  -- sales must NOT write the ops-owned jobs table
    insert into public.jobs (company_id, title)
      values ('00000000-0000-0000-0000-0000000000a1', 'RLS sales-in-jobs');
    raise notice 'T4c sales INSERT job: FAIL (allowed; should be ops/owner/admin)';
  exception when others then raise notice 'T4c sales INSERT job: PASS (rejected)'; end;
end $$;
rollback to savepoint t4;

-- ---- T5: ops can write job tables (not sales tables) -----------------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'ops-a@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
savepoint t5;
do $$
begin
  begin
    insert into public.jobs (company_id, title)
      values ('00000000-0000-0000-0000-0000000000a1', 'RLS ops job');
    raise notice 'T5a ops INSERT job: PASS (allowed)';
  exception when others then raise notice 'T5a ops INSERT job: FAIL (rejected: %)', sqlerrm; end;

  begin
    insert into public.job_notes (company_id, job_id, body)
      values ('00000000-0000-0000-0000-0000000000a1',
              '00000000-0000-0000-0000-00000000a401', 'RLS ops note');
    raise notice 'T5b ops INSERT job_note: PASS (allowed)';
  exception when others then raise notice 'T5b ops INSERT job_note: FAIL (rejected: %)', sqlerrm; end;

  begin  -- ops must NOT write the sales-owned leads table
    insert into public.leads (company_id, company_name, source_type)
      values ('00000000-0000-0000-0000-0000000000a1', 'RLS ops-in-leads', 'manual');
    raise notice 'T5c ops INSERT lead: FAIL (allowed; should be sales/owner/admin)';
  exception when others then raise notice 'T5c ops INSERT lead: PASS (rejected)'; end;
end $$;
rollback to savepoint t5;

-- ---- T6: inactive member is denied ----------------------------------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'inactive-a@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
do $$
declare v int;
begin
  select count(*) into v from public.leads;
  if v = 0 then raise notice 'T6 inactive member denied: PASS (0 visible)';
  else raise notice 'T6 inactive member denied: FAIL (% visible)', v; end if;
end $$;

-- ---- T7: anonymous access is denied ---------------------------------------
reset role;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
set local role anon;
do $$
declare v int;
begin
  select count(*) into v from public.leads;
  if v = 0 then raise notice 'T7 anonymous denied (leads): PASS (0 visible)';
  else raise notice 'T7 anonymous denied (leads): FAIL (% visible)', v; end if;
end $$;

-- ---- T8: audit_logs is append-only ----------------------------------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'owner-a@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
savepoint t8;
do $$
begin
  begin
    insert into public.audit_logs (company_id, action, entity_type)
      values ('00000000-0000-0000-0000-0000000000a1', 'create', 'test');
    raise notice 'T8a audit INSERT: PASS (allowed)';
  exception when others then raise notice 'T8a audit INSERT: FAIL (rejected: %)', sqlerrm; end;

  begin
    update public.audit_logs set action = 'login'
      where id = '00000000-0000-0000-0000-00000000a601';
    if found then raise notice 'T8b audit UPDATE: FAIL (allowed)';
    else raise notice 'T8b audit UPDATE: PASS (no row updated)'; end if;
  exception when others then raise notice 'T8b audit UPDATE: PASS (rejected)'; end;

  begin
    delete from public.audit_logs where id = '00000000-0000-0000-0000-00000000a601';
    if found then raise notice 'T8c audit DELETE: FAIL (allowed)';
    else raise notice 'T8c audit DELETE: PASS (no row deleted)'; end if;
  exception when others then raise notice 'T8c audit DELETE: PASS (rejected)'; end;
end $$;
rollback to savepoint t8;

-- ---- T9: superadmin reads across companies but cannot write ----------------
reset role;
select set_config('request.jwt.claims',
  json_build_object('sub', (select id from auth.users where email = 'superadmin@example.test'),
                    'role', 'authenticated')::text, true);
set local role authenticated;
savepoint t9;
do $$
declare c int;
begin
  select count(distinct company_id) into c from public.leads;
  if c >= 2 then raise notice 'T9a superadmin cross-company read: PASS (% companies visible)', c;
  else raise notice 'T9a superadmin cross-company read: FAIL (% companies visible)', c; end if;

  begin  -- superadmin is read-only support: writes must be rejected
    insert into public.leads (company_id, company_name, source_type)
      values ('00000000-0000-0000-0000-0000000000a1', 'RLS superadmin insert', 'manual');
    raise notice 'T9b superadmin INSERT lead: FAIL (allowed; should be read-only)';
  exception when others then raise notice 'T9b superadmin INSERT lead: PASS (rejected)'; end;
end $$;
rollback to savepoint t9;

reset role;
rollback;  -- discard everything; tests persist nothing
-- =============================================================================
-- Done. Every line above should read PASS. Investigate any FAIL.
-- =============================================================================
