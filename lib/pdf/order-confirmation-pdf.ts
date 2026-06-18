/**
 * Auftragsbestätigung (customer order confirmation), SERVER-ONLY.
 *
 * Modern card design matching the Clean24 reference: navy header card with four
 * mini-cards, a left column (Bestätigung & Projektdetails + KUNDE/OBJEKT/TERMINE/
 * HINWEIS cards + Leistungsumfang checklist), a right column (Preisübersicht +
 * Abgabegarantie), and the company footer. Built from existing data only (job +
 * source offer scope + customer lead) — no migration, no external asset.
 * Single-page A4 via the shared `pdf-core` + `clean24-doc` helpers. Tenant-aware
 * letterhead via `CompanyProfile`.
 */

import { chf, createPdf, wrap, GRAY } from "./pdf-core";
import {
  CARD_BG,
  CARD_BORDER,
  DARK_TEXT,
  DOC_LEFT,
  DOC_RIGHT,
  drawCardFooter,
  drawCardHeader,
  drawChecklist,
  drawDarkCard,
  drawInfoCard,
} from "./clean24-doc";
import type { CompanyProfile } from "./company-profile";

export interface OrderConfirmationItem {
  label: string;
  detail: string | null;
  amountChf: number;
}

export interface OrderConfirmationData {
  profile: CompanyProfile;
  reference: string;
  createdAt: string; // ISO
  offerReference: string | null;
  customerName: string | null;
  customerContact: string | null;
  customerAddress: string | null;
  serviceLabel: string | null;
  cleaningDate: string | null; // YYYY-MM-DD
  handoverDate: string | null; // YYYY-MM-DD
  cleaningTime: string | null; // HH:mm or null
  scopeItems: OrderConfirmationItem[];
  netChf: number | null;
  vatRatePct: number | null;
  grossChf: number | null;
}

function dateCh(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}.${m}.${y}` : iso.slice(0, 10);
}

export function buildOrderConfirmationPdf(
  data: OrderConfirmationData,
): Uint8Array<ArrayBuffer> {
  const doc = createPdf();
  const p = data.profile;
  const reinigung = dateCh(data.cleaningDate) ?? "n. Vereinbarung";
  const abgabe = dateCh(data.handoverDate) ?? dateCh(data.cleaningDate) ?? "n. Vereinbarung";
  const recipient = data.customerContact ?? data.customerName ?? "Kunde";
  const service = data.serviceLabel ?? "Reinigung inkl. Abgabegarantie";

  // Price: Swiss 5-Rappen rounding on the final total, consistent with the
  // Offerte PDF. Derive VAT from the net (not gross-net) so the breakdown and
  // the Rundungsdifferenz read the same as the offer letter.
  const net = data.netChf;
  const vatPct = data.vatRatePct ?? 8.1;
  let displayGross: number | null = data.grossChf;
  let vatAmount = 0;
  let rounding = 0;
  if (net !== null) {
    vatAmount = Math.round(net * (vatPct / 100) * 100) / 100;
    const rawGross = net + vatAmount;
    displayGross = Math.round(rawGross * 20) / 20;
    rounding = Math.round((displayGross - rawGross) * 100) / 100;
  }

  const bodyTop = drawCardHeader(doc, {
    brand: p.brandName || p.legalName,
    docLabel: "Auftragsbestätigung",
    subtitle: "Premium Reinigungsservice mit Abgabegarantie",
    refLine: data.offerReference
      ? `Verbindliche Bestätigung zur angenommenen Offerte ${data.offerReference}`
      : "Verbindliche Auftragsbestätigung",
    minis: [
      { label: "Kunde", value: recipient },
      { label: "Reinigung", value: reinigung },
      { label: "Abgabe", value: abgabe },
      {
        label: "Preis",
        value: displayGross !== null ? `CHF ${chf(displayGross)}` : "—",
        note: "inkl. MwSt.",
      },
    ],
  });

  // -------- Left column --------
  const lx = DOC_LEFT;
  const lw = 320;
  let ly = bodyTop;
  doc.text(lx, ly, 13, 2, "Bestätigung & Projektdetails", DARK_TEXT);
  ly -= 18;
  const intro = `Hiermit bestätigen wir Ihnen die Durchführung der ${service} inklusive Abgabegarantie, gemäss der von Ihnen angenommenen Offerte. Der Auftrag wird fachgerecht, sorgfältig und termingerecht ausgeführt.`;
  for (const line of wrap(intro, 9, lw)) {
    doc.text(lx, ly, 9, 1, line, GRAY);
    ly -= 12;
  }
  ly -= 8;

  // 2x2 info cards
  const cgap = 10;
  const cw = (lw - cgap) / 2;
  const chH = 58;
  const addrLines = (data.customerAddress ?? "")
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  drawInfoCard(doc, lx, ly, cw, chH, "Kunde", [recipient, ...addrLines]);
  drawInfoCard(doc, lx + cw + cgap, ly, cw, chH, "Objekt", [service, "inkl. Abgabegarantie"]);
  ly -= chH + cgap;
  drawInfoCard(doc, lx, ly, cw, chH, "Termine", [`Reinigung: ${reinigung}`, `Abgabe: ${abgabe}`]);
  drawInfoCard(
    doc,
    lx + cw + cgap,
    ly,
    cw,
    chH,
    "Hinweis",
    data.cleaningTime
      ? [`${data.cleaningTime} Uhr`, "Übergabe-Zeit vereinbart"]
      : ["Uhrzeit der Übergabe", "noch nicht bekannt"],
  );
  ly -= chH + 16;

  doc.text(lx, ly, 13, 2, "Vereinbarter Leistungsumfang", DARK_TEXT);
  ly -= 16;
  const checklistItems =
    data.scopeItems.length > 0
      ? data.scopeItems.map((it) => ({ label: it.label, detail: it.detail }))
      : [{ label: service, detail: "gemäss Offerte" }];
  drawChecklist(doc, lx, ly, lw, checklistItems);

  // -------- Right column --------
  const rx = 374;
  const rw = DOC_RIGHT - rx;
  let ry = bodyTop;

  // Price card
  if (displayGross !== null) {
    const rows: Array<[string, string]> = [];
    if (net !== null) {
      rows.push(["Total exkl. MwSt.", `CHF ${chf(net)}`]);
      rows.push([`MwSt. ${vatPct.toFixed(1)}%`, `CHF ${chf(vatAmount)}`]);
      if (Math.abs(rounding) >= 0.005) rows.push(["Rundungsdifferenz", `CHF ${chf(rounding)}`]);
    }
    const ph = 70 + rows.length * 14;
    doc.roundedRect(rx, ry - ph, rw, ph, 10, CARD_BG);
    doc.roundedRectStroke(rx, ry - ph, rw, ph, 10, 0.6, CARD_BORDER);
    doc.text(rx + 14, ry - 18, 7.5, 2, "PREISÜBERSICHT", GRAY);
    doc.text(rx + 14, ry - 40, 20, 2, `CHF ${chf(displayGross)}`, DARK_TEXT);
    doc.text(rx + 14, ry - 53, 8.5, 1, "Total inkl. MwSt.", GRAY);
    if (rows.length > 0) {
      doc.line(rx + 14, ry - 62, DOC_RIGHT - 14, ry - 62, 0.5, CARD_BORDER);
      let py = ry - 76;
      for (const [k, v] of rows) {
        doc.text(rx + 14, py, 9, 1, k, GRAY);
        doc.textRight(DOC_RIGHT - 14, py, 9, 2, v, DARK_TEXT);
        py -= 14;
      }
    }
    ry -= ph + 14;
  }

  // Abgabegarantie dark card
  drawDarkCard(
    doc,
    rx,
    ry,
    rw,
    "Abgabegarantie",
    "Die Reinigung wird in abgabebereitem Zustand ausgeführt. Vereinbarte Bereiche werden vollständig und mit hoher Sorgfalt gereinigt.",
  );

  drawCardFooter(doc, p);
  return doc.build();
}
