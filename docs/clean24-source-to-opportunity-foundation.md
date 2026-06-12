# Klarsa Core — Source → Opportunity Workflow Foundation (v0.3.10)

> **Status: VERIFIED on staging (2026-06-11).** Migration `006` was applied (+
> PostgREST schema reload); a logged-in Clean24 user clicked **"Opportunity
> vorbereiten"** on a registered source, the seeded Lead Hunter form opened with
> the source context, the opportunity saved, and the list showed the **source
> label** — all through the **session client (RLS)**. No scraping, no API, no
> real data. Staging result:
> [`clean24-source-to-opportunity-results.md`](./clean24-source-to-opportunity-results.md).

> Connects the **Source Registry** to the **Opportunity Radar**: from a
> registered, human-approved `lead_sources` row, a person clicks **"Opportunity
> vorbereiten"** and lands on a **pre-filled** capture form at
> `/app-shell/lead-hunter?source=<id>`. They confirm/edit the fields and save —
> the new opportunity is **linked back** to the source. **Manual only — no
> auto-search, no scraping, no Google/Maps/ZEFIX/SIMAP/Handelsregister lookup, no
> external call, no AI.** All reads/writes go through the **session client (RLS)**
> — never the service-role client.

Related: [`clean24-lead-hunter-source-registry.md`](./clean24-lead-hunter-source-registry.md)
(the registry), [`clean24-lead-hunter-foundation.md`](./clean24-lead-hunter-foundation.md)
(manual Opportunity Radar), [`clean24-lead-hunter-scoring.md`](./clean24-lead-hunter-scoring.md)
(deterministic scoring), [`lead-hunter-engine.md`](./lead-hunter-engine.md)
(future engine), [`security-architecture.md`](./security-architecture.md).

## The controlled, source-approved workflow

The [Lead Hunter architecture](./lead-hunter-engine.md) starts every discovery
from a **human-approved source**. v0.3.9 built the registry of those sources;
this step lets a human **work** a source by hand into a qualified opportunity —
the manual stand-in for the future, automated "query → normalise → dedupe →
score" pipeline. Nothing is fetched: the person reads the source themselves and
enters what they found.

```
Source Registry row ──"Opportunity vorbereiten"──▶ /app-shell/lead-hunter?source=<id>
   (lead_sources, human-approved)                     │
                                                       ├─ getLeadSourceById (RLS, active tenant)
                                                       ├─ pre-fill: source_type + reason context
                                                       │   (source.label + source.notes), hidden source_id
                                                       ├─ live deterministic scoring/service match (reused)
                                                       └─ human confirms + saves ─▶ createOpportunity
                                                             prospects insert (source_id linked), RLS can_write_sales
```

No step runs without a human click + save. There is **no** auto-submit and **no**
external lookup at any point.

## What it does

- **"Opportunity vorbereiten"** link on every source row in the registry
  (`/app-shell/lead-hunter/sources`) → opens the Lead Hunter capture form
  pre-seeded from that source.
- **Pre-fill from the source** (safe mapping):
  - `source.type` → the opportunity **Quelle** (`prospects.source_type`), mapped
    to an allowed opportunity-source value (unknown types fall back to *Andere*).
  - `source.label` + `source.notes` → the **"Warum interessant"** reason context
    (`Aus Quelle: <label> (<Typ>).` + notes). Fully editable.
  - The source link travels as a hidden **`source_id`** field.
- **The human enters/confirms** the opportunity name/company/project (required),
  type, region/city, service potential, score, reason and next action — the
  source never auto-fills the company name.
- **Reuses the deterministic scoring/service matching** (`scoring.ts`) live in
  the form — same offline, no-AI/API helper as v0.3.7.
- **Links the opportunity back to the source** via the new `prospects.source_id`
  (migration 006). The Opportunity Radar list then shows **"Quelle: <label>"**
  (the registered source name) instead of the raw type.
- **Source context is shown** the whole way: a banner on the form and a chip in
  the form, plus the registry list explains the manual action.

### Data link (migration 006 — additive, idempotent)

`prospects` had no source link. **Migration `006_prospects_source_id.sql`** adds
an **optional** `prospects.source_id uuid references lead_sources(id) on delete
set null` (+ index), mirroring the existing `leads.source_id` from migration 001
exactly. **001–005 are untouched.** Nullable: manually captured opportunities
without a source keep `source_id = NULL`. No RLS change — `prospects` already has
role-aware policies covering every column.

### Field mapping (form → `prospects` columns)

| Form field | Column | Seeded from source? |
| --- | --- | --- |
| Titel / Firma / Projekt * | `name` | no — human enters |
| Opportunity-Typ | `category` | no (default Manuell) |
| Region / Ort | `region` | no — human enters |
| Quelle | `source_type` | **yes** — from `source.type` |
| Service-Potenzial | `search_query` | no — human enters |
| Score | `score` | no (deterministic suggestion) |
| Warum interessant | `reason` | **yes** — `source.label` + `source.notes` |
| Nächste Aktion | `suggested_message` | no |
| (hidden link) | `source_id` | **yes** — the registered source |

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** the opportunity insert = `can_write_sales` (owner/admin/sales);
  reading the source to seed = any active member (the registry stays
  owner/admin-only for *writes*, unaffected here). A `readonly` user's save is
  rejected by the DB.
- **Defense in depth:** the action re-verifies the `source_id` belongs to the
  **active tenant** (and is not soft-deleted) before linking — a foreign/unknown
  id is silently dropped to `null`, never linked across tenants. The write is
  scoped to `company_id = activeCompanyId`.
- **No leak:** an unknown/foreign `?source=` id loads nothing (a neutral "Quelle
  nicht gefunden" note); no other tenant's source is ever shown.
- **Validation server-side:** name required; type/source/status whitelisted;
  score clamped 0–100; lengths capped.
- **No automation / no external source:** there is **no scraping, no
  auto-search, no Google/Maps/ZEFIX/SIMAP/Handelsregister lookup, no email, no
  upload, no AI/LLM call**. A human clicks, reviews and saves.

## Manual verification checklist (staging, fake data only)

1. On `/app-shell/lead-hunter/sources`, each source row shows **"Opportunity
   vorbereiten"**.
2. Clicking it opens `/app-shell/lead-hunter?source=<id>` with a **source
   banner**, the heading **"Opportunity aus Quelle erstellen"**, the **Quelle**
   pre-set, and a reason pre-filled from the source.
3. The live deterministic analysis still updates while typing; "Vorschläge
   übernehmen" works.
4. Enter a name + save → the opportunity appears in the list showing **"Quelle:
   <source label>"**; the radar overview updates.
5. **"Quelle entfernen"** returns to the plain capture form (no seed).
6. A bogus `?source=<random-uuid>` shows the neutral "nicht gefunden" note and
   still allows manual capture (no leak).
7. As a `readonly` member: the save is rejected by RLS (reads still work).
8. Unauthenticated: the route redirects to `/login`.

## NOT in scope (v0.3.10)

- **Any automated discovery** — scraping, web search, Google/Maps, ZEFIX, SIMAP,
  Handelsregister, feeds. The workflow stays manual.
- A **Swiss Opportunity Radar map** (region/canton visualisation) — that is the
  next step.
- Editing the source link after creation, bulk "prepare from source", or
  per-source opportunity counts/analytics.
- Email, bexio, or any external integration; real customer data.

## Next step

**v0.3.11 — Swiss Opportunity Radar Map foundation** (visualise opportunities by
region/canton on a Swiss map; static/manual, built on the data we already have —
incl. the new source link). Still manual, RLS-scoped, no real customer data —
real data only after verified backup/restore, strict staging/production
separation, and validated auth/RLS/security. **Offer PDF polish remains
deferred** until requested.
