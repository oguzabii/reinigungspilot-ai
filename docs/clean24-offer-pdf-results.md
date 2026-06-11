# Klarsa Core — Offer PDF Staging Results

> **Status: VERIFIED (Offer PDF on staging).** A logged-in Clean24 user opened
> the protected offer PDF route and confirmed the offer data, line items and
> totals render; the manual send-draft section is present. The PDF loads via the
> **session client (RLS)**. **No real email sending, no real customer data, no
> committed credentials.**

| | |
| --- | --- |
| **Date** | 2026-06-11 |
| **Environment** | local `next dev` + `klarsa-staging` (Supabase) |
| **Method** | Manual: log in, open `/app-shell/offers/[id]/pdf`, review the rendered PDF + the offer's send draft |
| **Reported by** | User |

> **Provenance / honesty note:** recorded from the **user's manual test**, as
> reported. It was **not** independently observed or automated from this
> repository, and this repo holds **no connection** to the staging project (no
> URL, keys, or service-role access). The local `.env.local` (staging values)
> lives only on the user's machine and is git-ignored. This document records a
> reported outcome.

## Result

| Step / check | Outcome |
| --- | --- |
| `/app-shell/offers/[id]/pdf` opens after login (protected route) | ✅ |
| PDF renders the offer data (company, reference, date, status, recipient) | ✅ |
| Line items appear | ✅ |
| Subtotal / VAT / total appear (Netto / MwSt / Brutto) | ✅ |
| Manual send-draft section present on the offer | ✅ (copy-only) |
| Tenant | ✅ **Clean24** (founder tenant) |
| Session-client / RLS read path | ✅ confirmed |
| Real email sending | ✅ none — copy-only draft |
| Real customer data used | ✅ none — staging test entries only |

The PDF is generated server-side with the **dependency-free** generator
(`lib/pdf/offer-pdf.ts`, standard Helvetica + WinAnsiEncoding, no external
asset), loaded through the **session client** with RLS plus explicit
`company_id` + `id` scoping. The route runs `force-dynamic`, so the build stays
env-free. The "sending foundation" is a manual subject + body to copy — there is
no SMTP, no email API, no bexio.

> **Design note (deferred):** the PDF is **foundation-level** by design. Visual
> polish — typography, spacing, a real letterhead/branding, multi-page support,
> per-item quantity × unit price — is intentionally deferred to a later
> iteration. This verification confirms the **data path and structure** work,
> not the final visual design.

## Safety confirmations

- ✅ **No real email sending.** The send draft is copy-and-paste text only; no
  SMTP, no Gmail/Resend, no bexio, no webhook, no `fetch`.
- ✅ **No real customer data.** The offer was staging test data typed by the
  user; no real customers, references or amounts.
- ✅ **No credentials recorded.** This document (and the repository) contain no
  Supabase URL, anon key, service-role key, project ref, password, or JWT.
- ✅ **Tenant isolation.** The PDF route only ever emits the active tenant's own
  offer (RLS + `company_id`/`id` scoping; a foreign id returns 404).
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Offer Engine inside
  Klarsa Core; the separate legacy system remains untouched.

## What this verifies

- The protected PDF route, tenant scoping and the dependency-free generator work
  end-to-end on real Supabase: offer data, line items and totals render.
- The manual send-draft foundation is present and is copy-only (no sending).

## What this does NOT mean

- The PDF visual design is **not** final — polish is deferred (see the design
  note above).
- No real customer data is approved or present. The hard rule **"No Security =
  No Customer Data"** still applies — real data only after backup/restore is set
  up **and tested**, **staging and production are strictly separated**, and
  auth + RLS + security are validated
  (see [`security-architecture.md`](./security-architecture.md)).

## Next step

**v0.3.4 — Job creation from an accepted offer** (create a `jobs` row when an
offer reaches *accepted*, ops domain) **or Offer PDF polish** (letterhead,
typography, layout). Still manual, RLS-scoped, no real customer data.
