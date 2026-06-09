-- =============================================================================
-- Klarsa Core — bind an EXISTING auth user to a fake tenant (STAGING ONLY)
-- =============================================================================
-- Why this exists: the fake users inserted by 002 are NOT reliably login-ready
-- in hosted Supabase (no real password / identity rows). For login tests, create
-- a real auth user in the **Dashboard** (Authentication → Users → Add user, with
-- "Auto Confirm User"), then run this script to bind that user to a fake tenant.
--
--   * STAGING ONLY. Do NOT run against production.
--   * Does NOT create auth users and does NOT set passwords (no raw passwords in
--     SQL). The auth user MUST already exist (created in the Dashboard).
--   * Creates no real customer data — bind only `@example.test` users to the
--     fake demo tenants from 002.
--   * Idempotent: re-running updates the membership in place.
--
-- HOW TO USE: edit the four variables at the top of the DO block, then run the
-- whole block in the Supabase SQL editor. Repeat (edit + run) for each user.
--
-- Example bindings (create each email in the Dashboard first, then bind):
--   owner-a-login@example.test    -> Clean24 Demo Tenant        -> owner    (active)
--   owner-b-login@example.test    -> Muster Service Demo Tenant -> owner    (active)
--   readonly-a-login@example.test -> Clean24 Demo Tenant        -> readonly (active)
--   inactive-a-login@example.test -> Clean24 Demo Tenant        -> readonly (INACTIVE)
-- =============================================================================

do $$
declare
  -- ▼▼▼ EDIT THESE FOUR, then run. ▼▼▼
  target_email        text        := 'owner-a-login@example.test';
  target_company_name text        := 'Clean24 Demo Tenant';
  target_role         member_role := 'owner';      -- owner|admin|sales|ops|readonly|superadmin
  target_is_active    boolean     := true;
  -- ▲▲▲ EDIT THESE FOUR. ▲▲▲

  v_user_id    uuid;
  v_company_id uuid;
begin
  -- 1) The auth user must already exist (create it in the Dashboard first).
  select id into v_user_id
  from auth.users
  where email = target_email
  limit 1;

  if v_user_id is null then
    raise exception
      'Auth user "%" not found. Create it first in Supabase Dashboard -> Authentication -> Users -> Add user (enable "Auto Confirm User"), then re-run.',
      target_email;
  end if;

  -- 2) The fake tenant must exist (run 002_fake_seed_for_rls_tests.sql first).
  select id into v_company_id
  from public.companies
  where legal_name = target_company_name
  limit 1;

  if v_company_id is null then
    raise exception
      'Company "%" not found. Run 002_fake_seed_for_rls_tests.sql first (it creates the demo tenants).',
      target_company_name;
  end if;

  -- 3) Upsert the application profile (id = auth user id). Idempotent.
  insert into public.user_profiles (id, email, display_name)
  values (v_user_id, target_email, split_part(target_email, '@', 1))
  on conflict (id) do update
    set email = excluded.email;

  -- 4) Upsert the tenant membership + role. Idempotent on (company_id, user_id).
  insert into public.company_members (company_id, user_id, role, is_active, joined_at)
  values (v_company_id, v_user_id, target_role, target_is_active, now())
  on conflict (company_id, user_id) do update
    set role = excluded.role,
        is_active = excluded.is_active;

  raise notice 'Bound % to "%" as % (active=%). Now log in at /login and open /app-shell.',
    target_email, target_company_name, target_role, target_is_active;
end;
$$;

-- -----------------------------------------------------------------------------
-- Other example bindings — copy the variable values into the block above and
-- re-run for each (create each Dashboard auth user first):
-- -----------------------------------------------------------------------------
--   target_email := 'owner-b-login@example.test';
--   target_company_name := 'Muster Service Demo Tenant';
--   target_role := 'owner';        target_is_active := true;
--
--   target_email := 'readonly-a-login@example.test';
--   target_company_name := 'Clean24 Demo Tenant';
--   target_role := 'readonly';     target_is_active := true;
--
--   target_email := 'inactive-a-login@example.test';
--   target_company_name := 'Clean24 Demo Tenant';
--   target_role := 'readonly';     target_is_active := false;   -- "Kein aktiver Mandant"
-- =============================================================================
