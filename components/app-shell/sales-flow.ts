/**
 * Shared sales-flow helpers (v0.5.14). PURE and deterministic — no I/O, no clock
 * (callers pass `nowIso` figures via the CEO KPIs). Both the Cockpit and the
 * Pipeline page use these so they never disagree:
 *
 *   - `salesStageStats` → the compact, plain-language status strip
 *     (Lead gefunden · Kontakt gefunden · Offerte bereit · Follow-up geplant ·
 *      Auftrag gewonnen · bexio bereit)
 *   - `nextBestAction`  → the single "Nächste beste Aktion" the owner should do
 *     now to move money, chosen money-closest first.
 *
 * Business language only — no technical module names. Nothing here sends,
 * scrapes or books; every action links the human to where THEY decide and act.
 */

import type { CeoKpis } from "@/components/ceo/kpi";
import type {
  OpportunityListItem,
  LeadListItem,
  OfferListItem,
  FollowupListItem,
  JobListItem,
} from "@/lib/auth/tenant-data";

/** Pre-promotion prospect statuses (a discovered candidate, not yet a lead). */
const PRE_PROMO = new Set<string>(["raw", "scored", "approved"]);
/** Offer statuses that still count as open work (not won/lost/archived). */
const OPEN_OFFER = new Set<string>(["draft", "ready", "sent"]);
/** Follow-up statuses that are still actionable (planned/due/overdue). */
const OPEN_FOLLOWUP = new Set<string>(["planned", "due", "overdue"]);

export interface SalesFlowInput {
  prospects: OpportunityListItem[];
  leads: LeadListItem[];
  offers: OfferListItem[];
  followups: FollowupListItem[];
  jobs: JobListItem[];
  /** Completed jobs not yet handed to bexio (from the CEO KPIs). */
  bexioReady: number;
}

export interface StageStat {
  key: string;
  /** Plain-language business label (no module names). */
  label: string;
  count: number;
  href: string;
}

/** The compact status strip: six plain-language stages with live counts. */
export function salesStageStats(input: SalesFlowInput): StageStat[] {
  const candidates = input.prospects.filter(
    (p) => p.promotedLeadId === null && PRE_PROMO.has(p.status),
  );
  const contactFound = candidates.filter(
    (p) => Boolean(p.contactEmail) || Boolean(p.contactPhone),
  ).length;
  const offersOpen = input.offers.filter((o) => OPEN_OFFER.has(o.status)).length;
  const followupsPlanned = input.followups.filter((f) =>
    OPEN_FOLLOWUP.has(f.status),
  ).length;

  return [
    {
      key: "lead",
      label: "Lead gefunden",
      count: candidates.length,
      href: "/app-shell/pipeline#chancen",
    },
    {
      key: "kontakt",
      label: "Kontakt gefunden",
      count: contactFound,
      href: "/app-shell/pipeline#chancen",
    },
    {
      key: "offerte",
      label: "Offerte bereit",
      count: offersOpen,
      href: "/app-shell/offers",
    },
    {
      key: "followup",
      label: "Follow-up geplant",
      count: followupsPlanned,
      href: "/app-shell/pipeline#leads",
    },
    {
      key: "auftrag",
      label: "Auftrag gewonnen",
      count: input.jobs.length,
      href: "/app-shell/jobs",
    },
    {
      key: "bexio",
      label: "bexio bereit",
      count: input.bexioReady,
      href: "/app-shell/bexio",
    },
  ];
}

export type NextActionTone =
  | "money"
  | "send"
  | "contact"
  | "warm"
  | "opportunity"
  | "find"
  | "offer";

export interface NextAction {
  key: string;
  /** Short title — what to do. */
  title: string;
  /** One-line money/why framing. */
  detail: string;
  href: string;
  ctaLabel: string;
  tone: NextActionTone;
}

export interface NextActionInput {
  kpis: CeoKpis;
  /** Candidates that still have no contact path. */
  contactMissing: number;
  /** Candidates with a contact email, ready for a first email. */
  emailReady: number;
  /** True if the tenant has any data at all (else: guide to finding leads). */
  hasAnyData: boolean;
}

/**
 * The single most valuable next step, money-closest first. Returns exactly one
 * action so the Cockpit can show ONE prominent card (not a wall of options).
 */
export function nextBestAction(input: NextActionInput): NextAction {
  const { kpis, contactMissing, emailReady, hasAnyData } = input;

  if (kpis.attnJobsNotHandedOff > 0) {
    return {
      key: "bexio",
      title: "Verdientes Geld verrechnen",
      detail: `${kpis.attnJobsNotHandedOff} abgeschlossene${
        kpis.attnJobsNotHandedOff === 1 ? "r Auftrag" : " Aufträge"
      } noch nicht an bexio übergeben.`,
      href: "/app-shell/bexio",
      ctaLabel: "bexio vorbereiten",
      tone: "money",
    };
  }
  if (kpis.attnOffersWaiting > 0) {
    return {
      key: "offers",
      title: "Offerte nachfassen",
      detail: `${kpis.attnOffersWaiting} gesendete Offerte${
        kpis.attnOffersWaiting === 1 ? "" : "n"
      } warten auf Antwort – kurz nachfassen schliesst Pipeline ab.`,
      href: "/app-shell/pipeline#leads",
      ctaLabel: "Nachfassen",
      tone: "money",
    };
  }
  if (emailReady > 0) {
    return {
      key: "email",
      title: "Erstkontakt-E-Mail senden",
      detail: `${emailReady} Kandidat${
        emailReady === 1 ? "" : "en"
      } mit Kontakt sind bereit für die erste E-Mail.`,
      href: "/app-shell/pipeline#chancen",
      ctaLabel: "E-Mail senden",
      tone: "send",
    };
  }
  if (contactMissing > 0) {
    return {
      key: "contact",
      title: "Kontakt finden",
      detail: `${contactMissing} Kandidat${
        contactMissing === 1 ? "" : "en"
      } ohne Kontakt – Klarsa findet E-Mail/Telefon automatisch.`,
      href: "/app-shell/pipeline#chancen",
      ctaLabel: "Kontakt finden",
      tone: "contact",
    };
  }
  if (kpis.attnLeadsNoFollowup > 0) {
    return {
      key: "followup",
      title: "Follow-up planen",
      detail: `${kpis.attnLeadsNoFollowup} offene Lead${
        kpis.attnLeadsNoFollowup === 1 ? "" : "s"
      } ohne nächsten Schritt – damit nichts liegen bleibt.`,
      href: "/app-shell/pipeline#leads",
      ctaLabel: "Follow-up planen",
      tone: "warm",
    };
  }
  if (kpis.attnHighScoreNotPromoted > 0) {
    return {
      key: "promote",
      title: "Heisse Chance übernehmen",
      detail: `${kpis.attnHighScoreNotPromoted} High-Score-Chance${
        kpis.attnHighScoreNotPromoted === 1 ? "" : "n"
      } noch nicht in der Pipeline.`,
      href: "/app-shell/pipeline#chancen",
      ctaLabel: "In Pipeline übernehmen",
      tone: "opportunity",
    };
  }
  if (!hasAnyData) {
    return {
      key: "find",
      title: "Erste Firmen finden",
      detail:
        "Noch keine Chancen. Lassen Sie Klarsa passende Firmen finden – sichtbar im Lead Radar.",
      href: "/app-shell/lead-hunter/radar",
      ctaLabel: "Firmen finden",
      tone: "find",
    };
  }
  return {
    key: "offer",
    title: "Neue Offerte erstellen",
    detail:
      "Alles aufgeräumt. Erfassen Sie eine neue Offerte – aus einem Lead oder einem neuen Kunden.",
    href: "/app-shell/offers/new",
    ctaLabel: "Offerte erstellen",
    tone: "offer",
  };
}
