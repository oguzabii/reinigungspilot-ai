/**
 * Shared "modern card" layout helpers for the Clean24 customer/partner
 * documents (Auftragsbestätigung, Partner-Einsatzbestätigung). SERVER-SAFE,
 * dependency-free — built on `pdf-core` primitives (text, rounded rects,
 * circles). Approximates the reference design's gradients with solid navy/blue
 * fills (no image/shading needed), so the build stays env-free and asset-free.
 */

import {
  type PdfDoc,
  type RGB,
  EMERALD,
  GRAY,
  measure,
  sanitize,
  wrap,
} from "./pdf-core";
import { footerLine, type CompanyProfile } from "./company-profile";

export const CARD_NAVY: RGB = [0.08, 0.16, 0.30];
export const CARD_NAVY_SOFT: RGB = [0.16, 0.24, 0.40];
export const CARD_BG: RGB = [0.95, 0.97, 0.99];
export const CARD_BORDER: RGB = [0.86, 0.90, 0.95];
export const WHITE: RGB = [1, 1, 1];
export const LIGHT_BLUE: RGB = [0.74, 0.82, 0.95];
export const DARK_TEXT: RGB = [0.12, 0.18, 0.32];

const PAGE_W = 595.28;
export const DOC_LEFT = 40;
export const DOC_RIGHT = 555;

/** Truncate a string to fit `maxW` points at `size` (latin1-safe ellipsis). */
function fit(s: string, size: number, maxW: number): string {
  let t = sanitize(s);
  if (measure(t, size) <= maxW) return t;
  while (t.length > 1 && measure(`${t}...`, size) > maxW) t = t.slice(0, -1);
  return `${t}...`;
}

export interface MiniCard {
  label: string;
  value: string;
  /** Optional small third line (e.g. "inkl. MwSt." / "Uhrzeit offen"). */
  note?: string;
}

/**
 * Draw the navy header card with brand, document label, subtitles and four
 * mini-cards. Returns the y just below the header (where the body starts).
 */
export function drawCardHeader(
  doc: PdfDoc,
  opts: {
    brand: string;
    docLabel: string;
    subtitle: string;
    refLine: string;
    minis: MiniCard[];
  },
): number {
  const x = DOC_LEFT;
  const w = DOC_RIGHT - DOC_LEFT;
  const top = 816;
  const h = 120;
  const bottom = top - h;
  doc.roundedRect(x, bottom, w, h, 14, CARD_NAVY);

  doc.text(x + 18, top - 30, 22, 2, opts.brand, WHITE);
  doc.text(x + 18, top - 44, 8, 1, opts.subtitle, LIGHT_BLUE);
  doc.textRight(DOC_RIGHT - 18, top - 30, 17, 2, opts.docLabel, WHITE);
  for (const [i, ln] of wrap(opts.refLine, 7.5, 220).slice(0, 2).entries()) {
    doc.textRight(DOC_RIGHT - 18, top - 44 - i * 10, 7.5, 1, ln, LIGHT_BLUE);
  }

  // Mini-card grid (4 across).
  const gx = x + 18;
  const gw = w - 36;
  const gap = 8;
  const n = Math.min(4, opts.minis.length);
  const cw = (gw - gap * (n - 1)) / Math.max(1, n);
  const cardTop = top - 60;
  const cardH = 46;
  for (let i = 0; i < n; i++) {
    const cx = gx + i * (cw + gap);
    doc.roundedRect(cx, cardTop - cardH, cw, cardH, 8, CARD_NAVY_SOFT);
    const m = opts.minis[i];
    doc.text(cx + 9, cardTop - 15, 6.5, 2, m.label.toUpperCase(), LIGHT_BLUE);
    doc.text(cx + 9, cardTop - 28, 10, 2, fit(m.value, 10, cw - 16), WHITE);
    if (m.note) doc.text(cx + 9, cardTop - 39, 6.5, 1, fit(m.note, 6.5, cw - 16), LIGHT_BLUE);
  }

  return bottom - 22;
}

/**
 * Light info card with an uppercase label and content lines (first line bold).
 * Fixed height; long content is truncated to fit the card width.
 */
export function drawInfoCard(
  doc: PdfDoc,
  x: number,
  yTop: number,
  w: number,
  h: number,
  label: string,
  lines: string[],
): void {
  doc.roundedRect(x, yTop - h, w, h, 8, CARD_BG);
  doc.roundedRectStroke(x, yTop - h, w, h, 8, 0.6, CARD_BORDER);
  doc.text(x + 10, yTop - 15, 7, 2, label.toUpperCase(), GRAY);
  let ly = yTop - 29;
  const maxLines = Math.max(1, Math.floor((h - 22) / 11));
  let rendered = 0;
  for (const [i, raw] of lines.entries()) {
    const size = i === 0 ? 9.5 : 8.5;
    const font: 1 | 2 = i === 0 ? 2 : 1;
    const color = i === 0 ? DARK_TEXT : GRAY;
    for (const sub of wrap(raw, size, w - 20)) {
      if (rendered >= maxLines) return;
      doc.text(x + 10, ly, size, font, sub, color);
      ly -= i === 0 ? 12 : 11;
      rendered++;
    }
  }
}

export interface ChecklistItem {
  label: string;
  detail: string | null;
}

/**
 * Two-column checklist with emerald check circles. Returns the y below it.
 */
export function drawChecklist(
  doc: PdfDoc,
  x: number,
  yTop: number,
  colW: number,
  items: ChecklistItem[],
): number {
  const gap = 12;
  const rowH = 40;
  const cols = 2;
  const cw = (colW - gap) / cols;
  const shown = items.slice(0, 8);
  let maxRow = 0;
  shown.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    maxRow = Math.max(maxRow, row);
    const cx = x + col * (cw + gap);
    const cyTop = yTop - row * rowH;
    doc.roundedRect(cx, cyTop - (rowH - 8), cw, rowH - 8, 7, CARD_BG);
    doc.roundedRectStroke(cx, cyTop - (rowH - 8), cw, rowH - 8, 7, 0.6, CARD_BORDER);
    // Emerald check circle + white tick.
    const ccx = cx + 16;
    const ccy = cyTop - 16;
    doc.circle(ccx, ccy, 7, EMERALD);
    doc.line(ccx - 3, ccy - 0.5, ccx - 0.8, ccy - 3, 1.2, WHITE);
    doc.line(ccx - 0.8, ccy - 3, ccx + 3.4, ccy + 2.6, 1.2, WHITE);
    doc.text(cx + 30, cyTop - 13, 9, 2, fit(it.label, 9, cw - 38), DARK_TEXT);
    if (it.detail) doc.text(cx + 30, cyTop - 24, 7.5, 1, fit(it.detail, 7.5, cw - 38), GRAY);
  });
  return yTop - (maxRow + 1) * rowH;
}

/** Dark navy card with a white title + wrapped white body (e.g. Abgabegarantie). */
export function drawDarkCard(
  doc: PdfDoc,
  x: number,
  yTop: number,
  w: number,
  title: string,
  body: string,
): number {
  const lines = wrap(body, 8.5, w - 24);
  const h = 30 + lines.length * 11 + 8;
  doc.roundedRect(x, yTop - h, w, h, 10, CARD_NAVY);
  doc.text(x + 14, yTop - 22, 12, 2, title, WHITE);
  let ly = yTop - 40;
  for (const ln of lines) {
    doc.text(x + 14, ly, 8.5, 1, ln, LIGHT_BLUE);
    ly -= 11;
  }
  return yTop - h;
}

/** Light card with a title + bullet lines (e.g. Ausführung / Wichtige Hinweise). */
export function drawBulletCard(
  doc: PdfDoc,
  x: number,
  yTop: number,
  w: number,
  title: string,
  bullets: string[],
): number {
  const wrapped: string[][] = bullets.map((b) => wrap(b, 8.5, w - 30));
  const totalLines = wrapped.reduce((s, ls) => s + ls.length, 0);
  const h = 26 + totalLines * 11 + 10;
  doc.roundedRect(x, yTop - h, w, h, 10, CARD_BG);
  doc.roundedRectStroke(x, yTop - h, w, h, 10, 0.6, CARD_BORDER);
  doc.text(x + 14, yTop - 20, 11, 2, title, DARK_TEXT);
  let ly = yTop - 36;
  for (const ls of wrapped) {
    for (const [i, ln] of ls.entries()) {
      if (i === 0) doc.circle(x + 15.5, ly + 3, 1.5, EMERALD); // bullet dot
      doc.text(x + 22, ly, 8.5, 1, ln, GRAY);
      ly -= 11;
    }
  }
  return yTop - h;
}

/** Centered company-letterhead footer at the bottom of the page. */
export function drawCardFooter(doc: PdfDoc, profile: CompanyProfile): void {
  doc.line(DOC_LEFT, 56, DOC_RIGHT, 56, 0.5, CARD_BORDER);
  let fy = 44;
  for (const ln of footerLine(profile)) {
    const w = measure(sanitize(ln), 7);
    doc.text((PAGE_W - w) / 2, fy, 7, 1, ln, GRAY);
    fy -= 10;
  }
}
