/**
 * Clean24 vector logo (SERVER-SAFE, dependency-free). Drawn from PDF path ops —
 * NO image asset (none exists in the repo). Approximates the official Clean24
 * mark: a blue "Clean" wordmark, a green raised "24", a leaf above the number,
 * a blue swoosh under the word, and the "Ihr Reinigungsprofi" tagline. Other
 * tenants get a clean wordmark + tagline (leaf only when the brand ends in
 * digits, like a "…24" mark).
 */

import { type PdfDoc, type RGB, measure } from "./pdf-core";

const BRAND_BLUE: RGB = [0.13, 0.33, 0.55];
const LEAF_GREEN: RGB = [0.44, 0.71, 0.31];
const LEAF_GREEN_DARK: RGB = [0.28, 0.55, 0.2];
const TAGLINE_GRAY: RGB = [0.45, 0.48, 0.53];

/** A tilted, pointed leaf path centred at (cx,cy), filled when passed to fillPath. */
function leafPath(cx: number, cy: number, w: number, h: number, angleDeg: number): string {
  const a = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const rot = (dx: number, dy: number): [number, number] => [
    cx + dx * cos - dy * sin,
    cy + dx * sin + dy * cos,
  ];
  const f = (n: number) => n.toFixed(2);
  const [bx, by] = rot(0, -h / 2); // bottom tip
  const [tx, ty] = rot(0, h / 2); // top tip
  const [c1x, c1y] = rot(-w / 2, -h / 5);
  const [c2x, c2y] = rot(-w / 2, h / 5);
  const [c3x, c3y] = rot(w / 2, h / 5);
  const [c4x, c4y] = rot(w / 2, -h / 5);
  return (
    `${f(bx)} ${f(by)} m ` +
    `${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(tx)} ${f(ty)} c ` +
    `${f(c3x)} ${f(c3y)} ${f(c4x)} ${f(c4y)} ${f(bx)} ${f(by)} c h`
  );
}

/**
 * Draw the logo with the wordmark baseline at `baseY`, left edge at `x`.
 * Returns the y of the bottom of the tagline (so callers know how far it reached).
 */
export function drawClean24Logo(
  doc: PdfDoc,
  x: number,
  baseY: number,
  opts: { brand: string; tagline?: string },
): number {
  const m = opts.brand.match(/^(.*?)(\d+)\s*$/);
  const word = (m ? m[1] : opts.brand).trim() || opts.brand;
  const num = m ? m[2] : "";

  const wordSize = 27;
  doc.text(x, baseY, wordSize, 2, word, BRAND_BLUE);
  const wordW = measure(word, wordSize);
  let endX = x + wordW;

  if (num) {
    const numSize = 16;
    const numX = endX + 3;
    const numY = baseY + 11; // raised like a superscript
    doc.text(numX, numY, numSize, 2, num, LEAF_GREEN_DARK);
    const numW = measure(num, numSize);
    endX = numX + numW;
    // Leaf above the number, with a midrib for a touch of detail.
    const lcx = numX + numW / 2 + 1;
    const lcy = numY + numSize + 4;
    doc.fillPath(leafPath(lcx, lcy, 12, 20, -40), LEAF_GREEN);
    const a = (-40 * Math.PI) / 180;
    const f = (n: number) => n.toFixed(2);
    doc.strokePath(
      `${f(lcx + 10 * Math.sin(a))} ${f(lcy - 10 * Math.cos(a))} m ` +
        `${f(lcx - 10 * Math.sin(a))} ${f(lcy + 10 * Math.cos(a))} l`,
      0.6,
      LEAF_GREEN_DARK,
    );
  }

  // Blue swoosh under the wordmark.
  const sf = (n: number) => n.toFixed(2);
  const sy = baseY - 4;
  doc.strokePath(
    `${sf(x)} ${sf(sy)} m ` +
      `${sf(x + (endX - x) * 0.35)} ${sf(sy - 3.5)} ${sf(x + (endX - x) * 0.65)} ${sf(sy - 3.5)} ${sf(endX)} ${sf(sy)} c`,
    1.5,
    BRAND_BLUE,
  );

  // Centred tagline under the wordmark.
  const taglineY = baseY - 15;
  if (opts.tagline) {
    const t = `"${opts.tagline}"`;
    const tSize = 7.5;
    const center = x + (endX - x) / 2;
    doc.text(center - measure(t, tSize) / 2, taglineY, tSize, 1, t, TAGLINE_GRAY);
  }
  return taglineY - 6;
}
