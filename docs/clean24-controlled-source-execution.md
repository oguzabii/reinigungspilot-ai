# Clean24 Controlled Source Execution (v0.5.1)

> Status: **shipped foundation** (v0.5.1) · **VERIFIED in production** (v0.5.1.1).
> Extends the Revenue Autopilot (`docs/clean24-revenue-autopilot-foundation.md`)
> and follows the roadmap (`docs/clean24-revenue-autopilot-roadmap.md`).
> Guardrail level: **high** — guided **manual** discovery, never automation.

## 0. VERIFIED in production (v0.5.1.1, 2026-06-13)

The Clean24 owner logged in to production (`https://klarsa.vercel.app`), opened a
source via **"Quelle abarbeiten"** and worked the guided cockpit. Confirmed:

- ✅ `/app-shell/lead-hunter/sources/[id]/execute` opens after login; reachable
  via "Quelle abarbeiten" from both the Source Registry and the Revenue Autopilot.
- ✅ The 5-step worklist renders: **Ziel → Recherchieren → Qualifizieren →
  Erfassen → Kontakt vorbereiten**.
- ✅ Research links open the owner's **own** browser searches (new tab) — no
  scraping, no API fetch, no server-side collection.
- ✅ The capture flow routes to `…/lead-hunter?source=<id>&service=…&region=…`,
  and the Lead Hunter shows the **"Quelle aktiv"** context.
- ✅ No automatic sending, no automatic booking, **no real customer data entered**.

Full record: [`clean24-controlled-source-execution-results.md`](./clean24-controlled-source-execution-results.md).
This reaffirms the LIMITED GO: real Clean24 data only via the app UI, restore test
still deferred, broad rollout still blocked.

## 1. What v0.5.1 adds

A **guided source-execution cockpit** that turns the Source Execution Queue into
a practical daily lead-hunting worklist — **without any scraping or automation**.

New protected route (dynamic):

```
/app-shell/lead-hunter/sources/[id]/execute
```

For one enabled lead source it shows a 5-step worklist:

1. **Ziel** — a concrete, human-sized goal derived from the source type
   ("Heute ≈5 Liegenschaftsverwaltungen recherchieren"), with a suggested
   Clean24 service and a target richtwert. The counts are coaching nudges, **not**
   data.
2. **Recherchieren** — the owner types a search keyword + region; Klarsa builds
   **plain href links** to the owner's *own* browser searches (Google, Google
   Maps, ZEFIX search start, website/contact search). Clicking opens a new tab —
   that is the only thing that happens.
3. **Qualifizieren** — a checklist (region matches, service need likely, contact
   channel visible, not irrelevant, good potential, capture notes) to decide if a
   found company is worth contacting. It is a local memory aid; nothing is stored.
4. **Erfassen** — a button routes into the pre-filled "Opportunity aus Quelle"
   form with **safe, non-PII** context (source id, suggested service, typed
   region). It creates nothing automatically — the human enters the real company
   and saves.
5. **Kontakt vorbereiten** — generic, source-based copy-only drafts (E-Mail /
   WhatsApp-SMS / Telefon-Skript / Follow-up + Terminvorschlag) with `[Firma]`
   placeholders, ready to copy and send manually.

### Integration
- **Revenue Autopilot** (`/app-shell/revenue-autopilot`): each Source Execution
  Queue item now links to **"Quelle abarbeiten"** (the execution cockpit), with a
  secondary "direkt erfassen" link. The section reads as a worklist:
  *Quelle öffnen → recherchieren → erfassen → Kontakt vorbereiten.*
- **Source Registry** (`/app-shell/lead-hunter/sources`): every source row gains
  a primary **"Quelle abarbeiten"** CTA (plus the existing "Opportunity
  vorbereiten"). Owner/admin permissions are unchanged.
- **Lead Hunter** (`/app-shell/lead-hunter`): when arriving with `?source=<id>`,
  the page shows an explicit **"Quelle aktiv"** banner with the next step and a
  link back to the execution cockpit. The capture form now also accepts safe,
  non-PII `?region=` and `?service=` prefills.

### New building blocks
- `components/revenue-autopilot/source-queue.ts` — extended with `sourceTaskFor()`
  (research keyword, suggested service, goal sentence, execute/capture links).
- `components/revenue-autopilot/ResearchTools.tsx` — client: keyword/region
  inputs, user-opened research links, and the source-aware capture button.
- `app/app-shell/lead-hunter/sources/[id]/execute/page.tsx` — the cockpit.
- `components/lead-hunter/NewOpportunityForm.tsx` — `OpportunitySeed` gains
  optional `region`/`service` prefills.

## 2. How Clean24 uses it daily

1. Open **Revenue Autopilot** → **Quellen abarbeiten**.
2. Pick a source → **Quelle abarbeiten** (the cockpit).
3. Read the **Ziel**; adjust the **Suchbegriff** and **Region**.
4. Open a **research link** (Google / Maps / ZEFIX / website) — your own browser
   search opens in a new tab.
5. For each candidate, run the **Qualifizieren** checklist.
6. If it fits, click **Gefundene Firma als Opportunity erfassen** → the form opens
   pre-filled with the source + suggested service + region. Enter the real company
   and save.
7. Use the **Kontakt vorbereiten** drafts (or the personalised ones in the Revenue
   Autopilot once the lead exists) — copy, adjust, send yourself.

The owner's day stays: **research → qualify → capture → contact/approve →
attend → close.**

## 3. What is still manual

- **Discovery is manual.** Klarsa does **not** find companies for you. It seeds
  *your own* browser searches and structures the work — you research, judge and
  enter every company by hand.
- **Sending is manual.** All drafts are copy-only; no SMTP/Gmail/WhatsApp API.
- **Booking is manual.** Appointment texts are proposals with placeholder time
  windows; no calendar access, nothing reserved.
- **Capture is manual.** The capture button only *navigates* to a pre-filled
  form; it inserts nothing. Real data enters only when the human saves.

## 4. Why this is NOT scraping

- The research links are **plain `<a href>` links** the user clicks. There is
  **no `fetch()`, no API call, no headless browser, no server-side collection**,
  and Klarsa never reads, parses, stores or transmits any search result.
- The keyword/region the owner types are used only to build those href links and
  (optionally) to pre-fill the owner's own capture form — they are generic
  context, **not** customer data.
- ZEFIX/Google/Maps are opened as the owner's **own** browser session; Klarsa is
  not a client of any of them.

## 5. Why no messages are sent automatically

Every assisted message is built as **vorbereitet → kopieren → prüfen → selbst
senden**. The only action any draft component performs is
`navigator.clipboard.writeText`. There is **no send/book code path** — no email,
no WhatsApp, no calendar, no bexio API.

## 6. How real data enters only through the UI

The capture button routes to `/app-shell/lead-hunter?source=<id>&service=…&region=…`
with **non-PII** context only (never a company name, contact, e-mail or phone).
The opportunity is created **only** when the human fills the form and submits it
through the existing role-aware, RLS-scoped server action (session client; never
service-role). No SQL seed/import, no bulk import, no fake data.

## 7. Next phase (gated, opt-in only)

- **v0.5.1.1** — record production verification after the owner tests the cockpit.
- **v0.5.2** — *planning* for the first **approved discovery integration**: a
  single, ToS-compliant, explicitly-approved source (e.g. SIMAP public tenders)
  that surfaces *candidates for human review* — still no auto-contact, still
  human-approved. Plus a gated Gmail/Calendar path.

Each of these requires an explicit owner GO and a compliance note. Until then the
workflow stays exactly what it is today: **guided, manual, copy-only.**
