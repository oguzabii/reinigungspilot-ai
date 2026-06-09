# Klarsa Core — Staging Seed Plan (v0.2.2)

> **Status: PLAN.** Defines a **fake** dataset for the **staging** project, used
> only to test RLS ([`rls-test-plan.md`](./rls-test-plan.md)) and workflows.
> **No real customer names, emails, phone numbers, or any real data.** This is a
> plan — no executable seed file is committed in v0.2.2.

## Safety rules

- **Fake only.** Every value is obviously synthetic.
- **Emails:** use the reserved `@example.test` domain (never deliverable).
- **Phone numbers:** placeholder `+41 00 000 00 00` only.
- **Names:** descriptive fakes ("Demo", "Test", role-based), never real people.
- **No bexio tokens, no secrets** — `bexio_connections.secret_ref` stays `null`.
- The dataset exists **only** to exercise tenant isolation and the lead → offer →
  follow-up → job → handoff flow. Delete it freely.

## Two test tenants

| | Company A | Company B |
| --- | --- | --- |
| `legal_name` | **Clean24 Demo Tenant** | **Muster Service Demo Tenant** |
| `brand_name` | Clean24 Demo | Muster Service Demo |
| `industry_preset` | reinigung | reinigung |
| `tier` | pro | starter |
| `regions_served` | `{ZH, AG}` | `{ZH}` |
| `is_first_tenant` | true (Clean24 = first proof) | false |

> "Clean24 Demo Tenant" is a **fake test tenant** for staging. It is not the
> real Clean24, and it is **not** the old standalone Clean24 Lead Autopilot.

## Fake users & roles

Create these in **staging Supabase Auth first** (fake emails), capture each
generated UUID, then insert matching `user_profiles` and `company_members`
(membership `user_id` = the auth UUID = `user_profiles.id`).

| Handle | Email (fake) | Member of | `member_role` | `is_active` |
| --- | --- | --- | --- | --- |
| `USER_A_OWNER` | `owner-a@example.test` | Company A | `owner` | true |
| `USER_A_ADMIN` | `admin-a@example.test` | Company A | `admin` | true |
| `USER_A_READONLY` | `readonly-a@example.test` | Company A | `readonly` | true |
| `USER_A_INACTIVE` | `inactive-a@example.test` | Company A | `sales` | **false** |
| `USER_B_OWNER` | `owner-b@example.test` | Company B | `owner` | true |
| `USER_SUPERADMIN` | `superadmin@example.test` | Company A | `superadmin` | true |

These cover every RLS case: tenant isolation, inactive member, readonly write
block (target), owner/admin manage, and superadmin support read.

## Fake business data (per tenant)

Keep volumes tiny — enough to test, not to benchmark.

**Company A — Clean24 Demo Tenant**
- `lead_sources`: `website` ("Website Anfrage"), `referral` ("Empfehlung"),
  `manual` ("manuell").
- `prospects`: "Demo Verwaltung Nord" (`status` raw → scored), "Demo Praxis Süd".
- `leads`: "Demo Immobilien A AG" (`new`), "Demo Büro A" (`offer_ready`).
- `offers`: ref `OF-TEST-A-001` (`draft`) with 2 `offer_items`.
- `followup_tasks`: one `24h` and one `48h` task on a lead.
- `jobs`: "Demo Auftrag A" (`planned`) with a `job_notes` entry.
- `bexio_connections`: one row, `status='disconnected'`, `level='connect'`,
  `secret_ref=null`.
- `audit_logs`: a couple of `create` / `status_change` entries.

**Company B — Muster Service Demo Tenant**
- `lead_sources`: `website`, `manual`.
- `leads`: "Demo Kunde B GmbH" (`qualified`).
- `offers`: ref `OF-TEST-B-001` (`sent`).
- `jobs`: "Demo Auftrag B" (`confirmed`).
- Minimal rows — mainly to prove A cannot see B and vice-versa.

## Loading order (later, on staging)

1. Apply `001_klarsa_core_schema.sql` (see [staging setup](./supabase-staging-setup.md)).
2. (Optional) seed `industry_presets` with the `reinigung` preset.
3. Create the fake **auth users** (dashboard or Auth admin API) → collect UUIDs.
4. Insert `user_profiles` (id = auth UUID), then `companies`, then
   `company_members` (link users ↔ companies with roles).
5. Insert the per-tenant fake business rows above.
6. Run [`rls-test-plan.md`](./rls-test-plan.md).

## Illustrative snippet (template — fake values only)

```sql
-- Company A (replace <…> with real staging UUIDs once created)
insert into public.companies (id, legal_name, brand_name, tier, regions_served, is_first_tenant)
values ('<COMPANY_A>', 'Clean24 Demo Tenant', 'Clean24 Demo', 'pro', '{ZH,AG}', true);

insert into public.user_profiles (id, email, display_name)
values ('<USER_A_OWNER_ID>', 'owner-a@example.test', 'Owner A (Demo)');

insert into public.company_members (company_id, user_id, role, is_active, joined_at)
values ('<COMPANY_A>', '<USER_A_OWNER_ID>', 'owner', true, now());

insert into public.leads (company_id, company_name, contact_name, email, phone, status, source_type)
values ('<COMPANY_A>', 'Demo Immobilien A AG', 'Demo Kontakt', 'lead-a@example.test',
        '+41 00 000 00 00', 'new', 'website');
```

> This snippet is a **template**, not a committed seed. It is run manually
> against **staging** with locally generated UUIDs. No real data, ever.

## Hard rule

Fake staging data is for testing isolation/workflows only. **No real customer
data** until auth, RLS and backup/restore are verified —
[`security-architecture.md`](./security-architecture.md).
