# Klarsa Core — Clean24 Tenant Setup (v0.2.8)

> **Status: FOUNDATION (staging/setup only).** Prepares **Clean24 Memis GmbH** as
> the **first real Klarsa tenant / live proof**. This step adds the billing/access
> schema and a staging setup script — but **no real customer data** (no leads,
> offers, jobs, contacts), **no credentials**, **no auth users/passwords**.

Related: [`phase-2-architecture.md`](./phase-2-architecture.md),
[`app-shell-staging-connection.md`](./app-shell-staging-connection.md),
[`staging-login-test-users.md`](./staging-login-test-users.md),
[`security-architecture.md`](./security-architecture.md),
[`../lib/tenant-clean24.ts`](../lib/tenant-clean24.ts).

## Latest verification status

✅ **Verified on staging (2026-06-09).** Migration `002` + script `005` applied,
an owner user bound via `004`, and login → `/app-shell` showed **Clean24 / owner /
Premium** with **all counts 0** (config only — no customer data), exactly as
expected (manual test, reported by the user). Full record:
**[clean24-staging-tenant-results.md](./clean24-staging-tenant-results.md)**.

## What Clean24 is (and is not)

- **Clean24 = the first tenant inside Klarsa Core** — the founder's own cleaning
  company, used as the live proof of the product.
- It is **separate** from, and must not be wired into, the old standalone
  **Clean24 Lead Autopilot** (a different system, untouched).
- "Clean24 Memis GmbH" is the **tenant's own configuration**, not customer data.

## Tenant configuration

| Field | Value |
| --- | --- |
| Legal name | **Clean24 Memis GmbH** |
| Brand | **Clean24** |
| Package (`tier`) | **premium** |
| `billing_status` | **internal_founder** (no real billing) |
| `access_status` | full |
| `billing_provider` | internal |
| Industry preset | Reinigung |
| Regions | all 26 Swiss cantons (focus: Zürich, Dietikon, Basel, Bern, Luzern, Zug, St. Gallen, Winterthur, Lausanne, Genève, Lugano) |

**Services (8):** Umzugsreinigung, Büroreinigung, Fensterreinigung,
Unterhaltsreinigung, Baureinigung, Treppenhausreinigung, Hauswartung,
Tiefgaragenreinigung.

**Lead sources (8):** Website Anfrage, Google, Empfehlung, Verwaltung,
Umzugsfirma Partner, Bauprojekt, Praxis/Ärzte, manuell. (In the DB these map to
the `source_type` enum — `website`, `google`, `referral`, `partner`, `manual`;
the label carries the specific channel.)

**Modules** (per package gating): Lead Inbox, Lead Hunter, Offer Engine,
Follow-ups, Jobs, bexio Übergabe, Reports.

Typed config: [`lib/tenant-clean24.ts`](../lib/tenant-clean24.ts).

## Billing / access fields (migration 002)

Migration `002_clean24_tenant_billing_foundation.sql` is **additive** (001 is
already applied and is not modified). It adds three enums and three columns on
`companies`:

- `billing_status`: `internal_founder | trial | active | overdue | limited | paused | cancelled`
- `access_status`: `full | limited | suspended`
- `billing_provider`: `internal | manual | bexio | stripe`

There is **no real billing** yet — these are status fields. The app access gate
(`access_status`) is intentionally independent of billing.

## How to set up on staging

> Staging only. Requires `.env.local` with staging values (git-ignored).

1. Apply **migration 002**:
   `supabase/migrations/002_clean24_tenant_billing_foundation.sql`.
2. Run **`supabase/verification/005_create_clean24_staging_tenant.sql`** — creates/
   updates the Clean24 company + settings + 8 services + 8 sources (idempotent).
   No leads/offers/jobs, no auth users, no memberships.
3. To log in as Clean24: create a Dashboard auth user (Auto Confirm) per
   [`staging-login-test-users.md`](./staging-login-test-users.md), then bind it
   with `004` using `target_company_name = 'Clean24 Memis GmbH'`, `target_role =
   'owner'`. Then open `/login` → `/app-shell`.

## No real data yet — the security gate

This is **setup only**. No real leads, customers, offers, jobs, emails, phone
numbers, bexio tokens or files. Real customer data stays gated by **"No Security
= No Customer Data"** — authentication **and** RLS **and** verified
backup/restore must all be in place first (see
[`security-architecture.md`](./security-architecture.md)). Until then Clean24
exists only as a configured tenant on staging.

## Next step

**v0.2.9 — Clean24 staging tenant verification / app-shell switch**, or auth /
onboarding hardening. No real data before the security/backup gate.
