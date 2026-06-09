-- =============================================================================
-- Klarsa Core — initial schema foundation (migration 001)
-- =============================================================================
-- Multi-tenant SaaS schema for Klarsa Core. Target: Supabase / PostgreSQL.
--
-- STATUS: FOUNDATION / DRAFT (v0.2.1). This migration defines structure only:
-- extensions, enums, tables, indexes, Row Level Security and DRAFT policies.
-- It contains NO seed data, NO credentials, NO secrets, NO tokens.
--
-- Hard rule: "No Security = No Customer Data." Do not load real customer data
-- before auth + RLS + backup/restore are verified in a staging project.
--
-- Apply on a FRESH database (runs once). See ../README.md for how to apply and
-- ../../docs/supabase-schema-notes.md for the design rationale. The TypeScript
-- mirror lives in lib/database-types.ts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions (safe / idempotent)
-- -----------------------------------------------------------------------------
-- pgcrypto provides gen_random_uuid(). On modern Postgres this may already be
-- available; "if not exists" keeps it safe.
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type package_tier as enum ('starter', 'pro', 'premium');

create type member_role as enum (
  'owner', 'admin', 'sales', 'ops', 'readonly', 'superadmin'
);

create type approval_status as enum (
  'draft', 'pending_review', 'approved', 'rejected'
);

create type source_type as enum (
  'manual', 'website', 'email', 'import', 'lead_hunter',
  'google', 'referral', 'partner', 'bexio', 'other'
);

create type lead_status as enum (
  'new', 'qualified', 'offer_ready', 'offer_sent', 'waiting_reply',
  'followup_due', 'won', 'lost', 'archived'
);

create type prospect_status as enum (
  'raw', 'scored', 'approved', 'contacted', 'replied',
  'converted', 'rejected', 'archived'
);

create type offer_status as enum (
  'draft', 'ready', 'sent', 'accepted', 'declined', 'expired', 'archived'
);

create type job_status as enum (
  'planned', 'confirmed', 'in_progress', 'completed', 'cancelled', 'archived'
);

create type handoff_status as enum (
  'not_ready', 'ready', 'queued', 'sent', 'failed', 'completed'
);

create type audit_action_type as enum (
  'create', 'update', 'delete', 'restore', 'status_change',
  'login', 'export', 'handoff', 'system'
);

-- -----------------------------------------------------------------------------
-- Shared trigger function: maintain updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLES
-- =============================================================================
-- Conventions:
--   * id            uuid primary key default gen_random_uuid()
--   * tenant tables carry company_id uuid not null references companies(id)
--   * created_at / updated_at on every table (audit_logs: created_at only)
--   * deleted_at for soft-deletable, data-bearing tables
--   * created_by / updated_by where useful (-> user_profiles)
-- Not tenant-scoped (no company_id): user_profiles (per person, -> auth.users)
-- and industry_presets (global catalog).
-- =============================================================================

-- Industry presets (global catalog) ------------------------------------------
create table public.industry_presets (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  tagline text,
  default_services text[] not null default '{}',
  default_sources source_type[] not null default '{}',
  default_followup_cadence_hours int[] not null default '{24,48,120}',
  target_customer_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User profiles (global, 1:1 with auth.users) --------------------------------
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  locale text not null default 'de-CH',
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Companies (tenant root) -----------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  brand_name text not null,
  industry_preset_id uuid references public.industry_presets(id),
  tier package_tier not null default 'starter',
  regions_served text[] not null default '{}',
  status text not null default 'trial'
    check (status in ('trial', 'active', 'suspended')),
  is_first_tenant boolean not null default false,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_companies_status on public.companies (status);
create index idx_companies_created_at on public.companies (created_at);
create index idx_companies_deleted_at on public.companies (deleted_at);

-- Company members (user <-> company, with role) ------------------------------
create table public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role member_role not null default 'readonly',
  is_active boolean not null default true,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);
create index idx_company_members_company_id on public.company_members (company_id);
create index idx_company_members_user_id on public.company_members (user_id);
create index idx_company_members_company_role on public.company_members (company_id, role);

-- Company settings (1:1 per company) -----------------------------------------
create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  default_vat_rate_pct numeric(4,2) not null default 8.10,
  followup_cadence_hours int[] not null default '{24,48,120}',
  sender_name text,
  sender_email text,
  settings jsonb not null default '{}',
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_company_settings_company_id on public.company_settings (company_id);

-- Company services ------------------------------------------------------------
create table public.company_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  price_label text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_company_services_company_id on public.company_services (company_id);
create index idx_company_services_created_at on public.company_services (created_at);
create index idx_company_services_deleted_at on public.company_services (deleted_at);
create index idx_company_services_company_created on public.company_services (company_id, created_at);

-- Pricing models --------------------------------------------------------------
create table public.pricing_models (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  unit text,
  base_rate numeric(12,2),
  params jsonb not null default '{}',
  is_active boolean not null default true,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_pricing_models_company_id on public.pricing_models (company_id);
create index idx_pricing_models_created_at on public.pricing_models (created_at);
create index idx_pricing_models_deleted_at on public.pricing_models (deleted_at);
create index idx_pricing_models_company_created on public.pricing_models (company_id, created_at);

-- Lead sources ----------------------------------------------------------------
create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type source_type not null,
  label text not null,
  enabled boolean not null default true,
  notes text,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_lead_sources_company_id on public.lead_sources (company_id);
create index idx_lead_sources_created_at on public.lead_sources (created_at);
create index idx_lead_sources_deleted_at on public.lead_sources (deleted_at);
create index idx_lead_sources_company_created on public.lead_sources (company_id, created_at);

-- Prospects (Lead Hunter candidates; promoted_lead_id FK added after leads) ---
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text,
  region text,
  source_type source_type not null default 'lead_hunter',
  search_query text,
  score int,
  confidence numeric(5,2),
  reason text,
  suggested_message text,
  status prospect_status not null default 'raw',
  approval_status approval_status not null default 'draft',
  est_value_chf numeric(12,2),
  promoted_lead_id uuid,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_prospects_company_id on public.prospects (company_id);
create index idx_prospects_status on public.prospects (status);
create index idx_prospects_created_at on public.prospects (created_at);
create index idx_prospects_deleted_at on public.prospects (deleted_at);
create index idx_prospects_company_status on public.prospects (company_id, status);
create index idx_prospects_company_created on public.prospects (company_id, created_at);

-- Leads -----------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  service_interest text,
  region text,
  status lead_status not null default 'new',
  source_id uuid references public.lead_sources(id) on delete set null,
  source_type source_type not null default 'manual',
  est_value_chf numeric(12,2),
  prospect_id uuid references public.prospects(id) on delete set null,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_leads_company_id on public.leads (company_id);
create index idx_leads_status on public.leads (status);
create index idx_leads_created_at on public.leads (created_at);
create index idx_leads_deleted_at on public.leads (deleted_at);
create index idx_leads_company_status on public.leads (company_id, status);
create index idx_leads_company_created on public.leads (company_id, created_at);

-- Now that leads exists, close the prospects -> leads relationship.
alter table public.prospects
  add constraint prospects_promoted_lead_fk
  foreign key (promoted_lead_id) references public.leads(id) on delete set null;

-- Lead scores (append-only history) ------------------------------------------
create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  score int not null,
  confidence numeric(5,2),
  region_match boolean,
  service_fit boolean,
  reasons text[] not null default '{}',
  model_version text,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lead_scores_company_id on public.lead_scores (company_id);
create index idx_lead_scores_lead_id on public.lead_scores (lead_id);
create index idx_lead_scores_created_at on public.lead_scores (created_at);
create index idx_lead_scores_company_created on public.lead_scores (company_id, created_at);

-- Lead activities (append-only timeline) -------------------------------------
create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null,
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  summary text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lead_activities_company_id on public.lead_activities (company_id);
create index idx_lead_activities_lead_id on public.lead_activities (lead_id);
create index idx_lead_activities_created_at on public.lead_activities (created_at);
create index idx_lead_activities_company_created on public.lead_activities (company_id, created_at);

-- Offers ----------------------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  reference text not null,
  status offer_status not null default 'draft',
  total_net_chf numeric(12,2) not null default 0,
  vat_rate_pct numeric(4,2) not null default 8.10,
  total_gross_chf numeric(12,2) not null default 0,
  valid_until date,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, reference)
);
create index idx_offers_company_id on public.offers (company_id);
create index idx_offers_status on public.offers (status);
create index idx_offers_created_at on public.offers (created_at);
create index idx_offers_deleted_at on public.offers (deleted_at);
create index idx_offers_company_status on public.offers (company_id, status);
create index idx_offers_company_created on public.offers (company_id, created_at);

-- Offer items -----------------------------------------------------------------
create table public.offer_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  label text not null,
  detail text,
  amount_chf numeric(12,2) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_offer_items_company_id on public.offer_items (company_id);
create index idx_offer_items_offer_id on public.offer_items (offer_id);
create index idx_offer_items_company_created on public.offer_items (company_id, created_at);

-- Follow-up tasks -------------------------------------------------------------
create table public.followup_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  stage text not null check (stage in ('24h', '48h', '5d_final')),
  due_at timestamptz not null,
  channel text,
  status text not null default 'planned'
    check (status in ('planned', 'due', 'overdue', 'done', 'skipped')),
  note text,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_followup_tasks_company_id on public.followup_tasks (company_id);
create index idx_followup_tasks_status on public.followup_tasks (status);
create index idx_followup_tasks_created_at on public.followup_tasks (created_at);
create index idx_followup_tasks_due_at on public.followup_tasks (due_at);
create index idx_followup_tasks_company_status on public.followup_tasks (company_id, status);
create index idx_followup_tasks_company_created on public.followup_tasks (company_id, created_at);

-- Jobs ------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  title text not null,
  location text,
  scheduled_for timestamptz,
  team text,
  status job_status not null default 'planned',
  value_chf numeric(12,2),
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_jobs_company_id on public.jobs (company_id);
create index idx_jobs_status on public.jobs (status);
create index idx_jobs_created_at on public.jobs (created_at);
create index idx_jobs_deleted_at on public.jobs (deleted_at);
create index idx_jobs_company_status on public.jobs (company_id, status);
create index idx_jobs_company_created on public.jobs (company_id, created_at);

-- Job notes -------------------------------------------------------------------
create table public.job_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  author_user_id uuid references public.user_profiles(id) on delete set null,
  body text not null,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_job_notes_company_id on public.job_notes (company_id);
create index idx_job_notes_job_id on public.job_notes (job_id);
create index idx_job_notes_created_at on public.job_notes (created_at);
create index idx_job_notes_deleted_at on public.job_notes (deleted_at);
create index idx_job_notes_company_created on public.job_notes (company_id, created_at);

-- bexio connections (metadata only — NO tokens here) -------------------------
create table public.bexio_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'connected', 'error', 'reconnect_required')),
  level text not null default 'connect' check (level in ('connect', 'plus')),
  -- Pointer to the ENCRYPTED token in a separate restricted store (e.g. Vault).
  -- Never store raw OAuth tokens here; never log them. See security docs.
  secret_ref text,
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bexio_connections_company_id on public.bexio_connections (company_id);
create index idx_bexio_connections_status on public.bexio_connections (status);
comment on column public.bexio_connections.secret_ref is
  'Reference to an encrypted token in a separate restricted store. Never a raw token; never logged.';

-- bexio handoffs (queue / protocol) ------------------------------------------
create table public.bexio_handoffs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  connection_id uuid references public.bexio_connections(id) on delete set null,
  status handoff_status not null default 'not_ready',
  net_chf numeric(12,2) not null default 0,
  vat_rate_pct numeric(4,2) not null default 8.10,
  gross_chf numeric(12,2) not null default 0,
  invoice_draft_ref text,
  queued_at timestamptz,
  sent_at timestamptz,
  error_message text,
  created_by uuid references public.user_profiles(id) on delete set null,
  updated_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_bexio_handoffs_company_id on public.bexio_handoffs (company_id);
create index idx_bexio_handoffs_status on public.bexio_handoffs (status);
create index idx_bexio_handoffs_created_at on public.bexio_handoffs (created_at);
create index idx_bexio_handoffs_company_status on public.bexio_handoffs (company_id, status);
create index idx_bexio_handoffs_company_created on public.bexio_handoffs (company_id, created_at);

-- Audit logs (append-only; company_id nullable for system/login events) ------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  action audit_action_type not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  -- Hashed client IP only — never the raw IP, never secrets/tokens.
  ip_hash text,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_company_id on public.audit_logs (company_id);
create index idx_audit_logs_action on public.audit_logs (action);
create index idx_audit_logs_created_at on public.audit_logs (created_at);
create index idx_audit_logs_company_created on public.audit_logs (company_id, created_at);
comment on column public.audit_logs.ip_hash is
  'Hashed IP for abuse investigation. Never store raw IP, secrets or tokens.';

-- -----------------------------------------------------------------------------
-- updated_at triggers (all tables that have updated_at; audit_logs excluded)
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  tbls text[] := array[
    'industry_presets', 'user_profiles', 'companies', 'company_members',
    'company_settings', 'company_services', 'pricing_models', 'lead_sources',
    'prospects', 'leads', 'lead_scores', 'lead_activities', 'offers',
    'offer_items', 'followup_tasks', 'jobs', 'job_notes',
    'bexio_connections', 'bexio_handoffs'
  ];
begin
  foreach t in array tbls loop
    execute format(
      'create trigger trg_set_updated_at_%1$s before update on public.%1$I '
      'for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Principle: DEFAULT DENY, ROLE-AWARE (hardened in v0.2.3). A user may access a
-- row only for a company where they are an ACTIVE member. READ is open to any
-- active member; WRITE depends on member_role:
--   owner/admin -> broad tenant write (incl. settings, members, bexio)
--   sales       -> leads, prospects, offers, offer_items, follow-ups,
--                  lead_scores, lead_activities (append)
--   ops         -> jobs, job_notes, follow-ups
--   readonly    -> SELECT only (no writes)
--   superadmin  -> support-level READ across companies, NO write
-- Service-role connections bypass RLS for trusted system jobs (e.g. queued
-- bexio handoffs); that is not modelled as a member role.
-- =============================================================================

-- Role-aware helpers. SECURITY DEFINER so they bypass RLS on company_members
-- (prevents recursive policy evaluation); search_path is pinned for safety.

-- The caller's role in a company, or NULL if not an active member.
create or replace function public.member_role_for(target_company uuid)
returns member_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.company_members m
  where m.company_id = target_company
    and m.user_id = auth.uid()
    and m.is_active = true
  limit 1;
$$;

-- True if the caller has an active 'superadmin' membership anywhere.
create or replace function public.can_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.company_members m
    where m.user_id = auth.uid()
      and m.role = 'superadmin'
      and m.is_active = true
  );
$$;

-- READ: any active member of the company, or a superadmin (support read).
create or replace function public.can_read_company(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.member_role_for(target_company) is not null
      or public.can_superadmin();
$$;

-- MANAGE (company, members, settings, bexio): owner or admin. Intentionally NO
-- superadmin — superadmin is support-read-only.
create or replace function public.can_manage_company(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.member_role_for(target_company) in ('owner', 'admin');
$$;

-- SALES writes (leads, prospects, offers, follow-ups, …): owner/admin/sales.
create or replace function public.can_write_sales(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.member_role_for(target_company) in ('owner', 'admin', 'sales');
$$;

-- OPS writes (jobs, job notes, follow-ups): owner/admin/ops.
create or replace function public.can_write_ops(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.member_role_for(target_company) in ('owner', 'admin', 'ops');
$$;

-- SETTINGS/config writes (settings, services, pricing, sources): owner/admin.
create or replace function public.can_write_settings(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.member_role_for(target_company) in ('owner', 'admin');
$$;

-- companies -------------------------------------------------------------------
-- Read: members + superadmin. Manage (update/delete): owner/admin only. Create:
-- any authenticated user (the first owner membership is then created by the
-- privileged onboarding path — see company_members).
alter table public.companies enable row level security;
create policy companies_select on public.companies for select
  using (public.can_read_company(id));
create policy companies_insert on public.companies for insert
  with check (auth.uid() is not null);
create policy companies_update on public.companies for update
  using (public.can_manage_company(id))
  with check (public.can_manage_company(id));
create policy companies_delete on public.companies for delete
  using (public.can_manage_company(id));

-- company_members -------------------------------------------------------------
-- You can always see your own membership; otherwise members of your companies.
-- Managing members requires owner/admin. The FIRST owner membership of a new
-- company is created by a privileged onboarding path (service role / SECURITY
-- DEFINER RPC, added with auth) — not by self-insert, to avoid privilege
-- escalation.
alter table public.company_members enable row level security;
create policy company_members_select on public.company_members for select
  using (user_id = auth.uid() or public.can_read_company(company_id));
create policy company_members_insert on public.company_members for insert
  with check (public.can_manage_company(company_id));
create policy company_members_update on public.company_members for update
  using (public.can_manage_company(company_id))
  with check (public.can_manage_company(company_id));
create policy company_members_delete on public.company_members for delete
  using (public.can_manage_company(company_id));

-- user_profiles ---------------------------------------------------------------
alter table public.user_profiles enable row level security;
create policy user_profiles_select on public.user_profiles for select
  using (id = auth.uid() or public.can_superadmin());
create policy user_profiles_insert on public.user_profiles for insert
  with check (id = auth.uid());
create policy user_profiles_update on public.user_profiles for update
  using (id = auth.uid() or public.can_superadmin())
  with check (id = auth.uid() or public.can_superadmin());

-- industry_presets (global catalog: read for all authenticated, write superadmin)
alter table public.industry_presets enable row level security;
create policy industry_presets_read on public.industry_presets for select
  using (auth.uid() is not null);
create policy industry_presets_write on public.industry_presets for all
  using (public.can_superadmin())
  with check (public.can_superadmin());

-- Append-only sales tables: SELECT (read) + INSERT (sales) only. No update/
-- delete policy => those are denied, so the history stays immutable.
alter table public.lead_scores enable row level security;
create policy lead_scores_select on public.lead_scores for select
  using (public.can_read_company(company_id));
create policy lead_scores_insert on public.lead_scores for insert
  with check (public.can_write_sales(company_id));

alter table public.lead_activities enable row level security;
create policy lead_activities_select on public.lead_activities for select
  using (public.can_read_company(company_id));
create policy lead_activities_insert on public.lead_activities for insert
  with check (public.can_write_sales(company_id));

-- audit_logs: append-only, immutable; company_id may be null (system events) --
alter table public.audit_logs enable row level security;
create policy audit_logs_select on public.audit_logs for select
  using (
    (company_id is not null and public.can_read_company(company_id))
    or public.can_superadmin()
  );
create policy audit_logs_insert on public.audit_logs for insert
  with check (company_id is null or public.can_read_company(company_id));

-- Role-aware tenant policies ---------------------------------------------------
-- Per table: SELECT = any active member (can_read_company); INSERT/UPDATE/DELETE
-- = the group's write predicate. readonly therefore has SELECT only. Separate
-- per-command policies (not "for all") are REQUIRED so DELETE is gated by the
-- WRITE predicate, not the read predicate.

-- Sales domain (owner/admin/sales).
do $$
declare t text;
  tbls text[] := array['leads', 'prospects', 'offers', 'offer_items'];
  wr text := 'public.can_write_sales(company_id)';
begin
  foreach t in array tbls loop
    execute format('alter table public.%1$I enable row level security;', t);
    execute format('create policy %1$s_select on public.%1$I for select using (public.can_read_company(company_id));', t);
    execute format('create policy %1$s_insert on public.%1$I for insert with check (%2$s);', t, wr);
    execute format('create policy %1$s_update on public.%1$I for update using (%2$s) with check (%2$s);', t, wr);
    execute format('create policy %1$s_delete on public.%1$I for delete using (%2$s);', t, wr);
  end loop;
end;
$$;

-- Ops domain (owner/admin/ops).
do $$
declare t text;
  tbls text[] := array['jobs', 'job_notes'];
  wr text := 'public.can_write_ops(company_id)';
begin
  foreach t in array tbls loop
    execute format('alter table public.%1$I enable row level security;', t);
    execute format('create policy %1$s_select on public.%1$I for select using (public.can_read_company(company_id));', t);
    execute format('create policy %1$s_insert on public.%1$I for insert with check (%2$s);', t, wr);
    execute format('create policy %1$s_update on public.%1$I for update using (%2$s) with check (%2$s);', t, wr);
    execute format('create policy %1$s_delete on public.%1$I for delete using (%2$s);', t, wr);
  end loop;
end;
$$;

-- Follow-ups: sales OR ops (owner/admin/sales/ops).
do $$
declare t text;
  tbls text[] := array['followup_tasks'];
  wr text := '(public.can_write_sales(company_id) or public.can_write_ops(company_id))';
begin
  foreach t in array tbls loop
    execute format('alter table public.%1$I enable row level security;', t);
    execute format('create policy %1$s_select on public.%1$I for select using (public.can_read_company(company_id));', t);
    execute format('create policy %1$s_insert on public.%1$I for insert with check (%2$s);', t, wr);
    execute format('create policy %1$s_update on public.%1$I for update using (%2$s) with check (%2$s);', t, wr);
    execute format('create policy %1$s_delete on public.%1$I for delete using (%2$s);', t, wr);
  end loop;
end;
$$;

-- Settings / config: owner/admin only.
do $$
declare t text;
  tbls text[] := array['company_settings', 'company_services', 'pricing_models', 'lead_sources'];
  wr text := 'public.can_write_settings(company_id)';
begin
  foreach t in array tbls loop
    execute format('alter table public.%1$I enable row level security;', t);
    execute format('create policy %1$s_select on public.%1$I for select using (public.can_read_company(company_id));', t);
    execute format('create policy %1$s_insert on public.%1$I for insert with check (%2$s);', t, wr);
    execute format('create policy %1$s_update on public.%1$I for update using (%2$s) with check (%2$s);', t, wr);
    execute format('create policy %1$s_delete on public.%1$I for delete using (%2$s);', t, wr);
  end loop;
end;
$$;

-- bexio: owner/admin. System/service writes (e.g. queued handoffs) use the
-- service role, which bypasses RLS — not modelled as a member role here.
do $$
declare t text;
  tbls text[] := array['bexio_connections', 'bexio_handoffs'];
  wr text := 'public.can_manage_company(company_id)';
begin
  foreach t in array tbls loop
    execute format('alter table public.%1$I enable row level security;', t);
    execute format('create policy %1$s_select on public.%1$I for select using (public.can_read_company(company_id));', t);
    execute format('create policy %1$s_insert on public.%1$I for insert with check (%2$s);', t, wr);
    execute format('create policy %1$s_update on public.%1$I for update using (%2$s) with check (%2$s);', t, wr);
    execute format('create policy %1$s_delete on public.%1$I for delete using (%2$s);', t, wr);
  end loop;
end;
$$;

-- =============================================================================
-- End of migration 001. No seed data, no credentials, no secrets.
-- =============================================================================
