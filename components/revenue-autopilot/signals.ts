/**
 * Opportunity Signal Engine — "Warum jetzt?" revenue intelligence (v0.5.3).
 *
 * PURE and deterministic. It turns a plain candidate/opportunity into a richer
 * "signal": why it matters now, which Clean24 services fit, a confidence score,
 * a timing window, and the next action. Offline only — no AI, no API, no
 * network, no clock dependency (created_at comes from the row).
 *
 * HONESTY RULES (hard):
 *   - We NEVER claim an exact construction-completion / tender date unless a
 *     source actually provides it. Computed timing is labelled `inferred`
 *     ("geschätzt"); when there is no basis at all it is `unknown`.
 *   - Every signal carries: source, why-now, suggested service(s), confidence,
 *     next action, and whether timing is exact / inferred / unknown.
 *
 * v0.5.3 builds signals from EXISTING discovered/manual candidates (`prospects`).
 * Future official adapters (Baugesuche / SIMAP / ZEFIX) will feed the same
 * `OpportunitySignal` shape — see `lib/discovery/adapters.ts`.
 */

import type { OpportunityListItem } from "@/lib/auth/tenant-data";
import { matchServices } from "@/components/lead-hunter/scoring";

export type SignalType =
  | "construction"
  | "verwaltung"
  | "tender"
  | "new_company"
  | "business";

export type TimingConfidence = "exact" | "inferred" | "unknown";

export interface OpportunitySignal {
  id: string;
  title: string;
  signalType: SignalType;
  /** Display source key (e.g. the prospect's source_type). */
  sourceType: string;
  sourceName: string;
  sourceUrl: string | null;
  region: string | null;
  suggestedServices: string[];
  whyNow: string;
  timingLabel: string;
  timingConfidence: TimingConfidence;
  confidenceScore: number;
  nextAction: string;
  /** The prospect this signal was derived from (so the owner can act on it). */
  relatedProspectId: string | null;
  createdAt: string;
}

export interface SignalTypeMeta {
  label: string;
  /** Tailwind badge classes (bg + text + ring). */
  className: string;
}

export const SIGNAL_TYPE_META: Record<SignalType, SignalTypeMeta> = {
  construction: { label: "Bauprojekt", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  verwaltung: { label: "Verwaltung", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  tender: { label: "Ausschreibung", className: "bg-violet-50 text-violet-700 ring-violet-200" },
  new_company: { label: "Neugründung", className: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
  business: { label: "Betrieb", className: "bg-slate-100 text-slate-600 ring-slate-200" },
};

export const TIMING_META: Record<TimingConfidence, SignalTypeMeta> = {
  exact: { label: "Exakt", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  inferred: { label: "Geschätzt", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  unknown: { label: "Kein Timing", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

/** Suggested services per signal type (canonical Clean24 vocabulary). */
const SERVICE_BY_TYPE: Record<SignalType, string[]> = {
  construction: ["Bauendreinigung", "Fensterreinigung", "Hauswartung"],
  verwaltung: ["Treppenhausreinigung", "Hauswartung", "Umzugsreinigung", "Fensterreinigung"],
  tender: ["Büroreinigung", "Treppenhausreinigung", "Hauswartung"],
  new_company: ["Büroreinigung"],
  business: ["Büroreinigung"],
};

const KW: Record<Exclude<SignalType, "business">, string[]> = {
  tender: ["ausschreibung", "tender", "simap", "submission", "vergabe", "öffentlich"],
  construction: [
    "neubau", "rohbau", "umbau", "überbauung", "wohnüberbauung", "baustelle",
    "sanierung", "mehrfamilien", "mfh", "bauprojekt", "bau ", "baugesuch",
  ],
  verwaltung: ["verwaltung", "liegenschaft", "immobilien", "hausverwaltung", "stwe", "stockwerkeigentum"],
  new_company: ["neugründung", "gegründet", "neu eröffnet", "handelsregister", "zefix", "start-up", "startup"],
};

/** Deterministically classify a candidate into a signal type from its text. */
export function classifySignal(text: string): SignalType {
  const t = ` ${text.toLowerCase()} `;
  if (KW.tender.some((k) => t.includes(k))) return "tender";
  if (KW.construction.some((k) => t.includes(k))) return "construction";
  if (KW.verwaltung.some((k) => t.includes(k))) return "verwaltung";
  if (KW.new_company.some((k) => t.includes(k))) return "new_company";
  return "business";
}

const WHY_NOW: Record<SignalType, string> = {
  construction:
    "Bauprojekt: Vor Bezug/Übergabe braucht es eine Bauend- und Fensterreinigung – jetzt positionieren, bevor die Vergabe läuft.",
  verwaltung:
    "Liegenschaftsverwaltung: wiederkehrender Bedarf (Treppenhaus, Unterhalt, Umzugsreinigung bei Mieterwechsel) – planbarer, warmer Umsatz.",
  tender:
    "Öffentliche Ausschreibung: konkreter, fristgebundener Auftrag – Eignung prüfen und fristgerecht eingeben.",
  new_company:
    "Neuer Betrieb: braucht früh eine Reinigungslösung – als erster Anbieter präsent sein.",
  business:
    "Entdeckter Betrieb im Einzugsgebiet – möglicher Bedarf für Unterhalts-/Büroreinigung; Bedarf prüfen.",
};

const TIMING: Record<SignalType, { label: string; confidence: TimingConfidence }> = {
  construction: {
    label: "Endreinigung üblicherweise zum Bauabschluss – Zeitpunkt erfragen/schätzen (geschätzt).",
    confidence: "inferred",
  },
  tender: {
    label: "Fristgebunden – die Eingabefrist aus der Quelle prüfen (geschätzt).",
    confidence: "inferred",
  },
  verwaltung: {
    label: "Wiederkehrender Unterhaltsbedarf – laufend relevant (geschätzt).",
    confidence: "inferred",
  },
  new_company: {
    label: "Neugründungen brauchen früh Reinigungslösungen (geschätzt).",
    confidence: "inferred",
  },
  business: {
    label: "Kein Zeitfenster – die Quelle liefert kein Timing.",
    confidence: "unknown",
  },
};

const NEXT_ACTION: Record<SignalType, string> = {
  construction: "Bauleitung/Generalunternehmer kontaktieren und Termin für die Bauendreinigung anfragen.",
  verwaltung: "Verwaltung kontaktieren und Offerte für Unterhalt/Treppenhaus anbieten.",
  tender: "Ausschreibungsunterlagen prüfen, Eignung klären und Eingabefrist notieren.",
  new_company: "Betrieb kontaktieren und eine Reinigungslösung anbieten.",
  business: "Kontakt prüfen, Bedarf klären und Offerte vorbereiten.",
};

const BASE_CONFIDENCE: Record<SignalType, number> = {
  tender: 75,
  construction: 70,
  verwaltung: 60,
  new_company: 50,
  business: 35,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

const SOURCE_NAME: Record<string, string> = {
  google: "Google Places (entdeckt)",
  manual: "Manuell erfasst",
  referral: "Empfehlung",
  partner: "Partner / Verwaltung",
  website: "Website / Portal",
  import: "Import / Liste",
  email: "E-Mail / Anfrage",
  other: "Verzeichnis / Register",
  bexio: "bexio",
  lead_hunter: "Lead Hunter",
};

/** Build an OpportunitySignal from a discovered/manual prospect. */
export function signalFromProspect(p: OpportunityListItem): OpportunitySignal {
  const text = `${p.name} ${p.category ?? ""} ${p.servicePotential ?? ""} ${p.region ?? ""}`;
  const signalType = classifySignal(text);

  // Service suggestion: deterministic keyword match first, else type default.
  const matched = matchServices({
    name: p.name,
    category: p.category ?? "Manuell",
    region: p.region ?? "",
    servicePotential: p.servicePotential ?? "",
    sourceType: p.sourceType,
    score: p.score,
  });
  const services =
    matched.length > 0
      ? Array.from(new Set([...matched, ...SERVICE_BY_TYPE[signalType]])).slice(0, 4)
      : SERVICE_BY_TYPE[signalType];

  // Confidence: base by type, plus modest, honest enrichment.
  let confidence = BASE_CONFIDENCE[signalType];
  if (p.region && p.region.trim()) confidence += 5;
  confidence += Math.min(matched.length * 4, 12);
  if (p.sourceType === "referral" || p.sourceType === "partner") confidence += 10;
  if (p.score !== null && p.score >= 70) confidence += 8;
  // Google-Places-only stays lower unless enriched by keyword/type signals.
  if (signalType === "business" && p.sourceType === "google") confidence -= 5;
  const confidenceScore = clamp(Math.round(confidence), 0, 100);

  const timing = TIMING[signalType];

  return {
    id: `sig-${p.id}`,
    title: p.name,
    signalType,
    sourceType: p.sourceType,
    sourceName: SOURCE_NAME[p.sourceType] ?? p.sourceType,
    sourceUrl: null,
    region: p.region,
    suggestedServices: services,
    whyNow: WHY_NOW[signalType],
    timingLabel: timing.label,
    timingConfidence: timing.confidence,
    confidenceScore,
    nextAction: NEXT_ACTION[signalType],
    relatedProspectId: p.id,
    createdAt: p.createdAt,
  };
}

/**
 * Build signals from the tenant's open (not-yet-promoted) prospects, strongest
 * first. Promoted opportunities already live in the Lead Inbox, so they are not
 * surfaced as fresh signals.
 */
export function buildSignalsFromProspects(
  prospects: OpportunityListItem[],
): OpportunitySignal[] {
  return prospects
    .filter((p) => p.promotedLeadId === null)
    .map(signalFromProspect)
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/** Confidence → badge classes (bg + text + ring). */
export function confidenceBadge(score: number): string {
  if (score >= 70) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (score >= 45) return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

/* -------------------------------------------------------------------------- */
/* Adapter-sourced signals (v0.5.4)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Structural input a source adapter (e.g. Baugesuche Zürich) provides per record.
 * Compatible with `RawSignal` in `lib/discovery/adapters.ts`. Kept inline so the
 * pure engine has NO dependency on the (server-side) adapter modules.
 */
export interface RawSignalInput {
  title: string;
  region: string | null;
  locationText?: string | null;
  signalType: SignalType;
  suggestedServices: string[];
  sourceUrl: string | null;
  /** Source-provided timing (e.g. a permit/publication date), or null. */
  timingLabel: string | null;
  timingDate: string | null;
  /** True when timing is inferred (no exact source date). */
  timingIsInferred: boolean;
}

/**
 * Convert an adapter `RawSignal` into an `OpportunitySignal`. The source already
 * provides the type + suggested services + (optional) timing; the engine adds the
 * why-now framing, a deterministic confidence, and the timing güte.
 *
 * HONESTY: timing is `exact` ONLY when the source supplies a real date (and the
 * label says WHAT that date is — a permit/publication date, not a fabricated
 * completion date). Otherwise it is `inferred`/`unknown`.
 */
export function signalFromRawSignal(
  raw: RawSignalInput,
  opts: { idPrefix: string; index: number; sourceType: string; sourceName: string; nowIso: string },
): OpportunitySignal {
  const services =
    raw.suggestedServices.length > 0 ? raw.suggestedServices : SERVICE_BY_TYPE[raw.signalType];

  let confidence = BASE_CONFIDENCE[raw.signalType];
  if (raw.region && raw.region.trim()) confidence += 5;
  confidence += Math.min(services.length * 3, 9);
  if (raw.timingDate && !raw.timingIsInferred) confidence += 8; // a real source date
  const confidenceScore = clamp(Math.round(confidence), 0, 100);

  const timingConfidence: TimingConfidence =
    raw.timingDate && !raw.timingIsInferred
      ? "exact"
      : raw.timingIsInferred
        ? "inferred"
        : "unknown";
  const timingLabel =
    raw.timingLabel ??
    (timingConfidence === "exact"
      ? `Quelldatum ${raw.timingDate} (exakt) – konkreter Zeitpunkt der Reinigung schätzen.`
      : "Kein Zeitfenster aus der Quelle.");

  return {
    id: `${opts.idPrefix}-${opts.index}`,
    title: raw.title,
    signalType: raw.signalType,
    sourceType: opts.sourceType,
    sourceName: opts.sourceName,
    sourceUrl: raw.sourceUrl,
    region: raw.region,
    suggestedServices: services,
    whyNow: WHY_NOW[raw.signalType],
    timingLabel,
    timingConfidence,
    confidenceScore,
    nextAction: NEXT_ACTION[raw.signalType],
    relatedProspectId: null,
    createdAt: opts.nowIso,
  };
}

/** Opportunity-form category for a signal type (whitelisted in OPPORTUNITY_TYPES). */
export function categoryForSignalType(signalType: SignalType): string {
  switch (signalType) {
    case "construction":
      return "Neubau";
    case "tender":
      return "Ausschreibung";
    case "verwaltung":
      return "Verwaltung";
    default:
      return "Firma";
  }
}
