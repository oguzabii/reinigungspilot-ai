/**
 * Baugesuche Zürich signal adapter (v0.5.4). SERVER-ONLY.
 *
 * Turns official building-permit / construction-project records into opportunity
 * signals ("this project suggests cleaning potential — Baureinigung,
 * Fensterreinigung, …").
 *
 * SOURCE RULES (hard):
 *   - OFFICIAL open-data / API JSON ONLY. The endpoint is OWNER-CONFIGURED via
 *     `BAUGESUCHE_ZH_SIGNAL_URL` (and optional `BAUGESUCHE_ZH_API_KEY`). We do NOT
 *     hardcode/guess an endpoint — the owner points this at a *validated* official
 *     feed (e.g. an opendata.swiss / Kanton Zürich / Stadt Zürich Bauprojekt-/
 *     Baugesuch-Dataset or OGC API Features / GeoJSON endpoint).
 *   - NO website scraping, NO HTML parsing, NO PDF parsing, NO headless browser.
 *   - Missing URL → `not_configured`; the app keeps working.
 *   - Hard result cap, request timeout, key never logged / never to the client.
 *
 * HONESTY: timing is `exact` only when a record carries a real date (labelled as
 * what it is — a permit/publication date, NOT a fabricated completion date);
 * otherwise it is inferred. We never invent project-completion dates.
 *
 * Expected response shape (documented contract). The configured endpoint should
 * return JSON as one of:
 *   - a GeoJSON `FeatureCollection` (`features[].properties`), or
 *   - a plain array of record objects, or
 *   - `{ records: [...] }` / `{ results: [...] }`.
 * Per record we read these keys (with common German aliases):
 *   title:  title | bezeichnung | projekt | zweck | beschreibung
 *   region: gemeinde | ort | region | plz_ort
 *   place:  adresse | strasse | standort
 *   type:   art | kategorie | projekttyp | bauart
 *   date:   datum | eingangsdatum | publikationsdatum | entscheiddatum | date
 *   url:    url | link | permalink
 */

import type { RawSignal, AdapterRunInput, AdapterRunResult } from "@/lib/discovery/adapters";

const MAX_RESULTS = 10;
const REQUEST_TIMEOUT_MS = 8000;

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** True if the Baugesuche source endpoint is configured (server-side). */
export function isBaugesucheConfigured(): boolean {
  return Boolean(readEnv("BAUGESUCHE_ZH_SIGNAL_URL"));
}

type Rec = Record<string, unknown>;

function pickString(rec: Rec, keys: string[]): string | null {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

/** Normalise common date strings to YYYY-MM-DD; return null if not a date. */
function normaliseDate(s: string | null): string | null {
  if (!s) return null;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ch = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/); // DD.MM.YYYY
  if (ch) return `${ch[3]}-${ch[2]}-${ch[1]}`;
  return null;
}

/** Project text → service potential (canonical Clean24 vocabulary). */
function servicesForProject(typeText: string): string[] {
  const t = typeText.toLowerCase();
  if (/(mehrfamilien|wohnüberbauung|wohnbau|wohnhaus|wohnung|mfh|überbauung)/.test(t)) {
    return ["Umzugsreinigung", "Fensterreinigung", "Treppenhausreinigung", "Hauswartung"];
  }
  if (/(gewerbe|büro|buro|geschäft|industrie|verwaltung|gewerblich)/.test(t)) {
    return ["Büroreinigung", "Fensterreinigung", "Hauswartung"];
  }
  // Neubau / Umbau / Sanierung (default construction)
  return ["Bauendreinigung", "Fensterreinigung", "Hauswartung"];
}

/** Pull a record list out of the documented response shapes. */
function extractRecords(data: unknown): Rec[] {
  if (Array.isArray(data)) return data as Rec[];
  if (data && typeof data === "object") {
    const o = data as Rec;
    if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
      return (o.features as Rec[])
        .map((f) => (f && typeof f === "object" ? ((f.properties as Rec) ?? {}) : {}))
        .filter((p) => Object.keys(p).length > 0);
    }
    if (Array.isArray(o.records)) return o.records as Rec[];
    if (Array.isArray(o.results)) return o.results as Rec[];
  }
  return [];
}

function mapRecord(rec: Rec): RawSignal | null {
  const title = pickString(rec, ["title", "bezeichnung", "projekt", "zweck", "beschreibung"]);
  if (!title) return null;

  const region = pickString(rec, ["gemeinde", "ort", "region", "plz_ort"]);
  const place = pickString(rec, ["adresse", "strasse", "standort"]);
  const typeText = [
    pickString(rec, ["art", "kategorie", "projekttyp", "bauart"]) ?? "",
    title,
  ].join(" ");
  const date = normaliseDate(pickString(rec, ["datum", "eingangsdatum", "publikationsdatum", "entscheiddatum", "date"]));
  const url = pickString(rec, ["url", "link", "permalink"]);

  return {
    title: title.slice(0, 200),
    summary: place ? place.slice(0, 300) : null,
    sourceUrl: url ? url.slice(0, 400) : null,
    region: region ? region.slice(0, 120) : null,
    locationText: place ? place.slice(0, 200) : null,
    signalType: "construction",
    timingLabel: date
      ? `Baugesuch-Datum ${date} (exakt). Endreinigung folgt später – Zeitpunkt schätzen.`
      : "Kein Quelldatum – Bauprojekt deutet auf späteren Endreinigungs-Bedarf (geschätzt).",
    timingDate: date,
    timingIsInferred: !date,
    suggestedServices: servicesForProject(typeText),
  };
}

/**
 * Fetch a capped number of recent building/permit/project records from the
 * configured official endpoint and normalise them to `RawSignal`s. Never throws
 * (failures map to `status: "error"`); fetches JSON only.
 */
export async function runBaugesucheZh(input: AdapterRunInput): Promise<AdapterRunResult> {
  const url = readEnv("BAUGESUCHE_ZH_SIGNAL_URL");
  if (!url) return { status: "not_configured", signals: [] };
  const apiKey = readEnv("BAUGESUCHE_ZH_API_KEY");
  const limit = Math.min(MAX_RESULTS, Math.max(1, input.limit ?? MAX_RESULTS));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return { status: "error", signals: [], message: `Baugesuche-Quelle antwortete mit Status ${res.status}.` };
    }
    const data = (await res.json()) as unknown;
    const records = extractRecords(data).slice(0, limit);
    const signals = records.map(mapRecord).filter((s): s is RawSignal => s !== null);
    return { status: "ok", signals };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: "error",
      signals: [],
      message: aborted
        ? "Baugesuche-Anfrage hat das Zeitlimit überschritten."
        : "Baugesuche-Anfrage fehlgeschlagen.",
    };
  } finally {
    clearTimeout(timer);
  }
}
