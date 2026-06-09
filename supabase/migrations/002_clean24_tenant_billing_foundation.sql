-- =============================================================================
-- Klarsa Core — migration 002: tenant billing / access foundation
-- =============================================================================
-- ADDITIVE ONLY. Migration 001 is already applied and is NOT modified here.
-- This adds billing/access fields to `companies` for the Clean24 founder tenant
-- (and future tenants). There is NO real billing yet — these are status fields.
--
-- Safe to apply to staging on top of 001. Re-runnable (guarded enum creation +
-- `add column if not exists`). No data, no credentials, no secrets.
-- =============================================================================

-- Enums (guarded so the migration is re-runnable on a DB that already has them).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'billing_status') then
    create type billing_status as enum (
      'internal_founder', 'trial', 'active', 'overdue', 'limited', 'paused', 'cancelled'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'access_status') then
    create type access_status as enum ('full', 'limited', 'suspended');
  end if;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'billing_provider') then
    create type billing_provider as enum ('internal', 'manual', 'bexio', 'stripe');
  end if;
end;
$$;

-- Columns on companies (additive; safe defaults fill any existing rows).
alter table public.companies
  add column if not exists billing_status billing_status not null default 'trial';
alter table public.companies
  add column if not exists access_status access_status not null default 'full';
alter table public.companies
  add column if not exists billing_provider billing_provider not null default 'internal';

comment on column public.companies.billing_status is
  'Billing lifecycle status. No real billing yet; "internal_founder" for the Clean24 founder tenant.';
comment on column public.companies.access_status is
  'App access gate, independent of billing (full | limited | suspended).';
comment on column public.companies.billing_provider is
  'Billing integration source: internal/manual now; bexio/stripe later.';

-- RLS note: these columns inherit the existing role-aware policies on
-- `companies` (managing them is owner/admin via can_manage_company). No new
-- policies are required.

-- =============================================================================
-- End of migration 002. No seed data, no credentials, no secrets.
-- =============================================================================
