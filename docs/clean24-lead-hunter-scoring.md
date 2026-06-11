# Klarsa Core — Lead Hunter Scoring & Service Matching (v0.3.7)

> **Status: FOUNDATION (staging).** Makes the manual Opportunity Radar smarter
> **without any auto-search**: a **deterministic, client-side** helper matches
> Clean24 services, explains the score, and recommends a next action as the user
> types. **No AI, no API, no network, no scraping, no external source.** The
> human keeps control — suggestions are only applied on an explicit "übernehmen".
> Writes still go through the **session client (RLS)**; **no new migration**.

Related: [`clean24-lead-hunter-foundation.md`](./clean24-lead-hunter-foundation.md),
[`clean24-lead-hunter-results.md`](./clean24-lead-hunter-results.md),
[`lead-hunter-engine.md`](./lead-hunter-engine.md) (future engine),
[`security-architecture.md`](./security-architecture.md).

## What it adds

- **Deterministic service matching** (`components/lead-hunter/scoring.ts`,
  `matchServices`): maps the opportunity **type** and the **free-text signals**
  (title + service potential + region) onto the Clean24 service vocabulary —
  **Umzugsreinigung, Treppenhausreinigung, Hauswartung, Bauendreinigung,
  Büroreinigung, Fensterreinigung, Tiefgaragenreinigung**. Same function powers
  the live form panel and the **Service-Match badges** on the list rows.
- **Score explanation** (`analyzeOpportunity`): a factor breakdown for **"Warum
  interessant?"** built from opportunity **type**, **region/city**, **service
  potential**, **timing words**, **source type** and the user's **score**, plus
  a **suggested score** (0–100, deterministic).
- **Recommended next action**: a deterministic suggestion per type (and warmer
  wording for referral/partner sources).
- **Client-side auto-fill**: a **"Vorschläge übernehmen"** button fills the
  *Grund*, *Nächste Aktion* and (if empty) *Score* fields from the analysis.
  Everything stays **editable**; nothing is hidden or auto-submitted.

## How the scoring works (deterministic, offline)

`analyzeOpportunity(signals)` is a **pure function** — no clock, no randomness,
no I/O — so the same inputs always give the same result and it is trivially
testable. The suggested score is additive and clamped to 0–100:

| Signal | Contribution |
| --- | --- |
| Base | 30 |
| Type | Ausschreibung +25 · Neubau +20 · Verwaltung +18 · Partner +15 · Firma/Praxis +12 · Manuell +4 |
| Region present | +5 |
| Service matches | +6 each (max +18) |
| Timing word found | +12 |
| Source | Empfehlung +12 · Partner +10 · Website +4 · Google +2 · Manuell/Andere 0 |

Timing words include `sofort`, `dringend`, `kurzfristig`, `Frist`, `Termin`,
`Ausschreibung`, quarters, years and month names. The user's own score is shown
as a factor but is **not** overwritten — the suggested score is advisory.

## Security & boundaries

- **Session client only**; the service-role/admin client is never used. The
  capture write is still gated by RLS (`can_write_sales`).
- **No external discovery, no automation:** the analysis runs **in the browser**
  from values the user typed. There is **no scraping, no web search, no
  Google/ZEFIX/SIMAP API, no AI/LLM call, no email, no upload**. Nothing leaves
  the page until the user submits the form.
- **Human in control:** suggestions appear, but are only written when the user
  clicks "übernehmen" and then submits. No silent auto-fill, no hidden writes.
- **No spam:** this only helps assess *manually captured* opportunities; it
  never reaches out to anyone.

## Manual verification checklist (staging, fake data only)

1. On `/app-shell/lead-hunter`, start typing a title / pick a type / enter a
   region → the **Analyse** panel appears with Service-Match badges, factors, a
   suggested score and a recommended next action.
2. e.g. type "Neubau" + "Bauendreinigung" → Bauendreinigung/Fensterreinigung
   match; "Verwaltung" + "Tiefgarage" → Treppenhaus/Hauswartung/Tiefgarage.
3. Click **"Vorschläge übernehmen"** → Grund, Nächste Aktion and (if empty)
   Score fill in; all remain editable.
4. Submit → the opportunity is saved; the list row shows the same Service-Match
   badges (computed deterministically from the stored fields).
5. No network request is made for the analysis (it is pure client-side).

## NOT in scope (v0.3.7)

- **Any automated discovery** — scraping, web search, registries, feeds. Still
  manual.
- Persisting the suggested score separately from the user's score, or a scoring
  history (`lead_scores`).
- A source registry (`lead_sources`) — see next step.
- Converting an opportunity into a lead, email, bexio, or any external call.

## Next step

**v0.3.8 — Source Registry foundation** (`lead_sources` as a catalog of allowed,
human-approved sources) **or Opportunity → Lead Inbox conversion** (promote a
qualified opportunity into a `leads` row via `promoted_lead_id`). Still manual,
RLS-scoped, no real customer data — real data only after verified
backup/restore, strict staging/production separation, and validated
auth/RLS/security.
