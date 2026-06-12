-- =============================================================================
-- Klarsa Core — production readiness checks (v0.4.0)
-- =============================================================================
-- READ-ONLY structural checks for the SECURITY/READINESS GATE. Confirms the
-- security posture is in place: RLS on every table, the role-aware helper
-- functions exist, every table has policies, and `audit_logs` is append-only
-- (no UPDATE/DELETE policy). Makes NO changes, reads NO row data — only
-- catalog/metadata — so it is SAFE to run on STAGING or PRODUCTION.
--
-- It deliberately does NOT check row counts (production legitimately has data),
-- so it complements `001_verify_schema.sql` (which expects an empty staging DB).
--
-- How to read: run the whole file in the Supabase SQL editor. Every row has a
-- `status` of PASS / FAIL / INFO — scan for any FAIL. No credentials, no secrets.
-- See docs/production-readiness-gate.md and docs/security-rls-verification-checklist.md.
-- =============================================================================

with
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
-- audit_logs must be append-only: SELECT + INSERT, but NO UPDATE/DELETE/ALL.
audit_bad as (
  select string_agg(distinct cmd, ', ') as cmds
  from pg_policies
  where schemaname = 'public' and tablename = 'audit_logs'
    and cmd in ('UPDATE', 'DELETE', 'ALL')),
audit_has as (
  select
    bool_or(cmd = 'SELECT') as has_select,
    bool_or(cmd = 'INSERT') as has_insert
  from pg_policies
  where schemaname = 'public' and tablename = 'audit_logs'),
-- Soft-delete coverage (informational): which required tables carry deleted_at.
soft_delete as (
  select c.relname
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  where n.nspname = 'public' and c.relkind = 'r'
    and a.attname = 'deleted_at' and a.attnum > 0 and not a.attisdropped
    and c.relname in (select name from req_table))
select * from (
  select 1 as ord, 'rls' as section,
    'RLS enabled on all 20 required tables' as check,
    case when not exists (select 1 from req_table r
                          where r.name in (select relname from rls_off))
         then 'PASS' else 'FAIL' end as status,
    coalesce((select string_agg(relname, ', ') from rls_off
              where relname in (select name from req_table)),
             'all enabled') as detail
  union all
  select 2, 'functions', 'all 8 role-aware helper functions exist',
    case when not exists (select 1 from req_func r
                          where r.name not in (select name from have_func))
         then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(r.name, ', ') from req_func r
              where r.name not in (select name from have_func)),
             'none missing')
  union all
  select 3, 'policies', 'every required table has >= 1 policy (default deny)',
    case when not exists (select 1 from no_policy) then 'PASS' else 'FAIL' end,
    coalesce((select string_agg(name, ', ') from no_policy), 'all have policies')
  union all
  select 4, 'audit', 'audit_logs append-only (no UPDATE/DELETE/ALL policy)',
    case when (select cmds from audit_bad) is null then 'PASS' else 'FAIL' end,
    coalesce((select 'has write policy: ' || cmds from audit_bad),
             'no update/delete policy')
  union all
  select 5, 'audit', 'audit_logs allows SELECT + INSERT in own tenant',
    case when (select has_select and has_insert from audit_has) then 'PASS'
         else 'FAIL' end,
    'select=' || coalesce((select has_select::text from audit_has), 'false')
      || ', insert=' || coalesce((select has_insert::text from audit_has), 'false')
  union all
  select 6, 'policies', 'total policy count (info)',
    'INFO',
    (select count(*)::text from pg_policies where schemaname = 'public')
  union all
  select 7, 'soft_delete', 'tables with a deleted_at column (info)',
    'INFO',
    (select count(*)::text || ': ' || string_agg(relname, ', ' order by relname)
     from soft_delete)
) checks
order by ord;
