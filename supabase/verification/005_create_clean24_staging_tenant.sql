-- =============================================================================
-- Klarsa Core — create/update the Clean24 founder tenant (STAGING ONLY)
-- =============================================================================
-- Sets up "Clean24 Memis GmbH" as the first Klarsa tenant (live proof) on a
-- STAGING project: the company row + settings + services + lead sources.
--
--   * STAGING ONLY. Do NOT run against production.
--   * Requires migrations 001 AND 002 (billing fields) applied first.
--   * Idempotent: re-running updates the rows in place (fixed UUIDs).
--   * Tenant SETUP only — NO customer data: no leads, prospects, offers, jobs,
--     follow-ups, audit rows. NO auth users, NO passwords, NO memberships
--     (bind a Dashboard auth user separately via 004), NO bexio tokens.
--   * Separate from the old standalone "Clean24 Lead Autopilot".
--
-- Note: "Clean24 Memis GmbH" is the founder's own company configuration (the
-- tenant), not customer data.
-- =============================================================================

-- Company (founder tenant). Premium package, billing status internal_founder.
insert into public.companies
  (id, legal_name, brand_name, industry_preset_id, tier, regions_served, status,
   is_first_tenant, billing_status, access_status, billing_provider)
values
  ('00000000-0000-4000-8000-0000000c1e00',
   'Clean24 Memis GmbH',
   'Clean24',
   (select id from public.industry_presets where key = 'reinigung' limit 1),
   'premium',
   '{ZH,BE,LU,UR,SZ,OW,NW,GL,ZG,FR,SO,BS,BL,SH,AR,AI,SG,GR,AG,TG,TI,VD,VS,NE,GE,JU}',
   'active',
   true,
   'internal_founder',
   'full',
   'internal')
on conflict (id) do update set
  legal_name        = excluded.legal_name,
  brand_name        = excluded.brand_name,
  industry_preset_id = coalesce(excluded.industry_preset_id, public.companies.industry_preset_id),
  tier              = excluded.tier,
  regions_served    = excluded.regions_served,
  status            = excluded.status,
  is_first_tenant   = excluded.is_first_tenant,
  billing_status    = excluded.billing_status,
  access_status     = excluded.access_status,
  billing_provider  = excluded.billing_provider;

-- Settings (1:1). No real mailbox — sender_email left NULL.
insert into public.company_settings
  (company_id, default_vat_rate_pct, sender_name, sender_email)
values
  ('00000000-0000-4000-8000-0000000c1e00', 8.10, 'Clean24', null)
on conflict (company_id) do update set
  default_vat_rate_pct = excluded.default_vat_rate_pct,
  sender_name          = excluded.sender_name;

-- Services (8). Display-only price labels; no real pricing logic.
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
  key        = excluded.key,
  label      = excluded.label,
  price_label = excluded.price_label,
  sort_order = excluded.sort_order;

-- Lead sources (8). `type` uses the DB source_type enum; `label` is the channel.
insert into public.lead_sources (id, company_id, type, label)
values
  ('00000000-0000-4000-8000-0000000c1f01', '00000000-0000-4000-8000-0000000c1e00', 'website',  'Website Anfrage'),
  ('00000000-0000-4000-8000-0000000c1f02', '00000000-0000-4000-8000-0000000c1e00', 'google',   'Google'),
  ('00000000-0000-4000-8000-0000000c1f03', '00000000-0000-4000-8000-0000000c1e00', 'referral', 'Empfehlung'),
  ('00000000-0000-4000-8000-0000000c1f04', '00000000-0000-4000-8000-0000000c1e00', 'partner',  'Verwaltung'),
  ('00000000-0000-4000-8000-0000000c1f05', '00000000-0000-4000-8000-0000000c1e00', 'partner',  'Umzugsfirma Partner'),
  ('00000000-0000-4000-8000-0000000c1f06', '00000000-0000-4000-8000-0000000c1e00', 'partner',  'Bauprojekt'),
  ('00000000-0000-4000-8000-0000000c1f07', '00000000-0000-4000-8000-0000000c1e00', 'referral', 'Praxis/Ärzte'),
  ('00000000-0000-4000-8000-0000000c1f08', '00000000-0000-4000-8000-0000000c1e00', 'manual',   'manuell')
on conflict (id) do update set
  type  = excluded.type,
  label = excluded.label;

-- =============================================================================
-- Done. Tenant setup only — no customer data, no auth users, no memberships.
-- To log in as Clean24: create a Dashboard auth user, then bind it to this
-- company with 004 (target_company_name = 'Clean24 Memis GmbH', role 'owner').
-- =============================================================================
