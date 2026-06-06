/**
 * Swiss number / currency formatting helpers.
 *
 * Grouping is done manually (not via Intl) on purpose: `Intl.NumberFormat`
 * picks the group separator from the runtime's ICU data, and Node and the
 * browser disagree on the de-CH separator glyph ("’" vs "'"). That mismatch
 * triggers React hydration errors in client components. Manual grouping is
 * fully deterministic across server and client.
 *
 * All currency output is rendered through these helpers via `{}` expressions
 * (never inlined as JSX text), so the apostrophe group separator never trips
 * `react/no-unescaped-entities`.
 */

const GROUP_SEPARATOR = "'";

function groupThousands(value: number): string {
  const rounded = Math.round(value);
  const negative = rounded < 0;
  const digits = Math.abs(rounded).toString();

  let result = "";
  for (let i = 0; i < digits.length; i += 1) {
    if (i > 0 && (digits.length - i) % 3 === 0) {
      result += GROUP_SEPARATOR;
    }
    result += digits[i];
  }
  return (negative ? "-" : "") + result;
}

/** e.g. 2490 -> "CHF 2'490" */
export function formatChf(amount: number): string {
  return `CHF ${groupThousands(amount)}`;
}

/** e.g. (490, 1500) -> "CHF 490 – 1'500" */
export function formatChfRange(from: number, to: number): string {
  return `CHF ${groupThousands(from)} – ${groupThousands(to)}`;
}

/** e.g. 1000 -> "1'000" (no currency prefix) */
export function formatNumber(value: number): string {
  return groupThousands(value);
}
