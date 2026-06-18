/**
 * CEO / Finanzen period scoping (v0.5.14). PURE and deterministic — no clock
 * (the caller passes `nowIso`), no I/O. Turns the RLS-filtered tenant lists into
 * a small, period-aware money summary for the simple period controls
 * (Heute · Diese Woche · Dieser Monat).
 *
 * Honest by design: period-scoped figures use the row's `created_at` (the only
 * timestamp every list carries) and are labelled as "im Zeitraum"; the
 * point-in-time figures (open offers, bexio ready, follow-ups due) reflect the
 * current state and are labelled "aktuell". No new column, no migration.
 */

import type { CeoKpiInput } from "@/components/ceo/kpi";

export type CeoPeriod = "today" | "week" | "month";

export const CEO_PERIODS: ReadonlyArray<{ key: CeoPeriod; label: string }> = [
  { key: "today", label: "Heute" },
  { key: "week", label: "Diese Woche" },
  { key: "month", label: "Dieser Monat" },
];

/** Parse an untrusted `?period=` value; default to the current month. */
export function parseCeoPeriod(raw: string | undefined | null): CeoPeriod {
  return raw === "today" || raw === "week" || raw === "month" ? raw : "month";
}

/**
 * Inclusive start instant (ms) of the selected period, computed in UTC from
 * `nowIso` (Vercel runs UTC; the rest of the app also slices ISO in UTC, so
 * server and any later client read agree). "Diese Woche" starts Monday.
 */
export function periodStartMs(period: CeoPeriod, nowIso: string): number {
  const now = new Date(nowIso);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const startOfToday = Date.UTC(y, m, d);
  if (period === "today") return startOfToday;
  if (period === "month") return Date.UTC(y, m, 1);
  // week: back to Monday (getUTCDay: 0 = Sunday … 6 = Saturday).
  const dow = now.getUTCDay();
  const sinceMonday = (dow + 6) % 7;
  return startOfToday - sinceMonday * 24 * 60 * 60 * 1000;
}

const OPEN_OFFER_STATUSES = new Set<string>(["draft", "ready", "sent"]);
const OPEN_LEAD_STATUSES = new Set<string>([
  "new",
  "qualified",
  "offer_ready",
  "offer_sent",
  "waiting_reply",
  "followup_due",
]);

export interface CeoPeriodKpis {
  period: CeoPeriod;
  periodLabel: string;
  // Period-scoped (by created_at within the period)
  wonRevenueChf: number;
  wonCount: number;
  completedJobs: number;
  completedJobChf: number;
  // Point-in-time (current state)
  openOffers: number;
  openOffersChf: number;
  bexioReady: number;
  followupsDue: number;
}

/** Compute the five headline figures for the selected period. */
export function computeCeoPeriodKpis(
  input: CeoKpiInput,
  period: CeoPeriod,
): CeoPeriodKpis {
  const startMs = periodStartMs(period, input.nowIso);
  const inPeriod = (iso: string) => Date.parse(iso) >= startMs;
  const followupLeadIds = new Set(input.followupLeadIds);

  const wonOffers = input.offers.filter(
    (o) => o.status === "accepted" && inPeriod(o.createdAt),
  );
  const completed = input.jobs.filter(
    (j) => j.status === "completed" && inPeriod(j.createdAt),
  );
  const openOffers = input.offers.filter((o) => OPEN_OFFER_STATUSES.has(o.status));
  const bexioReady = input.handoffJobs.filter(
    (h) => h.status === "completed" && !h.handoff,
  ).length;
  const followupsDue = input.leads.filter(
    (l) => OPEN_LEAD_STATUSES.has(l.status) && !followupLeadIds.has(l.id),
  ).length;

  return {
    period,
    periodLabel: CEO_PERIODS.find((p) => p.key === period)?.label ?? "Zeitraum",
    wonRevenueChf: wonOffers.reduce((s, o) => s + (o.totalGrossChf || 0), 0),
    wonCount: wonOffers.length,
    completedJobs: completed.length,
    completedJobChf: completed.reduce((s, j) => s + (j.valueChf || 0), 0),
    openOffers: openOffers.length,
    openOffersChf: openOffers.reduce((s, o) => s + (o.totalGrossChf || 0), 0),
    bexioReady,
    followupsDue,
  };
}
