/**
 * Source Execution Queue — controlled, manual source workflow (v0.5.0).
 *
 * PURE and deterministic. Given the tenant's enabled `lead_sources`, it derives
 * a suggested *execution task* per source: a concrete, human-sized next step
 * ("≈5 Liegenschaftsverwaltungen recherchieren") plus a link into the right
 * Klarsa page (the pre-filled "Opportunity aus Quelle"-Formular).
 *
 * HARD GUARDRAILS — this NEVER performs any lookup:
 *   - NO external API, NO Google/Maps/ZEFIX/SIMAP, NO scraping, NO network.
 *   - The suggested target counts (≈5, ≈3) are *coaching nudges*, not data and
 *     not a claim that those records exist. The human researches externally and
 *     enters each opportunity manually via the linked capture form.
 */

import type { LeadSourceListItem } from "@/lib/auth/tenant-data";
import type { SourceType } from "@/lib/database-types";

export interface SourceTask {
  sourceId: string;
  sourceLabel: string;
  sourceType: SourceType;
  /** Suggested action headline, e.g. "≈5 Verwaltungen recherchieren". */
  action: string;
  /** Why / how — a short, honest hint. No automation runs. */
  hint: string;
  /** Link into the pre-filled capture form for this source. */
  href: string;
}

interface Playbook {
  target: number;
  verb: string;
  hint: string;
}

/**
 * Per source type: a suggested research target + verb + hint. Deterministic and
 * conservative — it tells a *person* what to look at, nothing more.
 */
const TYPE_PLAYBOOK: Record<SourceType, Playbook> = {
  partner: {
    target: 5,
    verb: "Liegenschaftsverwaltungen kontaktieren",
    hint: "Bestehende Verwaltungen / Partner nach Treppenhaus- & Unterhaltsreinigung fragen.",
  },
  referral: {
    target: 3,
    verb: "Empfehlungen einholen",
    hint: "Zufriedene Kunden um eine konkrete Weiterempfehlung mit Ansprechperson bitten.",
  },
  website: {
    target: 4,
    verb: "Portal-Kandidaten prüfen",
    hint: "Im freigegebenen Portal passende Anfragen sichten und manuell erfassen.",
  },
  import: {
    target: 5,
    verb: "Listen-Kandidaten durchgehen",
    hint: "Eigene Liste sichten und passende Betriebe als Opportunity erfassen.",
  },
  google: {
    target: 4,
    verb: "Büroreinigung-Kandidaten recherchieren",
    hint: "Betriebe im Einzugsgebiet manuell prüfen – keine automatische Abfrage.",
  },
  other: {
    target: 3,
    verb: "Verzeichnis-Kandidaten prüfen",
    hint: "Bauprojekte / Ausschreibungen / Praxen manuell sichten und erfassen.",
  },
  manual: {
    target: 2,
    verb: "Recherche-Kandidaten festhalten",
    hint: "Manuell recherchierte Chancen als Opportunity erfassen.",
  },
  email: {
    target: 1,
    verb: "Eingehende Anfragen prüfen",
    hint: "Anfragen sichten und passende als Opportunity erfassen.",
  },
  lead_hunter: {
    target: 3,
    verb: "Kandidaten prüfen",
    hint: "Vorgemerkte Kandidaten manuell prüfen und erfassen.",
  },
  bexio: {
    target: 2,
    verb: "Bestandskunden prüfen",
    hint: "Bestehende Kontakte auf Zusatzbedarf prüfen und erfassen.",
  },
};

/**
 * Build the suggested execution tasks from the enabled lead sources. Disabled
 * sources are skipped. Sorted by suggested target (biggest opportunity first).
 */
export function buildSourceTasks(sources: LeadSourceListItem[]): SourceTask[] {
  return sources
    .filter((s) => s.enabled)
    .map((s) => {
      const pb = TYPE_PLAYBOOK[s.type] ?? TYPE_PLAYBOOK.manual;
      return {
        task: {
          sourceId: s.id,
          sourceLabel: s.label,
          sourceType: s.type,
          action: `≈${pb.target} ${pb.verb}`,
          hint: s.notes?.trim() ? s.notes.trim() : pb.hint,
          href: `/app-shell/lead-hunter?source=${s.id}`,
        },
        target: pb.target,
      };
    })
    .sort((a, b) => b.target - a.target)
    .map((x) => x.task);
}
