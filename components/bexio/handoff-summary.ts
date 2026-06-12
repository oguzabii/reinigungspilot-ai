/**
 * Pure builder for a copyable bexio handoff summary (v0.3.12). Assembles a
 * Swiss-German plain-text block of the invoice/customer data a human pastes into
 * bexio by hand. PURE: no clock, no I/O, no network — and explicitly NO real
 * bexio API. Reuses the SSR-safe CHF formatter from the offers module.
 */

import { formatChf } from "@/components/offers/offer-status";

export interface HandoffSummaryInput {
  customerName: string | null;
  customerContact: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerRegion: string | null;
  service: string | null;
  location: string | null;
  /** ISO timestamp of the job date (scheduled_for), or null. */
  jobDate: string | null;
  reference: string | null;
  netChf: number | null;
  vatRatePct: number | null;
  grossChf: number | null;
}

function present(value: string | null | undefined): value is string {
  return !!value && value.trim() !== "";
}

function line(label: string, value: string | null): string | null {
  return present(value) ? `${label}: ${value}` : null;
}

export function buildHandoffSummary(i: HandoffSummaryInput): string {
  const contact = [i.customerContact, i.customerEmail, i.customerPhone]
    .filter(present)
    .join(" · ");
  const address = [i.location, i.customerRegion].filter(present).join(", ");

  const net = i.netChf ?? 0;
  const gross = i.grossChf ?? 0;
  const vatRate = i.vatRatePct ?? 0;
  const vatAmount = Math.max(0, gross - net);
  const dateStr = present(i.jobDate) ? i.jobDate.slice(0, 10) : null;

  const lines: Array<string | null> = [
    "bexio-Übergabe – Rechnungsdaten (manuell)",
    "",
    line("Kunde", i.customerName ?? "—"),
    contact ? `Kontakt: ${contact}` : null,
    line("Leistung", i.service),
    line("Ort / Adresse", address || null),
    line("Auftragsdatum", dateStr),
    line("Referenz", i.reference),
    "",
    `Netto: CHF ${formatChf(net)}`,
    `MwSt (${vatRate}%): CHF ${formatChf(vatAmount)}`,
    `Total (Brutto): CHF ${formatChf(gross)}`,
    "",
    "Hinweis: Diese Daten manuell in bexio erfassen. Keine automatische " +
      "Übermittlung, keine API-Verbindung.",
  ];
  return lines.filter((l) => l !== null).join("\n");
}
