# Klarsa Core — Swiss Opportunity Radar Map Foundation (v0.3.11)

> **Status: VERIFIED on staging (2026-06-12).** A logged-in Clean24 user opened
> `/app-shell/lead-hunter/radar`; the stat cards, the stylised canton radar SVG,
> the top-region cards and the service/source/type chips all rendered from the
> existing opportunities — read-only, through the **session client (RLS)**. No
> map provider, no tiles, no geocoding, no API, no real data. Staging result:
> [`clean24-swiss-opportunity-radar-map-results.md`](./clean24-swiss-opportunity-radar-map-results.md).

> A **manual, static** visualisation of the tenant's opportunities on a stylised
> Swiss canton radar: a protected **`/app-shell/lead-hunter/radar`** route that
> aggregates the existing `prospects` data (region, score, source, type, service
> match) into stat cards, a canton radar SVG, top-region cards, and
> service/source/type chips. **No map provider, no tiles, no Google Maps, no
> ZEFIX/SIMAP, no external lookup, no scraping, no auto-search, no AI.** All reads
> go through the **session client (RLS)** — never the service-role client. **No
> new migration** (uses existing data), no real customer data.

Related: [`clean24-lead-hunter-foundation.md`](./clean24-lead-hunter-foundation.md)
(manual Opportunity Radar), [`clean24-lead-hunter-scoring.md`](./clean24-lead-hunter-scoring.md)
(deterministic scoring, reused here),
[`clean24-source-to-opportunity-foundation.md`](./clean24-source-to-opportunity-foundation.md)
(the source link shown here), [`lead-hunter-engine.md`](./lead-hunter-engine.md)
(future engine), [`security-architecture.md`](./security-architecture.md).

## What it does

A read-only, visual overview built entirely from data the tenant already entered
by hand. Nothing is fetched.

- **Stat cards:** total opportunities, average score, high-score count (≥70),
  converted/promoted count (`promoted_lead_id` set or status `converted`).
- **Swiss canton radar (static SVG):** opportunities are grouped by canton via a
  **deterministic offline keyword map** (city/canton text → canton code). Each
  canton with opportunities is drawn as a **pin** placed on a stylised Swiss
  layout — **pin size ≈ count**, **colour ≈ average score** (emerald ≥70, blue
  40–69, amber <40, slate = unscored). Decorative concentric rings give the
  "radar" feel. Opportunities whose region doesn't match a canton (or has no
  region) are counted in a footnote, **not** placed on the map.
- **Top-region cards:** the most frequent raw region texts with count + average
  score badge.
- **Highlight chips:** top **service-match** (reused `scoring.ts`), **source
  labels** (where an opportunity was prepared from a registered source), and
  **opportunity types**, each with counts.
- **Empty state** for a tenant with no opportunities yet.
- Linked from the **Lead Hunter** page (`/app-shell/lead-hunter`).

### Data inputs (all existing, RLS-filtered)

From `getProspects(companyId)` → `OpportunityListItem[]` (migration 001 +
`source_id` from 006). No new columns, **no migration**:

| Shown | From |
| --- | --- |
| Total / Ø score / high-score | `score` |
| Converted | `promoted_lead_id` / `status` |
| Canton pins + top regions | `region` (text → canton, offline) |
| Service highlights | `matchServices()` over name/category/region/service |
| Source chips | `source_id` → embedded `lead_sources.label` (006) |
| Type chips | `category` |

### The canton mapping is stylised, not GIS

`components/lead-hunter/swiss-radar.ts` is a **pure, offline** module: the 26
cantons with **approximate, decorative** coordinates, an ordered keyword table
(`Basel-Landschaft` before `Basel-Stadt`, `Appenzell A.Rh.` before `Appenzell`,
etc.), `cantonForRegion()` (deterministic `includes` match → code or null), and
score→colour helpers. It is honest about being a **radar**, not a real map — there
is no projection, no tiles, no geocoding, no network.

## Data flow

```
/app-shell/lead-hunter/radar (force-dynamic, protected)
  ├─ reads (session client, RLS):
  │    getProspects ── prospects (active tenant, newest first, max 100)
  │    getCompanySummary
  ├─ aggregate IN MEMORY (pure):
  │    stats · group-by-canton (cantonForRegion) · top regions ·
  │    matchServices highlights · source labels · types
  └─ render static SVG radar + cards + chips  (no client JS, no fetch)
```

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** reads are any active member of the active company; the page only
  ever sees this tenant's opportunities (`company_id`-scoped).
- **No writes:** the page is read-only — no actions, no inserts/updates.
- **No external/automation:** no map provider, tiles, Google Maps, ZEFIX, SIMAP,
  Handelsregister, geocoding, scraping, web search, email, upload, or AI/LLM
  call. The canton layout is a local, stylised approximation.

## Manual verification checklist (staging, fake data only)

1. From `/app-shell/lead-hunter`, the **Schweiz-Radar** card opens
   `/app-shell/lead-hunter/radar`.
2. Empty state shows for a tenant with no opportunities.
3. With opportunities: stat cards show total / Ø score / high-score / converted.
4. The radar SVG shows canton pins; a Zürich/Bern/… region lands on the right
   canton; pin size grows with count; colour reflects the average score.
5. Opportunities with an unrecognised/blank region appear only in the footnote,
   not on the map.
6. Top-region cards, service-match chips, source-label chips and type chips match
   the entered data.
7. Unauthenticated: `/app-shell/lead-hunter/radar` redirects to `/login`.

## NOT in scope (v0.3.11)

- **Any real map** — no map provider, tiles, projection, or geocoding. The canton
  layout is decorative/approximate.
- **Any automated discovery** — scraping, web search, Google/Maps, ZEFIX, SIMAP,
  Handelsregister. Strictly a visualisation of manually entered data.
- Interactivity (filtering, drill-down, hover tooltips), per-canton drill pages,
  or time-series. Editing data from the radar.
- Email, bexio, or any external integration; real customer data.

## Next step

**v0.3.12 — Lead Hunter source execution plan** (how a human works an approved
source into opportunities, step by step, ahead of any automation) **or a bexio
handoff foundation** (queue a manual handoff, no real bexio API). Still manual,
RLS-scoped, no real customer data — real data only after verified backup/restore,
strict staging/production separation, and validated auth/RLS/security. **Offer PDF
polish remains deferred** until requested.
