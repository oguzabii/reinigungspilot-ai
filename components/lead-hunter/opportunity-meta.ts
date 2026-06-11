/**
 * Opportunity Radar (Lead Hunter) metadata — shared by the page and the capture
 * form. Maps onto the existing `prospects` schema from migration 001. This is a
 * MANUAL foundation: no scraping, no auto-search, no external sources.
 *
 * Field mapping (form → prospects column):
 *   Titel/Firma/Projekt → name        Opportunity-Typ   → category
 *   Region/Ort          → region      Quelle            → source_type
 *   Service-Potenzial   → search_query (repurposed)
 *   Score               → score       Warum interessant → reason
 *   Nächste Aktion      → suggested_message (repurposed)
 *   Status              → status (prospect_status)
 */

import type { ProspectStatus, SourceType } from "@/lib/database-types";

export interface StatusMeta {
  label: string;
  className: string;
}

/** Opportunity types (stored in `prospects.category`). */
export const OPPORTUNITY_TYPES = [
  "Neubau",
  "Praxis",
  "Verwaltung",
  "Ausschreibung",
  "Firma",
  "Partner",
  "Manuell",
] as const;

/** Service-match examples (datalist suggestions for "Service-Potenzial"). */
export const SERVICE_SUGGESTIONS = [
  "Umzugsreinigung",
  "Treppenhausreinigung",
  "Hauswartung",
  "Bauendreinigung",
  "Büroreinigung",
] as const;

/** Sources offered for a MANUAL opportunity (subset of the source_type enum). */
export const OPPORTUNITY_SOURCES: Array<{ value: SourceType; label: string }> = [
  { value: "manual", label: "Manuell" },
  { value: "referral", label: "Empfehlung" },
  { value: "partner", label: "Partner / Verwaltung" },
  { value: "website", label: "Website" },
  { value: "google", label: "Google / Recherche" },
  { value: "other", label: "Andere" },
];

/** Canonical order for the status select + badges. */
export const PROSPECT_STATUS_FLOW: ProspectStatus[] = [
  "raw",
  "scored",
  "approved",
  "contacted",
  "replied",
  "converted",
  "rejected",
  "archived",
];

/** German labels + Tailwind badge classes (bg + text + ring). */
export const PROSPECT_STATUS_META: Record<ProspectStatus, StatusMeta> = {
  raw: { label: "Roh", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  scored: { label: "Bewertet", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  approved: {
    label: "Freigegeben",
    className: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  contacted: {
    label: "Kontaktiert",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  replied: { label: "Geantwortet", className: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
  converted: {
    label: "Konvertiert",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  rejected: { label: "Abgelehnt", className: "bg-rose-50 text-rose-700 ring-rose-200" },
  archived: { label: "Archiviert", className: "bg-slate-50 text-slate-400 ring-slate-200" },
};

/** Statuses that count as "actively pursued" for the radar overview. */
export const ACTIVE_PURSUIT_STATUSES: ProspectStatus[] = [
  "approved",
  "contacted",
  "replied",
];

/** Score badge color ramp (null = unscored). */
export function scoreBadgeClass(score: number | null): string {
  if (score === null) return "bg-slate-100 text-slate-500 ring-slate-200";
  if (score >= 70) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 40) return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-amber-50 text-amber-800 ring-amber-200";
}
