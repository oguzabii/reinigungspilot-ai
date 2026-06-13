# Clean24 Revenue Autopilot — Foundation (v0.5.0)

> Status: **shipped foundation** (v0.5.0). Builds on the roadmap in
> `docs/clean24-revenue-autopilot-roadmap.md`.
> Guardrail level: **high** — this is an *assistant*, not an autonomous agent.

## 1. What v0.5.0 adds

A dedicated, protected command center:

```
/app-shell/revenue-autopilot
```

It turns the existing chain (Lead Hunter → Radar → Lead Inbox → Follow-up →
Offer → Job → bexio → CEO) into a single **"what do I do today to get work?"**
view. Everything on it is built **at request time** from the tenant's own
RLS-filtered data — there is **no new migration, no new table, no schema change**.

The page shows, in money order:

1. **Nächste Umsatz-Aktionen** — the prioritised Autopilot actions (reused from
   the CEO/cockpit `AutopilotCard`): money to invoice, offers to chase,
   hot opportunities to take, leads to keep warm.
2. **Quellen abarbeiten (Source Execution Queue)** — for each enabled
   `lead_sources` entry, a suggested, human-sized research step
   ("≈5 Liegenschaftsverwaltungen kontaktieren") with a link into the
   pre-filled "Opportunity aus Quelle"-Formular.
3. **Heisse Chancen ansprechen** — top un-promoted opportunities, each with a
   copy-only **Erstkontakt-Entwurf** (E-Mail / WhatsApp / Telefon-Skript /
   Follow-up).
4. **Leads nachfassen & Termin vorschlagen** — open leads without a planned
   follow-up, each with a copy-only **Nachricht** and a copy-only
   **Terminvorschlag / Terminbestätigung**.
5. **Offerten nachfassen** — sent offers, each with a copy-only **Nachfass-Entwurf**.
6. **Abschliessen & verrechnen** — links to bexio handoff and the CEO briefing.

It is reachable from the top navigation (**Autopilot**), and the cockpit + CEO
briefing surface the open-action count with a link into it.

### New building blocks (all pure / copy-only)
- `components/revenue-autopilot/source-queue.ts` — `buildSourceTasks()` (pure).
- `components/revenue-autopilot/outreach.ts` — `buildOutreachDrafts()` (pure):
  E-Mail / WhatsApp-SMS / Telefon-Skript / Follow-up, Swiss-German tone.
- `components/revenue-autopilot/appointment.ts` — `buildAppointmentDrafts()`
  (pure): Terminvorschlag + Terminbestätigung with placeholder time windows.
- `components/revenue-autopilot/DraftChannels.tsx` — client copy-only viewer
  (channel switch + "Kopieren"; clipboard only, no network).
- `lib/auth/tenant-data.ts` — `getCompanySettings()` (RLS read of the sender
  identity used to personalise drafts).

## 2. What is still 100% manual

Klarsa **prepares**; the human **decides, approves and acts**:

- **Discovery is manual.** Klarsa does **not** find leads for you. The Source
  Execution Queue tells a *person* what to research; the person does the
  research externally and enters each opportunity by hand. The suggested counts
  ("≈5", "≈3") are coaching nudges, **not** data and **not** a claim that those
  records exist.
- **Sending is manual.** Every outreach / follow-up message is a **draft you
  copy** and send from your own mailbox / phone. There is **no** SMTP, Gmail,
  Resend or WhatsApp integration.
- **Booking is manual.** Appointment messages are **proposals**; Klarsa has no
  calendar access and reserves nothing. Time windows are `[Platzhalter]` you fill.
- **Invoicing is manual.** The bexio handoff stays a manual, copy-only queue
  (no real bexio API).

## 3. Human approval — how it is enforced

Every assisted action is framed and built as **vorbereitet → kopieren → prüfen →
selbst senden**:

- Drafts render inside a collapsed `DraftChannels` block with a permanent note:
  *"Vorbereiteter Entwurf. Kein automatischer Versand – prüfen, anpassen und
  selbst senden."*
- The page header and the `AutopilotCard` both carry the guardrail note that
  Klarsa *searches, sends and books nothing automatically*.
- There is **no send/book code path at all** — the only action a draft component
  performs is `navigator.clipboard.writeText` (copy to clipboard).
- Promotion / status changes still go through the existing role-aware,
  RLS-scoped server actions (session client; never service-role).

## 4. Legal / safety guardrails (unchanged, reaffirmed)

- **No service-role** in app routes/actions; session client + RLS only.
- **No credentials/secrets/env** in the repo; no `.env.local` committed.
- **No customer data** in repo/docs/prompts; drafts are built at runtime from
  the tenant's own rows and never persisted by this feature.
- **No SQL seed/import** of customer data; **no fake production data**.
- **No uncontrolled scraping, no spam.**
- **No automatic email/WhatsApp sending; no automatic appointment booking.**
- **No real bexio API; no paid external API** (unless explicitly approved later).
- Swiss data-protection (revDSG) + GDPR awareness: lawful basis for B2B outreach,
  clear sender identity, easy opt-out, data minimisation — the owner remains the
  data controller and the one who contacts.

## 5. How Clean24 should use it daily

A tight daily loop for the owner:

1. Open **Revenue Autopilot** (`/app-shell/revenue-autopilot`).
2. **Nächste Umsatz-Aktionen**: clear the money-first items (invoice finished
   work, chase sent offers).
3. **Quellen abarbeiten**: pick a source, do the suggested research, and enter
   the chances you find via the linked form.
4. **Heisse Chancen**: open a draft, adjust it, send it yourself, then take the
   opportunity into the Lead Inbox.
5. **Leads nachfassen / Termin**: copy a follow-up or a Terminvorschlag, send it,
   plan the follow-up in the Lead Inbox.
6. **Offerten nachfassen**: nudge open offers.
7. Close the loop: **bexio-Übergabe** + **CEO-Briefing**.

The owner's day becomes: **review → contact/approve → attend → close.**

## 6. Next phase (gated, opt-in only)

Tracked in `docs/clean24-revenue-autopilot-roadmap.md`:

- **v0.5.1+ Source execution state** — optionally persist "done/snoozed" per
  source task (would be the next additive migration, only if needed).
- **Approved discovery** — source-by-source, ToS-compliant, explicitly approved
  (e.g. SIMAP public tenders) — surfaces *candidates for human review* only.
- **Gmail / Calendar** — OAuth + encrypted tokens, per-message human approval,
  free/busy *suggestions*, events only on confirmation.
- **bexio API** — OAuth, encrypted tokens, human-approved invoice drafts.

Each of these is **separately gated** and requires an explicit owner GO plus a
compliance note. Until then, the Revenue Autopilot stays exactly what it is
today: a fast, safe **preparation** surface with a human at every send.
