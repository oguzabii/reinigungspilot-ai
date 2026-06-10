/**
 * Offer status metadata — shared between the offers page, the status control
 * and the create form. Mirrors the `offer_status` enum from migration 001.
 *
 * Canonical flow (presented in this order):
 *   draft → ready → sent → accepted / declined / expired → archived
 *
 * Transitions are intentionally NOT strictly enforced — the select offers all
 * statuses in flow order so users can correct misclicks. A strict state machine
 * can arrive later with the PDF/sending workflow (v0.3.3+).
 */

import type { OfferStatus } from "@/lib/database-types";

export interface StatusMeta {
  label: string;
  className: string;
}

/** Canonical order for selects and badges. */
export const OFFER_STATUS_FLOW: OfferStatus[] = [
  "draft",
  "ready",
  "sent",
  "accepted",
  "declined",
  "expired",
  "archived",
];

/** German labels + Tailwind badge classes (ring + bg + text). */
export const OFFER_STATUS_META: Record<OfferStatus, StatusMeta> = {
  draft: {
    label: "Entwurf",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  ready: {
    label: "Bereit",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  sent: {
    label: "Gesendet",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  accepted: {
    label: "Angenommen",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  declined: {
    label: "Abgelehnt",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  expired: {
    label: "Abgelaufen",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  archived: {
    label: "Archiviert",
    className: "bg-slate-50 text-slate-400 ring-slate-200",
  },
};

/** Swiss standard VAT rate (%) — the offers schema default. */
export const DEFAULT_VAT_RATE_PCT = 8.1;

/**
 * Deterministic CHF formatter (SSR-safe — no locale/ICU dependency so server
 * and client render identically). Apostrophe thousands, 2 decimals.
 */
export function formatChf(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  const [intPart, decPart] = Math.abs(v).toFixed(2).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  return `${v < 0 ? "-" : ""}${grouped}.${decPart}`;
}
