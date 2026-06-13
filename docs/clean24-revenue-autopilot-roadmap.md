# Clean24 Revenue Autopilot — Roadmap

> Status: **planning / foundation** (introduced with v0.4.3)
> Scope owner: Klarsa product + owner (Clean24)
> Guardrail level: **high** — this document defines what we will build, in what
> order, and the hard rules that gate every step. Nothing here ships without an
> explicit, separate GO.

> **Progress update (v0.5.2):** the **Autopilot Rules Engine** and the first
> **Automatic Discovery** adapter (official Google Places, env-gated) have shipped
> as a safe-by-default foundation — see
> `docs/clean24-automatic-discovery-autopilot-rules.md`. Cold outreach, auto-calls
> and silent booking remain **hard-blocked**; auto-messaging for safe categories
> still awaits a compliant send provider (separate GO). The Outreach/Follow-up/
> Appointment **assistants** (§3.3–§3.5) remain copy-only until that provider
> phase.

## 1. Why this document exists

Today Klarsa is a **manual, human-driven** sales & ops chain:

```
Lead Hunter → Schweiz-Radar → Opportunity → Lead Inbox → Follow-up
            → Offerte → Auftrag → bexio-Übergabe → CEO-Briefing
```

Every station works and is RLS-isolated per tenant. The **Schweiz-Radar
visualises opportunities that already exist** — it does **not** discover real
leads yet. v0.4.3 closes the *visibility* gap (the radar is always shown and
looks alive, the cockpit shows "what to do next for money"), but the **discovery
and assistance** gap is still open.

The Revenue Autopilot is the plan to close that gap **safely**: move the owner
from "do everything by hand" to "review hot opportunities, attend appointments,
close jobs" — while keeping a human in control of every outbound action.

**Honest framing we must keep:** the Autopilot is an *assistant*, not an
autonomous agent. It prepares; the human decides and sends. We never pretend a
step is automated when it is not.

## 2. North-star outcome for Clean24

> Each morning the owner opens Klarsa and sees:
> 1. **Hot opportunities** — ranked, region-aware, service-matched.
> 2. **Ready-to-send outreach** — drafted per opportunity, editable, *not sent*.
> 3. **An appointment proposal** — suggested slots, *not booked*.
>
> The owner reviews, edits, approves, and acts. Klarsa does the preparation;
> the owner keeps the relationship and the decision.

The owner's remaining work: **review hot opportunities → attend appointments →
close jobs.** Everything else is *prepared* by Klarsa and *approved* by a human.

## 3. The five building blocks

Each block is additive, ships behind its own gate, and reuses the existing
deterministic helpers (`scoring.ts`, `swiss-radar.ts`, `kpi.ts`,
`autopilot.ts`) before any AI is introduced.

### 3.1 Source Execution Queue
**What:** turn the existing, human-curated **Source Registry** into a *work
queue*. For each enabled source, generate a manual task: "Recherchieren Sie
Quelle X, erfassen Sie gefundene Chancen." A human works the queue and captures
opportunities (exactly today's manual capture, just organised).

- Builds on: `lead_sources`, the "Opportunity vorbereiten" workflow (migration 006).
- **No** automatic querying. The queue tells a *person* what to look at.
- Output: more, better-organised manual opportunities.
- Gate: ships as UI only. No external calls.

### 3.2 Opportunity Discovery Assistant
**What:** help a human find candidate opportunities faster from **approved,
compliant** sources only (see §5). Two phases:

- **Phase A (assist):** the human pastes/links a candidate (e.g. a public
  tender notice, a referral note). Klarsa structures it, applies `scoring.ts`,
  suggests service-match + region + next action. Still 100% human-initiated.
- **Phase B (approved discovery, gated):** *only if* a specific source is
  explicitly approved (e.g. SIMAP public tenders via an official, ToS-compliant
  feed), Klarsa may *fetch and present candidates for human review*. Nothing is
  contacted; nothing is captured without a human clicking "erfassen".

- **No uncontrolled scraping.** Every source passes the §5 checklist first.
- Gate: Phase B requires a signed source-by-source approval + a compliance note.

### 3.3 Outreach Draft Agent
**What:** for an opportunity/lead, draft a **personalised first-contact message**
(email/letter/phone script) using the service-match and region context.

- Output is a **draft only**, shown in an editable field with a copy button —
  exactly like the existing `OfferSendDraft` pattern (copy-only, no send).
- **No automatic email/WhatsApp sending. Ever, before approval.** The first
  version has *no send capability at all*; the human copies the draft into their
  own channel.
- A later, separately-gated phase may add "send from Klarsa" **only** with: real
  channel integration (see §6), per-message human approval, opt-out/contactability
  checks, and anti-spam limits.
- Gate: draft-only ships first; sending is a distinct, later GO.

### 3.4 Follow-up Agent
**What:** propose the **next follow-up** for open leads with no planned step
(this is the `attnLeadsNoFollowup` signal the Autopilot card already surfaces).
Suggest timing, channel and a drafted message.

- Creates a **proposed** follow-up task the human confirms; reuses the existing
  follow-up planner. **No automatic sending** — the human sends.
- Cadence is suggested, never executed silently.
- Gate: proposal-only; any auto-reminder/auto-send is a later, separate GO.

### 3.5 Appointment Coordination Assistant
**What:** when a lead is warm, **propose appointment slots** and a short
confirmation message.

- Output: a **proposal** ("Vorschlag: Di 10:00, Mi 14:00, Do 09:00") + a draft
  message. **No automatic booking.** The human picks and confirms.
- Builds on the existing job scheduling + `.ics` download (no calendar sync today).
- A later phase may read free/busy from a connected calendar (see §6) to *suggest*
  better slots — still proposal-only, still human-confirmed.
- Gate: proposal-only; auto-booking is explicitly out of scope until a separate GO.

## 4. Human approval rules (non-negotiable)

1. **Discovery** surfaces candidates → a human decides what becomes an
   opportunity. No silent capture.
2. **Outreach** is drafted → a human edits and **a human sends** (copy-only until
   real, gated channel integration exists).
3. **Follow-ups** are proposed → a human confirms before anything is scheduled.
4. **Appointments** are proposed → a human books. Klarsa never books.
5. **bexio / invoicing** stays manual until the separate bexio-API phase.
6. Every Autopilot suggestion links to the page where the **human acts**; the
   Autopilot itself performs no outbound action.
7. **Audit:** every approved action is attributable to a user (existing
   role-aware RLS + audit-append-only).

## 5. Legal / safety guardrails & allowed sources

### Hard guardrails (apply to every block)
- **No uncontrolled scraping.** Only sources that pass the checklist below.
- **No spam.** Respect frequency limits, relevance, and prior relationship.
- **No automatic sending** before a separate, explicit GO + real channel integration.
- **No automatic booking** before a separate, explicit GO.
- **No paid external API** integration unless explicitly approved later.
- **No service-role** access from app routes/actions; session client + RLS only.
- **No secrets/credentials** in the repo; **no customer PII** in repo/docs/prompts.
- **No fake/seed production data**; real Clean24 data enters **only via the app UI**.
- **Swiss data-protection (revDSG) + GDPR awareness:** lawful basis for B2B
  outreach, clear sender identity, easy opt-out, data minimisation, retention limits.
- **Channel ToS compliance:** respect WhatsApp Business policy, email anti-spam
  law, and any source's terms of service.

### Source approval checklist (every source must pass before any fetch)
- [ ] Source is **public** or we have permission to use it.
- [ ] Use complies with the source's **Terms of Service**.
- [ ] No login-walled or rate-limit-evading access.
- [ ] Data is **B2B / business** context with a lawful basis for outreach.
- [ ] An **opt-out / do-not-contact** path exists and is honoured.
- [ ] Owner has **explicitly approved** this source in writing.

### Allowed / approved lead sources (start here)
- ✅ **Referrals & partners** (warm, consented) — already supported, highest trust.
- ✅ **Property managers / Verwaltungen** the owner already has a relationship with.
- ✅ **Manually researched** opportunities a human enters.
- 🔶 **SIMAP public tenders** — *candidate* for approved discovery (public,
  tender context). Requires §5 checklist + signed approval before any fetch.
- 🔶 **ZEFIX / Handelsregister** — *validation/enrichment only* (confirm a company
  exists), never bulk harvesting. Gated.
- 🔶 **Google / Maps Places** — only via official API, within ToS, **paid-API
  approval required**, never page scraping. Gated.
- ⛔ **Website scraping / email harvesting / bought lists** — **not allowed.**

## 6. Future integration paths (each separately gated)

These are **not** in the near-term scope. They are documented so we build toward
them cleanly, with the same approval discipline.

- **Gmail / email sending:** OAuth, encrypted tokens (never in repo), send only
  on per-message human approval, opt-out + rate limits. Until then: copy-only drafts.
- **Calendar (Google/Microsoft):** read free/busy to *suggest* slots; create
  events only on human confirmation. Until then: `.ics` download, no sync.
- **Google / ZEFIX / SIMAP / website discovery:** only via compliant, official,
  ToS-respecting access, source-by-source approved (see §5). No uncontrolled
  scraping under any circumstances.
- **bexio API:** OAuth + encrypted tokens, human-approved invoice drafts. Until
  then: manual handoff (current behaviour).
- **AI (LLM) usage:** drafting/structuring assistance with human-in-the-loop;
  no PII in prompts beyond what the owner already holds for their own contacts;
  no autonomous outbound. A model choice + data-handling note ships with that GO.

## 7. Suggested delivery order

1. **v0.4.x — Autopilot hints (done in v0.4.3):** UI-only "next actions" from
   existing data. No external calls. ✅
2. **Source Execution Queue (§3.1):** organise manual work. UI only.
3. **Outreach Draft Agent — draft-only (§3.3):** copy-only messages, no send.
4. **Follow-up Agent — proposal-only (§3.4):** suggested next steps.
5. **Appointment Coordination — proposal-only (§3.5):** suggested slots.
6. **Opportunity Discovery Assistant — Phase A (§3.2):** human-pasted candidates.
7. **(Gated) Discovery Phase B + channel/calendar/bexio integrations (§6):**
   each behind its own compliance review and explicit owner GO.

## 8. Definition of done for the first Autopilot milestone

For Clean24, the first milestone is reached when, **using approved sources and
human approval only**, the owner reliably gets:

- **Hot opportunities** — ranked and region/service-aware (extends today's radar).
- **Ready-to-send outreach** — drafted per opportunity, editable, copy-only.
- **An appointment proposal** — suggested slots + a draft confirmation message.

…and the owner's day shrinks to **review → attend → close**, with Klarsa never
having sent, scraped, or booked anything on its own.
