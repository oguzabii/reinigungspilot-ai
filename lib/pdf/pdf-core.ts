/**
 * Shared, dependency-free PDF 1.4 core (SERVER-ONLY).
 *
 * Extracted from the proven `offer-pdf.ts` builder so the Clean24 customer/
 * partner documents (Auftragsbestätigung, Partner-Einsatzbestätigung) render
 * identically — same Helvetica / Helvetica-Bold built-in fonts, WinAnsiEncoding
 * and latin1 content bytes so Swiss-German umlauts (ä ö ü Ä Ö Ü ß) work without
 * embedding fonts or shipping any asset. The existing offer PDF is left
 * untouched; only the new documents use this core.
 *
 * Single-page A4. Callers position text in PDF points (origin bottom-left).
 */

export type RGB = [number, number, number];

export const NAVY: RGB = [0.07, 0.11, 0.22];
export const GRAY: RGB = [0.42, 0.45, 0.5];
export const BLUE: RGB = [0.15, 0.39, 0.92];
export const LINE: RGB = [0.85, 0.87, 0.9];
export const BLACK: RGB = [0, 0, 0];
export const EMERALD: RGB = [0.02, 0.47, 0.34];

// A4 in points.
export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const LEFT = 56;
export const RIGHT = 539;

// Helvetica AFM advance widths (per 1000 units) for printable ASCII 32–126.
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
export function sanitize(s: string): string {
  return s
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/€/g, "EUR")
    .replace(/[^\t\n\r\x20-\xFF]/g, "?");
}

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function clean(s: string): string {
  return escapePdf(sanitize(s));
}

export function measure(text: string, size: number): number {
  const s = sanitize(text);
  let w = 0;
  for (let i = 0; i < s.length; i++) w += HELV_WIDTHS[s.charCodeAt(i)] ?? 556;
  return (w * size) / 1000;
}

/** CHF with apostrophe thousands and 2 decimals, plain ASCII apostrophe. */
export function chf(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  const [intPart, decPart] = Math.abs(v).toFixed(2).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${v < 0 ? "-" : ""}${grouped}.${decPart}`;
}

/** Wrap text to a max width (in points), splitting on spaces. */
export function wrap(text: string, size: number, maxWidth: number): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface PdfDoc {
  /** Draw left-aligned text. font: 1 = Helvetica, 2 = Helvetica-Bold. */
  text: (x: number, y: number, size: number, font: 1 | 2, str: string, color?: RGB) => void;
  /** Draw right-aligned text (xRight is the right edge). */
  textRight: (xRight: number, y: number, size: number, font: 1 | 2, str: string, color?: RGB) => void;
  /** Draw a line. */
  line: (x1: number, y1: number, x2: number, y2: number, width: number, color: RGB) => void;
  /** Draw a filled rectangle. */
  rect: (x: number, y: number, w: number, h: number, color: RGB) => void;
  /** Draw a filled rounded rectangle (corner radius r). */
  roundedRect: (x: number, y: number, w: number, h: number, r: number, color: RGB) => void;
  /** Stroke (outline) a rounded rectangle. */
  roundedRectStroke: (
    x: number, y: number, w: number, h: number, r: number, width: number, color: RGB,
  ) => void;
  /** Draw a filled circle (centre cx,cy, radius r). */
  circle: (cx: number, cy: number, r: number, color: RGB) => void;
  /** Fill an arbitrary path (raw PDF path ops, e.g. "x y m … c h"). */
  fillPath: (d: string, color: RGB) => void;
  /** Stroke an arbitrary path. */
  strokePath: (d: string, width: number, color: RGB) => void;
  /** Assemble the final single-page PDF bytes. */
  build: () => Uint8Array<ArrayBuffer>;
}

/** Bézier circle constant (4-segment approximation). */
const K = 0.5523;

/** Build a rounded-rectangle path (no paint operator). */
function roundedPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const x0 = x;
  const y0 = y;
  const x1 = x + w;
  const y1 = y + h;
  const f = (n: number) => n.toFixed(2);
  return [
    `${f(x0 + rr)} ${f(y0)} m`,
    `${f(x1 - rr)} ${f(y0)} l`,
    `${f(x1 - rr + K * rr)} ${f(y0)} ${f(x1)} ${f(y0 + rr - K * rr)} ${f(x1)} ${f(y0 + rr)} c`,
    `${f(x1)} ${f(y1 - rr)} l`,
    `${f(x1)} ${f(y1 - rr + K * rr)} ${f(x1 - rr + K * rr)} ${f(y1)} ${f(x1 - rr)} ${f(y1)} c`,
    `${f(x0 + rr)} ${f(y1)} l`,
    `${f(x0 + rr - K * rr)} ${f(y1)} ${f(x0)} ${f(y1 - rr + K * rr)} ${f(x0)} ${f(y1 - rr)} c`,
    `${f(x0)} ${f(y0 + rr)} l`,
    `${f(x0)} ${f(y0 + rr - K * rr)} ${f(x0 + rr - K * rr)} ${f(y0)} ${f(x0 + rr)} ${f(y0)} c`,
    "h",
  ].join(" ");
}

/** Create a single-page A4 PDF document builder. */
export function createPdf(): PdfDoc {
  const ops: string[] = [];
  const rgb = (c: RGB) => `${c[0]} ${c[1]} ${c[2]}`;

  const text: PdfDoc["text"] = (x, y, size, font, str, color = BLACK) => {
    ops.push(
      `BT /F${font} ${size} Tf ${rgb(color)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${clean(str)}) Tj ET`,
    );
  };
  const textRight: PdfDoc["textRight"] = (xRight, y, size, font, str, color = BLACK) => {
    text(xRight - measure(str, size), y, size, font, str, color);
  };
  const line: PdfDoc["line"] = (x1, y1, x2, y2, width, color) => {
    ops.push(`${rgb(color)} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  };
  const rect: PdfDoc["rect"] = (x, y, w, h, color) => {
    ops.push(`${rgb(color)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  };
  const roundedRect: PdfDoc["roundedRect"] = (x, y, w, h, r, color) => {
    ops.push(`${rgb(color)} rg ${roundedPath(x, y, w, h, r)} f`);
  };
  const roundedRectStroke: PdfDoc["roundedRectStroke"] = (x, y, w, h, r, width, color) => {
    ops.push(`${rgb(color)} RG ${width} w ${roundedPath(x, y, w, h, r)} S`);
  };
  const circle: PdfDoc["circle"] = (cx, cy, r, color) => {
    const f = (n: number) => n.toFixed(2);
    ops.push(
      `${rgb(color)} rg ${f(cx + r)} ${f(cy)} m ` +
        `${f(cx + r)} ${f(cy + K * r)} ${f(cx + K * r)} ${f(cy + r)} ${f(cx)} ${f(cy + r)} c ` +
        `${f(cx - K * r)} ${f(cy + r)} ${f(cx - r)} ${f(cy + K * r)} ${f(cx - r)} ${f(cy)} c ` +
        `${f(cx - r)} ${f(cy - K * r)} ${f(cx - K * r)} ${f(cy - r)} ${f(cx)} ${f(cy - r)} c ` +
        `${f(cx + K * r)} ${f(cy - r)} ${f(cx + r)} ${f(cy - K * r)} ${f(cx + r)} ${f(cy)} c f`,
    );
  };
  const fillPath: PdfDoc["fillPath"] = (d, color) => {
    ops.push(`${rgb(color)} rg ${d} f`);
  };
  const strokePath: PdfDoc["strokePath"] = (d, width, color) => {
    ops.push(`${rgb(color)} RG ${width} w 1 J 1 j ${d} S`);
  };

  const build = (): Uint8Array<ArrayBuffer> => {
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

    const merged = Buffer.concat(chunks);
    const out = new Uint8Array(merged.byteLength);
    out.set(merged);
    return out;
  };

  return {
    text, textRight, line, rect, roundedRect, roundedRectStroke, circle,
    fillPath, strokePath, build,
  };
}

/** Shared Clean24-style header used by the customer/partner documents. */
export function drawHeader(
  doc: PdfDoc,
  opts: { companyName: string; docLabel: string; accent?: RGB },
): void {
  const accent = opts.accent ?? BLUE;
  doc.text(LEFT, 800, 20, 2, opts.companyName, NAVY);
  doc.text(LEFT, 786, 8.5, 1, "Reinigung & Service · Schweiz", GRAY);
  doc.textRight(RIGHT, 800, 12, 2, opts.docLabel, NAVY);
  doc.line(LEFT, 775, RIGHT, 775, 1, accent);
}

/** Shared footer note. */
export function drawFooter(doc: PdfDoc, companyName: string, note: string): void {
  doc.line(LEFT, 66, RIGHT, 66, 0.5, LINE);
  doc.text(LEFT, 52, 8, 1, `${sanitize(companyName)}  ·  erstellt mit Klarsa`, GRAY);
  doc.text(LEFT, 41, 8, 1, note, GRAY);
}
