# Klarsa Core — Controlled Source Execution Production Results

> **Status: VERIFIED (Controlled Source Execution in production).** The Clean24
> owner logged in to production (`https://klarsa.vercel.app`), opened a source via
> **"Quelle abarbeiten"** and worked the guided execution cockpit
> (`/app-shell/lead-hunter/sources/[id]/execute`). The 5-step worklist rendered,
> the research links opened the owner's **own** browser searches, and the capture
> flow carried safe, non-PII context into the Opportunity form. The page is
> **read-only / copy-only** through the **session client (RLS)** — **no scraping,
> no API fetch, no server-side collection, no automatic sending, no automatic
> booking, no real customer data, no committed credentials.**

| | |
| --- | --- |
| **Version** | v0.5.1.1 (verification of v0.5.1) |
| **Date** | 2026-06-13 |
| **Environment** | Production — `https://klarsa.vercel.app` + `klarsa-production` (Supabase) |
| **Tenant** | Clean24 (production owner tenant) |
| **Method** | Manual: owner logs in, opens a source via "Quelle abarbeiten", works the cockpit, follows the capture link |
| **Reported by** | Owner |

> **Provenance / honesty note:** recorded from the **owner's manual production
> test**, as reported. It was **not** independently observed or automated from
> this repository, and this repo holds **no connection** to the production project
> (no URL secrets, keys, or service-role access). Production env values live only
> in Vercel/Supabase, never in the repo. This document records a reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| `/app-shell/lead-hunter/sources/[id]/execute` opens after login (protected route) | ✅ |
| Source Registry → **"Quelle abarbeiten"** opens the cockpit | ✅ |
| Revenue Autopilot → **"Quelle abarbeiten"** opens the cockpit | ✅ |
| **Ziel** step renders (goal + suggested service + richtwert) | ✅ |
| **Recherchieren** step renders (keyword/region inputs + research links) | ✅ |
| Research links open the owner's **own** browser search (new tab) | ✅ |
| **Qualifizieren** step renders (checklist, local only) | ✅ |
| **Erfassen** step routes to `…?source=<id>&service=…&region=…` | ✅ |
| **Kontakt vorbereiten** step renders (copy-only drafts) | ✅ |
| Lead Hunter shows **"Quelle aktiv"** context after the capture link | ✅ |
| Scraping / API fetch / server-side collection | ✅ none |
| Automatic sending / automatic booking | ✅ none |
| Read-only / copy-only / session-client / RLS path | ✅ confirmed (no writes) |
| Real customer data entered during verification | ✅ none |

The cockpit is composed **in memory** from the tenant's existing RLS-filtered
reads (`getLeadSourceById`/`getCompanySummary`/`getCompanySettings`) plus the pure
helpers (`components/revenue-autopilot/source-queue.ts` `sourceTaskFor`,
`outreach.ts`, `appointment.ts`). The research links are plain `<a href>` links
the owner clicks; the capture button only *navigates* to the pre-filled form with
non-PII context. The page performs **no writes** and uses the **anon/session
client** only (never service-role).

## Safety confirmations

- ✅ **Not scraping.** Research links are user-opened `<a href>` links (Google /
  Maps / ZEFIX / website). No `fetch()`, no API call, no headless browser, no
  server-side collection; Klarsa reads, parses, stores and transmits nothing.
- ✅ **No automatic sending.** Outreach/appointment texts are copy-only drafts;
  the only client action is `navigator.clipboard.writeText`. No SMTP/Gmail/
  WhatsApp API.
- ✅ **No automatic booking.** Appointment texts are proposals with placeholder
  time windows; no calendar access, nothing reserved.
- ✅ **No real bexio API.** No token, no network call to bexio.
- ✅ **Capture is manual / non-PII.** The capture link carries only `source`,
  `service` and `region` (generic context, sanitised) — never a company name,
  contact, e-mail or phone. The opportunity is created only when the human fills
  and submits the form (session client / RLS, never service-role).
- ✅ **No real customer data.** No real companies, projects or contacts were
  entered during this verification.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **No new migration.** Built on existing data; 001–006 untouched,
  `verification/004` untouched.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the controlled source
  execution inside Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The guided source-execution cockpit works in **production** after login for the
  Clean24 tenant, reachable via "Quelle abarbeiten" from both the Source Registry
  and the Revenue Autopilot.
- The full 5-step worklist (Ziel → Recherchieren → Qualifizieren → Erfassen →
  Kontakt vorbereiten) renders, the research links open the owner's own browser
  searches, and the capture flow carries safe non-PII context with the Lead
  Hunter showing the active source.
- No scraping, API fetch, server-side collection, automatic sending or booking is
  involved.

## What this does NOT mean

- **Discovery, sending and booking remain manual.** The cockpit *guides,
  structures, drafts and routes* the work; it does **not** find companies, send
  messages or book appointments. The owner researches, qualifies, captures and
  contacts manually.
- The **controlled Clean24 production start stays LIMITED GO** — real Clean24 data
  may enter **only via the production app UI** (no SQL/bulk import, no
  service-role, no customer PII in repo/docs). The **restore test remains
  deferred** and broad rollout / external onboarding stays blocked until it passes
  and the owner signs a full GO (see
  [`production-readiness-gate.md`](./production-readiness-gate.md) and
  [`clean24-controlled-production-start.md`](./clean24-controlled-production-start.md)).

## Next step

**Controlled daily production usage** with real Clean24 leads via the app UI (work
the source queue: open a source → research → qualify → capture → prepare contact,
copy and send manually). Then, **only on explicit owner approval, v0.5.2** —
planning for the first **compliant/approved discovery integration** (e.g. SIMAP
public tenders surfacing *candidates for human review*) and a gated Gmail/Calendar
path (see
[`clean24-controlled-source-execution.md`](./clean24-controlled-source-execution.md)
and [`clean24-revenue-autopilot-roadmap.md`](./clean24-revenue-autopilot-roadmap.md)).
