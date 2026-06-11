/**
 * Minimal, dependency-free PDF builder for an offer (SERVER-ONLY).
 *
 * Why hand-rolled: the offer PDF must work with **no external assets, no fonts
 * to embed, no third-party library, and an env-free build**. We emit a valid
 * PDF 1.4 using the standard Helvetica / Helvetica-Bold fonts (one of the 14
 * built-in fonts every reader has) and WinAnsiEncoding. The content stream is
 * written as latin1 bytes, which agree with WinAnsiEncoding across 0xA0–0xFF —
 * so Swiss-German umlauts (ä ö ü Ä Ö Ü ß) render correctly without embedding.
 *
 * Layout is single-page A4. Long item lists are truncated with a note rather
 * than spilling to a second page (foundation scope).
 */

export interface OfferPdfItem {
  label: string;
  detail: string | null;
  amountChf: number;
}

export interface OfferPdfData {
  companyName: string;
  reference: string;
  statusLabel: string;
  createdAt: string; // ISO
  validUntil: string | null; // YYYY-MM-DD
  leadName: string | null;
  vatRatePct: number;
  items: OfferPdfItem[];
  totalNetChf: number;
  totalGrossChf: number;
}

// Helvetica AFM advance widths (per 1000 units) for printable ASCII 32–126.
// Used to right-align amounts. Anything outside the table defaults to 556.
const HELV_WIDTHS: Record<number, number> = {
  32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191,
  40: 333, 41: 333, 42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278,
  48: 556, 49: 556, 50: 556, 51: 556, 52: 556, 53: 556, 54: 556, 55: 556,
  56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584, 62: 584, 63: 556,
  64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
  72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778,
  80: 667, 81: 778, 82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944,
  88: 667, 89: 667, 90: 611, 91: 278, 92: 278, 93: 278, 94: 469, 95: 556,
  96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556, 102: 278, 103: 556,
  104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556,
  111: 556, 112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556,
  118: 500, 119: 722, 120: 500, 121: 500, 122: 500, 123: 334, 124: 260,
  125: 334, 126: 584,
};

/** Map a few common Unicode glyphs to latin1, drop anything still out of range. */
function sanitize(s: string): string {
  return s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/€/g, "EUR")
    .replace(/[^\t\n\r\x20-\xFF]/g, "?");
}

/** Escape the PDF string delimiters. Run AFTER sanitize. */
function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function clean(s: string): string {
  return escapePdf(sanitize(s));
}

function measure(text: string, size: number): number {
  const s = sanitize(text);
  let w = 0;
  for (let i = 0; i < s.length; i++) w += HELV_WIDTHS[s.charCodeAt(i)] ?? 556;
  return (w * size) / 1000;
}

/** CHF with apostrophe thousands and 2 decimals, plain ASCII apostrophe. */
function chf(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  const [intPart, decPart] = Math.abs(v).toFixed(2).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${v < 0 ? "-" : ""}${grouped}.${decPart}`;
}

// A4 in points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const LEFT = 56;
const RIGHT = 539;

type RGB = [number, number, number];
const NAVY: RGB = [0.07, 0.11, 0.22];
const GRAY: RGB = [0.42, 0.45, 0.5];
const BLUE: RGB = [0.15, 0.39, 0.92];
const LINE: RGB = [0.85, 0.87, 0.9];
const BLACK: RGB = [0, 0, 0];

export function buildOfferPdf(data: OfferPdfData): Uint8Array<ArrayBuffer> {
  const ops: string[] = [];
  const rgb = (c: RGB) => `${c[0]} ${c[1]} ${c[2]}`;

  // font: 1 = Helvetica, 2 = Helvetica-Bold
  const text = (x: number, y: number, size: number, font: 1 | 2, str: string, color: RGB = BLACK) => {
    ops.push(
      `BT /F${font} ${size} Tf ${rgb(color)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${clean(str)}) Tj ET`,
    );
  };
  const textRight = (xRight: number, y: number, size: number, font: 1 | 2, str: string, color: RGB = BLACK) => {
    text(xRight - measure(str, size), y, size, font, str, color);
  };
  const line = (x1: number, y1: number, x2: number, y2: number, width: number, color: RGB) => {
    ops.push(`${rgb(color)} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };

  // --- Header -------------------------------------------------------------
  text(LEFT, 800, 20, 2, "Klarsa", NAVY);
  text(LEFT, 786, 8.5, 1, "KI-Verkaufsbuero fuer Schweizer KMU", GRAY);
  textRight(RIGHT, 800, 12, 2, data.companyName, NAVY);
  line(LEFT, 775, RIGHT, 775, 1, BLUE);

  // --- Title + meta -------------------------------------------------------
  text(LEFT, 748, 16, 2, "Offerte", NAVY);

  let my = 726;
  const metaRow = (k: string, v: string) => {
    text(LEFT, my, 10, 2, k, NAVY);
    text(LEFT + 78, my, 10, 1, v, BLACK);
    my -= 15;
  };
  metaRow("Referenz", data.reference);
  metaRow("Datum", data.createdAt.slice(0, 10));
  metaRow("Status", data.statusLabel);
  metaRow("Gueltig bis", data.validUntil ?? "-");

  // --- Recipient ----------------------------------------------------------
  text(LEFT, my - 8, 10, 2, "An", NAVY);
  text(LEFT + 78, my - 8, 10, 1, data.leadName ?? "Ohne Lead-Zuordnung", BLACK);

  // --- Items table --------------------------------------------------------
  let y = my - 40;
  text(LEFT, y, 10, 2, "Position", NAVY);
  textRight(RIGHT, y, 10, 2, "Betrag CHF", NAVY);
  y -= 6;
  line(LEFT, y, RIGHT, y, 0.75, LINE);
  y -= 18;

  const MIN_Y = 150; // keep room for totals + footer
  let truncated = 0;
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    if (y < MIN_Y) {
      truncated = data.items.length - i;
      break;
    }
    text(LEFT, y, 10, 1, item.label, BLACK);
    textRight(RIGHT, y, 10, 1, chf(item.amountChf), BLACK);
    if (item.detail) {
      y -= 11;
      text(LEFT + 10, y, 8, 1, item.detail, GRAY);
    }
    y -= 18;
  }
  if (data.items.length === 0) {
    text(LEFT, y, 10, 1, "Keine Positionen.", GRAY);
    y -= 18;
  }
  if (truncated > 0) {
    text(LEFT, y, 9, 1, `... ${truncated} weitere Position(en) nicht dargestellt.`, GRAY);
    y -= 18;
  }

  // --- Totals -------------------------------------------------------------
  const vatAmount = data.totalGrossChf - data.totalNetChf;
  y -= 4;
  line(330, y, RIGHT, y, 0.75, LINE);
  y -= 18;
  const totalRow = (label: string, value: string, bold: boolean) => {
    text(330, y, 10, bold ? 2 : 1, label, bold ? NAVY : GRAY);
    textRight(RIGHT, y, 10, bold ? 2 : 1, `CHF ${value}`, bold ? NAVY : BLACK);
    y -= 16;
  };
  totalRow("Zwischensumme (Netto)", chf(data.totalNetChf), false);
  totalRow(`MwSt (${data.vatRatePct.toFixed(2)}%)`, chf(vatAmount), false);
  y -= 2;
  line(330, y + 12, RIGHT, y + 12, 0.5, LINE);
  totalRow("Total (Brutto)", chf(data.totalGrossChf), true);

  // --- Footer -------------------------------------------------------------
  line(LEFT, 66, RIGHT, 66, 0.5, LINE);
  text(LEFT, 52, 8, 1, `${sanitize(data.companyName)}  ·  erstellt mit Klarsa`, GRAY);
  text(LEFT, 41, 8, 1, "Entwurf - kein rechtsverbindliches Dokument. Kein automatischer Versand.", GRAY);

  // --- Assemble the PDF ---------------------------------------------------
  const content = ops.join("\n");
  const enc = (s: string) => Buffer.from(s, "latin1");
  const chunks: Buffer[] = [];
  const offsets: number[] = [];
  let pos = 0;
  const push = (b: Buffer) => {
    chunks.push(b);
    pos += b.length;
  };
  const obj = (num: number, body: string) => {
    offsets[num] = pos;
    push(enc(`${num} 0 obj\n${body}\nendobj\n`));
  };

  push(enc("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
  );
  obj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  obj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const contentBytes = enc(content);
  obj(6, `<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`);

  const xrefStart = pos;
  const count = 7;
  let xref = `xref\n0 ${count}\n0000000000 65535 f\r\n`;
  for (let i = 1; i < count; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n\r\n`;
  }
  push(enc(xref));
  push(enc(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`));

  // Copy into a Uint8Array backed by a plain (non-shared) ArrayBuffer so the
  // result satisfies the Web BodyInit type in the route handler.
  const merged = Buffer.concat(chunks);
  const out = new Uint8Array(merged.byteLength);
  out.set(merged);
  return out;
}
