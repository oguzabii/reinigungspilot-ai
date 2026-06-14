# Clean24 Opportunity Signal Engine — "Why now?" (v0.5.3)

> Status: **shipped foundation** (v0.5.3) · **VERIFIED in production** (v0.5.3.1).
> Builds on Automatic Discovery (`docs/clean24-automatic-discovery-autopilot-rules.md`)
> and the roadmap (`docs/clean24-revenue-autopilot-roadmap.md`).
> Guardrail level: **high** — intelligence + framing only; no outreach, no booking.

## 0. VERIFIED in production (v0.5.3.1, 2026-06-14)

The Clean24 owner logged in to production (`https://klarsa.vercel.app`) and opened
`/app-shell/revenue-autopilot/signals`. Confirmed:

- ✅ The route opens after login; signal cards render from existing production
  candidates/prospects.
- ✅ Each card shows **source**, **signal type**, **"Warum jetzt?"**, **suggested
  service(s)**, **confidence**, **timing window + güte** (exakt/geschätzt/unbekannt)
  and the **next action / Lead Hunter link**.
- ✅ Links to Signals from Revenue Autopilot / Discovery / Radar / Lead Hunter work.
- ✅ Inferred/unknown timing is honestly labelled; **no fabricated exact dates**.
- ✅ No automatic outreach/calls/booking/scraping; **no real customer data entered**.

Full record: [`clean24-opportunity-signal-engine-results.md`](./clean24-opportunity-signal-engine-results.md).
This reaffirms the LIMITED GO: real data only via the app UI; the first official
Baugesuche/SIMAP/ZEFIX timing adapter (+ migration 007) remains a gated next step.

## 1. What v0.5.3 adds

Klarsa moves from *"here are companies"* to *"here are time-sensitive revenue
opportunities and why they matter."*

- **Opportunity Signal Engine** (`components/revenue-autopilot/signals.ts`, pure):
  turns each candidate/opportunity into a **signal** with: signal type, **why
  now**, suggested **service(s)**, **confidence**, a **timing window** with its
  **timing güte (exact / inferred / unknown)**, and the **next action**.
- **Opportunity Signals page** — `/app-shell/revenue-autopilot/signals`:
  "Warum jetzt?", a source-readiness panel, and the signal cards.
- **Source adapter architecture** (`lib/discovery/adapters.ts`): a clean seam for
  future official/approved sources (Baugesuche, SIMAP, ZEFIX), shipped as
  documented **stubs** (`phase: "planned"`, `not_configured`); Google Places is
  the one **live** supporting source.
- **Prepared cron** (`app/api/autopilot/discovery-cron/route.ts`): a
  secret-gated, **disabled-by-design** endpoint that documents the safe shape of
  a future scheduled run (no writes — see §6).
- **Integration**: a "Neue Signale gefunden" banner on the Revenue Autopilot, and
  links from Discovery, Radar and Lead Hunter.

**No schema change / no migration.** v0.5.3 computes signals from the existing
`prospects` rows (discovered + manual). Persisting adapter-sourced signals will
come *with* the first live official adapter (see §2).

## 2. Signal data model — existing schema vs. migration 007

For v0.5.3 the existing `prospects` table is **sufficient**: a signal is a
deterministic, runtime *reading* of an existing prospect (`id`, `name`,
`region`, `source_type`, `search_query`, `score`, …). No new table is needed and
none is added.

A dedicated `opportunity_signals` table only becomes necessary when a real
**official adapter** (Baugesuche/SIMAP/ZEFIX) goes live and produces signals that
are **not yet** companies (projects/tenders with their own title/url/timing). At
that point we add the additive **migration 007** (RLS + session-client only),
roughly:

```
opportunity_signals(
  id, company_id, source_type, source_name, source_url,
  title, summary, region, location_text, suggested_service,
  signal_type, timing_label, timing_date, timing_is_inferred,
  confidence_score, reason, next_action,
  status (new|reviewed|promoted|rejected), related_prospect_id,
  created_at, updated_at, deleted_at
)
```

This is documented now, **not applied** — no premature/empty production table.

## 3. What each signal shows

| Field | Meaning |
| --- | --- |
| **Signal type** | construction / verwaltung / tender / new company / business |
| **Source** | where it came from (e.g. Google Places, manual, referral) |
| **Why now** | a plain-language reason it matters now |
| **Suggested service(s)** | Clean24 services that fit the signal |
| **Confidence** | deterministic 0–100 score |
| **Timing** | a window **plus** its güte: exact / **geschätzt (inferred)** / unbekannt |
| **Next action** | the concrete next step |

## 4. How "why now" + service potential are generated

Deterministic, offline classification (no AI/API):

- **Classify** from the candidate's text (name + type + service + region) by
  keyword → construction / verwaltung / tender / new_company / business.
- **Why now** is a fixed, honest reason per type.
- **Suggested services** per type (canonical Clean24 vocabulary), enriched by the
  existing `scoring.ts` keyword match:
  - construction → Bauendreinigung, Fensterreinigung, Hauswartung
  - verwaltung → Treppenhausreinigung, Hauswartung, Umzugsreinigung, Fensterreinigung
  - tender → Büroreinigung, Treppenhausreinigung, Hauswartung
  - new company → Büroreinigung (Gewerbereinigung-Potenzial)
  - business (Google-Places-only) → Büroreinigung; **lower confidence** unless
    enriched by keyword/type signals
- **Confidence** = base-by-type + modest, honest enrichment (region present,
  matched services, warm source, existing high score). Google-Places-only stays
  lower.

## 5. What is inferred vs. exact

- **Exact** timing is used **only** when a source actually provides a date — none
  does in v0.5.3, so nothing is labelled exact yet.
- **Inferred ("geschätzt")** is used for construction/verwaltung/tender/new-company
  readings (e.g. *"Endreinigung üblicherweise zum Bauabschluss — Zeitpunkt
  erfragen/schätzen"*). It is clearly badged **Geschätzt** and never presented as
  a hard completion/deadline date.
- **Unknown** is used for Google-Places-only business signals (Places gives no
  timing) — badged **Kein Timing**.

We never overpromise a construction-completion or tender date.

## 6. Daily / automatic behaviour

- **Manual run remains** the primary path (Discovery page, owner/admin).
- A **prepared cron endpoint** exists (`/api/autopilot/discovery-cron`) but is
  **disabled by design**: it is invisible without `CRON_SECRET` (404), requires
  `Authorization: Bearer <CRON_SECRET>`, and even when authorised performs **no
  discovery and no writes**. There is **no `vercel.json` cron entry**, so nothing
  is scheduled.
- Why no autonomous writes: a session-less scheduled run would need a server
  identity that bypasses RLS (**service-role**), which is **banned in app
  routes**. Real scheduled runs therefore need a separately-reviewed, explicitly
  approved server-identity pattern — and would still cap runs/results, audit every
  run, and trigger **no outreach**.

## 7. Source adapter architecture

`lib/discovery/adapters.ts` defines `SignalAdapter` (`key`, `label`, `phase`,
`isConfigured()`, `run()`) and a registry:

- **google_places** — `phase: "live"`, configured iff `GOOGLE_PLACES_API_KEY` set
  (supporting data; discovery itself runs from the Discovery page).
- **baugesuche** — `phase: "live"` since **v0.5.4** (real adapter,
  `lib/discovery/baugesuche-zh.ts`), configured iff `BAUGESUCHE_ZH_SIGNAL_URL` is
  set to a validated official endpoint; official JSON only, **no scraping**. See
  `docs/clean24-baugesuche-signal-adapter.md`.
- **simap / zefix** — `phase: "planned"` **stubs**: `isConfigured() === false`,
  `run()` returns `not_configured`, **no fetch, no scraping**.

Any future adapter must use **official API / approved open data only** (no HTML
scraping), be **env-gated**, **result-capped**, **timeout-bounded**, and ship
**only after an explicit owner GO + source-validation note**.

## 8. Promote a signal to opportunity

A signal is already backed by a `prospect`, so the owner acts on it through the
**existing** flow: the card links to the **Lead Hunter**, where the prospect is
reviewed and **übernommen** (promoted to a lead) via the existing role-aware,
RLS-scoped action. There is **no automatic cold outreach, no sending, no booking**
from a signal. (Adapter-sourced signals that are *not* yet prospects will, when
those adapters go live, create a prospect via the existing `createOpportunity`
action.)

## 9. Hard guardrails (reaffirmed)

- **No service-role** in app routes/actions; session client + RLS only.
- **No secrets/keys in the repo**; `GOOGLE_PLACES_API_KEY` / `CRON_SECRET` are
  empty placeholders; keys never logged, never to the client.
- **No customer data/PII in repo/docs.**
- **No SQL seed/import**, **no fake data.**
- **No uncontrolled scraping** (official API only; planned adapters are stubs),
  **no spam, no automatic cold outreach, no automatic phone calls, no silent
  booking, no real bexio API.**
- **Old Clean24 Lead Autopilot** untouched.

## 10. Next phase (gated, explicit GO required)

- First **official source adapter** (e.g. Baugesuche/Bauprojekt open data or
  SIMAP) — source validation + GO → then migration 007 + persisted signals with
  real (sometimes exact) timing.
- **Radar by signal** (region/service heat from signals).
- Compliant **send/calendar providers** (still human-approved; never silent).

Until then: v0.5.3 gives honest **"why now"** intelligence over existing
candidates — and contacts no one automatically.
