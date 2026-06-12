/**
 * CEO / KPI dashboard — pure metric computation (v0.3.13). Given the
 * RLS-filtered tenant lists, it derives the chain KPIs, funnel, conversions and
 * attention figures. PURE and deterministic: no clock (the caller passes
 * `nowIso`), no I/O, no network, no AI. Read-only — nothing here writes.
 *
 * Self-consistent by design: every figure is derived from the same lists, so a
 * subset (e.g. promoted) is never larger than its total. Lists are capped per
 * module in `tenant-data`, so at large scale this reflects the most recent
 * entries — honest for a foundation, exact on staging.
 */

import type {
  OpportunityListItem,
  LeadListItem,
  OfferListItem,
  JobListItem,
  HandoffJobItem,
} from "@/lib/auth/tenant-data";

export interface CeoKpiInput {
  opportunities: OpportunityListItem[];
  leads: LeadListItem[];
  offers: OfferListItem[];
  jobs: JobListItem[];
  handoffJobs: HandoffJobItem[];
  /** Lead ids that have at least one follow-up task. */
  followupLeadIds: string[];
  /** Request-time ISO timestamp (caller-provided, keeps this pure). */
  nowIso: string;
}

export interface FunnelStage {
  label: string;
  value: number;
}

export interface CeoKpis {
  // Volumes
  oppsTotal: number;
  oppsPromoted: number;
  leadsTotal: number;
  leadsOpen: number;
  offersTotal: number;
  offersAccepted: number;
  offersWaiting: number;
  jobsTotal: number;
  jobsCompleted: number;
  handoffsTotal: number;
  handoffsQueued: number;
  handoffsCompleted: number;
  // Money (CHF)
  pipelineOpenChf: number;
  acceptedChf: number;
  completedJobChf: number;
  // Conversions (whole %, or null when the denominator is 0)
  oppToLeadPct: number | null;
  leadToOfferPct: number | null;
  offerToJobPct: number | null;
  jobToBexioPct: number | null;
  // Funnel volumes (Opportunity → Lead → Offer → Job → bexio)
  funnel: FunnelStage[];
  // Attention (counts)
  attnOffersWaiting: number;
  attnJobsNotHandedOff: number;
  attnHighScoreNotPromoted: number;
  attnLeadsNoFollowup: number;
  // Activity (last 7 days)
  newOpps7d: number;
  newLeads7d: number;
  newOffers7d: number;
  newJobs7d: number;
}

/** Lead statuses that count as still open / in progress (not won/lost/archived). */
const OPEN_LEAD_STATUSES = new Set<string>([
  "new",
  "qualified",
  "offer_ready",
  "offer_sent",
  "waiting_reply",
  "followup_due",
]);

/** Offer statuses whose gross counts as open pipeline (not yet won/lost). */
const OPEN_OFFER_STATUSES = new Set<string>(["draft", "ready", "sent"]);

function pct(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

export function computeCeoKpis(input: CeoKpiInput): CeoKpis {
  const { opportunities, leads, offers, jobs, handoffJobs } = input;
  const followupLeadIds = new Set(input.followupLeadIds);
  const cutoffMs = Date.parse(input.nowIso) - 7 * 24 * 60 * 60 * 1000;
  const within7d = (iso: string) => Date.parse(iso) >= cutoffMs;

  // Opportunities
  const oppsTotal = opportunities.length;
  const oppsPromoted = opportunities.filter((o) => o.promotedLeadId !== null).length;
  const attnHighScoreNotPromoted = opportunities.filter(
    (o) => o.score !== null && o.score >= 70 && o.promotedLeadId === null,
  ).length;

  // Leads
  const leadsTotal = leads.length;
  const openLeads = leads.filter((l) => OPEN_LEAD_STATUSES.has(l.status));
  const leadsOpen = openLeads.length;
  const attnLeadsNoFollowup = openLeads.filter(
    (l) => !followupLeadIds.has(l.id),
  ).length;

  // Offers
  const offersTotal = offers.length;
  const offersAccepted = offers.filter((o) => o.status === "accepted").length;
  const offersWaiting = offers.filter((o) => o.status === "sent").length;
  const pipelineOpenChf = offers
    .filter((o) => OPEN_OFFER_STATUSES.has(o.status))
    .reduce((s, o) => s + (o.totalGrossChf || 0), 0);
  const acceptedChf = offers
    .filter((o) => o.status === "accepted")
    .reduce((s, o) => s + (o.totalGrossChf || 0), 0);
  const leadsWithOffer = new Set(
    offers.map((o) => o.leadId).filter((id): id is string => !!id),
  ).size;

  // Jobs
  const jobsTotal = jobs.length;
  const completedJobs = jobs.filter((j) => j.status === "completed");
  const jobsCompleted = completedJobs.length;
  const completedJobChf = completedJobs.reduce(
    (s, j) => s + (j.valueChf || 0),
    0,
  );

  // bexio handoffs (from the jobs+handoff join)
  const withHandoff = handoffJobs.filter((h) => h.handoff !== null);
  const handoffsTotal = withHandoff.length;
  const handoffsCompleted = withHandoff.filter(
    (h) => h.handoff?.status === "completed",
  ).length;
  const handoffsQueued = handoffsTotal - handoffsCompleted;
  const attnJobsNotHandedOff = handoffJobs.filter(
    (h) => h.status === "completed" && !h.handoff,
  ).length;

  return {
    oppsTotal,
    oppsPromoted,
    leadsTotal,
    leadsOpen,
    offersTotal,
    offersAccepted,
    offersWaiting,
    jobsTotal,
    jobsCompleted,
    handoffsTotal,
    handoffsQueued,
    handoffsCompleted,
    pipelineOpenChf,
    acceptedChf,
    completedJobChf,
    oppToLeadPct: pct(oppsPromoted, oppsTotal),
    leadToOfferPct: pct(leadsWithOffer, leadsTotal),
    offerToJobPct: pct(jobsTotal, offersAccepted),
    jobToBexioPct: pct(handoffsTotal, jobsCompleted),
    funnel: [
      { label: "Opportunities", value: oppsTotal },
      { label: "Leads", value: leadsTotal },
      { label: "Offerten", value: offersTotal },
      { label: "Aufträge", value: jobsTotal },
      { label: "bexio", value: handoffsTotal },
    ],
    attnOffersWaiting: offersWaiting,
    attnJobsNotHandedOff,
    attnHighScoreNotPromoted,
    attnLeadsNoFollowup,
    newOpps7d: opportunities.filter((o) => within7d(o.createdAt)).length,
    newLeads7d: leads.filter((l) => within7d(l.createdAt)).length,
    newOffers7d: offers.filter((o) => within7d(o.createdAt)).length,
    newJobs7d: jobs.filter((j) => within7d(j.createdAt)).length,
  };
}
