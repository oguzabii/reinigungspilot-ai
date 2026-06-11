# Klarsa Core — Offer PDF & Sending Foundation (v0.3.3)

> **Status: VERIFIED on staging (2026-06-11).** Adds a **protected PDF download**
> for an offer and a **manual send draft** (subject + body to copy and send
> yourself). The PDF loads via the **session client (RLS)**, never the
> service-role client, and only ever renders **the active tenant's** offer. **No
> real email/SMTP/Gmail/Resend, no bexio, no external assets, no real customer
> data.** The PDF is foundation-level; visual polish is deferred.
>
> Staging verification (PDF route + offer data/items/totals rendered, send-draft
> present, RLS read path, no real sending, no real data — user-reported manual
> test): [`clean24-offer-pdf-results.md`](./clean24-offer-pdf-results.md).

Related: [`clean24-offer-draft-foundation.md`](./clean24-offer-draft-foundation.md),
[`clean24-offer-draft-results.md`](./clean24-offer-draft-results.md),
[`security-architecture.md`](./security-architecture.md).

## What it does

- **PDF download** at the protected route **`GET /app-shell/offers/[id]/pdf`**
  (`force-dynamic`). Same guard chain as the offers page: redirect to `/login`
  without a session, to `/app-shell` without an active tenant. The offer is
  loaded with `getOfferById(companyId, id)` — RLS **plus** explicit
  `company_id` + `id` scoping — so a tenant can only ever download its own
  offer. A foreign or unknown id returns **404**, not another tenant's data.
- **Clean Swiss-German A4 layout:** Klarsa wordmark + tenant company name,
  title "Offerte", reference, date, status, "Gültig bis", recipient
  (lead name or "Ohne Lead-Zuordnung"), the line items, and
  Netto / MwSt / Brutto totals, with a draft-notice footer.
- **Manual send draft** under each offer on `/app-shell/offers`: a collapsible
  "Versand-Entwurf (manuell)" with a suggested **subject** and **body** in
  Swiss German, each with a copy button. Clearly labelled *no automatic
  sending* — the user copies the text, sends it from their own mailbox, and
  attaches the downloaded PDF.

## How the PDF is generated (no dependencies, no assets)

`lib/pdf/offer-pdf.ts` hand-writes a valid **PDF 1.4** using the standard
**Helvetica / Helvetica-Bold** fonts (two of the 14 built-in fonts every PDF
reader has) with **WinAnsiEncoding**. There is:

- **no third-party PDF library** (nothing added to `package.json`),
- **no font file or image to embed** (standard fonts, text + vector lines only),
- **no network/runtime asset fetch**.

The content stream is written as **latin1** bytes, which agree with
WinAnsiEncoding across `0xA0–0xFF`, so Swiss-German umlauts (ä ö ü Ä Ö Ü ß)
render correctly without embedding. A small Helvetica width table right-aligns
the amount column. This keeps the **build env-free** and avoids any
serverless/bundling surprises from a binary PDF dependency.

> Foundation scope: single A4 page. A very long item list is truncated with a
> "… weitere Position(en) nicht dargestellt" note rather than spilling onto a
> second page. Multi-page rendering can come with the workflow version.

## Data flow

```
GET /app-shell/offers/[id]/pdf  (route handler, force-dynamic)
  ├─ isSupabaseConfigured? no  → redirect /app-shell
  ├─ session?            none  → redirect /login
  ├─ active tenant?      none  → redirect /app-shell
  ├─ getOfferById(companyId, id)        ← session client, RLS + company scoping
  │     not found → 404 (never another tenant's offer)
  ├─ getCompanySummary(companyId)       ← tenant brand/legal name for the header
  └─ buildOfferPdf({...})  → Response  (application/pdf, inline, no-store)

/app-shell/offers  (offers list)
  └─ per offer: "PDF" link → the route above (new tab)
                OfferSendDraft → buildOfferEmailDraft (pure, client-side copy)
```

## Security model

- **Session client only**; the service-role/admin client is never used. RLS
  gates reads (`can_read_company`), and the route additionally scopes by
  `company_id` + `id`.
- **Tenant isolation:** the PDF route can only ever emit the active tenant's
  own offer; a foreign id yields 404. The send draft is built purely from data
  already shown on the (RLS-filtered) offers page.
- **No sending, no external calls:** the "sending foundation" is copy-only text.
  There is no SMTP, no email API, no webhook, no bexio, no upload. The PDF
  carries an explicit "Entwurf – kein rechtsverbindliches Dokument. Kein
  automatischer Versand." footer.
- **No new migration, no schema change** — reads the existing `offers` /
  `offer_items` columns. Migrations 001–004 are untouched.

## Manual verification checklist (staging, fake data only)

1. Login → `/app-shell/offers` → an offer shows a **PDF** button and a
   **Versand-Entwurf (manuell)** section.
2. Click **PDF** → a PDF opens/downloads showing the company, reference, date,
   status, recipient, line items and Netto/MwSt/Brutto totals; umlauts render.
3. Open the send draft → subject + body are populated in Swiss German; the
   **Kopieren** buttons copy them; no "send" action exists.
4. Edit the offer id in the PDF URL to **another tenant's** offer id → **404**
   (no cross-tenant document).
5. Log out → open the PDF URL directly → redirected to `/login`.
6. As `readonly-a-login@example.test`: the PDF download still works (read is
   allowed); no write is performed by viewing or drafting.

## NOT in scope (v0.3.3)

- Real email sending (SMTP/Gmail/Resend), scheduled sends, or tracking.
- bexio handover or any external integration.
- Multi-page PDFs, logos/images, or per-item quantity × unit price.
- Storing the generated PDF or the draft text (both are produced on demand).

## Next step

Two candidate directions for **v0.3.4** (pick when prioritising):

- **Offer sending integration** — wire a real, gated send path (still
  staging-only, behind the security gate), or
- **Job creation from an accepted offer** — when an offer reaches *accepted*,
  create a `jobs` row (ops domain) from it.

Real customer data remains gated behind verified backup/restore, strict
staging/production separation, and validated auth/RLS/security.
