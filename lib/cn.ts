export type ClassValue = string | number | false | null | undefined;

/**
 * Minimal classNames helper (clsx-style) — keeps component markup readable
 * without pulling in an extra dependency.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
