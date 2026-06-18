/**
 * Partner-Einsatzbestätigung (internal partner assignment), SERVER-ONLY.
 *
 * The internal counterpart to the customer Auftragsbestätigung: it tells an
 * assigned partner/team what to do, where and when — WITHOUT exposing the
 * customer-facing price as the headline, and with fixed partner instructions
 * (communication runs through the company, no own offers to the customer, etc.).
 * Built from existing data only — no migration, no external asset. Single-page
 * A4 via the shared `pdf-core`. Tenant-aware.
 */

import {
  BLACK,
  GRAY,
  LEFT,
  LINE,
  NAVY,
  RIGHT,
  createPdf,
  drawFooter,
  drawHeader,
  wrap,
} from "./pdf-core";

export interface PartnerAssignmentScopeItem {
  label: string;
  detail: string | null;
}

export interface PartnerAssignmentData {
  companyName: string;
  reference: string;
  createdAt: string; // ISO
  jobTitle: string;
  offerReference: string | null;
  customerName: string | null;
  customerContact: string | null;
  customerAddress: string | null;
  serviceLabel: string | null;
  cleaningDate: string | null; // YYYY-MM-DD
  cleaningTime: string | null; // HH:mm or null
  team: string | null;
  statusLabel: string;
  scopeItems: PartnerAssignmentScopeItem[];
}

export function buildPartnerAssignmentPdf(
  data: PartnerAssignmentData,
): Uint8Array<ArrayBuffer> {
  const doc = createPdf();
  drawHeader(doc, {
    companyName: data.companyName,
    docLabel: "Partner-Einsatz",
    accent: NAVY,
  });

  doc.text(LEFT, 748, 16, 2, "Partner-Einsatzbestätigung", NAVY);
  doc.text(LEFT, 734, 8.5, 1, "INTERN – nicht an den Kunden weitergeben", GRAY);

  // Meta
  let my = 712;
  const metaRow = (k: string, v: string) => {
    doc.text(LEFT, my, 10, 2, k, NAVY);
    doc.text(LEFT + 88, my, 10, 1, v, BLACK);
    my -= 15;
  };
  metaRow("Referenz", data.reference);
  metaRow("Datum", data.createdAt.slice(0, 10));
  metaRow("Auftrag", data.jobTitle);
  if (data.offerReference) metaRow("Quell-Offerte", data.offerReference);

  // Object / customer contact
  let y = my - 10;
  doc.text(LEFT, y, 11, 2, "Objekt / Ansprechpartner", NAVY);
  y -= 6;
  doc.line(LEFT, y, RIGHT, y, 0.75, LINE);
  y -= 16;
  const fact = (k: string, v: string) => {
    doc.text(LEFT, y, 10, 2, k, NAVY);
    doc.text(LEFT + 130, y, 10, 1, v, BLACK);
    y -= 15;
  };
  fact("Kunde / Objekt", data.customerName ?? "—");
  if (data.customerContact) fact("Kontakt", data.customerContact);
  fact("Adresse", data.customerAddress ?? "—");
  fact("Reinigungsdatum", data.cleaningDate ?? "nach Vereinbarung");
  fact("Übergabe", data.cleaningTime ? `${data.cleaningTime} Uhr` : "nach Vereinbarung");
  if (data.serviceLabel) fact("Leistung", data.serviceLabel);
  fact("Partner / Team", data.team ?? "noch nicht zugeteilt");
  fact("Status", data.statusLabel);

  // Scope (no customer pricing — internal scope only)
  y -= 8;
  doc.text(LEFT, y, 11, 2, "Auszuführender Umfang", NAVY);
  y -= 6;
  doc.line(LEFT, y, RIGHT, y, 0.75, LINE);
  y -= 16;
  const MIN_Y = 200;
  let truncated = 0;
  if (data.scopeItems.length === 0) {
    doc.text(LEFT, y, 10, 1, data.serviceLabel ?? "Gemäss Auftrag.", GRAY);
    y -= 15;
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
    doc.text(LEFT + 4, y, 9, 1, `... ${truncated} weitere Position(en) gemäss Auftrag.`, GRAY);
  }

  // Partner instructions box (fixed)
  const boxTop = 168;
  doc.rect(LEFT, 78, RIGHT - LEFT, boxTop - 78, [0.96, 0.97, 0.99]);
  doc.text(LEFT + 10, boxTop - 16, 10.5, 2, "Hinweise für den Partner", NAVY);
  const instructions = [
    `Kundenkommunikation läuft ausschliesslich über ${data.companyName}.`,
    "Keine eigenen Angebote an den Kunden.",
    `Bei Unklarheiten zuerst ${data.companyName} kontaktieren.`,
    "Vorher-/Nachher-Fotos werden empfohlen.",
  ];
  let iy = boxTop - 32;
  for (const ins of instructions) {
    const lines = wrap(`•  ${ins}`, 9, RIGHT - LEFT - 24);
    for (const [i, ln] of lines.entries()) {
      doc.text(LEFT + 12, iy, 9, 1, i === 0 ? ln : `   ${ln}`, BLACK);
      iy -= 12;
    }
  }

  drawFooter(
    doc,
    data.companyName,
    "Internes Einsatzdokument. Kein automatischer Versand an Dritte.",
  );

  return doc.build();
}
