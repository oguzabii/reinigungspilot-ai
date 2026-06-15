/**
 * Premium "Klarsa hat für Sie gearbeitet" digest (v0.5.6). PURE — no I/O.
 *
 * Builds the Premium owner's daily "what Klarsa did for you" summary from the
 * tenant's REAL, RLS-scoped data. The hard rule: where a number genuinely
 * exists (opportunities, offers, scheduled jobs, discovery runs) we show it;
 * where it needs a channel that is not connected yet (sending, inbound replies,
 * calendar), we show an honest zero with a calm "channel not connected" note —
 * never a fabricated number.
 */

import type {
  OpportunityListItem,
  LeadListItem,
  OfferListItem,
  JobListItem,
  DiscoveryRunLog,
} from "@/lib/auth/tenant-data";

export type DigestState = "active" | "waiting" | "channel" | "empty";

export interface DigestRow {
  key: string;
  label: string;
  /** Primary number to show. */
  value: number;
  /** Short honest sub-line (state-aware). */
  sublabel: string;
  state: DigestState;
}

export interface NextAppointment {
  whenIso: string;
  customer: string | null;
  topic: string;
  location: string | null;
}

export interface PremiumDigest {
  rows: DigestRow[];
  nextAppointment: NextAppointment | null;
  /** True if there is any real activity to celebrate (drives the headline). */
  hasActivity: boolean;
}

export interface PremiumProviders {
  /** An approved discovery source is connected. */
  discovery: boolean;
  /** A compliant send channel (e.g. Gmail/SMTP) is connected. */
  send: boolean;
  /** A calendar channel is connected. */
  calendar: boolean;
}

export interface PremiumDigestInput {
  prospects: OpportunityListItem[];
  leads: LeadListItem[];
  offers: OfferListItem[];
  jobs: JobListItem[];
  discoveryRuns: DiscoveryRunLog[];
  providers: PremiumProviders;
  /** Request-time ISO timestamp (keeps this pure). */
  nowIso: string;
}

export function buildPremiumDigest(input: PremiumDigestInput): PremiumDigest {
  const { prospects, offers, jobs, discoveryRuns, providers, nowIso } = input;

  // 1) Firmen geprüft — companies surfaced by approved discovery runs.
  const companiesChecked = discoveryRuns.reduce((s, r) => s + (r.found ?? 0), 0);

  // 2) Chancen gefunden — opportunities currently in the radar.
  const opportunitiesFound = prospects.length;

  // 3) Erstkontakte — drafts ready (unpromoted); sending needs a channel.
  const contactsPrepared = prospects.filter(
    (p) => p.promotedLeadId === null,
  ).length;
  const contactsSent = 0; // no send channel connected yet (honest zero)

  // 4) Antworten erhalten — needs an inbound channel (honest zero).
  const repliesReceived = 0;

  // 5) Offerten — real offer statuses.
  const offersSent = offers.filter((o) => o.status === "sent").length;
  const offersPrepared = offers.filter(
    (o) => o.status === "draft" || o.status === "ready",
  ).length;

  // 6) Termine — jobs with a scheduled date.
  const scheduled = jobs.filter(
    (j): j is JobListItem & { scheduledFor: string } => j.scheduledFor !== null,
  );
  const appointments = scheduled.length;

  // Next appointment — soonest upcoming scheduled job (fallback: soonest known).
  const nowMs = Date.parse(nowIso);
  const byWhen = scheduled
    .slice()
    .sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor));
  const next =
    byWhen.find((j) => Date.parse(j.scheduledFor) >= nowMs) ?? byWhen[0] ?? null;
  const nextAppointment: NextAppointment | null = next
    ? {
        whenIso: next.scheduledFor,
        customer: next.customerName,
        topic: next.title,
        location: next.location,
      }
    : null;

  const rows: DigestRow[] = [
    {
      key: "checked",
      label: "Firmen geprüft",
      value: companiesChecked,
      sublabel: providers.discovery
        ? companiesChecked > 0
          ? "über freigegebene Quellen"
          : "Discovery aktiv – noch kein Lauf"
        : "Discovery-Quelle bereit zum Aktivieren",
      state:
        companiesChecked > 0 ? "active" : providers.discovery ? "waiting" : "channel",
    },
    {
      key: "found",
      label: "Chancen gefunden",
      value: opportunitiesFound,
      sublabel: opportunitiesFound > 0 ? "im Radar" : "noch keine",
      state: opportunitiesFound > 0 ? "active" : "empty",
    },
    {
      key: "contacts",
      label: "Erstkontakte",
      value: contactsPrepared,
      sublabel: providers.send
        ? `${contactsSent} gesendet`
        : "vorbereitet · Versand-Kanal nicht verbunden",
      state: providers.send
        ? "active"
        : contactsPrepared > 0
          ? "waiting"
          : "channel",
    },
    {
      key: "replies",
      label: "Antworten erhalten",
      value: repliesReceived,
      sublabel: providers.send
        ? "noch keine"
        : "Posteingang-Kanal nicht verbunden",
      state: "channel",
    },
    {
      key: "offers",
      label: "Offerten",
      value: offersSent,
      sublabel: `${offersSent} versendet · ${offersPrepared} vorbereitet`,
      state: offersSent > 0 || offersPrepared > 0 ? "active" : "empty",
    },
    {
      key: "appointments",
      label: "Termine",
      value: appointments,
      sublabel: providers.calendar
        ? appointments > 0
          ? "koordiniert"
          : "noch keine"
        : appointments > 0
          ? "geplant · Kalender-Kanal nicht verbunden"
          : "Kalender-Kanal nicht verbunden",
      state: appointments > 0 ? "active" : "channel",
    },
  ];

  const hasActivity =
    companiesChecked > 0 ||
    opportunitiesFound > 0 ||
    contactsPrepared > 0 ||
    offersSent > 0 ||
    offersPrepared > 0 ||
    appointments > 0;

  return { rows, nextAppointment, hasActivity };
}
