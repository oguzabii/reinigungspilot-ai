/**
 * Source Execution Queue — controlled, manual source workflow (v0.5.0, extended
 * v0.5.1 with a guided execution detail per source).
 *
 * PURE and deterministic. Given the tenant's enabled `lead_sources`, it derives
 * a suggested *execution task* per source: a concrete, human-sized goal
 * ("Heute ≈5 Liegenschaftsverwaltungen recherchieren"), a research keyword and a
 * suggested Clean24 service, plus links into the guided execution cockpit and
 * the pre-filled capture form.
 *
 * HARD GUARDRAILS — this NEVER performs any lookup:
 *   - NO external API, NO Google/Maps/ZEFIX/SIMAP fetch, NO scraping, NO network.
 *   - The suggested target counts (≈5, ≈3) are *coaching nudges*, not data and
 *     not a claim that those records exist. The human researches externally
 *     (via user-opened links) and enters each opportunity manually.
 *   - The research keyword/service are suggestions to seed the human's own
 *     browser search and the capture form — they are NOT customer data.
 */

import type { LeadSourceListItem } from "@/lib/auth/tenant-data";
import type { SourceType } from "@/lib/database-types";

export interface SourceTask {
  sourceId: string;
  sourceLabel: string;
  sourceType: SourceType;
  /** Suggested research target count (coaching nudge, not data). */
  target: number;
  /** Full goal sentence, e.g. "Heute ≈5 Verwaltungen recherchieren". */
  goal: string;
  /** Short action headline for the queue, e.g. "≈5 Verwaltungen recherchieren". */
  action: string;
  /** Why / how — a short, honest hint. No automation runs. */
  hint: string;
  /** Default research keyword to seed the human's own browser search. */
  keyword: string;
  /** Suggested Clean24 service (from the service vocabulary) for capture. */
  service: string;
  /** Link to the guided execution cockpit for this source. */
  executeHref: string;
  /** Link to the pre-filled capture form for this source. */
  captureHref: string;
}

interface Playbook {
  target: number;
  verb: string;
  hint: string;
  /** Browser-search keyword (German). Empty → fall back to the source label. */
  keyword: string;
  /** Suggested service (matches `SERVICE_SUGGESTIONS`). */
  service: string;
}

/**
 * Per source type: a suggested research target + verb + hint + research keyword
 * + suggested service. Deterministic and conservative — it tells a *person* what
 * to look at, nothing more.
 */
const TYPE_PLAYBOOK: Record<SourceType, Playbook> = {
  partner: {
    target: 5,
    verb: "Liegenschaftsverwaltungen recherchieren",
    hint: "Verwaltungen / Partner nach Treppenhaus- & Unterhaltsreinigung fragen.",
    keyword: "Liegenschaftsverwaltung",
    service: "Treppenhausreinigung",
  },
  referral: {
    target: 3,
    verb: "Empfehlungen einholen",
    hint: "Zufriedene Kunden um eine konkrete Weiterempfehlung mit Ansprechperson bitten.",
    keyword: "Empfehlung Reinigung",
    service: "Umzugsreinigung",
  },
  website: {
    target: 4,
    verb: "Portal-Kandidaten prüfen",
    hint: "Im freigegebenen Portal passende Anfragen sichten und manuell erfassen.",
    keyword: "Reinigung Ausschreibung",
    service: "Büroreinigung",
  },
  import: {
    target: 5,
    verb: "Listen-Kandidaten durchgehen",
    hint: "Eigene Liste sichten und passende Betriebe als Opportunity erfassen.",
    keyword: "Reinigung Firma",
    service: "Büroreinigung",
  },
  google: {
    target: 4,
    verb: "Büroreinigung-Kandidaten recherchieren",
    hint: "Betriebe im Einzugsgebiet manuell prüfen – keine automatische Abfrage.",
    keyword: "Büro Gewerbe",
    service: "Büroreinigung",
  },
  other: {
    target: 3,
    verb: "Verzeichnis-Kandidaten prüfen",
    hint: "Bauprojekte / Ausschreibungen / Praxen manuell sichten und erfassen.",
    keyword: "Neubau Bauprojekt",
    service: "Bauendreinigung",
  },
  manual: {
    target: 2,
    verb: "Recherche-Kandidaten festhalten",
    hint: "Manuell recherchierte Chancen als Opportunity erfassen.",
    keyword: "Reinigung",
    service: "Umzugsreinigung",
  },
  email: {
    target: 1,
    verb: "Eingehende Anfragen prüfen",
    hint: "Anfragen sichten und passende als Opportunity erfassen.",
    keyword: "Reinigungsanfrage",
    service: "Umzugsreinigung",
  },
  lead_hunter: {
    target: 3,
    verb: "Kandidaten prüfen",
    hint: "Vorgemerkte Kandidaten manuell prüfen und erfassen.",
    keyword: "Reinigung",
    service: "Büroreinigung",
  },
  bexio: {
    target: 2,
    verb: "Bestandskunden prüfen",
    hint: "Bestehende Kontakte auf Zusatzbedarf prüfen und erfassen.",
    keyword: "Bestandskunde",
    service: "Hauswartung",
  },
};

/** Build the execution task for a single source (used by the execution cockpit). */
export function sourceTaskFor(source: LeadSourceListItem): SourceTask {
  const pb = TYPE_PLAYBOOK[source.type] ?? TYPE_PLAYBOOK.manual;
  return {
    sourceId: source.id,
    sourceLabel: source.label,
    sourceType: source.type,
    target: pb.target,
    goal: `Heute ≈${pb.target} ${pb.verb}`,
    action: `≈${pb.target} ${pb.verb}`,
    hint: source.notes?.trim() ? source.notes.trim() : pb.hint,
    keyword: pb.keyword,
    service: pb.service,
    executeHref: `/app-shell/lead-hunter/sources/${source.id}/execute`,
    captureHref: `/app-shell/lead-hunter?source=${source.id}`,
  };
}

/**
 * Build the suggested execution tasks from the enabled lead sources. Disabled
 * sources are skipped. Sorted by suggested target (biggest opportunity first).
 */
export function buildSourceTasks(sources: LeadSourceListItem[]): SourceTask[] {
  return sources
    .filter((s) => s.enabled)
    .map(sourceTaskFor)
    .sort((a, b) => b.target - a.target);
}
