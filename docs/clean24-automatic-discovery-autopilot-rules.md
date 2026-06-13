# Clean24 Automatic Discovery + Autopilot Rules (v0.5.2)

> Status: **shipped foundation** (v0.5.2). Builds on Controlled Source Execution
> (`docs/clean24-controlled-source-execution.md`) and the roadmap
> (`docs/clean24-revenue-autopilot-roadmap.md`).
> Guardrail level: **maximum** — this is the first version that can act
> automatically, so it is **safe-by-default** and **policy-gated** throughout.

## 1. What v0.5.2 adds

Klarsa moves toward automation — **controlled by policy**, not a spam machine.

Three things ship:

1. **Autopilot Rules Engine** (`components/revenue-autopilot/policy.ts`) — a pure,
   deterministic policy brain that decides what Klarsa may do automatically per
   **lead category**, given the owner's safe-mode toggles and which providers are
   configured. It returns verdicts; the UI and server actions must honour them.
2. **Automatic Discovery** (`lib/discovery/google-places.ts`) — an env-gated
   adapter for the **official** Google Places Text Search. It finds candidate
   businesses and (only if the owner enables it) auto-creates them as **cold
   prospects**.
3. **Autopilot Control Center** — three surfaces:
   - `/app-shell/revenue-autopilot` — an "Automatik" section + safe-mode banner.
   - `/app-shell/revenue-autopilot/discovery` — run discovery, see candidates,
     audit of runs.
   - `/app-shell/revenue-autopilot/policy` — the policy matrix, hard-blocked
     list, and the owner's safe-mode toggles.

**No schema change / no migration.** Discovered candidates reuse the existing
`prospects` table (`source_type = 'google'` = the auto-discovery marker); policy
toggles live in the existing `company_settings.settings` jsonb (key `autopilot`);
every automatic run is written to the existing `audit_logs` table
(`entity_type = 'discovery_run'`).

## 2. Lead categories (the heart of the rules engine)

| Category | Meaning | Auto-create | Auto-message | Auto-book |
| --- | --- | --- | --- | --- |
| **Inbound / Opt-in** | Contact reached out (form/call/email) | Lead | Allowed *if* send provider configured | Never silently |
| **Bestandskunde** | Existing relationship | — | Follow-up *if* provider configured | Never silently |
| **Freigegebener Kontakt** | Owner manually approved | — | Follow-up *if* provider configured | Never silently |
| **Kalt entdeckt** | Auto-discovered, no consent | Candidate (cold) | **BLOCKED** | **BLOCKED** |

Only **safe** categories may ever receive automatic messages, and only when a
**compliant send provider** (sender identity + opt-out) is configured. None is
today, so all auto-messaging currently resolves to *"draft only — send yourself."*

## 3. What Klarsa can now do automatically

- **Discover candidates** from the official Places API (owner/admin-triggered,
  manual, capped at 10 results, deduped) — **when the owner has set a key**.
- **Auto-create cold candidates** as `prospects` (marked cold, not contacted,
  outreach blocked) — **only when the `autoCreateColdCandidates` toggle is ON**
  (default OFF). This is the safe reading of "convert without my approval": the
  *candidate* is created automatically; it is **not** turned into a contactable
  lead and **nothing is sent**.
- **Score** each discovered candidate (deterministic, offline `scoring.ts`).
- **Prepare** outreach / follow-up / appointment drafts (copy-only, from v0.5.0).

## 4. What remains blocked by policy

- **Automatic cold outreach** — always blocked. No automatic email/WhatsApp to
  cold/discovered/scraped contacts. No spam.
- **Automatic phone calls** — never.
- **Silent appointment booking** — never. A calendar event is created only after
  the customer confirms / picks a slot.
- **Uncontrolled scraping** — never. Only official, approved APIs.
- **Auto-creating a cold *lead*** (vs. candidate) — blocked; cold stays a
  candidate until a human qualifies/approves it.
- **Auto-sending for safe categories** — currently blocked too, because **no
  compliant send provider is configured** (it resolves to draft-only).

## 5. How missing API keys are handled

`isDiscoveryConfigured()` reads `GOOGLE_PLACES_API_KEY` lazily, server-side only.
If it is unset:

- the Discovery page shows **"Nicht konfiguriert"** and the run button is disabled;
- a run returns `status: "not_configured"` and changes nothing;
- the rest of the app keeps working (nothing throws at import or build time).

The key is **never** in the repo (only a placeholder in `.env.local.example`),
**never** `NEXT_PUBLIC_`, **never** logged, **never** sent to the client. The owner
sets it in Vercel/Supabase env.

## 6. Is the Google Places adapter implemented or prepared?

**Implemented and functional** — it performs a real call to the official
`places:searchText` endpoint **when a key is configured**. In this repo/environment
no key is set, so it is **dormant** and shows "not configured." Controls: official
API only (no HTML/page scraping), owner/admin manual trigger, **no cron**, hard cap
of 10 results, request timeout, field-mask-minimised response, key never logged.

## 7. How candidates / leads are auto-created

- A discovery run normalises each Place to `{ providerId, name, address, website }`.
- **Dedupe**: against existing `prospects` by `name + region` (case-insensitive),
  and within the run by `providerId`.
- If `autoCreateColdCandidates` is ON, fresh candidates are inserted into
  `prospects` via the **session client (RLS, sales domain; owner/admin qualify)**
  with: `source_type = 'google'`, `status = 'raw'`, an auto score, and a `reason`
  noting *"Automatisch entdeckt … kalt … Cold-Outreach gesperrt"* (plus
  website/address for the owner's reference). If OFF, candidates are only shown
  for manual capture.
- Cold discovered businesses are **never** auto-created as leads. Lead creation
  for cold contacts stays manual (promotion in the Lead Hunter).

## 8. How message automation is constrained

There is **no send code path** in v0.5.2. Messages are represented as **prepared
copy-only drafts** (from v0.5.0) plus a **policy verdict**:

- `cold` → **blocked_by_policy** (cold outreach).
- safe category, no provider → effectively **send_provider_not_configured**
  (draft ready to send manually).
- safe category + provider + toggle → *would be* ready_to_send — but **no provider
  is configured**, so this never fires today.

We **do not fake sending**. No SMTP/Gmail/Resend/WhatsApp integration exists.

## 9. How appointment automation is constrained

Appointment **proposals** can be prepared (copy-only, placeholder time windows).
There is **no calendar provider**, so nothing is booked. A real event would be
created **only** after the customer confirms / selects a booking-link slot —
**never silently**. This is a hard rule (`autoBook` is always blocked in the
policy engine).

## 10. Audit / transparency

Every automatic discovery run writes an `audit_logs` row (`action = 'system'`,
`entity_type = 'discovery_run'`) with counts (found / created / deduped), the
query/region, and the auto-create flag — **no silent actions**. The Discovery page
shows the recent runs. (Audit metadata records counts + query, not individual
business names.)

## 11. Hard guardrails (reaffirmed)

- **No service-role** in app routes/actions; session client + RLS only.
- **No secrets/keys in the repo**; `.env.local` never committed; key never logged.
- **No customer data/PII in repo/docs**; discovered data lives only in the tenant
  DB at runtime, created via an owner-triggered app action (no SQL/bulk import).
- **No fake production data.**
- **No uncontrolled scraping, no spam, no automatic cold email/calls, no silent
  booking, no real bexio API, no paid API unless the owner configures the key.**
- **Old Clean24 Lead Autopilot** untouched.

## 12. Next phase (gated, explicit GO required)

- **Inbound channel** (website form → inbound lead) to make `auto_create_lead` /
  `auto_send_inbound_reply` meaningful.
- **Compliant send provider** (Gmail/SMTP/Resend): OAuth/encrypted tokens, sender
  identity, opt-out, rate limits, per-message human approval.
- **Calendar provider**: free/busy *suggestions*; events only on confirmation.
- **More approved discovery sources** (e.g. SIMAP) — source-by-source, ToS-checked.

Each requires an explicit owner GO and a compliance note. Until then, automation
stays exactly what it is today: **discover + create cold candidates (opt-in),
prepare drafts, and block everything else.**
