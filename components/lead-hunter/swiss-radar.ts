/**
 * Swiss Opportunity Radar — pure, offline data helpers (v0.3.11).
 *
 * Maps manually-entered opportunity region text onto a stylised Swiss canton
 * layout for a radar-style visualisation. PURE and offline: no AI, no API, no
 * network, no map provider, no tiles, no geocoding, no randomness, no clock.
 * The canton positions are an approximate, decorative layout (a "radar", not a
 * GIS map). Unknown/blank regions fall into a neutral "Andere" bucket.
 *
 * Consumed by the protected `/app-shell/lead-hunter/radar` page, which renders a
 * static SVG from the RLS-filtered opportunities — nothing here fetches anything.
 */

export interface Canton {
  code: string;
  name: string;
  /** Normalised position on a stylised CH layout: x 0=west..100=east. */
  x: number;
  /** y 0=north..100=south. */
  y: number;
}

/** The 26 Swiss cantons with approximate, stylised radar coordinates. */
export const CANTONS: Canton[] = [
  { code: "GE", name: "Genf", x: 7, y: 84 },
  { code: "VD", name: "Waadt", x: 17, y: 66 },
  { code: "VS", name: "Wallis", x: 36, y: 90 },
  { code: "NE", name: "Neuenburg", x: 23, y: 49 },
  { code: "FR", name: "Freiburg", x: 29, y: 61 },
  { code: "JU", name: "Jura", x: 25, y: 30 },
  { code: "BE", name: "Bern", x: 35, y: 57 },
  { code: "SO", name: "Solothurn", x: 37, y: 39 },
  { code: "BL", name: "Basel-Landschaft", x: 34, y: 22 },
  { code: "BS", name: "Basel-Stadt", x: 33, y: 15 },
  { code: "AG", name: "Aargau", x: 45, y: 27 },
  { code: "LU", name: "Luzern", x: 46, y: 45 },
  { code: "OW", name: "Obwalden", x: 50, y: 56 },
  { code: "NW", name: "Nidwalden", x: 53, y: 53 },
  { code: "UR", name: "Uri", x: 58, y: 61 },
  { code: "ZG", name: "Zug", x: 54, y: 39 },
  { code: "ZH", name: "Zürich", x: 54, y: 27 },
  { code: "SH", name: "Schaffhausen", x: 54, y: 11 },
  { code: "TG", name: "Thurgau", x: 65, y: 19 },
  { code: "SG", name: "St. Gallen", x: 72, y: 33 },
  { code: "AR", name: "Appenzell A.Rh.", x: 70, y: 29 },
  { code: "AI", name: "Appenzell I.Rh.", x: 73, y: 32 },
  { code: "GL", name: "Glarus", x: 64, y: 43 },
  { code: "GR", name: "Graubünden", x: 81, y: 57 },
  { code: "TI", name: "Tessin", x: 70, y: 83 },
  { code: "SZ", name: "Schwyz", x: 59, y: 45 },
];

export const CANTON_BY_CODE: Record<string, Canton> = Object.fromEntries(
  CANTONS.map((c) => [c.code, c]),
);

/**
 * Region/city keywords → canton code, in priority order. Matched against the
 * lower-cased region text via `includes`, so more specific entries (e.g.
 * Basel-Landschaft before Basel-Stadt, Appenzell A.Rh. before Appenzell) come
 * first. Purely a local lookup table — no external lookup.
 */
const REGION_KEYWORDS: Array<{ code: string; keywords: string[] }> = [
  { code: "BL", keywords: ["basel-landschaft", "baselland", "liestal", "allschwil", "muttenz", "pratteln"] },
  { code: "BS", keywords: ["basel-stadt", "basel", "bâle"] },
  { code: "AR", keywords: ["ausserrhoden", "herisau", "teufen"] },
  { code: "AI", keywords: ["innerrhoden", "appenzell"] },
  { code: "ZH", keywords: ["zürich", "zurich", "zueri", "winterthur", "dietikon", "uster", "dübendorf"] },
  { code: "BE", keywords: ["bern", "berne", "thun", "biel", "bienne", "interlaken", "burgdorf"] },
  { code: "LU", keywords: ["luzern", "lucerne", "emmen", "kriens"] },
  { code: "GE", keywords: ["genf", "genève", "geneve", "geneva", "carouge"] },
  { code: "VD", keywords: ["waadt", "vaud", "lausanne", "montreux", "nyon", "yverdon", "morges", "vevey"] },
  { code: "VS", keywords: ["wallis", "valais", "sion", "sitten", "brig", "visp", "zermatt", "martigny", "monthey", "sierre"] },
  { code: "SG", keywords: ["st. gallen", "st.gallen", "sankt gallen", "gallen", "rapperswil", "wil", "gossau"] },
  { code: "TI", keywords: ["tessin", "ticino", "lugano", "bellinzona", "locarno", "mendrisio"] },
  { code: "ZG", keywords: ["zug", "baar", "cham"] },
  { code: "FR", keywords: ["freiburg", "fribourg", "bulle", "murten"] },
  { code: "SO", keywords: ["solothurn", "soleure", "olten", "grenchen"] },
  { code: "AG", keywords: ["aargau", "aarau", "baden", "wettingen", "wohlen", "rheinfelden"] },
  { code: "TG", keywords: ["thurgau", "frauenfeld", "kreuzlingen", "arbon", "amriswil"] },
  { code: "GR", keywords: ["graubünden", "grisons", "grigioni", "chur", "davos", "st. moritz", "moritz", "landquart"] },
  { code: "NE", keywords: ["neuenburg", "neuchâtel", "neuchatel", "chaux-de-fonds"] },
  { code: "SH", keywords: ["schaffhausen", "neuhausen"] },
  { code: "JU", keywords: ["jura", "delémont", "delemont", "porrentruy"] },
  { code: "GL", keywords: ["glarus"] },
  { code: "UR", keywords: ["uri", "altdorf"] },
  { code: "SZ", keywords: ["schwyz", "pfäffikon", "einsiedeln", "freienbach"] },
  { code: "OW", keywords: ["obwalden", "sarnen"] },
  { code: "NW", keywords: ["nidwalden", "stans"] },
];

/**
 * Deterministically map a free-text region/city to a canton code, or null if no
 * keyword matches (caller buckets those as "Andere"). Offline lookup only.
 */
export function cantonForRegion(region: string | null): string | null {
  if (!region) return null;
  const text = region.toLowerCase();
  for (const entry of REGION_KEYWORDS) {
    if (entry.keywords.some((k) => text.includes(k))) return entry.code;
  }
  return null;
}

/** Score → tone key (matches the radar/badge ramp). null = unscored. */
export function scoreTone(
  score: number | null,
): "none" | "low" | "mid" | "high" {
  if (score === null) return "none";
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

/** Score → SVG fill hex (for radar pins; inline so no Tailwind purge issues). */
export function scoreFill(score: number | null): string {
  switch (scoreTone(score)) {
    case "high":
      return "#10b981"; // emerald-500
    case "mid":
      return "#3b82f6"; // blue-500
    case "low":
      return "#f59e0b"; // amber-500
    default:
      return "#cbd5e1"; // slate-300
  }
}

/** Score → Tailwind badge classes (bg + text + ring), for the region cards. */
export function scoreToneBadge(score: number | null): string {
  switch (scoreTone(score)) {
    case "high":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "mid":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "low":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-500 ring-slate-200";
  }
}
