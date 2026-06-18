/**
 * Auftragsbestätigung (customer-facing order confirmation), SERVER-ONLY.
 *
 * Generated after an offer is accepted and a job exists. Built entirely from
 * existing data (job + source offer scope + customer lead) — no migration, no
 * external asset. Single-page A4 via the shared `pdf-core`. Tenant-aware: the
 * header/company name come from the active company, so the Clean24 tenant
 * produces a Clean24 document.
 */

import {
  BLACK,
  EMERALD,
  GRAY,
  LEFT,
  LINE,
  NAVY,
  RIGHT,
  chf,
  createPdf,
  drawFooter,
  drawHeader,
  wrap,
} from "./pdf-core";

export interface OrderConfirmationItem {
  label: string;
  detail: string | null;
  amountChf: number;
}

export interface OrderConfirmationData {
  companyName: string;
  reference: string;
  createdAt: string; // ISO
  offerReference: string | null;
  customerName: string | null;
  customerContact: string | null;
  customerAddress: string | null;
  serviceLabel: string | null;
  cleaningDate: string | null; // YYYY-MM-DD
  cleaningTime: string | null; // HH:mm or null
  scopeItems: OrderConfirmationItem[];
  netChf: number | null;
  vatRatePct: number | null;
  grossChf: number | null;
}

export function buildOrderConfirmationPdf(
  data: OrderConfirmationData,
): Uint8Array<ArrayBuffer> {
  const doc = createPdf();
  drawHeader(doc, { companyName: data.companyName, docLabel: "Auftragsbestätigung" });

  doc.text(LEFT, 748, 16, 2, "Auftragsbestätigung", NAVY);

  // Meta
  let my = 726;
  const metaRow = (k: string, v: string) => {
    doc.text(LEFT, my, 10, 2, k, NAVY);
    doc.text(LEFT + 88, my, 10, 1, v, BLACK);
    my -= 15;
  };
  metaRow("Referenz", data.reference);
  metaRow("Datum", data.createdAt.slice(0, 10));
  if (data.offerReference) metaRow("Quell-Offerte", data.offerReference);

  // Customer
  my -= 8;
  doc.text(LEFT, my, 10, 2, "Kunde", NAVY);
  doc.text(LEFT + 88, my, 10, 1, data.customerName ?? "Ohne Kundenzuordnung", BLACK);
  my -= 14;
  if (data.customerContact) {
    doc.text(LEFT + 88, my, 9.5, 1, data.customerContact, GRAY);
    my -= 13;
  }
  if (data.customerAddress) {
    doc.text(LEFT + 88, my, 9.5, 1, data.customerAddress, GRAY);
    my -= 13;
  }

  // Eckdaten box
  let y = my - 14;
  doc.text(LEFT, y, 11, 2, "Eckdaten", NAVY);
  y -= 6;
  doc.line(LEFT, y, RIGHT, y, 0.75, LINE);
  y -= 16;
  const fact = (k: string, v: string) => {
    doc.text(LEFT, y, 10, 2, k, NAVY);
    doc.text(LEFT + 130, y, 10, 1, v, BLACK);
    y -= 15;
  };
  fact("Reinigungsdatum", data.cleaningDate ?? "nach Vereinbarung");
  fact("Übergabe", data.cleaningTime ? `${data.cleaningTime} Uhr` : "nach Vereinbarung");
  fact("Objekt / Adresse", data.customerAddress ?? "—");
  if (data.serviceLabel) fact("Leistung", data.serviceLabel);

  // Scope
  y -= 8;
  doc.text(LEFT, y, 11, 2, "Vereinbarter Umfang", NAVY);
  y -= 6;
  doc.line(LEFT, y, RIGHT, y, 0.75, LINE);
  y -= 16;
  const MIN_Y = 210;
  let truncated = 0;
  if (data.scopeItems.length === 0) {
    doc.text(LEFT, y, 10, 1, data.serviceLabel ?? "Gemäss Offerte.", GRAY);
    y -= 16;
  }
  for (let i = 0; i < data.scopeItems.length; i++) {
    if (y < MIN_Y) {
      truncated = data.scopeItems.length - i;
      break;
    }
    const item = data.scopeItems[i];
    doc.text(LEFT + 4, y, 10, 1, `· ${item.label}`, BLACK);
    if (item.detail) {
      y -= 11;
      doc.text(LEFT + 14, y, 8.5, 1, item.detail, GRAY);
    }
    y -= 15;
  }
  if (truncated > 0) {
    doc.text(LEFT + 4, y, 9, 1, `... ${truncated} weitere Position(en) gemäss Offerte.`, GRAY);
    y -= 15;
  }

  // Price summary
  if (data.grossChf !== null) {
    y -= 6;
    doc.line(330, y, RIGHT, y, 0.75, LINE);
    y -= 16;
    const totalRow = (label: string, value: string, bold: boolean) => {
      doc.text(330, y, 10, bold ? 2 : 1, label, bold ? NAVY : GRAY);
      doc.textRight(RIGHT, y, 10, bold ? 2 : 1, `CHF ${value}`, bold ? NAVY : BLACK);
      y -= 15;
    };
    if (data.netChf !== null) totalRow("Zwischensumme (Netto)", chf(data.netChf), false);
    if (data.netChf !== null && data.vatRatePct !== null) {
      totalRow(`MwSt (${data.vatRatePct.toFixed(2)}%)`, chf(data.grossChf - data.netChf), false);
    }
    doc.line(330, y + 12, RIGHT, y + 12, 0.5, LINE);
    totalRow("Vereinbarter Preis", chf(data.grossChf), true);
  }

  // Abgabegarantie
  doc.rect(LEFT, 92, RIGHT - LEFT, 30, [0.93, 0.97, 0.95]);
  doc.text(LEFT + 10, 110, 10, 2, "Abgabegarantie", EMERALD);
  for (const [i, ln] of wrap(
    "Wir reinigen das Objekt fachgerecht. Bei begründeter Beanstandung durch die Abnahmestelle bessern wir kostenlos nach.",
    8.5,
    RIGHT - LEFT - 20,
  ).entries()) {
    doc.text(LEFT + 10, 99 - i * 10, 8.5, 1, ln, GRAY);
  }

  drawFooter(
    doc,
    data.companyName,
    "Bestätigung des erteilten Auftrags. Kein automatischer Versand.",
  );

  return doc.build();
}
