# Klarsa Core — CEO / KPI Dashboard Foundation (v0.3.13)

> A **read-only** owner overview across the whole Klarsa chain — a protected
> **`/app-shell/ceo`** route ("CEO-Briefing") that aggregates the tenant's
> existing data into money-impact cards, KPI tiles, a funnel
> (Opportunity → Lead → Offer → Job → bexio), a 7-day activity row, and
> attention cards. **Read-only — no writes, no AI, no external API, no scraping,
> no bexio API, no email.** All reads go through the **session client (RLS)** —
> never the service-role client. **No new migration** (uses existing data), no
> real customer data.

Related: [`clean24-lead-hunter-foundation.md`](./clean24-lead-hunter-foundation.md),
[`clean24-lead-inbox-foundation.md`](./clean24-lead-inbox-foundation.md),
[`clean24-offer-draft-foundation.md`](./clean24-offer-draft-foundation.md),
[`clean24-job-from-offer-foundation.md`](./clean24-job-from-offer-foundation.md),
[`clean24-bexio-handoff-foundation.md`](./clean24-bexio-handoff-foundation.md),
[`security-architecture.md`](./security-architecture.md).

## Why a CEO briefing

The locked product chain is **Lead Hunter → Opportunity Radar → Lead Inbox →
Follow-up → Offer → Job → Invoice/bexio**. Each step now has a screen. The
CEO-Briefing is the first **owner / money-impact** view that puts the whole chain
on one page — owner-friendly, not technical, "compact premium" — so a Swiss-KMU
owner sees pipeline value, conversions and what needs attention at a glance.

## What it does (read-only)

- **Money impact (CHF):** open pipeline (sum of `draft/ready/sent` offer gross),
  accepted offers (gross), completed jobs (value).
- **KPI tiles:** Opportunities (+ promoted), Leads (+ open), Offerten (+
  accepted), Aufträge (+ completed), bexio-Übergaben (+ queued / completed).
- **Funnel:** Opportunity → Lead → Offerte → Auftrag → bexio with volumes and
  stage **conversion %** (promoted/opps, leads-with-offer/leads, jobs/accepted,
  handoffs/completed-jobs). Shown as a volume overview, not a strict cohort
  (leads can be manual, not only promoted) — stated honestly on the page.
- **Letzte 7 Tage:** new opportunities / leads / offers / jobs in the last 7 days
  (from `created_at`, compared to the request-time timestamp).
- **Achtung & nächste Schritte** (attention cards, each links to the right
  screen, shown only when count > 0; otherwise a green "all clear"):
  - Offers waiting for response (`status = sent`) → Offer Engine.
  - Completed jobs not yet handed off to bexio → bexio-Übergabe.
  - High-score opportunities (`score ≥ 70`) not yet promoted → Lead Hunter.
  - Open leads without a follow-up → Lead Inbox.
- Linked from a prominent **CEO-Briefing** card on `/app-shell`.

### Design

Swiss/German business tone, owner-friendly wording, "CEO Briefing" framing, a
compact premium layout (a navy money-impact accent card, clean KPI tiles, a
horizontal funnel). A clear disclaimer: **read-only KPI overview based on
existing Klarsa data.**

## Data inputs (all existing, RLS-filtered)

No new readers for the heavy lifting — it composes the existing helpers, then a
**pure** function does the math:

| Source | Used for |
| --- | --- |
| `getProspects` | opportunities total / promoted / high-score-not-promoted |
| `getLeads` | leads total / open (status not won/lost/archived) |
| `getOffers` | offers total / accepted / waiting + pipeline & accepted CHF + leads-with-offer |
| `getJobs` | jobs total / completed + completed CHF |
| `getInvoiceHandoffJobs` | handoffs queued / completed + completed-not-handed-off |
| `getFollowups` (now exposes `leadId`) | open leads without a follow-up |

`components/ceo/kpi.ts` (`computeCeoKpis`) is **pure and deterministic**: it takes
the lists + a caller-provided `nowIso` and returns every figure. No clock, no
I/O, no AI. Self-consistent: a subset (e.g. promoted) is never larger than its
total. Conversions guard divide-by-zero (null → shown as "—").

> **Honest about caps:** the list readers are capped per module (e.g. offers/jobs
> 100, leads 200). At large scale the overview reflects the most recent entries;
> on staging (small fake data) it is exact. Stated in the on-page disclaimer.

## Data flow

```
/app-shell/ceo (force-dynamic, protected, READ-ONLY)
  ├─ reads (session client, RLS, in parallel):
  │    getProspects · getLeads · getOffers · getJobs · getInvoiceHandoffJobs · getFollowups
  ├─ computeCeoKpis(lists, nowIso)   (pure: volumes, money, funnel, conversions, attention, 7d)
  └─ render cards + funnel + attention links   (no client JS, no fetch, no writes)
```

## Security model

- **Session client only**; the service-role/admin client is never used.
- **RLS first:** reads are any active member of the active company; the page only
  ever sees this tenant's data (`company_id`-scoped).
- **Read-only:** no actions, no inserts/updates/deletes anywhere on the page.
- **No external / no automation:** no AI/LLM call, no external API, no bexio API,
  no scraping, no email, no upload. The 7-day window uses the request-time
  timestamp passed into the pure function.

## Manual verification checklist (staging, fake data only)

1. From `/app-shell`, the **CEO-Briefing** card opens `/app-shell/ceo`.
2. Money-impact cards show CHF for open pipeline / accepted offers / completed
   jobs.
3. KPI tiles match the data (opportunities/promoted, leads/open, offers/accepted,
   jobs/completed, handoffs queued/completed).
4. The funnel shows Opportunity → Lead → Offerte → Auftrag → bexio with
   conversion % (or "—" when a denominator is 0).
5. Attention cards appear only when relevant and link to the right screen; with a
   clean tenant they collapse to "Alles im grünen Bereich".
6. "Letzte 7 Tage" reflects recently created records.
7. Unauthenticated: `/app-shell/ceo` redirects to `/login`.

## NOT in scope (v0.3.13)

- **No AI summary / recommendations.** The briefing is deterministic and static;
  an optional KI-CEO-Agent (with human approval) is a later, separate phase.
- **No writes / no drill-down pages / no charts library** — counts + a CSS/flex
  funnel only.
- **No external integration** — no bexio API, email, export, or real-time feeds.
- Real customer data.

## Next step

**v0.3.13.1 — CEO/KPI dashboard staging verification**, then **v0.4.0 — Clean24
live production readiness** (the security/backup gate: verified backup/restore,
strict staging/production separation, validated auth/RLS/security — before any
real customer data). **Offer PDF polish remains deferred** until requested.
