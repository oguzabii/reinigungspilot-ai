# Klarsa Core — Lead Hunter Source Registry Staging Results

> **Status: VERIFIED (Source Registry on staging).** A logged-in Clean24
> owner/admin opened `/app-shell/lead-hunter/sources`, registered a controlled
> source by hand, and saw it in the list with the right badges — end-to-end
> through the **session client (RLS, settings domain)**. **No scraping, no API,
> no external lookup, no real customer data, no committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-11 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, open the registry from Lead Hunter, register a source (preset + manual), review the list/overview/badges |
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
| `/app-shell/lead-hunter/sources` opened after login (protected route) | ✅ |
| Reached via the **Quellen-Registry** link on `/app-shell/lead-hunter` | ✅ |
| **Register a source** (Bezeichnung + Typ + Aktiv + Notiz) | ✅ succeeded |
| **Vorlagen-Chips** pre-fill type/label/notes (empty fields only) | ✅ |
| **List + overview** (Total / Aktiv / Inaktiv + Phasen-Chips) update | ✅ |
| **Badges** render: Aktiv/Inaktiv **plus** Phase (Manuell / Künftige API / Künftiges Register) | ✅ |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS write path | ✅ confirmed (settings domain, `can_write_settings`) |
| Owner/admin sees the create form (role-aware) | ✅ |
| Scraping / external API / auto-search used | ✅ none — manual catalog entry only |
| Real customer data used | ✅ none — staging test entries only |

The source is stored through the **anon/session client** with Row Level Security
enforcing the tenant (`company_id`) and the role (`can_write_settings`:
owner/admin only — the registry is the **settings domain**, stricter than the
sales-domain opportunities). The service-role client was not used. The
registered source appearing in the RLS-filtered list, with the active/inactive
and phase badges derived deterministically from `enabled` + `type`, closes the
loop. No query ran against any external source — the registry is a passive,
human-curated catalog.

## Safety confirmations

- ✅ **No scraping, no API, no auto-search.** Nothing is fetched, scraped or
  queried — Google/Maps, ZEFIX, SIMAP and Handelsregister remain future, gated
  phases that make **no** network request today.
- ✅ **No real customer data.** The source was staging test data typed by the
  user; no real companies, directories, projects or contacts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **Human in control.** Owner/admin curate the catalog; presets only fill
  empty fields; nothing auto-submits, no external discovery, no spam, no email.
- ✅ **No new migration.** Uses the existing `lead_sources` schema (migration
  001); 001–005 untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Lead Hunter inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The protected registry route, the Lead-Hunter link, and the role-aware create
  form work after login for an owner/admin of the Clean24 tenant.
- The source write goes through the **session client with RLS** (settings
  domain), and the list/overview/badges render correctly from the stored rows.
- The registry is a controlled, human-approved catalog — no automation or
  external lookup is involved.

## What this does NOT mean

- **No automated discovery exists.** The registry only stores *which* sources a
  human has approved — there is no scraping, web search, Google/Maps API, or
  ZEFIX/SIMAP/Handelsregister lookup, and no AI/LLM call.
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.10 — Source→Opportunity workflow** (an Opportunity records which
registered source it came from) **or a Lead Hunter source execution plan** (how a
human-approved source is worked manually, ahead of any automation). Still manual,
RLS-scoped, no real customer data. **Offer PDF polish remains deferred** until
requested.
