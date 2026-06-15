# Klarsa Core — Outreach Autopilot Production Results

> **Status: VERIFIED (Outreach Autopilot MVP in production).** The Clean24 owner
> deployed v0.5.8 and confirmed the **production UI changed as expected**:
> `/app-shell/revenue-autopilot/outreach` opens after login, the outreach queue is
> visible, and each card shows ready-to-use drafts (E-Mail, WhatsApp/SMS,
> Telefon-Skript, Follow-up, Terminvorschlag) with copy + action buttons.
> Everything stays **copy-only** — **no real sending, no booking, no bexio API,
> no scraping**. **No real customer data committed.**

| | |
| --- | --- |
| **Version** | v0.5.8.1 (verification of v0.5.8) |
| **Date** | 2026-06-15 |
| **Environment** | Production — `https://klarsa.vercel.app` + `klarsa-production` (Supabase) |
| **Tenant** | Clean24 (production owner tenant; premium / `internal_founder`) |
| **Method** | Manual: owner deploys v0.5.8, logs in, opens **Revenue Autopilot → Erstkontakt / Outreach**, reviews the queue |
| **Reported by** | Owner |

> **Provenance / honesty note:** recorded from the **owner's manual production
> test**, as reported. It was **not** independently observed or automated from
> this repository, and this repo holds **no connection** to the production project
> (no URL secrets, keys, or service-role access). Production env values live only
> in Vercel/Supabase, never in the repo. This document records a reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| v0.5.8 deployed to production / UI changed as expected | ✅ reported |
| `/app-shell/revenue-autopilot/outreach` opens after login (protected route) | ✅ reported |
| Outreach queue visible (Bereit für Erstkontakt · Heisse Chancen · Leads ohne Follow-up · Offerten Antwort ausstehend · Termine vorschlagen) | ✅ reported |
| Drafts visible — **E-Mail** | ✅ reported |
| Drafts visible — **WhatsApp/SMS-style** | ✅ reported |
| Drafts visible — **Telefon-Skript** | ✅ reported |
| Drafts visible — **Follow-up** | ✅ reported |
| Drafts visible — **Terminvorschlag** | ✅ reported |
| Copy workflow works (Kopieren) | ✅ reported — where tested |
| Actions visible/working — „In Lead Inbox übernehmen" / „Als kontaktiert markieren" / Follow-up-/Offerten-Links | ✅ reported — where tested |
| Revenue Autopilot **Erstkontakt-Lane** links to `/outreach` + „X Kandidaten bereit für Erstkontakt" | ✅ reported |
| Package gating (Starter locked / Pro guided / Premium framing) | ✅ as designed (Clean24 = Premium) |
| **No real sending** (email/WhatsApp) | ✅ none (no channel connected) |
| **No booking** | ✅ none |
| **No bexio API** | ✅ none |
| Real customer data entered during verification / committed to repo | ✅ none |

The page reads tenant data RLS-scoped (`getCompanySummary` incl. `tier` +
`billingStatus`, `getCompanySettings`, `getProspects`, `getLeads`, `getOffers`,
`getFollowups`) and assembles drafts with the deterministic helpers
(`components/revenue-autopilot/outreach.ts`, `appointment.ts`). The only writes
available are `promoteOpportunity` and `markProspectContacted`
(`prospects.status='contacted'`), both via the **session/anon client (RLS)** —
never service-role. Drafts are copy-only; nothing is sent.

## Safety confirmations

- ✅ **Copy-only.** No SMTP/Gmail/Resend/WhatsApp API; drafts are copied and sent
  by the owner. No send channel is connected.
- ✅ **No booking.** No calendar API; appointment drafts are proposals only.
- ✅ **No bexio API.** No token, no network call to bexio.
- ✅ **No scraping / no spam / no hidden mass outreach.** The queue is the
  tenant's own RLS-scoped data; nothing is harvested or auto-sent.
- ✅ **No real customer data.** No real companies/contacts were committed to the
  repo/docs during this verification.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon/service-role key, project ref, API key, password, or JWT.
- ✅ **No new migration.** v0.5.8 reused existing fields/status; 001–006
  untouched, `verification/004` untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Outreach Autopilot inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The Outreach Autopilot MVP is live in **production** after login for the Clean24
  tenant, and the production UI changed as expected.
- The five-section queue, the ready-to-use drafts across all channels, and the
  copy + action workflow behave as designed, from real RLS-scoped data.

## What this does NOT mean

- **No real sending exists yet.** Drafts are copy-only; Klarsa sends nothing and
  books nothing. A compliant send channel is the next step.
- The **controlled Clean24 production start stays LIMITED GO** — real data only via
  the production app UI (no SQL/bulk import, no service-role, no customer PII in
  repo/docs). The **restore test remains deferred** and broad rollout stays blocked
  until it passes and the owner signs a full GO (see
  [`production-readiness-gate.md`](./production-readiness-gate.md) and
  [`clean24-controlled-production-start.md`](./clean24-controlled-production-start.md)).

## Next step

**v0.5.9 — Real Outreach Send Channel MVP:** controlled, single-recipient,
owner-approved **email** sending for Premium through a configured provider — no
bulk, no spam, no hidden background sends, no WhatsApp, no booking. Pro stays on
the approval/copy workflow (see
[`clean24-outreach-autopilot-mvp.md`](./clean24-outreach-autopilot-mvp.md)).
