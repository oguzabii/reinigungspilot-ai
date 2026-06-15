/**
 * Autopilot lanes (v0.5.6). PURE — no I/O.
 *
 * The Revenue Autopilot is the command center. Each "lane" is one stage of the
 * money chain that Klarsa can drive — Discovery → Erstkontakt → Nachfassen →
 * Offerten → Termine → Abschluss/bexio. Given the tier and which channels are
 * connected, every lane reports one honest, owner-facing state:
 *
 *   Aktiv · Wartet auf Freigabe · Kanal nicht verbunden · Bereit für Premium ·
 *   Premium-Funktion · Nächste Aktion geplant
 *
 * Full automation is therefore always VISIBLE, BOUNDED and PACKAGE-GATED:
 *   - Starter/Pro never silently run Premium behaviour — they show the value
 *     they DO deliver (guided/prepared) and mark full-auto as a Premium feature.
 *   - Premium only acts automatically on a lane once its channel is connected;
 *     until then it reads "Bereit für Premium" — no fake "running" state.
 */

import type { PackageTier } from "@/lib/database-types";
import { tierRank, isPremiumExperience } from "@/components/app-shell/autopilot-tier";

export type LaneState =
  | "active"
  | "waiting_approval"
  | "channel_not_connected"
  | "ready_premium"
  | "premium_feature"
  | "planned";

export interface AutopilotLane {
  key: string;
  title: string;
  description: string;
  href: string;
  state: LaneState;
  /** One-line, owner-facing, non-technical status note. */
  note: string;
}

export const LANE_STATE_META: Record<
  LaneState,
  { label: string; className: string }
> = {
  active: {
    label: "Aktiv",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  waiting_approval: {
    label: "Wartet auf Freigabe",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  channel_not_connected: {
    label: "Kanal nicht verbunden",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  ready_premium: {
    label: "Bereit für Premium",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  premium_feature: {
    label: "Premium-Funktion",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  planned: {
    label: "Nächste Aktion geplant",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
};

export interface LanesInput {
  tier: PackageTier;
  billingStatus?: string | null;
  /** Which channels are connected (send/calendar are not connected today). */
  providers: { discovery: boolean; send: boolean; calendar: boolean };
  /** Most recent Approved Discovery run, if any (drives the lane's note). */
  lastDiscovery?: { found: number; created: number } | null;
  /** Candidates currently ready for first contact (drives the Erstkontakt note). */
  readyForOutreach?: number;
}

/** Tiny typed pair helper so each lane stays readable and type-safe. */
function sn(state: LaneState, note: string): { state: LaneState; note: string } {
  return { state, note };
}

export function buildAutopilotLanes(input: LanesInput): AutopilotLane[] {
  const { tier, billingStatus, providers, lastDiscovery, readyForOutreach } = input;
  const premium = isPremiumExperience(tier, billingStatus);
  const isPro = tierRank(tier) >= 1;

  // "X Kandidaten bereit für Erstkontakt" suffix for the Erstkontakt lane.
  const readyNote =
    readyForOutreach && readyForOutreach > 0
      ? ` ${readyForOutreach} Kandidaten bereit für Erstkontakt.`
      : "";

  // "Letzter Lauf: X Kandidaten" suffix when a run has happened.
  const lastRunNote =
    lastDiscovery && lastDiscovery.found > 0
      ? ` Letzter Lauf: ${lastDiscovery.found} gefunden, ${lastDiscovery.created} erstellt.`
      : "";

  // Discovery — find matching companies from approved sources.
  const discovery = !isPro
    ? sn("premium_feature", "Ab Pro: Klarsa findet neue Firmen. Mit Premium vollautomatisch.")
    : providers.discovery
      ? premium
        ? sn("active", `Quelle verbunden – Premium kann Läufe automatisch planen.${lastRunNote}`)
        : sn("active", `Quelle verbunden – läuft auf Ihre Auslösung.${lastRunNote}`)
      : premium
        ? sn("ready_premium", "Freigegebene Quelle aktivieren, dann automatisch.")
        : sn("channel_not_connected", "Freigegebene Quelle noch nicht verbunden.");

  // Erstkontakt — prepare first contact, send after approval.
  const outreach = !isPro
    ? sn("premium_feature", `Im Pro-Paket vorbereitet, im Premium-Paket automatisierbar.${readyNote}`)
    : premium
      ? providers.send
        ? sn("active", `Versand-Kanal verbunden – Klarsa kontaktiert nach Regeln.${readyNote}`)
        : sn("ready_premium", `Entwürfe bereit – Versand-Kanal verbinden für Vollautomatik.${readyNote}`)
      : sn("waiting_approval", `Entwürfe werden vorbereitet – Sie geben frei und senden.${readyNote}`);

  // Nachfassen — keep leads warm, follow up at the right time.
  const followup = premium
    ? providers.send
      ? sn("active", "Automatisches Nachfassen an freigegebene Kontakte.")
      : sn("ready_premium", "Vorbereitet – Versand-Kanal verbinden für Vollautomatik.")
    : sn("waiting_approval", "Follow-ups vorbereitet – Sie bestätigen den Versand.");

  // Offerten — create offers/PDFs, send after approval.
  const offer = premium
    ? providers.send
      ? sn("active", "Offerten werden vorbereitet und nach Regeln versendet.")
      : sn("ready_premium", "Offerten & PDF bereit – Versand-Kanal verbinden.")
    : sn("waiting_approval", "Offerten & PDF vorbereitet – Sie versenden selbst.");

  // Termine — propose and coordinate appointments.
  const appointment = !isPro
    ? sn("premium_feature", "Termin-Koordination ab Pro, vollautomatisch mit Premium.")
    : premium
      ? providers.calendar
        ? sn("active", "Kalender verbunden – Termine werden koordiniert.")
        : sn("ready_premium", "Vorschläge bereit – Kalender verbinden für Vollautomatik.")
      : sn("waiting_approval", "Terminvorschläge vorbereitet – Sie bestätigen.");

  // Abschluss & bexio — close jobs and prepare the invoice handoff.
  const handoff = !isPro
    ? sn("premium_feature", "bexio-Übergabe ab Pro, erweitert mit Premium.")
    : sn("planned", "Abgeschlossene Aufträge werden zur Verrechnung vorbereitet.");

  return [
    {
      key: "discovery",
      title: "Discovery",
      description: "Findet passende Firmen aus freigegebenen Quellen.",
      href: "/app-shell/revenue-autopilot/discovery",
      ...discovery,
    },
    {
      key: "outreach",
      title: "Erstkontakt",
      description: "Bereitet Erstkontakte vor und sendet sie nach Freigabe.",
      href: "/app-shell/revenue-autopilot/outreach",
      ...outreach,
    },
    {
      key: "followup",
      title: "Nachfassen",
      description: "Hält Leads warm und fasst zur richtigen Zeit nach.",
      href: "/app-shell/leads",
      ...followup,
    },
    {
      key: "offer",
      title: "Offerten",
      description: "Erstellt Offerten und PDFs, versendet nach Freigabe.",
      href: "/app-shell/offers",
      ...offer,
    },
    {
      key: "appointment",
      title: "Termine",
      description: "Schlägt Termine vor und koordiniert sie.",
      href: "/app-shell/jobs",
      ...appointment,
    },
    {
      key: "handoff",
      title: "Abschluss & bexio",
      description: "Schliesst Aufträge ab und bereitet die Verrechnung vor.",
      href: "/app-shell/bexio",
      ...handoff,
    },
  ];
}
