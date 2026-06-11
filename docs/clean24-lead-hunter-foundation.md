# Klarsa Core — Lead Hunter / Opportunity Radar Foundation (v0.3.6)

> **Status: VERIFIED on staging (2026-06-11).** Starts the **Lead Hunter** as a
> **manual Opportunity Radar**: a protected **`/app-shell/lead-hunter`** route to
> capture and list opportunities. **Human entry only — no scraping, no
> auto-search, no Google/ZEFIX/SIMAP API, no external source, no spam.** All
> writes go through the **session client (RLS)** — prospects are the **sales
> domain** (owner/admin/sales) — never the service-role client. **No new
> migration** (uses the existing `prospects` schema), no real customer data.
>
> Staging verification (manual capture + list + radar overview, RLS write path,
> Clean24 tenant, no real data — user-reported manual test):
> [`clean24-lead-hunter-results.md`](./clean24-lead-hunter-results.md).

Related: [`lead-hunter-engine.md`](./lead-hunter-engine.md) (the future engine
plan), [`clean24-lead-inbox-foundation.md`](./clean24-lead-inbox-foundation.md),
[`security-architecture.md`](./security-architecture.md),
[`data-model.md`](./data-model.md).

## What it does

- **Capture** (`createOpportunity`): a manual **"Opportunity erfassen"** form.
  A human enters the opportunity; nothing is fetched or scraped.
- **List + radar overview:** the active tenant's opportunities, newest first,
  with simple **radar-style overview cards** (total, average score, actively
  pursued) and a per-type chip breakdown. (Static cards — no animation yet.)
- **Empty state** for a tenant (e.g. Clean24) with no opportunities yet.
- The **Lead Hunter** card on `/app-shell` opens this route.

### Field mapping (form → existing `prospects` columns)

No new columns — the existing `prospects` schema (migration 001) covers it:

| Form field | Column | Note |
| --- | --- | --- |
| Titel / Firma / Projekt * | `name` | required |
| Opportunity-Typ | `category` | one of the types below |
| Region / Ort | `region` | free text |
| Quelle | `source_type` | `source_type` enum (manual default) |
| Service-Potenzial | `search_query` | **repurposed** for the service match |
| Score (0–100) | `score` | int, clamped server-side |
| Warum interessant | `reason` | free text |
| Nächste Aktion | `suggested_message` | **repurposed** for the next step |
| Status | `status` | `prospect_status` enum |

> Two columns are **repurposed** for the manual foundation: `search_query` holds
> the service potential, and `suggested_message` holds the next action. When the
> automated engine arrives, these can move to dedicated columns via a migration.

### Vocabularies

- **Opportunity types** (`category`): Neubau · Praxis · Verwaltung ·
  Ausschreibung · Firma · Partner · Manuell.
- **Service-match examples** (datalist for Service-Potenzial): Umzugsreinigung ·
  Treppenhausreinigung · Hauswartung · Bauendreinigung · Büroreinigung.
- **Status** (`prospect_status`): Roh · Bewertet · Freigegeben · Kontaktiert ·
  Geantwortet · Konvertiert · Abgelehnt · Archiviert.
- **Sources** offered for manual entry: Manuell · Empfehlung · Partner · Website
  · Google/Recherche · Andere.

## Data flow

```
/app-shell/lead-hunter (force-dynamic, protected)
  ├─ reads (session client, RLS):
  │    getProspects ── prospects (active tenant, newest first, max 100)
  │    getCompanySummary
  ├─ radar overview: aggregates computed from the RLS-filtered list
  │    (total, Ø score, actively pursued, per-type counts)
  └─ NewOpportunityForm ─▶ createOpportunity (server action)
        validate name + whitelist type/source/status + clamp score
        insert prospects (company_id = ACTIVE tenant)
        RLS: can_write_sales (owner/admin/sales)
```

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** prospect insert = `can_write_sales` (owner/admin/sales); reads
  = any active member. A `readonly` user is rejected by the DB.
- **Defense in depth:** the write is scoped to the active company
  (`company_id = activeCompanyId`).
- **Validation server-side:** name required; opportunity type, source and status
  are whitelisted; the score is parsed and clamped to 0–100; lengths are capped.
- **No automation / no external source:** there is **no scraping, no
  auto-search, no Google/ZEFIX/SIMAP API, no email, no upload**. A human decides
  what to capture — no spam, no bulk import.

## Manual verification checklist (staging, fake data only)

1. From `/app-shell`, the **Lead Hunter** card opens `/app-shell/lead-hunter`.
2. Empty state shows for a tenant with no opportunities (e.g. Clean24).
3. Capture an opportunity (title + type + region + service + score + status) →
   it appears in the list; the radar overview cards and per-type chips update.
4. Submit with an empty title → clear German error, nothing saved.
5. As `readonly-a-login@example.test`: capture is rejected (reads still work).
6. `/app-shell` Lead Hunter count reflects the captured opportunities.
7. Unauthenticated: `/app-shell/lead-hunter` redirects to `/login`.

## NOT in scope (v0.3.6)

- **Any automated discovery** — scraping, web search, Google/ZEFIX/SIMAP,
  registries, feeds. This stays manual until explicitly built and gated.
- Editing/deleting opportunities or changing status from the list (workflow
  version).
- Converting an opportunity into a lead (`promoted_lead_id`), scoring history
  (`lead_scores`), or a source registry (`lead_sources`).
- Email, bexio, or any external integration. Real animation for the radar.

## Next step

**v0.3.7 — Lead Hunter scoring / service matching** (a richer score + a
structured service-match model) **or a source registry** (`lead_sources` as the
catalog of allowed, human-approved sources). Still manual, RLS-scoped, no real
customer data — real data only after verified backup/restore, strict
staging/production separation, and validated auth/RLS/security.
