-- =============================================================================
-- Klarsa Core — migration 003: lead notes
-- =============================================================================
-- ADDITIVE ONLY. Migrations 001 and 002 are already applied and are NOT
-- modified here. Adds a free-text `notes` column to `leads` for the manual
-- Lead Inbox entry form (v0.3.0).
--
-- Safe to apply on top of 001/002. Re-runnable (`add column if not exists`).
-- No data, no credentials, no secrets. The column inherits the existing
-- role-aware RLS policies on `leads` (no new policies required).
-- =============================================================================

alter table public.leads
  add column if not exists notes text;

comment on column public.leads.notes is
  'Free-text notes for a manually entered lead (Lead Inbox, v0.3.0).';

-- =============================================================================
-- End of migration 003.
-- =============================================================================
