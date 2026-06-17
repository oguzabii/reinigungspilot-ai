# Digital Office Builder — Foundation (vNext)

> **New product direction.** Klarsa is repositioned from a complex
> lead/radar/CRM system into a **simple, self-service Digital Office Builder**.
> This document describes the foundation version added in `vNext`.

## Why this direction

Customers do not hire us to set up their system by hand. They log in, **build
their own digital office**, choose digital workers, connect their mailbox,
prepare an offer/PDF template, set pricing rules — and then watch their digital
workers handle mail, offers, follow-ups, tasks and daily office work.

The feeling we want:

> „Ich habe mein eigenes digitales Büro gebaut. Meine KI-Mitarbeiter erledigen
> Mail, Offerten, Follow-ups, Aufgaben und tägliche Büroarbeit."

Customer-facing wording stays simple: **Digitales Büro · KI-Mitarbeiter · Mail ·
Offerte · Preisregeln · Aufgaben · Freigaben · Heute erledigt** — not "agent
orchestration", "radar" or "AI workflow engine".

Turkish (internal): *Müşteri kendi dijital bürosunu kurar, çalışanlarını seçer,
mailini bağlar, fiyatlarını girer, PDF teklif şablonunu hazırlar ve dijital
çalışanlar işi yürütür.*

## The route

A new protected route: **`/app-shell/digital-office`**. It is the new central
product experience and is linked from the app-shell navigation as **„Digitales
Büro"**. Existing routes are untouched and keep working.

The page shows: a hero („Ihr digitales Büro"), a package/status summary,
quick-action cards, self-service setup progress, the digital workers working
live, mailbox/template/pricing foundation cards, a today's-activity feed and the
**Ask Office** panel (gated to Pro+).

## Package model (central config)

Single source of truth: [`lib/digital-office/pricing.ts`](../lib/digital-office/pricing.ts).
No CHF number or limit is hardcoded in components.

| Package  | CHF/mo | Offices | Workers | Mailboxes | Templates | Pricing rules | Ask Office | Automation |
|----------|-------:|--------:|--------:|----------:|----------:|---------------|------------|------------|
| Free     | 0      | 1       | 1       | 0         | 0         | —             | —          | —          |
| Starter  | 19     | 1       | 3       | 1         | 1         | basic         | —          | draft/approval |
| Pro      | 49     | 1       | 7       | 3         | 3         | advanced      | ✓          | approval   |
| Premium  | 99     | 1       | 15      | 5         | 5         | advanced      | Pro        | semi-auto  |
| Business | 199    | 3       | 30      | 10        | 15        | advanced      | full       | semi-auto  |

> The old `Go` package is removed from product thinking. The older,
> setup-fee-based packages in [`lib/packages.ts`](../lib/packages.ts) are left
> **untouched** (still used by the public marketing/pricing pages).

**Add-ons** (also in `pricing.ts`): extra worker +5 CHF/mo, extra mailbox
+5 CHF/mo, extra template +5 CHF/mo, extra office +19 CHF/mo, 1’000 extra AI
tasks 9 CHF.

**Tier bridge.** The DB only knows `companies.tier = starter | pro | premium`
today. `tierToOfficePackage()` maps that to the new model (missing tier → Free).
`Business` is not yet reachable from the DB — see *Persistence plan* below.

`aiTasksPerMonth` per package are sensible initial defaults; tune them centrally
in `pricing.ts`.

## Digital worker model

Catalog: [`lib/digital-office/workers.ts`](../lib/digital-office/workers.ts) — 8
worker types (Büro-Manager, Digitale Sekretärin, Digitaler Verkäufer,
Offerten-Assistent, Follow-up-Mitarbeiter, Termin-Assistent, Finanz-Assistent,
Operations-Assistent).

How many workers are **active** is bounded by the package `workers` limit. For
this foundation the active set is the first N of the catalog — a **config-backed
default selection**; persisting a custom selection is a documented next step.

Per-worker **runtime** (status / current task / today's output) is derived from
real, RLS-scoped tenant data in
[`lib/digital-office/office.ts`](../lib/digital-office/office.ts). Statuses are
honest: `idle` / `working` / `waiting_approval` / `blocked` / `locked` — e.g. the
Digitale Sekretärin is **blocked** until the mailbox is connected, and the
Offerten-Assistent **waits** for pricing rules.

## Feature gating

[`lib/digital-office/feature-gates.ts`](../lib/digital-office/feature-gates.ts)
is the single place that answers "is this feature available for this package?".
Every answer is **derived** from the `pricing.ts` limits — no numbers duplicated.

Locked features are framed positively: „Ab Pro verfügbar", „Mit Pro öffnen",
„Upgrade, wenn Sie mehr digitale Mitarbeiter brauchen". Three honest states:
available, locked, upgrade-required.

## Ask Office panel

A YouTube-Studio-style right-side assistant
([`components/digital-office/AskOffice.tsx`](../components/digital-office/AskOffice.tsx),
engine in [`lib/digital-office/ask-office.ts`](../lib/digital-office/ask-office.ts)).

- **Gating:** Free locked, Starter locked (friendly upgrade CTA), Pro enabled,
  Premium = Ask Office Pro, Business = full.
- **Context-aware:** it knows the current route, company, setup status, active
  workers, package limits and pending approvals/tasks.
- **v1 commands:** summarize the office, show setup gaps, suggest next steps,
  create a task (draft), draft a follow-up instruction, explain package limits,
  suggest pricing-rule changes (as a proposal), suggest offer-template
  improvements, show pending approvals.
- **Safety:** Ask Office never silently sends email, changes prices, connects
  mailboxes, deletes data or performs high-risk actions. Any change is a
  **proposal that requires confirmation**. This foundation persists nothing, so
  confirming records the intent honestly without changing data.

### Language behaviour

- The panel **opens in German** (greeting, quick chips, placeholder).
- Each user message is **language-detected**; the reply follows that language —
  German, Turkish or English. Switching language mid-conversation is followed.
- Unclear language → German (Swiss default).
- Business object names (companies, customers, offer titles, saved template
  names) are **not translated** unless explicitly asked.
- The detected conversation language is held in local component state; persistent
  per-conversation language is a future step (when chat sessions are stored).
- v1 is **deterministic and local** — no external AI provider. The future AI
  provider integration would slot in behind the same `respond()` interface.

## Mailbox configuration foundation

Data model (`MailboxConfig` in `office.ts`): `incomingEmail`, `outgoingEmail`,
`senderName`, `replyToEmail`, `signature`, `mode`
(`draft_only | approval_required | automatic_allowed`), `status`
(`not_connected | configured | connected | error`).

**Honest status, reusing the existing mail foundations:**
- A mailbox is only shown **„Verbunden"** when a real send channel is configured
  (`lib/outreach/send-provider.ts`, env-based — Resend/SMTP).
- Otherwise it is **„Konfiguriert"** (sender known) or **„Nicht verbunden"**.
- Incoming reflects the IMAP foundation (`lib/outreach/inbox-provider.ts`).
- **No fake "connected".** No real email is sent unless a configured, approved
  send channel already exists. Saving mailbox settings is a documented next step.

## Offer / PDF template foundation

Data model (`OfferTemplate` in `office.ts`): `templateName`, `companyLogoUrl`,
`companyAddress`, `contactEmail`, `phone`, `paymentTerms`, `footerNote`,
`taxLabel`, `defaultLanguage`, `defaultOfferIntro`, `defaultOfferFooter`.

The card shows a **generic template preview** and explains: prepare your template
once, then the Offerten-Assistent creates offers from it. The existing offer-PDF
logic (`lib/pdf/offer-pdf.ts`, `/app-shell/offers/[id]/pdf`) is **not changed** —
existing offer PDFs keep working. Saving a custom template is a next step.

## Pricing rule builder foundation

Data model (`PricingRule` / `PricingRuleType` in `office.ts`): rule types
`fixed_price`, `hourly_rate`, `package_price`, `add_on`, `percentage_adjustment`,
`minimum_price`. A rule has `name`, `category`, `type`, `value`, `currency`,
`active`.

The empty state shows **illustrative examples only** (clearly labelled
„Beispiele") — never stored as real tenant data. No Clean24 production prices are
baked in as customer data.

## What is real in this version

- The route, navigation entry, package/worker/gating config and Ask Office UI.
- Real, RLS-scoped reads of the tenant's own data (company name, sender settings,
  leads/prospects/offers/jobs/follow-ups counts) drive the hero, setup progress,
  worker runtime and activity feed.
- Honest mailbox status from the real send/inbox provider configuration.
- Deterministic, multilingual Ask Office answers with a confirm-before-change
  pattern.

## What is NOT real yet (next steps)

- **Persistence** of office setup, custom worker selection, mailbox settings,
  offer templates and pricing rules. Planned approach: start with the existing
  `company_settings.settings` jsonb (RLS, session client — never service-role),
  then a dedicated `office_*` schema (with `Business` multi-office) once the model
  stabilises. No new migration is added in this foundation.
- **No automatic sending** unless a mailbox is connected **and** the owner
  approves. No background/cron jobs.
- **External AI provider** for Ask Office (the local engine is the v1 stand-in).

## Guardrails honoured

No service-role in app routes/actions, no secrets committed, no real customer
data, old Clean24 Lead Autopilot untouched, the protected
`supabase/verification/004_bind_auth_user_to_fake_tenant.sql` untouched and
unstaged, no uncontrolled automatic sending, no false "mailbox connected" claims.
Existing app-shell routes still compile. `lint` + `build` green.
