# Digital Office — Ask Office Chat (vNext, follow-up)

> Follow-up to [`digital-office-builder-foundation.md`](./digital-office-builder-foundation.md).
> This step makes Ask Office a real, context-aware chat and frames Digital Office
> Builder as a **separate product path** on the Klarsa platform.

## Separate product, not a Klarsa module

Digital Office Builder is developed on the `digital-office-builder-foundation`
branch and is **deliberately kept separate from Klarsa `master`**. It must not be
merged into `master`, and the existing Klarsa product stays intact.

- Klarsa remains the **platform shell** (auth, tenant, RLS, navigation) for now.
- The route stays `/app-shell/digital-office`, but the page is branded as a
  standalone product: headline **„Digital Office Builder"**, value proposition
  **„Bauen Sie Ihr digitales Büro mit KI-Mitarbeitern."**, positioned as an
  *„Eigenständiges Produkt · läuft auf der Klarsa-Plattform"*.
- No Klarsa pages are deleted or changed in their behaviour.

## Ask Office is a context-aware chat

Ask Office is a YouTube-Studio-style right-side panel that holds a real
conversation, not a fixed FAQ.

- **Local chat history** is kept for the open panel session.
- Each turn is sent to a server action
  ([`app/app-shell/digital-office/actions.ts`](../app/app-shell/digital-office/actions.ts) →
  `askOfficeChat`), which re-derives the **safe, server-trusted** office context
  (never trusting a client-supplied context, never service-role) and returns the
  reply.
- The reply answers the user's **actual message**, drawing on the office context.
  The **context facets used** are shown as subtle chips under the answer
  („Kontext: Einrichtung · Mailbox").
- A typing indicator, message bubbles and quick-suggestion chips make it feel
  conversational; chips remain available but responses are not canned templates.

### Placement (vNext standalone shell)

Ask Office is the **central assistant** of the standalone surface, not a hidden
widget ([`AskOfficeDock`](../components/digital-office/AskOffice.tsx)):

- **Desktop:** an **always-visible, sticky docked panel** in the right column
  („Frag Ihr digitales Büro").
- **Mobile:** a prominent in-flow section plus a sticky bottom shortcut that
  jumps to it.
- The header shows the **mode honestly** („Lokaler Modus" / „KI-Modus") and the
  reminder **„Änderungen brauchen Freigabe"**.
- Locked state stays for Free/Starter (friendly upgrade); Pro+ enabled.

### Architecture

| File | Role |
|------|------|
| [`lib/digital-office/ask-office-context.ts`](../lib/digital-office/ask-office-context.ts) | Defines the **safe context object** + `buildAskOfficeContext()`. |
| [`lib/digital-office/ask-office.ts`](../lib/digital-office/ask-office.ts) | The **local (deterministic) engine** — conversational, context-aware fallback + structured action-proposal detector. |
| [`lib/digital-office/ask-office-chat.ts`](../lib/digital-office/ask-office-chat.ts) | The **provider abstraction** (server-only): `local` vs `ai` mode, `generateAskOfficeReply()`. |
| [`lib/digital-office/office-data.ts`](../lib/digital-office/office-data.ts) | Server loader that reads RLS data and builds the view + context (shared by page + action). |
| [`app/app-shell/digital-office/actions.ts`](../app/app-shell/digital-office/actions.ts) | The `askOfficeChat` server action (auth, gating, read-only). |
| [`components/digital-office/AskOffice.tsx`](../components/digital-office/AskOffice.tsx) | The client panel (history, bubbles, chips, mode badge, proposals). |

## Fallback mode vs. future AI provider mode

There are two honest modes; the panel header shows which one is active.

- **`local` (default):** the deterministic, context-aware engine. No external
  call. The header says **„Lokaler Modus · kontextbezogen"**. We do **not** claim
  it is full AI.
- **`ai` (opt-in):** an OpenAI-compatible chat completion, used **only** when the
  owner sets env (never in the repo): `ASK_OFFICE_AI_API_KEY` (+ optional
  `ASK_OFFICE_AI_BASE_URL`, `ASK_OFFICE_AI_MODEL`, `ASK_OFFICE_AI_PROVIDER`). The
  model writes the prose; the local detector still produces the structured,
  approval-required action proposal. The header says **„KI-Modus · <provider>"**.

The key is read lazily server-side, **never logged, never sent to the client**.
On any AI error/timeout the action **falls back to local** (status `fallback`) —
it never throws. If a provider is configured later, the same interface yields
real AI replies with no further UI changes.

> This mirrors the existing `lib/outreach/send-provider.ts` pattern: a real,
> env-gated integration that stays inert (and honest) until the owner configures it.

## Language behaviour

- The panel **opens in German** (greeting, quick chips, placeholder).
- Each user message is **language-detected**; the reply uses that language —
  German, Turkish or English. Switching language mid-conversation is followed.
- Unclear language → German (Swiss default).
- Business object names (companies, customers, offer titles, template names) are
  **not translated**.

Examples:
- *„3.5 Zimmer fiyatını 890 yap"* → Turkish reply + a pricing-change proposal card
  („3.5 Zimmer → CHF 890", Onay gerekli).
- *„Fasse mein Büro zusammen"* → German summary.
- *„What is missing before launch?"* → English list of setup gaps.

## Approval-only action pattern

Ask Office may **propose** actions but never executes them silently. A proposal
renders as a card with a clear label — **„Entwurf / Vorschlag · Freigabe nötig"**
(localized) — and Confirm / Cancel buttons.

This foundation **persists nothing**, so confirming records the intent honestly
(„Vorgemerkt — die Ausführung folgt im nächsten Schritt. Es wurde nichts geändert
oder gesendet.") without changing data. When persistence and execution land, the
same approval gate stays in front of every change.

## Safety boundaries

- No service-role in routes/actions; the action uses the session client via RLS
  reads only and **writes nothing**.
- No secrets in the repo; the AI key is env-only, lazy, never logged/returned.
- The context passed to any model is the **safe, tenant-scoped** object only — no
  credentials, no raw env, no service-role data.
- No uncontrolled automatic email sending; no destructive actions without
  confirmation.
- No false claims: mailbox shows „connected" only with a real send channel; the
  assistant shows „Lokaler Modus" when no AI provider is configured.
- Old Clean24 Lead Autopilot is untouched; the protected
  `supabase/verification/004_…sql` is untouched and unstaged; no new migration.

## Next steps

- Persist office setup / mailbox / template / pricing rules (start with the
  existing `company_settings.settings` jsonb, session-client/RLS).
- Wire confirmed proposals to real (approval-gated) writes.
- Optionally persist the per-conversation language and chat history.
