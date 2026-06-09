-- =============================================================================
-- Klarsa Core — FAKE seed for RLS tests (STAGING ONLY)
-- =============================================================================
-- THROWAWAY, SYNTHETIC test data to exercise RLS in a STAGING project.
--
--   * NOT real Clean24 data. NOT real customers.
--   * All emails use the reserved, non-deliverable domain @example.test.
--   * No real names, no real phone numbers (placeholder +41 00 000 00 00).
--   * No secrets, no bexio tokens (bexio_connections.secret_ref stays NULL).
--   * Safe to delete anytime — see 004 / the verification runbook for reset.
--
-- DO NOT RUN AGAINST PRODUCTION. Re-runnable (ON CONFLICT DO NOTHING).
--
-- Two tenants:  Company A = "Clean24 Demo Tenant"  (fake!),
--               Company B = "Muster Service Demo Tenant".
-- Fixed UUIDs are used so the RLS test script (003) is deterministic.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Section A (optional) — create the 8 fake AUTH users.
-- -----------------------------------------------------------------------------
-- Direct auth.users insert is acceptable ONLY in a throwaway staging project.
-- If your Supabase version rejects this, instead create these 8 users via
-- Dashboard -> Authentication with the SAME @example.test emails (any password)
-- and skip this section — the rest of the seed resolves users by email.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin,
   confirmation_token, recovery_token, email_change_token_new, email_change)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
  u.email, crypt('staging-only-unused', gen_salt('bf')), now(),
  now(), now(), '{"provider":"email","providers":["email"]}', '{}', false,
  '', '', '', ''
from (values
  ('00000000-0000-0000-0000-0000000a0001'::uuid, 'owner-a@example.test'),
  ('00000000-0000-0000-0000-0000000a0002'::uuid, 'admin-a@example.test'),
  ('00000000-0000-0000-0000-0000000a0003'::uuid, 'sales-a@example.test'),
  ('00000000-0000-0000-0000-0000000a0004'::uuid, 'ops-a@example.test'),
  ('00000000-0000-0000-0000-0000000a0005'::uuid, 'readonly-a@example.test'),
  ('00000000-0000-0000-0000-0000000a0006'::uuid, 'inactive-a@example.test'),
  ('00000000-0000-0000-0000-0000000b0001'::uuid, 'owner-b@example.test'),
  ('00000000-0000-0000-0000-00000000ad01'::uuid, 'superadmin@example.test')
) as u(id, email)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Section B — user_profiles (resolved by email, works for either creation path)
-- -----------------------------------------------------------------------------
insert into public.user_profiles (id, email, display_name)
select u.id, u.email,
  case u.email
    when 'owner-a@example.test' then 'Owner A (Demo)'
    when 'admin-a@example.test' then 'Admin A (Demo)'
    when 'sales-a@example.test' then 'Sales A (Demo)'
    when 'ops-a@example.test' then 'Ops A (Demo)'
    when 'readonly-a@example.test' then 'Readonly A (Demo)'
    when 'inactive-a@example.test' then 'Inactive A (Demo)'
    when 'owner-b@example.test' then 'Owner B (Demo)'
    when 'superadmin@example.test' then 'Superadmin (Demo)'
  end
from auth.users u
where u.email in (
  'owner-a@example.test', 'admin-a@example.test', 'sales-a@example.test',
  'ops-a@example.test', 'readonly-a@example.test', 'inactive-a@example.test',
  'owner-b@example.test', 'superadmin@example.test')
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Section C — companies (two fake tenants, fixed UUIDs)
-- -----------------------------------------------------------------------------
insert into public.companies (id, legal_name, brand_name, tier, regions_served,
                              status, is_first_tenant)
values
  ('00000000-0000-0000-0000-0000000000a1', 'Clean24 Demo Tenant',
   'Clean24 Demo', 'pro', '{ZH,AG}', 'active', true),
  ('00000000-0000-0000-0000-0000000000b1', 'Muster Service Demo Tenant',
   'Muster Service Demo', 'starter', '{ZH}', 'active', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Section D — company_members (link fake users to companies with roles)
-- -----------------------------------------------------------------------------
insert into public.company_members (company_id, user_id, role, is_active, joined_at)
select m.company_id, u.id, m.role, m.is_active, now()
from (values
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'owner-a@example.test',    'owner'::member_role,    true),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'admin-a@example.test',    'admin'::member_role,    true),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'sales-a@example.test',    'sales'::member_role,    true),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'ops-a@example.test',      'ops'::member_role,      true),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'readonly-a@example.test', 'readonly'::member_role, true),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'inactive-a@example.test', 'sales'::member_role,    false),
  ('00000000-0000-0000-0000-0000000000b1'::uuid, 'owner-b@example.test',    'owner'::member_role,    true),
  ('00000000-0000-0000-0000-0000000000a1'::uuid, 'superadmin@example.test', 'superadmin'::member_role, true)
) as m(company_id, email, role, is_active)
join auth.users u on u.email = m.email
on conflict (company_id, user_id) do nothing;

-- -----------------------------------------------------------------------------
-- Section E — fake tenant data (fixed UUIDs; created_by left NULL on purpose)
-- -----------------------------------------------------------------------------
-- Company A settings + a couple of services/sources (targets for role tests).
insert into public.company_settings (company_id, default_vat_rate_pct, sender_name, sender_email)
values ('00000000-0000-0000-0000-0000000000a1', 8.10, 'Clean24 Demo', 'office-a@example.test')
on conflict (company_id) do nothing;

insert into public.lead_sources (id, company_id, type, label)
values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000000a1', 'website', 'Website Anfrage'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000000a1', 'referral', 'Empfehlung')
on conflict (id) do nothing;

-- Company A: leads, prospect, offer, job, follow-up, audit row.
insert into public.leads (id, company_id, company_name, contact_name, email, phone,
                          status, source_type, est_value_chf)
values
  ('00000000-0000-0000-0000-00000000a101', '00000000-0000-0000-0000-0000000000a1',
   'Demo Immobilien A AG', 'Demo Kontakt', 'lead-a1@example.test', '+41 00 000 00 00',
   'new', 'website', 12000),
  ('00000000-0000-0000-0000-00000000a102', '00000000-0000-0000-0000-0000000000a1',
   'Demo Buero A', 'Demo Kontakt', 'lead-a2@example.test', '+41 00 000 00 00',
   'offer_ready', 'referral', 8000)
on conflict (id) do nothing;

insert into public.prospects (id, company_id, name, category, region, source_type,
                              search_query, status, approval_status, est_value_chf)
values
  ('00000000-0000-0000-0000-00000000a201', '00000000-0000-0000-0000-0000000000a1',
   'Demo Verwaltung Nord', 'Immobilienverwaltung', 'ZH', 'lead_hunter',
   'reinigung verwaltung zürich', 'scored', 'pending_review', 20000)
on conflict (id) do nothing;

insert into public.offers (id, company_id, lead_id, reference, status,
                           total_net_chf, vat_rate_pct, total_gross_chf)
values
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-00000000a102', 'OF-TEST-A-001', 'draft', 8000, 8.10, 8648)
on conflict (id) do nothing;

insert into public.jobs (id, company_id, lead_id, title, location, status, value_chf)
values
  ('00000000-0000-0000-0000-00000000a401', '00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-00000000a101', 'Demo Auftrag A', 'Zürich', 'planned', 12000)
on conflict (id) do nothing;

insert into public.followup_tasks (id, company_id, lead_id, stage, due_at, channel, status)
values
  ('00000000-0000-0000-0000-00000000a501', '00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-00000000a101', '24h', now() + interval '1 day', 'email', 'planned')
on conflict (id) do nothing;

insert into public.audit_logs (id, company_id, action, entity_type, entity_id)
values
  ('00000000-0000-0000-0000-00000000a601', '00000000-0000-0000-0000-0000000000a1',
   'create', 'lead', '00000000-0000-0000-0000-00000000a101')
on conflict (id) do nothing;

-- Company B: minimal data (mainly to prove A cannot see B).
insert into public.leads (id, company_id, company_name, contact_name, email, phone,
                          status, source_type, est_value_chf)
values
  ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-0000000000b1',
   'Demo Kunde B GmbH', 'Demo Kontakt', 'lead-b1@example.test', '+41 00 000 00 00',
   'qualified', 'website', 5000)
on conflict (id) do nothing;

insert into public.offers (id, company_id, lead_id, reference, status,
                           total_net_chf, vat_rate_pct, total_gross_chf)
values
  ('00000000-0000-0000-0000-00000000b301', '00000000-0000-0000-0000-0000000000b1',
   '00000000-0000-0000-0000-00000000b101', 'OF-TEST-B-001', 'sent', 5000, 8.10, 5405)
on conflict (id) do nothing;

insert into public.jobs (id, company_id, lead_id, title, location, status, value_chf)
values
  ('00000000-0000-0000-0000-00000000b401', '00000000-0000-0000-0000-0000000000b1',
   '00000000-0000-0000-0000-00000000b101', 'Demo Auftrag B', 'Zürich', 'confirmed', 5000)
on conflict (id) do nothing;

-- =============================================================================
-- Done. Fake staging data only. Run 003 to test RLS, then reset (see runbook).
-- =============================================================================
