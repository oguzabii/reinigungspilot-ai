-- =============================================================================
-- Klarsa Core — schema verification (run AFTER applying migration 001)
-- =============================================================================
-- Read-only checks for a STAGING project. Confirms enums, tables, helper
-- functions, RLS and policies exist, and that NO seed/customer data is present
-- yet. Makes no changes. No credentials, no secrets.
--
-- How to read: run the whole file in the Supabase SQL editor. Every row has a
-- `status` of PASS / FAIL / INFO — scan for any FAIL.
--
-- Run this RIGHT AFTER the migration and BEFORE the fake seed (002); the
-- "tables empty" check expects a clean database.
-- =============================================================================

with
req_enum(name) as (values
  ('package_tier'), ('member_role'), ('approval_status'), ('source_type'),
  ('lead_status'), ('prospect_status'), ('offer_status'), ('job_status'),
  ('handoff_status'), ('audit_action_type')),
req_table(name) as (values
  ('industry_presets'), ('user_profiles'), ('companies'), ('company_members'),
  ('company_settings'), ('company_services'), ('pricing_models'), ('lead_sources'),
  ('prospects'), ('lead_scores'), ('leads'), ('lead_activities'), ('offers'),
  ('offer_items'), ('followup_tasks'), ('jobs'), ('job_notes'),
  ('bexio_connections'), ('bexio_handoffs'), ('audit_logs')),
req_func(name) as (values
  ('set_updated_at'), ('member_role_for'), ('can_read_company'),
  ('can_manage_company'), ('can_write_sales'), ('can_write_ops'),
  ('can_write_settings'), ('can_superadmin')),
have_enum as (
  select t.typname as name
  from pg_type t join pg_namespace n on n.oid = t.typnamespace
  where t.typtype = 'e' and n.nspname = 'public'),
have_table as (
  select table_name as name
  from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'),
have_func as (
  select p.proname as name
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'),
rls_off as (
  select c.relname
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false),
no_policy as (
  select t.name
  from req_table t
  where not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = t.name)),
-- Exact row counts for the customer/tenant tables (industry_presets is a
-- catalog and is excluded from the "no customer data" check).
rowcounts(tbl, cnt) as (
  select 'user_profiles', (select count(*) from public.user_profiles)
  union all select 'companies', (select count(*) from public.companies)
  union all select 'company_members', (select count(*) from public.company_members)
  union all select 'company_settings', (select count(*) from public.company_settings)
  union all select 'company_services', (select count(*) from public.company_services)
  union all select 'pricing_models', (select count(*) from public.pricing_models)
  union all select 'lead_sources', (select count(*) from public.lead_sources)
  union all select 'prospects', (select count(*) from public.prospects)
  union all select 'lead_scores', (select count(*) from public.lead_scores)
  union all select 'leads', (select count(*) from public.leads)
  union all select 'lead_activities', (select count(*) from public.lead_activities)
  union all select 'offers', (select count(*) from public.offers)
  union all select 'offer_items', (select count(*) from public.offer_items)
  union all select 'followup_tasks', (select count(*) from public.followup_tasks)
  union all select 'jobs', (select count(*) from public.jobs)
  union all select 'job_notes', (select count(*) from public.job_notes)
  union all select 'bexio_connections', (select count(*) from public.bexio_connections)
  union all select 'bexio_handoffs', (select count(*) from public.bexio_handoffs)
  union all select 'audit_logs', (select count(*) from public.audit_logs))
select * from (
  select 1 as ord, 'enums' as section, 'all 10 required enums exist' as check,
    case when not exists (select 1 from req_enum r
                          where r.name not in (select name from have_enum))
         then 'PASS' else 'FAIL' end as status,
    coalesce((select string_agg(r.name, ', ') from req_enum r
              where r.name not in (select name from have_enum)),
             'none missing') as detail
  union all
  select 2, 'tables', 'all 20 required tables exist',
    case when not exists (select 1 from req_table r
                          where r.name not in (select name from have_table))
         then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(r.name, ', ') from req_table r
              where r.name not in (select name from have_table)),
             'none missing')
  union all
  select 3, 'functions', 'all 8 helper functions exist',
    case when not exists (select 1 from req_func r
                          where r.name not in (select name from have_func))
         then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(r.name, ', ') from req_func r
              where r.name not in (select name from have_func)),
             'none missing')
  union all
  select 4, 'rls', 'RLS enabled on all required tables',
    case when not exists (select 1 from req_table r
                          where r.name in (select relname from rls_off))
         then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(relname, ', ') from rls_off
              where relname in (select name from req_table)),
             'all enabled')
  union all
  select 5, 'policies', 'every required table has >= 1 policy',
    case when not exists (select 1 from no_policy) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(name, ', ') from no_policy), 'all have policies')
  union all
  select 6, 'policies', 'total policy count (info)',
    'INFO',
    (select count(*)::text from pg_policies where schemaname = 'public')
  union all
  select 7, 'data', 'no customer/tenant data (run pre-seed)',
    case when (select count(*) from rowcounts where cnt > 0) = 0
         then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(tbl || '=' || cnt, ', ')
              from rowcounts where cnt > 0), 'all empty')
  union all
  select 8, 'data', 'industry_presets catalog rows (info)',
    'INFO',
    (select count(*)::text from public.industry_presets)
) checks
order by ord;
