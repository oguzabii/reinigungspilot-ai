-- =============================================================================
-- Klarsa Core — Migration 007: prospects contact fields (controlled outreach)
-- =============================================================================
-- ADDITIVE + IDEMPOTENT. Does NOT modify migrations 001-006.
--
-- The Outreach Autopilot (v0.5.8) prepares first-contact drafts for discovered
-- candidates (`prospects`). To support the v0.5.9 controlled, single-recipient,
-- owner-approved EMAIL send channel, a prospect needs somewhere to hold the
-- contact a human entered/approved. `leads` already carry email/phone/contact;
-- `prospects` did not — these columns mirror that, on prospects.
--
-- All columns are NULLABLE (no backfill, no data): a candidate without contact
-- details simply has NULLs and the UI shows "Kontaktangaben fehlen". No RLS
-- change is needed — `prospects` already has role-aware policies (001/002.3) that
-- cover every column: reads = any active member, writes = `can_write_sales`
-- (owner/admin/sales). There is NO column-level policy in this schema.
--
-- `last_contacted_at` records when the owner actually sent/contacted (set by the
-- send action together with status = 'contacted'). No new enum, no index needed.
--
-- Safe to run more than once (ADD COLUMN IF NOT EXISTS).
-- =============================================================================

alter table public.prospects
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists contact_website text,
  add column if not exists contact_person text,
  add column if not exists last_contacted_at timestamptz;
