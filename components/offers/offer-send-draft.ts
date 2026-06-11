/**
 * Builds a **manual** Swiss-German e-mail draft (subject + body) for an offer.
 *
 * This is a copy-and-paste aid only. Klarsa does NOT send anything: no SMTP,
 * no Gmail/Resend, no bexio. The user copies the text and sends it themselves
 * from their own mailbox, attaching the downloaded PDF.
 */

import { formatChf } from "@/components/offers/offer-status";

export interface OfferDraftInput {
  reference: string;
  leadName: string | null;
  validUntil: string | null;
  totalGrossChf: number;
  companyName: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
}

export function buildOfferEmailDraft(input: OfferDraftInput): EmailDraft {
  const subject = `Offerte ${input.reference}`;

  const greeting = input.leadName
    ? `Sehr geehrte Damen und Herren von ${input.leadName}`
    : "Sehr geehrte Damen und Herren";

  const lines = [
    `${greeting},`,
    "",
    `vielen Dank für Ihr Interesse. Gerne unterbreiten wir Ihnen unsere Offerte ${input.reference}.`,
    "",
    `Gesamtbetrag inkl. MwSt: CHF ${formatChf(input.totalGrossChf)}`,
  ];

  if (input.validUntil) {
    lines.push(`Gültig bis: ${input.validUntil}`);
  }

  lines.push(
    "",
    "Die detaillierte Offerte finden Sie im beigefügten PDF.",
    "",
    "Bei Fragen stehen wir Ihnen gerne zur Verfügung.",
    "",
    "Freundliche Grüsse",
    input.companyName,
  );

  return { subject, body: lines.join("\n") };
}
