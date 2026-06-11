# Klarsa Core — Lead Hunter Source Registry Foundation (v0.3.9)

> Adds a **controlled Source Registry** to the Lead Hunter: a protected
> **`/app-shell/lead-hunter/sources`** route to register and list the lead
> sources a tenant has **human-approved**. **No scraping, no auto-search, no
> Google/Maps API, no ZEFIX/SIMAP/Handelsregister lookup, no external call** —
> this only stores a curated catalog row. All writes go through the **session
> client (RLS)** — `lead_sources` is the **settings domain** (owner/admin via
> `can_write_settings`) — never the service-role client. **No new migration**
> (uses the existing `lead_sources` schema from migration 001), no real customer
> data.

Related: [`lead-hunter-engine.md`](./lead-hunter-engine.md) (the future engine
plan), [`clean24-lead-hunter-foundation.md`](./clean24-lead-hunter-foundation.md)
(manual Opportunity Radar), [`security-architecture.md`](./security-architecture.md),
[`data-model.md`](./data-model.md).

## Why a registry first

The [Lead Hunter architecture](./lead-hunter-engine.md) is a **controlled
discovery pipeline**, explicitly **not** uncontrolled scraping. Its very first
stage is a **freigegebene Quelle/Provider** — a human-approved source. Before any
query can ever run, a person must decide *which* sources are allowed. This
registry is that gate: a tenant builds a catalog of controlled sources by hand.
Nothing automated reads from it yet — automation is a later, separately gated
phase.

## What it does

- **Register** (`createLeadSource`): a manual **"Quelle registrieren"** form.
  A human enters a source; nothing is fetched, scraped or queried. Quick-fill
  **presets** (Manuell, Empfehlung, Bauprojekt, Praxis/Ärzte, Verwaltung,
  Ausschreibung, Google/Maps *(später)*, ZEFIX *(später)*) only fill empty
  fields, so the person keeps control.
- **List + overview:** the active tenant's sources, newest first, with overview
  cards (total, active, inactive) and a per-phase chip breakdown.
- **Badges:** every row shows an **active/inactive** badge and a **phase** badge
  — *Manuell* (human-curated, usable now), *Künftige API* (Google/Maps later),
  *Künftiges Register* (ZEFIX/SIMAP/Handelsregister later).
- **Role-aware:** only **owner/admin** see the create form (settings domain);
  other members get a read-only view with a hint.
- **Empty state** for a tenant (e.g. Clean24) with no sources yet.
- Linked from the **Lead Hunter** page (`/app-shell/lead-hunter`).

### Field mapping (form → existing `lead_sources` columns)

No new columns — the existing `lead_sources` schema (migration 001) covers it:

| Form field | Column | Note |
| --- | --- | --- |
| Bezeichnung der Quelle * | `label` | required |
| Quellen-Typ | `type` | `source_type` enum (curated subset; manual default) |
| Status (Aktiv/Inaktiv) | `enabled` | boolean, default active |
| Notiz / Beschreibung | `notes` | free text |

> `category`, `region` and `priority` are **not** columns on `lead_sources`, so
> they are intentionally **out of scope** here — the foundation stays on the
> existing schema with **no migration**. The notes field carries that context
> for now; dedicated columns can be added via a future migration when the engine
> needs them.

### Vocabularies

- **Source types** (`type`, curated subset offered for manual entry): Manuell ·
  Empfehlung · Partner/Verwaltung · Website/Portal · Import/Liste · Google/Maps ·
  Verzeichnis/Register. (The full `source_type` enum still renders if present.)
- **Phase** (informational, derived from `type`): *Manuell* · *Künftige API*
  (google, bexio, lead_hunter) · *Künftiges Register* (other).
- **Status** (`enabled`): Aktiv · Inaktiv.

## Data flow

```
/app-shell/lead-hunter/sources (force-dynamic, protected)
  ├─ reads (session client, RLS):
  │    getLeadSources ── lead_sources (active tenant, newest first, max 200)
  │    getCompanySummary
  ├─ overview: total / active / inactive + per-phase counts (from the list)
  ├─ role check: owner/admin → create form; else read-only hint
  └─ NewSourceForm ─▶ createLeadSource (server action)
        re-check role (owner/admin) + validate label + whitelist type
        insert lead_sources (company_id = ACTIVE tenant)
        RLS: can_write_settings (owner/admin)
```

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** `lead_sources` insert = `can_write_settings` (owner/admin);
  reads = any active member. A sales/ops/readonly user is rejected by the DB.
- **Defence in depth:** the action re-checks the caller's role for the active
  company and scopes the write to `company_id = activeCompanyId`. The page only
  renders the form for owner/admin.
- **Validation server-side:** label required; source type is whitelisted; the
  active flag is a boolean; lengths are capped.
- **No automation / no external source:** there is **no scraping, no
  auto-search, no Google/Maps API, no ZEFIX/SIMAP/Handelsregister lookup, no
  email, no upload**. The registry is a passive, human-curated catalog.

## Manual verification checklist (staging, fake data only)

1. From `/app-shell/lead-hunter`, the **Quellen-Registry** card opens
   `/app-shell/lead-hunter/sources`.
2. Empty state shows for a tenant with no sources (e.g. Clean24).
3. As owner/admin: register a source (label + type + active + notes) → it
   appears in the list with the right phase + active badges; overview updates.
4. A preset chip (e.g. "ZEFIX (später)") pre-fills type/label/notes and shows
   the *Künftiges Register* phase badge — but runs **no** query.
5. Submit with an empty label → clear German error, nothing saved.
6. As a `sales`/`readonly` member: the create form is hidden (read-only hint);
   a forced submit is rejected by RLS.
7. Toggling **Inaktiv** stores `enabled = false`; the row shows the Inaktiv badge.
8. Unauthenticated: `/app-shell/lead-hunter/sources` redirects to `/login`.

## NOT in scope (v0.3.9)

- **Any automated discovery** — scraping, web search, Google/Maps, ZEFIX, SIMAP,
  Handelsregister, feeds. This stays a passive catalog until explicitly built
  and gated.
- Editing/deleting/toggling a source from the list (workflow version), or
  `category`/`region`/`priority` columns (would need a migration).
- Running a source to produce opportunities (the source→opportunity execution
  plan) — that is the next step.
- Email, bexio, or any external integration; real customer data.

## Next step

**v0.3.10 — Source→Opportunity workflow** (link a registered source to manually
captured opportunities, e.g. an Opportunity records which controlled source it
came from) **or a Lead Hunter source execution plan** (how a human-approved
source is *worked* manually, ahead of any automation). Still manual, RLS-scoped,
no real customer data — real data only after verified backup/restore, strict
staging/production separation, and validated auth/RLS/security.
