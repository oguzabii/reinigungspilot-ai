-- =============================================================================
-- Klarsa Core — migration 004: follow-up ↔ lead tenant integrity (deferred F6)
-- =============================================================================
-- Additive and idempotent. Does NOT modify migrations 001/002/003.
--
-- Why: `followup_tasks` links to a lead via `lead_id`, and the application sets
-- `followup_tasks.company_id` to the active tenant. Nothing at the DB level
-- guaranteed that a follow-up's tenant equals its lead's tenant — the app
-- enforces it with a server-side pre-check (defense in depth), but a composite
-- foreign key closes the gap permanently. This is the hardening deferred from
-- the v0.3.1 engineering review (finding F6).
--
-- What it does:
--   1) Adds a composite UNIQUE constraint on leads(id, company_id) so it can be
--      the target of a composite FK. `id` is already the primary key (globally
--      unique), so this never rejects existing rows; it only exposes the pair
--      as an FK target.
--   2) Adds a composite FK followup_tasks(lead_id, company_id)
--      → leads(id, company_id), ON DELETE CASCADE (matching the existing
--      single-column lead_id FK). The pre-existing FK is left in place; both
--      enforce, which is harmless.
--
-- Precondition (already true for app-created data): every existing
-- followup_tasks row must have company_id equal to its lead's company_id.
-- To check before applying:
--   select ft.id from public.followup_tasks ft
--   join public.leads l on l.id = ft.lead_id
--   where ft.company_id <> l.company_id;
-- (Expect zero rows. If any appear, fix them before running step 2.)
--
-- STAGING / standard migration: contains no data, no credentials. Safe to run
-- on the klarsa-staging project after 001–003.
-- =============================================================================

do $$
begin
  -- 1) Composite unique on leads(id, company_id) — FK target.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.leads'::regclass
      and conname = 'leads_id_company_id_key'
  ) then
    alter table public.leads
      add constraint leads_id_company_id_key unique (id, company_id);
    raise notice 'Added unique constraint leads_id_company_id_key.';
  else
    raise notice 'leads_id_company_id_key already exists — skipped.';
  end if;

  -- 2) Composite FK: a follow-up's tenant must match its lead's tenant.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.followup_tasks'::regclass
      and conname = 'followup_tasks_lead_company_fkey'
  ) then
    alter table public.followup_tasks
      add constraint followup_tasks_lead_company_fkey
      foreign key (lead_id, company_id)
      references public.leads (id, company_id)
      on delete cascade;
    raise notice 'Added composite FK followup_tasks_lead_company_fkey.';
  else
    raise notice 'followup_tasks_lead_company_fkey already exists — skipped.';
  end if;
end;
$$;
