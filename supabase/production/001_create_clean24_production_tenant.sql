-- =============================================================================
-- Klarsa Core — create/update the Clean24 PRODUCTION tenant (v0.4.1)
-- =============================================================================
-- Production-safe bootstrap for the first real Klarsa tenant,
-- "Clean24 Memis GmbH", on the klarsa-production project.
--
--   * PRODUCTION ONLY. Run this in the SQL editor of the `klarsa-production`
--     project. Do NOT run it on staging.
--   * Requires migrations 001..006 applied first (see ../migrations).
--   * TENANT CONFIG ONLY — NO customer data: no leads, prospects, offers, jobs,
--     follow-ups, scores, audit rows, or bexio tokens. Only the company row,
--     its settings, the owner membership, and the company's own
--     service/source catalog (configuration, not customer records).
--   * Idempotent: re-running updates the rows in place (fixed config UUIDs +
--     on-conflict upserts).
--   * NO real auth UID, passwords, keys, project URLs, anon/service-role keys,
--     or env values are stored in this file.
--   * Separate from the old standalone "Clean24 Lead Autopilot" (do not couple).
--
-- !!! BEFORE RUNNING — replace the placeholder owner UID !!!
--   1. In Supabase → Authentication → Users, find the production owner user
--      (created manually beforehand) and copy its **User UID** (a UUID).
--   2. In THIS file, replace the token  CLEAN24_OWNER_AUTH_USER_ID  with that
--      UUID (it appears once, in the owner-binding DO block below). Keep the
--      single quotes: '00000000-0000-0000-0000-000000000000'.
--   3. Do NOT commit the real UID back into the repo — keep the placeholder in
--      the committed copy. If you forget to replace it, the script fails loudly
--      (invalid uuid) and changes nothing in the owner-binding step.
--
-- What this inserts/updates:
--   companies          -> Clean24 Memis GmbH (Premium, internal_founder, active)
--   company_settings    -> VAT default + sender name (no real mailbox)
--   company_services    -> Clean24's own service catalog (config)
--   lead_sources        -> a minimal, human-approved source baseline (config)
--   user_profiles       -> a profile row for the owner auth user (1:1)
--   company_members     -> the owner membership (role 'owner')
--
-- After running: see the verification query at the bottom of this file.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Company (founder tenant). Premium, billing internal_founder, status active.
--    The fixed UUID is a non-secret config identifier (same across environments).
-- -----------------------------------------------------------------------------
insert into public.companies
  (id, legal_name, brand_name, industry_preset_id, tier, regions_served, status,
   is_first_tenant, billing_status, access_status, billing_provider)
values
  ('00000000-0000-4000-8000-0000000c1e00',
   'Clean24 Memis GmbH',
   'Clean24',
   (select id from public.industry_presets where key = 'reinigung' limit 1), -- NULL-safe if catalog empty
   'premium',
   '{ZH,BE,LU,UR,SZ,OW,NW,GL,ZG,FR,SO,BS,BL,SH,AR,AI,SG,GR,AG,TG,TI,VD,VS,NE,GE,JU}',
   'active',
   true,
   'internal_founder',
   'full',
   'internal')
on conflict (id) do update set
  legal_name         = excluded.legal_name,
  brand_name         = excluded.brand_name,
  industry_preset_id = coalesce(excluded.industry_preset_id, public.companies.industry_preset_id),
  tier               = excluded.tier,
  regions_served     = excluded.regions_served,
  status             = excluded.status,
  is_first_tenant    = excluded.is_first_tenant,
  billing_status     = excluded.billing_status,
  access_status      = excluded.access_status,
  billing_provider   = excluded.billing_provider;

-- -----------------------------------------------------------------------------
-- 2. Settings (1:1). No real mailbox — sender_email left NULL (no email sending).
-- -----------------------------------------------------------------------------
insert into public.company_settings
  (company_id, default_vat_rate_pct, sender_name, sender_email)
values
  ('00000000-0000-4000-8000-0000000c1e00', 8.10, 'Clean24', null)
on conflict (company_id) do update set
  default_vat_rate_pct = excluded.default_vat_rate_pct,
  sender_name          = excluded.sender_name;

-- -----------------------------------------------------------------------------
-- 3. Services — Clean24's own service catalog (CONFIG, not customer data).
--    Display-only price labels; no real pricing logic.
-- -----------------------------------------------------------------------------
insert into public.company_services
  (id, company_id, key, label, price_label, sort_order)
values
  ('00000000-0000-4000-8000-0000000c1e01', '00000000-0000-4000-8000-0000000c1e00', 'umzugsreinigung',     'Umzugsreinigung',      'Pauschale nach Wohnungsgrösse', 1),
  ('00000000-0000-4000-8000-0000000c1e02', '00000000-0000-4000-8000-0000000c1e00', 'bueroreinigung',      'Büroreinigung',        'Abo pro Monat',                 2),
  ('00000000-0000-4000-8000-0000000c1e03', '00000000-0000-4000-8000-0000000c1e00', 'fensterreinigung',    'Fensterreinigung',     'Richtwert pro Einsatz',         3),
  ('00000000-0000-4000-8000-0000000c1e04', '00000000-0000-4000-8000-0000000c1e00', 'unterhaltsreinigung', 'Unterhaltsreinigung',  'Abo pro Monat',                 4),
  ('00000000-0000-4000-8000-0000000c1e05', '00000000-0000-4000-8000-0000000c1e00', 'baureinigung',        'Baureinigung',         'Offerte nach Objekt',           5),
  ('00000000-0000-4000-8000-0000000c1e06', '00000000-0000-4000-8000-0000000c1e00', 'treppenhausreinigung','Treppenhausreinigung', 'Abo pro Monat',                 6),
  ('00000000-0000-4000-8000-0000000c1e07', '00000000-0000-4000-8000-0000000c1e00', 'hauswartung',         'Hauswartung',          'Abo pro Monat',                 7),
  ('00000000-0000-4000-8000-0000000c1e08', '00000000-0000-4000-8000-0000000c1e00', 'tiefgaragenreinigung','Tiefgaragenreinigung', 'Offerte nach Objekt',           8)
on conflict (id) do update set
  key         = excluded.key,
  label       = excluded.label,
  price_label = excluded.price_label,
  sort_order  = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- 4. Lead sources — minimal, human-approved baseline (CONFIG, not customer data).
--    `type` uses the source_type enum; `label` is the channel name.
-- -----------------------------------------------------------------------------
insert into public.lead_sources (id, company_id, type, label)
values
  ('00000000-0000-4000-8000-0000000c1f01', '00000000-0000-4000-8000-0000000c1e00', 'manual',   'Manuell'),
  ('00000000-0000-4000-8000-0000000c1f02', '00000000-0000-4000-8000-0000000c1e00', 'referral', 'Empfehlung'),
  ('00000000-0000-4000-8000-0000000c1f03', '00000000-0000-4000-8000-0000000c1e00', 'website',  'Website Anfrage'),
  ('00000000-0000-4000-8000-0000000c1f04', '00000000-0000-4000-8000-0000000c1e00', 'partner',  'Verwaltung')
on conflict (id) do update set
  type  = excluded.type,
  label = excluded.label;

-- -----------------------------------------------------------------------------
-- 5. Owner binding — REPLACE the placeholder UID below before running.
--    Upserts the owner's user_profiles row (1:1 with auth.users) and the owner
--    membership. No password, no email literal (email is read from auth.users).
-- -----------------------------------------------------------------------------
do $$
declare
  -- vvv REPLACE 'CLEAN24_OWNER_AUTH_USER_ID' with the real auth User UID vvv
  owner_uid uuid := 'CLEAN24_OWNER_AUTH_USER_ID';
  -- ^^^ keep the single quotes; do NOT commit the real UID back to the repo ^^^
  company_uuid constant uuid := '00000000-0000-4000-8000-0000000c1e00';
begin
  -- The auth user must already exist (created in Supabase Authentication first).
  if not exists (select 1 from auth.users where id = owner_uid) then
    raise exception
      'Auth user % not found in auth.users. Create the production owner in '
      'Supabase Authentication first, then put its UID here.', owner_uid;
  end if;

  -- Profile (1:1 with auth.users). Email pulled from auth.users — no literal here.
  insert into public.user_profiles (id, email, display_name, locale, is_active)
  values (
    owner_uid,
    (select email from auth.users where id = owner_uid),
    'Clean24 Inhaber',
    'de-CH',
    true)
  on conflict (id) do update set
    email      = coalesce(excluded.email, public.user_profiles.email),
    is_active  = true,
    updated_at = now();

  -- Owner membership (role 'owner', active). Unique on (company_id, user_id).
  insert into public.company_members (company_id, user_id, role, is_active, joined_at)
  values (company_uuid, owner_uid, 'owner', true, now())
  on conflict (company_id, user_id) do update set
    role       = 'owner',
    is_active  = true,
    updated_at = now();

  raise notice 'Clean24 production tenant bootstrap: owner % bound to company %.',
    owner_uid, company_uuid;
end;
$$;

-- =============================================================================
-- VERIFICATION (read-only) — run after the script above; expect one owner row.
-- =============================================================================
-- select c.brand_name, c.legal_name, c.tier, c.status,
--        c.billing_status, c.access_status,
--        (select count(*) from public.company_services s where s.company_id = c.id) as services,
--        (select count(*) from public.lead_sources    l where l.company_id = c.id) as sources,
--        (select count(*) from public.company_members  m where m.company_id = c.id and m.role = 'owner' and m.is_active) as owners,
--        (select count(*) from public.leads    where company_id = c.id) as leads_should_be_0,
--        (select count(*) from public.offers   where company_id = c.id) as offers_should_be_0,
--        (select count(*) from public.jobs     where company_id = c.id) as jobs_should_be_0,
--        (select count(*) from public.prospects where company_id = c.id) as prospects_should_be_0
-- from public.companies c
-- where c.id = '00000000-0000-4000-8000-0000000c1e00';
--
-- Expected: tier=premium, status=active, owners=1, services/sources > 0, and
-- every *_should_be_0 column = 0 (no customer data). Real customer data stays
-- NO-GO until the production-readiness gate is signed GO by the owner.
-- =============================================================================
