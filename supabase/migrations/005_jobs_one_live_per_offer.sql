-- =============================================================================
-- Klarsa Core — migration 005: at most one live job per offer (v0.3.4)
-- =============================================================================
-- Additive and idempotent. Does NOT modify migrations 001/002/003/004.
--
-- Why: v0.3.4 lets a user create a `jobs` row from an *accepted* offer. To stop
-- the same offer spawning duplicate jobs, this adds a **partial unique index**:
-- a tenant may have at most one NON-deleted job per offer. The app also does a
-- pre-check, but the index is the real guard (it closes the check-then-insert
-- race). Soft-deleting a job frees the offer to get a new job, which is the
-- intended "re-create after delete" behaviour.
--
-- Precondition (already true for app-created data): no tenant currently has two
-- live jobs pointing at the same offer. To check before applying:
--   select company_id, offer_id, count(*)
--   from public.jobs
--   where offer_id is not null and deleted_at is null
--   group by company_id, offer_id having count(*) > 1;
-- (Expect zero rows. If any appear, soft-delete the extras before running.)
--
-- STAGING / standard migration: contains no data, no credentials. Safe to run
-- on the klarsa-staging project after 001-004.
-- =============================================================================

create unique index if not exists jobs_one_live_per_offer
  on public.jobs (company_id, offer_id)
  where offer_id is not null and deleted_at is null;
