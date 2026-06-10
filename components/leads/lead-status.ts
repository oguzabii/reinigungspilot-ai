/**
 * Shared status metadata for the Lead Inbox (page + forms). Pure constants —
 * safe to import from both server and client components.
 *
 * Canonical lead flow (presented in this order; transitions are NOT strictly
 * enforced so users can correct mistakes — see
 * docs/clean24-lead-status-followups.md):
 *
 *   new → qualified → offer_ready → offer_sent → waiting_reply
 *       → followup_due → won / lost / archived
 */

import type {
  LeadStatus,
  FollowupStage,
  FollowupTaskStatus,
} from "@/lib/database-types";

export interface StatusMeta {
  label: string;
  className: string;
}

/** Lead statuses in canonical flow order (drives the select + badge maps). */
export const LEAD_STATUS_FLOW: LeadStatus[] = [
  "new",
  "qualified",
  "offer_ready",
  "offer_sent",
  "waiting_reply",
  "followup_due",
  "won",
  "lost",
  "archived",
];

export const LEAD_STATUS_META: Record<LeadStatus, StatusMeta> = {
  new: { label: "Neu", className: "bg-blue-50 text-blue-700 ring-blue-100" },
  qualified: { label: "Qualifiziert", className: "bg-violet-50 text-violet-700 ring-violet-100" },
  offer_ready: { label: "Offerte bereit", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  offer_sent: { label: "Offerte gesendet", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  waiting_reply: { label: "Wartet auf Antwort", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  followup_due: { label: "Follow-up fällig", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  won: { label: "Gewonnen", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  lost: { label: "Verloren", className: "bg-rose-50 text-rose-700 ring-rose-100" },
  archived: { label: "Archiviert", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

/* ------------------------------ Follow-ups ------------------------------- */

/** Follow-up stages (DB check constraint: 24h | 48h | 5d_final). */
export const FOLLOWUP_STAGES: FollowupStage[] = ["24h", "48h", "5d_final"];

export const FOLLOWUP_STAGE_LABELS: Record<FollowupStage, string> = {
  "24h": "24h",
  "48h": "48h",
  "5d_final": "5 Tage (final)",
};

export const FOLLOWUP_STATUS_META: Record<FollowupTaskStatus, StatusMeta> = {
  planned: { label: "Geplant", className: "bg-blue-50 text-blue-700 ring-blue-100" },
  due: { label: "Fällig", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  overdue: { label: "Überfällig", className: "bg-rose-50 text-rose-700 ring-rose-100" },
  done: { label: "Erledigt", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  skipped: { label: "Übersprungen", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

/** Channel options for the follow-up form (stored as free text). */
export const FOLLOWUP_CHANNELS = ["E-Mail", "Telefon", "WhatsApp", "Andere"] as const;
