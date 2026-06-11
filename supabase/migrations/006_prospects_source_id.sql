-- =============================================================================
-- Klarsa Core — Migration 006: prospects.source_id (Source -> Opportunity link)
-- =============================================================================
-- ADDITIVE + IDEMPOTENT. Does NOT modify migrations 001-005.
--
-- Adds an OPTIONAL link from a prospect (Opportunity Radar item) to the
-- registered `lead_sources` row it was prepared from — the v0.3.10 manual
-- "Source -> Opportunity" workflow. It mirrors the existing `leads.source_id`
-- column from migration 001 exactly (same FK target, same ON DELETE SET NULL),
-- so an Opportunity can record which human-approved source it came from.
--
-- Nullable: manually captured opportunities without a source keep
-- `source_id = NULL`. No backfill, no data, no RLS change — `prospects` already
-- has role-aware policies (from 001/002.3) that cover every column: reads = any
-- active member, writes = `can_write_sales` (owner/admin/sales). Reading a
-- `lead_sources` row to seed the form is allowed for any active member; the
-- registry stays owner/admin-only for WRITES (settings domain), unaffected here.
--
-- Safe to run more than once (guards: ADD COLUMN IF NOT EXISTS + the FK is only
-- attached together with the column; CREATE INDEX IF NOT EXISTS).
-- =============================================================================

alter table public.prospects
  add column if not exists source_id uuid
  references public.lead_sources(id) on delete set null;

create index if not exists idx_prospects_source_id
  on public.prospects (source_id);
