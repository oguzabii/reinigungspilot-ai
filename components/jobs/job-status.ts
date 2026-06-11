/**
 * Job status metadata — shared by the jobs list. Mirrors the `job_status` enum
 * from migration 001. v0.3.4 is display-only (create + list); a status workflow
 * UI can arrive with the jobs workflow version.
 */

import type { JobStatus } from "@/lib/database-types";

export interface StatusMeta {
  label: string;
  className: string;
}

/** Canonical order for badges. */
export const JOB_STATUS_FLOW: JobStatus[] = [
  "planned",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "archived",
];

/** German labels + Tailwind badge classes (bg + text + ring). */
export const JOB_STATUS_META: Record<JobStatus, StatusMeta> = {
  planned: {
    label: "Geplant",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  confirmed: {
    label: "Bestätigt",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  in_progress: {
    label: "In Arbeit",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  completed: {
    label: "Abgeschlossen",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  cancelled: {
    label: "Storniert",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  archived: {
    label: "Archiviert",
    className: "bg-slate-50 text-slate-400 ring-slate-200",
  },
};
