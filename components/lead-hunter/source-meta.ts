/**
 * Lead Hunter — Source Registry metadata (v0.3.9 foundation). Shared by the
 * registry page and the create form. Maps onto the existing `lead_sources`
 * schema from migration 001 (columns: `type`, `label`, `enabled`, `notes`).
 *
 * This is a CONTROLLED, human-approved registry: a person decides which sources
 * the Lead Hunter may eventually use. There is NO scraping, no auto-search, no
 * Google/Maps API, no ZEFIX/SIMAP/Handelsregister lookup — those are future,
 * gated phases. Every source here is curated by a human.
 *
 * Field mapping (form → lead_sources column):
 *   Bezeichnung / Quelle → label     Quellen-Typ → type (source_type enum)
 *   Aktiv                → enabled    Notiz       → notes
 */

import type { SourceType } from "@/lib/database-types";

/**
 * Automation readiness of a source channel — purely informational. It explains
 * *how* a source is (or will be) used; it is independent of whether THIS entry
 * is active (`enabled`). Nothing here triggers any automation today.
 */
export type SourcePhase = "manual" | "future_api" | "future_registry";

export interface PhaseMeta {
  label: string;
  className: string;
  description: string;
}

/** German label + Tailwind badge class + short note per phase. */
export const SOURCE_PHASE_META: Record<SourcePhase, PhaseMeta> = {
  manual: {
    label: "Manuell",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    description: "Mensch-kuratiert, sofort nutzbar – keine Automatik.",
  },
  future_api: {
    label: "Künftige API",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    description: "Geplant: Google/Maps-API – aktuell keine Abfrage.",
  },
  future_registry: {
    label: "Künftiges Register",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
    description: "Geplant: ZEFIX/SIMAP/Handelsregister – aktuell keine Abfrage.",
  },
};

interface SourceTypeMeta {
  label: string;
  phase: SourcePhase;
}

/**
 * Every `source_type` enum value mapped to a German label + phase, so list
 * rendering is total (any stored type renders). Manual creation offers a
 * curated subset (see `REGISTRY_SOURCE_TYPE_OPTIONS`).
 */
export const SOURCE_TYPE_META: Record<SourceType, SourceTypeMeta> = {
  manual: { label: "Manuell", phase: "manual" },
  referral: { label: "Empfehlung", phase: "manual" },
  partner: { label: "Partner / Verwaltung", phase: "manual" },
  website: { label: "Website / Portal", phase: "manual" },
  import: { label: "Import / Liste", phase: "manual" },
  email: { label: "E-Mail / Anfrage", phase: "manual" },
  google: { label: "Google / Maps", phase: "future_api" },
  bexio: { label: "bexio", phase: "future_api" },
  lead_hunter: { label: "Lead Hunter (Engine)", phase: "future_api" },
  other: { label: "Verzeichnis / Register", phase: "future_registry" },
};

/** Phase for a stored source type (defaults to manual for safety). */
export function phaseFor(type: SourceType): SourcePhase {
  return SOURCE_TYPE_META[type]?.phase ?? "manual";
}

export interface RegistrySourceOption {
  value: SourceType;
  label: string;
  phase: SourcePhase;
}

/**
 * Source types a human may register, in display order. A curated subset of the
 * enum — system/engine values (`email`, `lead_hunter`, `bexio`) are omitted
 * from manual creation but still render if present.
 */
export const REGISTRY_SOURCE_TYPE_OPTIONS: RegistrySourceOption[] = [
  "manual",
  "referral",
  "partner",
  "website",
  "import",
  "google",
  "other",
].map((value) => ({
  value: value as SourceType,
  label: SOURCE_TYPE_META[value as SourceType].label,
  phase: SOURCE_TYPE_META[value as SourceType].phase,
}));

/** Whitelist of values accepted by the server action (defence in depth). */
export const REGISTRY_SOURCE_TYPE_VALUES: SourceType[] =
  REGISTRY_SOURCE_TYPE_OPTIONS.map((o) => o.value);

export interface SourcePreset {
  label: string;
  type: SourceType;
  note: string;
}

/**
 * One-click presets that pre-fill the form (human stays in control — only empty
 * fields are filled, everything stays editable). These mirror the controlled
 * source examples; the "(später)" ones are explicitly future, gated phases with
 * NO query running today.
 */
export const SOURCE_PRESETS: SourcePreset[] = [
  { label: "Manuell", type: "manual", note: "Manuell recherchierte Quelle." },
  {
    label: "Empfehlung",
    type: "referral",
    note: "Empfehlung / Weiterempfehlung durch Kunden oder Partner.",
  },
  {
    label: "Bauprojekt",
    type: "other",
    note: "Bauprojekt / Neubau – manuell geprüft (Automatisierung später).",
  },
  {
    label: "Praxis / Ärzte",
    type: "other",
    note: "Praxis- / Ärzteverzeichnis – manuell geprüft.",
  },
  {
    label: "Verwaltung",
    type: "partner",
    note: "Liegenschaftsverwaltung / Behörde.",
  },
  {
    label: "Ausschreibung",
    type: "other",
    note: "Öffentliche Ausschreibung / SIMAP – spätere Phase.",
  },
  {
    label: "Google / Maps (später)",
    type: "google",
    note: "Google Places / Maps – geplante API-Phase, aktuell keine Abfrage.",
  },
  {
    label: "ZEFIX (später)",
    type: "other",
    note: "ZEFIX / Handelsregister – geplante Register-Phase, aktuell keine Abfrage.",
  },
];

/**
 * Ready/inactive badge for a registry entry. These manual channels do NOT run a
 * search by themselves, so an enabled entry reads "Bereit" (ready to work),
 * never a misleading "Aktiv" (automatic sources live on the Lead Radar).
 */
export function enabledBadge(enabled: boolean): {
  label: string;
  className: string;
} {
  return enabled
    ? { label: "Bereit", className: "bg-blue-50 text-blue-700 ring-blue-200" }
    : { label: "Inaktiv", className: "bg-slate-100 text-slate-500 ring-slate-200" };
}
