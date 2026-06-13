# Klarsa Core — Revenue Autopilot Production Results

> **Status: VERIFIED (Revenue Autopilot in production).** The Clean24 owner
> logged in to production (`https://klarsa.vercel.app`) and opened
> `/app-shell/revenue-autopilot`. The command center rendered, the navigation
> and tenant context were correct, and the guarded-automation notice was present.
> The page is **read-only / copy-only** through the **session client (RLS)** —
> **no scraping, no automatic search, no automatic email/WhatsApp sending, no
> automatic booking, no bexio API, no real customer data, no committed
> credentials.**

| | |
| --- | --- |
| **Version** | v0.5.0.1 (verification of v0.5.0) |
| **Date** | 2026-06-13 |
| **Environment** | Production — `https://klarsa.vercel.app` + `klarsa-production` (Supabase) |
| **Tenant** | Clean24 (production owner tenant) |
| **Method** | Manual: owner logs in to production, opens **Autopilot** from `AppShellNav`, reviews the page |
| **Reported by** | Owner |

> **Provenance / honesty note:** recorded from the **owner's manual production
> test**, as reported. It was **not** independently observed or automated from
> this repository, and this repo holds **no connection** to the production project
> (no URL secrets, keys, or service-role access). Production env values live only
> in Vercel/Supabase, never in the repo. This document records a reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| `/app-shell/revenue-autopilot` opens after login (protected route) | ✅ |
| `AppShellNav` shows **Autopilot**, and the Autopilot nav item is **active** | ✅ |
| Clean24 tenant context visible (company name in the nav/header) | ✅ |
| Page title **"Revenue Autopilot"** renders | ✅ |
| Money hero **"Heute Geld holen"** renders | ✅ |
| Hero line **"Klarsa zeigt Ihnen, was heute Umsatz bringt."** renders | ✅ |
| **Guarded-automation notice** present (no scraping, no automatic search, no automatic email/WhatsApp sending, no automatic booking, no bexio API) | ✅ |
| **"Autopilot – Nächste Schritte für Umsatz"** card renders | ✅ |
| Production route live and usable | ✅ |
| Read-only / copy-only / session-client / RLS path | ✅ confirmed (no writes) |
| Scraping / auto-search / auto-send / auto-booking / external API | ✅ none |
| Real customer data entered during verification | ✅ none |

The page is composed **in memory** from the tenant's existing RLS-filtered reads
(`getProspects`/`getLeads`/`getOffers`/`getJobs`/`getInvoiceHandoffJobs`/
`getFollowups`/`getLeadSources`/`getCompanySettings`) plus the pure helpers
(`components/revenue-autopilot/*`, `components/app-shell/autopilot.ts`,
`components/ceo/kpi.ts`). The only client action available on a draft is
`navigator.clipboard.writeText` (copy to clipboard) — there is no send/book code
path. The page performs **no writes** and uses the **anon/session client** only
(never service-role).

## Safety confirmations

- ✅ **Read-only / copy-only.** No inserts, updates or deletes on the page; reads
  are RLS-scoped to the active tenant. Drafts are copy-to-clipboard only.
- ✅ **No discovery automation.** No scraping, no automatic search, no external
  lookup (Source Execution Queue suggests *manual* research steps only).
- ✅ **No sending.** No SMTP/Gmail/Resend/WhatsApp API; outreach and follow-up
  texts are drafts the owner copies and sends manually.
- ✅ **No booking.** No calendar API; appointment texts are proposals with
  placeholder time windows the owner fills and confirms manually.
- ✅ **No real bexio API.** The bexio link routes to the existing manual handoff
  queue; no token, no network call to bexio.
- ✅ **No real customer data.** No real companies, projects or contacts were
  entered during this verification.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No new migration.** Built on existing data; 001–006 untouched,
  `verification/004` untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Revenue Autopilot inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The protected Revenue Autopilot route works in **production** after login for
  the Clean24 tenant, with correct navigation (active Autopilot item) and tenant
  context, read-only/copy-only through the session client (RLS).
- The command center renders its headline, money hero, guarded-automation notice
  and the prioritised "Nächste Schritte für Umsatz" card.
- No writes, discovery automation, sending, booking, or external lookup is
  involved.

## What this does NOT mean

- **No automatic discovery, sending or booking exists.** The Revenue Autopilot is
  a controlled **preparation** surface: it tells the owner what to do and prepares
  copy-only drafts, but Klarsa searches, sends and books **nothing** on its own.
- The **controlled Clean24 production start stays LIMITED GO** — real Clean24 data
  may enter **only via the production app UI** (no SQL/bulk import, no
  service-role, no customer PII in repo/docs). The **restore test remains
  deferred** and broad rollout / external onboarding stays blocked until it passes
  and the owner signs a full GO (see
  [`production-readiness-gate.md`](./production-readiness-gate.md) and
  [`clean24-controlled-production-start.md`](./clean24-controlled-production-start.md)).

## Next step

First **controlled daily production usage** with real Clean24 leads via the app
UI (use the Revenue Autopilot daily: work the source queue, prepare drafts, copy
and send manually). Then **v0.5.1** — optional source-execution state and, **only
on explicit owner approval**, compliant/approved discovery (e.g. SIMAP) and a
gated Gmail/Calendar path. Until then everything stays **vorbereiten → kopieren →
selbst senden** (see
[`clean24-revenue-autopilot-roadmap.md`](./clean24-revenue-autopilot-roadmap.md)).
