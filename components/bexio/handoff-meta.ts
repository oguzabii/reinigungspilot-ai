/**
 * bexio handoff metadata — shared by the handoff page, the action buttons and
 * the summary. Mirrors the `handoff_status` enum from migration 001. This is a
 * MANUAL handoff queue: there is NO real bexio API, no token, no network call.
 *
 * Manual lifecycle produced by the UI:
 *   (no handoff) ──"Für bexio vorbereiten"──▶ queued (Vorbereitet)
 *   queued       ──"Als verrechnet markieren"──▶ completed (Verrechnet)
 * The other enum values (not_ready/ready/sent/failed) still render if present.
 */

import type { HandoffStatus, JobStatus } from "@/lib/database-types";

export interface StatusMeta {
  label: string;
  className: string;
}

/** German labels + Tailwind badge classes (bg + text + ring). */
export const HANDOFF_STATUS_META: Record<HandoffStatus, StatusMeta> = {
  not_ready: {
    label: "Nicht bereit",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  ready: { label: "Bereit", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  queued: {
    label: "Vorbereitet",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  sent: {
    label: "Übermittelt",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  failed: { label: "Fehler", className: "bg-rose-50 text-rose-700 ring-rose-200" },
  completed: {
    label: "Verrechnet",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
};

/** A job becomes ready for invoice handoff once it is completed. */
export const READY_JOB_STATUS: JobStatus = "completed";
