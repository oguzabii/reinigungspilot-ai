/**
 * Deterministic Opportunity Radar scoring + service matching (v0.3.7).
 *
 * PURE and offline: no AI, no API, no network, no randomness, no clock. Given
 * the manually-entered signals (type, region, free text, source, score), it
 * returns matched Clean24 services, a "why interesting" factor breakdown, a
 * suggested score, and a recommended next action. Used both for the live
 * analysis panel in the capture form and for the badges on the list — the same
 * function, so the UI is consistent. The human keeps control; nothing is hidden
 * or auto-submitted, and there is NO external discovery.
 */

import type { SourceType } from "@/lib/database-types";
import { SERVICE_SUGGESTIONS, OPPORTUNITY_SOURCES } from "./opportunity-meta";

export interface OpportunitySignals {
  name: string;
  category: string; // opportunity type
  region: string;
  servicePotential: string;
  sourceType: string;
  score: number | null;
}

export interface ScoreFactor {
  label: string;
  detail: string;
  tone: "positive" | "neutral" | "hint";
}

export interface OpportunityAnalysis {
  matchedServices: string[];
  factors: ScoreFactor[];
  suggestedScore: number;
  whyInteresting: string;
  recommendedNextAction: string;
}

/** Keyword → service. Matched against the combined lower-cased free text. */
const KEYWORD_SERVICE_MAP: Array<{ service: string; keywords: string[] }> = [
  { service: "Umzugsreinigung", keywords: ["umzug", "auszug", "wohnungsübergabe", "wohnungsabgabe", "abgabe"] },
  { service: "Treppenhausreinigung", keywords: ["treppenhaus", "mehrfamilien", "liegenschaft", "stockwerk", "überbauung", "wohnüberbauung", "mfh"] },
  { service: "Hauswartung", keywords: ["hauswart", "hauswartung", "unterhalt", "umgebung", "winterdienst", "facility"] },
  { service: "Bauendreinigung", keywords: ["bau", "neubau", "rohbau", "umbau", "baustelle", "endreinigung", "bauend", "sanierung"] },
  { service: "Büroreinigung", keywords: ["büro", "office", "praxis", "kanzlei", "arztpraxis", "geschäft", "gewerbe"] },
  { service: "Fensterreinigung", keywords: ["fenster", "glas", "verglasung", "fassade", "schaufenster"] },
  { service: "Tiefgaragenreinigung", keywords: ["tiefgarage", "garage", "parking", "einstellhalle", "parkhaus"] },
];

/** Opportunity type → likely services. */
const TYPE_SERVICE_MAP: Record<string, string[]> = {
  Neubau: ["Bauendreinigung", "Fensterreinigung"],
  Praxis: ["Büroreinigung", "Fensterreinigung"],
  Verwaltung: ["Treppenhausreinigung", "Hauswartung", "Tiefgaragenreinigung"],
  Ausschreibung: ["Büroreinigung", "Treppenhausreinigung"],
  Firma: ["Büroreinigung"],
  Partner: [],
  Manuell: [],
};

/** Words that signal timing / urgency (a positive buying signal). */
const TIMING_WORDS = [
  "sofort", "dringend", "kurzfristig", "frist", "termin", "ausschreibung",
  "q1", "q2", "q3", "q4", "2025", "2026", "2027", "nächste woche", "bald",
  "januar", "februar", "märz", "april", "mai", "juni", "juli", "august",
  "september", "oktober", "november", "dezember",
];

const TYPE_INTENT: Record<string, { detail: string; weight: number }> = {
  Ausschreibung: { detail: "Konkreter, ausgeschriebener Bedarf – hohe Kaufabsicht.", weight: 25 },
  Neubau: { detail: "Bauprojekt – Bedarf für die Bauendreinigung absehbar.", weight: 20 },
  Verwaltung: { detail: "Liegenschaftsverwaltung – wiederkehrender Unterhaltsbedarf.", weight: 18 },
  Partner: { detail: "Über einen Partner – warme Einführung möglich.", weight: 15 },
  Firma: { detail: "Betrieb – möglicher Bedarf für Unterhaltsreinigung.", weight: 12 },
  Praxis: { detail: "Praxis/Standort – regelmässige Reinigung denkbar.", weight: 12 },
  Manuell: { detail: "Manuell erfasst – Bedarf offen.", weight: 4 },
};

const SOURCE_WEIGHT: Partial<Record<SourceType, number>> = {
  referral: 12,
  partner: 10,
  website: 4,
  google: 2,
  manual: 0,
  other: 0,
};

function sourceLabel(source: string): string {
  return OPPORTUNITY_SOURCES.find((s) => s.value === source)?.label ?? source;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Deterministic service matching from type + free-text keywords. */
export function matchServices(s: OpportunitySignals): string[] {
  const text = `${s.name} ${s.servicePotential} ${s.region}`.toLowerCase();
  const fromKeywords = KEYWORD_SERVICE_MAP.filter((m) =>
    m.keywords.some((k) => text.includes(k)),
  ).map((m) => m.service);
  const fromType = TYPE_SERVICE_MAP[s.category] ?? [];
  const set = new Set<string>([...fromKeywords, ...fromType]);
  // Stable order: follow the canonical service vocabulary.
  return SERVICE_SUGGESTIONS.filter((svc) => set.has(svc));
}

export function analyzeOpportunity(s: OpportunitySignals): OpportunityAnalysis {
  const text = `${s.name} ${s.servicePotential} ${s.region}`.toLowerCase();
  const matchedServices = matchServices(s);
  const hasTiming = TIMING_WORDS.some((w) => text.includes(w));
  const intent = TYPE_INTENT[s.category] ?? TYPE_INTENT.Manuell;
  const srcWeight = SOURCE_WEIGHT[s.sourceType as SourceType] ?? 0;

  const factors: ScoreFactor[] = [];
  factors.push({ label: `Typ: ${s.category || "—"}`, detail: intent.detail, tone: "positive" });
  if (s.region.trim()) {
    factors.push({
      label: `Region: ${s.region.trim()}`,
      detail: "Im Einzugsgebiet (Clean24 ist CH-weit tätig).",
      tone: "neutral",
    });
  }
  if (matchedServices.length > 0) {
    factors.push({
      label: "Service-Potenzial",
      detail: `Passende Services: ${matchedServices.join(", ")}.`,
      tone: "positive",
    });
  } else {
    factors.push({
      label: "Service-Potenzial",
      detail: "Noch kein klarer Service-Match – Bedarf manuell prüfen.",
      tone: "hint",
    });
  }
  if (hasTiming) {
    factors.push({
      label: "Timing",
      detail: "Zeit-/Terminsignal erkannt – zeitnah handeln.",
      tone: "positive",
    });
  }
  factors.push({
    label: `Quelle: ${sourceLabel(s.sourceType)}`,
    detail:
      srcWeight >= 10
        ? "Warme Quelle – höhere Abschlusswahrscheinlichkeit."
        : "Neutrale Quelle.",
    tone: srcWeight >= 10 ? "positive" : "neutral",
  });
  if (s.score !== null) {
    factors.push({
      label: `Eigener Score: ${s.score}`,
      detail: "Manuell vergebene Einschätzung.",
      tone: "neutral",
    });
  }

  // Deterministic suggested score (0–100).
  let suggested = 30;
  suggested += intent.weight;
  if (s.region.trim()) suggested += 5;
  suggested += Math.min(matchedServices.length * 6, 18);
  if (hasTiming) suggested += 12;
  suggested += srcWeight;
  const suggestedScore = clamp(Math.round(suggested), 0, 100);

  // "Warum interessant?" — one assembled sentence (for the reason auto-fill).
  const parts: string[] = [];
  parts.push(`${s.category || "Opportunity"}${s.region.trim() ? ` in ${s.region.trim()}` : ""}.`);
  parts.push(
    matchedServices.length > 0
      ? `Passende Services: ${matchedServices.join(", ")}.`
      : "Service-Bedarf noch zu klären.",
  );
  if (hasTiming) parts.push("Zeit-/Terminsignal vorhanden.");
  parts.push(`Quelle: ${sourceLabel(s.sourceType)}.`);
  const whyInteresting = parts.join(" ");

  return {
    matchedServices,
    factors,
    suggestedScore,
    whyInteresting,
    recommendedNextAction: nextActionFor(s.category, s.sourceType),
  };
}

function nextActionFor(category: string, source: string): string {
  const warm = source === "referral" || source === "partner";
  const base: Record<string, string> = {
    Ausschreibung: "Ausschreibungsunterlagen anfordern, Eignung prüfen und Eingabefrist notieren.",
    Neubau: "Bauleitung / Generalunternehmer kontaktieren und Termin für die Bauendreinigung anfragen.",
    Verwaltung: "Liegenschaftsverwaltung kontaktieren und Offerte für Unterhalt / Treppenhaus anbieten.",
    Praxis: "Standort kontaktieren und Bedarf für Unterhalts- / Büroreinigung klären.",
    Firma: "Ansprechperson im Betrieb kontaktieren und Reinigungsbedarf aufnehmen.",
    Partner: "Partner um eine konkrete Empfehlung / Kontaktvermittlung bitten.",
    Manuell: "Kontakt aufnehmen, Bedarf klären und Offerte vorbereiten.",
  };
  const action = base[category] ?? base.Manuell;
  return warm && category !== "Partner" ? `Warme Einführung nutzen: ${action}` : action;
}
