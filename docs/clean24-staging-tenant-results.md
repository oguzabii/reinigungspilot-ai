# Klarsa Core — Clean24 Staging Tenant Results

> **Status: VERIFIED (Clean24 tenant on staging).** The Clean24 founder tenant
> was created on `klarsa-staging` and a bound user reached `/app-shell` as
> **Clean24 / owner / Premium** with **zero** rows (config only). **No real
> customer data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-09 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: apply migration `002` + script `005`, bind a Dashboard auth user via `004`, log in |
| **Reported by** | User |

> **Provenance / honesty note:** recorded from the **user's manual test**, as
> reported. It was **not** independently observed or automated from this
> repository, and this repo holds **no connection** to the staging project (no
> URL, keys, or service-role access). The local `.env.local` (staging values)
> lives only on the user's machine and is git-ignored. This document records a
> reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| Migration `002` applied (billing/access fields) | ✅ |
| Script `005` applied (Clean24 tenant setup) | ✅ |
| Auth user bound via `004` (owner of Clean24) | ✅ |
| Login → `/app-shell` | ✅ |
| Tenant shown | ✅ **Clean24** |
| Role shown | ✅ **owner** |
| Package tier shown | ✅ **Premium** |

### Counts shown (RLS-scoped) — all zero, as expected

| Module | Count |
| --- | --- |
| Lead Inbox | 0 |
| Lead Hunter | 0 |
| Offer Engine | 0 |
| Follow-ups | 0 |
| Jobs | 0 |
| bexio Übergabe | 0 |
| Reports | planned (—) |

**All zero is the expected and correct result.** Script `005` creates only the
Clean24 tenant **configuration** (company, settings, services, lead sources) — it
inserts **no** leads, prospects, offers, jobs, follow-ups or handoffs. So the real
Clean24 tenant correctly contains **zero customer data**, unlike the fake "Clean24
Demo" tenant (which had seeded demo counts). The shell still reads only through the
session/anon client (RLS), never the service-role client.

## Safety confirmations

- ✅ **No real customer data.** Clean24 has zero leads/offers/jobs; only its own
  tenant config (name, brand, package, services, sources).
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT. The
  staging values live only in the user's local, git-ignored `.env.local`.
- ✅ **No passwords in SQL.** The login user was created in the Dashboard (Auto
  Confirm) and bound with `004` — `004`/`005` never set or store passwords.
- ✅ **Not the old Clean24 Lead Autopilot.** "Clean24 Memis GmbH" is the founder
  tenant inside Klarsa, separate from the untouched legacy system.

## What this verifies

- Migrations `001` + `002` and the `005` tenant setup work on real Supabase.
- The Clean24 tenant + owner membership resolve end-to-end: login → session →
  tenant context (owner, Premium) → RLS-scoped read (correctly empty).

## What this does NOT mean

- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after auth + RLS + verified
  backup/restore (see [`security-architecture.md`](./security-architecture.md)),
  and with proper **staging/production separation**.

## Next step

**v0.3.0 — Clean24 Lead Inbox foundation** (manual lead entry, no external
integrations yet). Real data only after backup/restore and staging/production
separation are in place.
