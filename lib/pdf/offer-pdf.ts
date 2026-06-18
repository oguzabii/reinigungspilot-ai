/**
 * Clean24-style Offerte PDF (SERVER-ONLY), dependency-free.
 *
 * Matches the official Clean24 Offerte letter layout: logo/header, Kunden-Nr. /
 * Datum / UID block, sender line, customer address, "Offerte OF-…" title,
 * greeting, service intro, an item table (# / Beschreibung / Anzahl / Preis /
 * Total), totals (exkl. MwSt., MwSt. %, Rundungsdifferenz, Total inkl. MwSt.),
 * closing text, signature and the full company footer. Built on the shared
 * `pdf-core` (Helvetica/WinAnsi, single-page A4) — no external asset, no font
 * embed, env-free build. Driven entirely by real offer/customer data + the
 * tenant letterhead `CompanyProfile`; nothing is hardcoded to a sample customer.
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
  measure,
  sanitize,
  wrap,
  type RGB,
} from "./pdf-core";
import type { CompanyProfile } from "./company-profile";
import { footerLine } from "./company-profile";

const HEADER_BG: RGB = [0.95, 0.96, 0.97];

export interface OfferPdfItem {
  label: string;
  detail: string | null;
  amountChf: number;
}

export interface OfferPdfData {
  profile: CompanyProfile;
  reference: string;
  createdAt: string; // ISO
  validUntil: string | null; // YYYY-MM-DD
  /** Customer number, e.g. "K-60572" (derived), or null. */
  customerNr: string | null;
  /** Recipient display name (person or company). */
  recipientName: string | null;
  /** Address lines below the recipient name. */
  addressLines: string[];
  /** Service group / object label, e.g. "Umzugsreinigung 4.5-Zimmer Wohnung". */
  serviceLabel: string | null;
  items: OfferPdfItem[];
  vatRatePct: number;
  totalNetChf: number;
  totalGrossChf: number;
}

/** German date DD.MM.YYYY from an ISO/`YYYY-MM-DD` string. */
function dateCh(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}.${m}.${y}` : iso.slice(0, 10);
}

export function buildOfferPdf(data: OfferPdfData): Uint8Array<ArrayBuffer> {
  const doc = createPdf();
  const p = data.profile;

  // --- Logo / brand (text-based; the leaf mark needs an image we don't embed) -
  // Render "Clean24" with an emerald accent on a trailing "24" when present.
  const brand = p.brandName || p.legalName;
  const m24 = brand.match(/^(.*?)(24)\s*$/);
  if (m24) {
    doc.text(LEFT, 800, 24, 2, m24[1], NAVY);
    doc.text(LEFT + measure(m24[1], 24), 800, 24, 2, m24[2], EMERALD);
  } else {
    doc.text(LEFT, 800, 24, 2, brand, NAVY);
  }
  if (p.tagline) doc.text(LEFT, 786, 8.5, 1, `"${p.tagline}"`, GRAY);

  // --- Meta block (left): Kunden-Nr. / Datum / UID --------------------------
  let my = 740;
  const metaRow = (k: string, v: string) => {
    doc.text(LEFT, my, 8.5, 1, k, GRAY);
    doc.text(LEFT + 64, my, 10, 1, v, BLACK);
    my -= 15;
  };
  if (data.customerNr) metaRow("Kunden-Nr.", data.customerNr);
  metaRow("Datum", dateCh(data.createdAt));
  if (p.uid) metaRow("UID", p.uid);

  // --- Sender line + recipient address (right column) -----------------------
  const addrX = 320;
  const senderLine = [
    p.legalName,
    p.street,
    `${p.zip} ${p.city}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");
  doc.text(addrX, 752, 7.5, 1, senderLine, GRAY);
  doc.line(addrX, 748, RIGHT, 748, 0.5, LINE);

  let ay = 734;
  if (data.recipientName) {
    doc.text(addrX, ay, 11, 1, data.recipientName, BLACK);
    ay -= 15;
  }
  for (const ln of data.addressLines.slice(0, 4)) {
    doc.text(addrX, ay, 11, 1, ln, BLACK);
    ay -= 15;
  }

  // --- Title ----------------------------------------------------------------
  let y = Math.min(my, ay) - 26;
  doc.text(LEFT, y, 17, 2, "Offerte", NAVY);
  doc.text(LEFT + measure("Offerte", 17) + 8, y, 17, 1, data.reference, NAVY);
  y -= 28;

  // --- Greeting + intro -----------------------------------------------------
  const greeting = data.recipientName
    ? `Guten Tag ${data.recipientName}`
    : "Sehr geehrte Damen und Herren";
  doc.text(LEFT, y, 10.5, 1, greeting, BLACK);
  y -= 22;

  const service = data.serviceLabel ?? "Reinigung";
  const paras = [
    `Vielen Dank für Ihre Anfrage betreffend die ${service}.`,
    "Gerne unterbreiten wir Ihnen unser Angebot für eine fachgerechte, gründliche und termingerechte Ausführung inklusive Abgabegarantie.",
    "Unser Ziel ist es, das Objekt in einem einwandfreien, sauberen und abgabebereiten Zustand zu übergeben.",
    "Die Reinigung umfasst je nach Objekt unter anderem Küche, Badezimmer, Wohnräume, Böden, Fenster, Türen und Schränke sowie weitere vereinbarte Bereiche. Die Arbeiten werden zuverlässig und mit hoher Sorgfalt ausgeführt.",
  ];
  for (const para of paras) {
    for (const ln of wrap(para, 10, RIGHT - LEFT)) {
      doc.text(LEFT, y, 10, 1, ln, BLACK);
      y -= 13;
    }
    y -= 5;
  }

  // --- Item table -----------------------------------------------------------
  y -= 4;
  const colNr = LEFT + 4;
  const colDesc = LEFT + 26;
  const colQtyR = 392;
  const colPriceR = 466;
  const colTotalR = RIGHT - 4;

  // Header bar
  doc.rect(LEFT, y - 4, RIGHT - LEFT, 18, HEADER_BG);
  const headY = y + 1;
  doc.text(colNr, headY, 9, 2, "#", NAVY);
  doc.text(colDesc, headY, 9, 2, "Beschreibung", NAVY);
  doc.textRight(colQtyR, headY, 9, 2, "Anzahl", NAVY);
  doc.textRight(colPriceR, headY, 9, 2, "Preis", NAVY);
  doc.textRight(colTotalR, headY, 9, 2, "Total", NAVY);
  y -= 18;

  // Category row (service group)
  doc.text(colDesc, y, 9.5, 2, service, NAVY);
  y -= 4;
  doc.line(LEFT, y, RIGHT, y, 0.5, LINE);
  y -= 16;

  const MIN_Y = 250; // keep room for totals + closing + footer
  let truncated = 0;
  for (let i = 0; i < data.items.length; i++) {
    if (y < MIN_Y) {
      truncated = data.items.length - i;
      break;
    }
    const it = data.items[i];
    doc.text(colNr, y, 10, 1, String(i + 1), BLACK);
    doc.text(colDesc, y, 10, 1, it.label.slice(0, 56), BLACK);
    doc.textRight(colQtyR, y, 10, 1, "1", BLACK);
    doc.textRight(colPriceR, y, 10, 1, chf(it.amountChf), BLACK);
    doc.textRight(colTotalR, y, 10, 1, chf(it.amountChf), BLACK);
    if (it.detail) {
      y -= 11;
      doc.text(colDesc, y, 8, 1, it.detail.slice(0, 80), GRAY);
    }
    y -= 16;
  }
  if (data.items.length === 0) {
    doc.text(colDesc, y, 10, 1, "Keine Positionen.", GRAY);
    y -= 16;
  }
  if (truncated > 0) {
    doc.text(colDesc, y, 9, 1, `... ${truncated} weitere Position(en) nicht dargestellt.`, GRAY);
    y -= 16;
  }

  // --- Totals (Swiss 5-Rappen rounding on the final total) ------------------
  doc.line(280, y + 4, RIGHT, y + 4, 0.5, LINE);
  y -= 12;
  const net = data.totalNetChf;
  const vatAmount = Math.round(net * (data.vatRatePct / 100) * 100) / 100;
  const rawGross = net + vatAmount;
  const roundedGross = Math.round(rawGross * 20) / 20; // nearest 0.05
  const rounding = Math.round((roundedGross - rawGross) * 100) / 100;

  const totalRow = (label: string, value: string, bold: boolean, prefix = "") => {
    doc.text(300, y, bold ? 11 : 9.5, bold ? 2 : 1, label, bold ? NAVY : GRAY);
    doc.textRight(colTotalR, y, bold ? 11 : 9.5, bold ? 2 : 1, `${prefix}${value}`, bold ? NAVY : BLACK);
    y -= bold ? 0 : 14;
  };
  totalRow("Total exkl. MwSt.", chf(net), false);
  totalRow(`${data.vatRatePct.toFixed(1)}%`, chf(vatAmount), false);
  if (Math.abs(rounding) >= 0.005) totalRow("Rundungsdifferenz", chf(rounding), false);
  y -= 6;
  doc.line(280, y + 14, RIGHT, y + 14, 0.75, NAVY);
  totalRow("Total inkl. MwSt.", chf(roundedGross), true, "CHF ");
  y -= 24;

  // --- Closing + signature --------------------------------------------------
  const closing = [
    "Der Name unseres Unternehmens steht für Qualität, Zuverlässigkeit und sorgfältige Arbeit. Dies möchten wir Ihnen gerne bei Ihrer Reinigung unter Beweis stellen.",
    "Vielen Dank, dass Sie uns die Gelegenheit geben, Ihnen ein Angebot unterbreiten zu dürfen.",
  ];
  for (const para of closing) {
    if (y < 150) break;
    for (const ln of wrap(para, 9.5, RIGHT - LEFT)) {
      doc.text(LEFT, y, 9.5, 1, ln, BLACK);
      y -= 12.5;
    }
    y -= 4;
  }
  if (y > 132) {
    doc.text(LEFT, y, 10, 1, "Freundliche Grüsse", BLACK);
    y -= 18;
    if (p.ownerName) {
      doc.text(LEFT, y, 10, 1, p.ownerName, BLACK);
      y -= 12;
    }
    if (p.ownerRole) {
      doc.text(LEFT, y, 9, 1, p.ownerRole, GRAY);
      y -= 12;
    }
    doc.text(LEFT, y, 9, 1, p.legalName, GRAY);
  }

  // --- Footer (full company letterhead) -------------------------------------
  const footer = footerLine(p);
  doc.line(LEFT, 60, RIGHT, 60, 0.5, LINE);
  let fy = 48;
  for (const ln of footer) {
    // Centre the footer lines like the reference.
    const w = measure(sanitize(ln), 7);
    doc.text((595.28 - w) / 2, fy, 7, 1, ln, GRAY);
    fy -= 10;
  }

  return doc.build();
}
