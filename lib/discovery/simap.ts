/**
 * SIMAP public-tender signal adapter (v0.5.15). SERVER-ONLY.
 *
 * Turns official public procurement tenders (öffentliche Ausschreibungen) into
 * opportunity signals for Clean24-relevant services (Reinigung / Gebäude- /
 * Unterhalts- / Umzugsreinigung / Hauswartung / Facility Services).
 *
 * SOURCE RULES (hard):
 *   - OFFICIAL SIMAP API ONLY, OWNER-CONFIGURED via `SIMAP_API_BASE_URL` (the
 *     full official query endpoint) + `SIMAP_API_TOKEN`. We do NOT hardcode or
 *     guess an endpoint, and we never crawl simap.ch HTML.
 *   - NO scraping, NO HTML/PDF parsing, NO headless browser, NO unofficial
 *     third-party scraper.
 *   - Missing config → `not_configured` ("Zugang erforderlich"); the app keeps
 *     working and never pretends the source is active.
 *   - Hard caps (result count), request timeout, token never logged / never sent
 *     to the client.
 *
 * HONESTY: a tender's submission deadline is treated as an exact, source-provided
 * date; without a deadline the timing is inferred. We never fabricate a date.
 */

import type { RawSignal, AdapterRunInput, AdapterRunResult } from "@/lib/discovery/adapters";

const MAX_RESULTS = 10;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_SCAN = 200;

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** True if the official SIMAP endpoint + token are configured (server-side). */
export function isSimapConfigured(): boolean {
  return Boolean(readEnv("SIMAP_API_BASE_URL") && readEnv("SIMAP_API_TOKEN"));
}

type Rec = Record<string, unknown>;

/** Clean24-relevant tender keywords (lowercased) + CPV cleaning-code prefixes. */
const RELEVANT = [
  "reinigung", "gebäudereinigung", "gebaeudereinigung", "unterhaltsreinigung",
  "umzugsreinigung", "büroreinigung", "bueroreinigung", "hauswart", "facility",
  "gebäudeunterhalt", "gebaeudeunterhalt", "unterhalt", "cleaning",
];
const CPV_PREFIXES = ["9090", "9091", "9092", "7973"]; // cleaning / facility CPV

function normaliseKeys(rec: Rec): Rec {
  const out: Rec = {};
  for (const k of Object.keys(rec)) out[k.trim().toLowerCase()] = rec[k];
  return out;
}

function pickString(rec: Rec, keys: string[]): string | null {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

function normaliseDate(s: string | null): string | null {
  if (!s) return null;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ch = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (ch) return `${ch[3]}-${ch[2]}-${ch[1]}`;
  return null;
}

/** Pull a record list out of common JSON response shapes. */
function extractRecords(data: unknown): Rec[] {
  let raw: Rec[] = [];
  if (Array.isArray(data)) raw = data as Rec[];
  else if (data && typeof data === "object") {
    const o = data as Rec;
    for (const key of ["records", "results", "content", "data", "items", "tenders"]) {
      if (Array.isArray(o[key])) {
        raw = o[key] as Rec[];
        break;
      }
    }
  }
  return raw.slice(0, MAX_SCAN).map(normaliseKeys);
}

function isRelevant(rec: Rec): boolean {
  const text = [
    pickString(rec, ["title", "projecttitle", "subject", "betreff", "bezeichnung", "name"]) ?? "",
    pickString(rec, ["description", "beschreibung", "summary"]) ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const cpv = pickString(rec, ["cpv", "cpvcode", "cpv_code"]) ?? "";
  if (CPV_PREFIXES.some((p) => cpv.replace(/\D/g, "").startsWith(p))) return true;
  return RELEVANT.some((k) => text.includes(k));
}

function mapRecord(rec: Rec): RawSignal | null {
  const title = pickString(rec, [
    "title", "projecttitle", "subject", "betreff", "bezeichnung", "name",
  ]);
  if (!title) return null;

  const buyer = pickString(rec, [
    "buyer", "authority", "contractingauthority", "auftraggeber",
    "beschaffungsstelle", "organisation", "vergabestelle",
  ]);
  const location = pickString(rec, [
    "location", "place", "ort", "region", "canton", "kanton", "erfuellungsort",
  ]);
  const deadline = normaliseDate(
    pickString(rec, ["deadline", "submissiondeadline", "eingabefrist", "frist", "duedate"]),
  );
  const published = normaliseDate(
    pickString(rec, ["publicationdate", "datepublished", "publikationsdatum", "date"]),
  );
  const url = pickString(rec, ["url", "link", "detailurl", "permalink"]);

  return {
    title: title.slice(0, 200),
    summary: buyer ? `Auftraggeber: ${buyer}`.slice(0, 300) : null,
    sourceUrl: url ? url.slice(0, 400) : null,
    region: location ? location.slice(0, 120) : null,
    locationText: location ? location.slice(0, 200) : null,
    signalType: "tender",
    timingLabel: deadline
      ? `Eingabefrist ${deadline} (exakt) – Eignung prüfen und fristgerecht eingeben.`
      : published
        ? `Publiziert ${published}. Eingabefrist aus der Ausschreibung prüfen.`
        : "Fristgebunden – Eingabefrist aus der Quelle prüfen (geschätzt).",
    timingDate: deadline ?? published,
    timingIsInferred: !deadline,
    suggestedServices: ["Unterhaltsreinigung", "Gebäudereinigung", "Büroreinigung", "Hauswartung"],
  };
}

/**
 * Fetch a capped list of public tenders from the configured official SIMAP
 * endpoint, filter to Clean24-relevant ones, and normalise to `RawSignal`s.
 * Never throws (failures map to `status: "error"`); JSON only — no scraping.
 */
export async function runSimap(input: AdapterRunInput): Promise<AdapterRunResult> {
  const url = readEnv("SIMAP_API_BASE_URL");
  const token = readEnv("SIMAP_API_TOKEN");
  if (!url || !token) {
    return {
      status: "not_configured",
      signals: [],
      message: "SIMAP: Zugang erforderlich – offizielle API noch nicht konfiguriert.",
    };
  }
  const limit = Math.min(MAX_RESULTS, Math.max(1, input.limit ?? MAX_RESULTS));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return { status: "error", signals: [], message: `SIMAP-Quelle antwortete mit Status ${res.status}.` };
    }
    const data = (await res.json()) as unknown;
    const records = extractRecords(data);
    const signals = records
      .filter(isRelevant)
      .map(mapRecord)
      .filter((s): s is RawSignal => s !== null);

    if (signals.length === 0) {
      return { status: "ok", signals: [], message: "Keine passenden Ausschreibungen gefunden." };
    }
    return { status: "ok", signals: signals.slice(0, limit) };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: "error",
      signals: [],
      message: aborted ? "SIMAP-Anfrage hat das Zeitlimit überschritten." : "SIMAP-Anfrage fehlgeschlagen.",
    };
  } finally {
    clearTimeout(timer);
  }
}
