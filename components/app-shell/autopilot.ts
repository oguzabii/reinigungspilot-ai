/**
 * Autopilot — "next actions for revenue" (v0.4.3, UI-only foundation).
 *
 * PURE and deterministic: given the already-computed CEO KPIs (themselves
 * derived from the RLS-filtered tenant lists), it returns a prioritised list of
 * the concrete next steps the owner should take to move money. It is a
 * read-only assistant surface:
 *
 *   - NO external API, NO scraping, NO discovery.
 *   - NO automatic email/WhatsApp sending and NO automatic booking — every
 *     action links the human to the page where THEY decide and act.
 *
 * The four signals are the same "attention" figures the CEO briefing computes,
 * reused here so the cockpit and the briefing never disagree. Ordering follows
 * the money: cash already earned first, then pipeline you can close, then hot
 * opportunities, then keeping leads warm.
 */

import type { CeoKpis } from "@/components/ceo/kpi";

export type AutopilotTone = "money" | "pipeline" | "opportunity" | "warm";

export interface AutopilotAction {
  id: "handoff" | "offers" | "opps" | "followups";
  count: number;
  /** Owner-friendly action title (plain language, not technical). */
  title: string;
  /** Short money/why framing. */
  detail: string;
  href: string;
  ctaLabel: string;
  tone: AutopilotTone;
}

/**
 * Build the prioritised action list from the CEO KPIs. Only actions with a
 * positive count are returned, money-closest first.
 */
export function buildAutopilotActions(kpis: CeoKpis): AutopilotAction[] {
  const actions: AutopilotAction[] = [];

  if (kpis.attnJobsNotHandedOff > 0) {
    actions.push({
      id: "handoff",
      count: kpis.attnJobsNotHandedOff,
      title: "Verdientes Geld verrechnen",
      detail:
        "Abgeschlossene Aufträge sind noch nicht an bexio übergeben – Rechnung vorbereiten und Umsatz sichern.",
      href: "/app-shell/bexio",
      ctaLabel: "Zur bexio-Übergabe",
      tone: "money",
    });
  }

  if (kpis.attnOffersWaiting > 0) {
    actions.push({
      id: "offers",
      count: kpis.attnOffersWaiting,
      title: "Offerten nachfassen",
      detail:
        "Versendete Offerten warten auf Antwort – kurz nachfassen bringt offene Pipeline zum Abschluss.",
      href: "/app-shell/offers",
      ctaLabel: "Offerten ansehen",
      tone: "pipeline",
    });
  }

  if (kpis.attnHighScoreNotPromoted > 0) {
    actions.push({
      id: "opps",
      count: kpis.attnHighScoreNotPromoted,
      title: "Heisse Chancen übernehmen",
      detail:
        "High-Score-Opportunities sind noch nicht im Lead Inbox – jetzt übernehmen und aktiv verfolgen.",
      href: "/app-shell/lead-hunter",
      ctaLabel: "Zum Lead Hunter",
      tone: "opportunity",
    });
  }

  if (kpis.attnLeadsNoFollowup > 0) {
    actions.push({
      id: "followups",
      count: kpis.attnLeadsNoFollowup,
      title: "Leads warmhalten",
      detail:
        "Offene Leads haben kein geplantes Follow-up – einen nächsten Schritt setzen, damit nichts liegen bleibt.",
      href: "/app-shell/leads",
      ctaLabel: "Follow-up planen",
      tone: "warm",
    });
  }

  return actions;
}
