/**
 * Baugesuche Zürich signal adapter (v0.5.4, CSV support v0.5.4.1). SERVER-ONLY.
 *
 * Turns official building-permit / construction-project records into opportunity
 * signals ("this project suggests cleaning potential — Baureinigung,
 * Fensterreinigung, …").
 *
 * SOURCE RULES (hard):
 *   - OFFICIAL open-data feed ONLY, OWNER-CONFIGURED via `BAUGESUCHE_ZH_SIGNAL_URL`
 *     (and optional `BAUGESUCHE_ZH_API_KEY`). We do NOT hardcode/guess an endpoint.
 *     The validated official Kanton Zürich dataset is a **CSV** download, e.g.
 *     `https://daten.statistik.zh.ch/ogd/daten/ressourcen/KTZH_00002982_00006183.csv`.
 *   - Supports **CSV** (semicolon/comma, quoted values) AND **JSON** (GeoJSON
 *     FeatureCollection / array / `{records}` / `{results}`), auto-detected by
 *     content-type or a `.csv` URL.
 *   - NO website scraping, NO HTML parsing, NO PDF parsing, NO headless browser.
 *   - Missing URL → `not_configured`; unknown schema → `unsupported_schema` (with
 *     detected column names as a safe diagnostic — never values/secrets).
 *   - Hard caps (rows scanned + text size + result count), 8 s timeout, key never
 *     logged / never to the client.
 *
 * HONESTY: a record's source date (a Baugesuch/publication date) is treated as
 * exact and labelled as what it IS — NOT a project-completion date. Completion
 * timing stays inferred unless an actual completion date is present. We never
 * fabricate a completion date.
 */

import type { RawSignal, AdapterRunInput, AdapterRunResult } from "@/lib/discovery/adapters";

const MAX_RESULTS = 10;
const REQUEST_TIMEOUT_MS = 8000;
/** Cap on data rows parsed from a CSV (bounds work on large official files). */
const MAX_ROWS_SCAN = 2000;
/**
 * Cap on characters kept from a CSV body (memory guard). The official Kanton
 * Zürich Baugesuche CSV is about 8 MB; the guard is set slightly above that so
 * the full official feed is accepted, while still bounding memory.
 */
const MAX_TEXT_CHARS = 12_000_000;

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

/** Lowercase + trim object keys so alias lookups work for CSV and JSON alike. */
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

/**
 * First non-empty value among keys that START WITH any of `prefixes` and CONTAIN
 * any of `contains` (lowercased). Used for the flattened nested feed columns like
 * `buildingContractor_companyName` / `projectFramer_name` without hardcoding the
 * exact sub-field names.
 */
function pickPrefixed(rec: Rec, prefixes: string[], contains: string[]): string | null {
  for (const key of Object.keys(rec)) {
    if (!prefixes.some((p) => key.startsWith(p))) continue;
    if (contains.length > 0 && !contains.some((c) => key.includes(c))) continue;
    const v = rec[key];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
}

/** Normalise common date strings to YYYY-MM-DD; return null if not a date. */
function normaliseDate(s: string | null): string | null {
  if (!s) return null;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ch = s.match(/(\d{2})\.(\d{2})\.(\d{4})/); // DD.MM.YYYY
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

/** Pull a record list out of the documented JSON response shapes. */
function extractJsonRecords(data: unknown): Rec[] {
  let raw: Rec[] = [];
  if (Array.isArray(data)) raw = data as Rec[];
  else if (data && typeof data === "object") {
    const o = data as Rec;
    if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
      raw = (o.features as Rec[])
        .map((f) => (f && typeof f === "object" ? ((f.properties as Rec) ?? {}) : {}))
        .filter((p) => Object.keys(p).length > 0);
    } else if (Array.isArray(o.records)) raw = o.records as Rec[];
    else if (Array.isArray(o.results)) raw = o.results as Rec[];
  }
  return raw.map(normaliseKeys);
}

/**
 * Minimal, dependency-free CSV parser. Detects `;` or `,` delimiter, supports
 * quoted values (with `""` escapes and embedded newlines), CRLF, and stops after
 * MAX_ROWS_SCAN data rows. Returns the raw header names (for diagnostics) and
 * records keyed by lowercased headers.
 */
function parseCsv(text: string): { columns: string[]; records: Rec[] } {
  const firstNl = text.indexOf("\n");
  const headerLine = firstNl === -1 ? text : text.slice(0, firstNl);
  const semis = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  const delim = semis >= commas ? ";" : ",";

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      if (rows.length > MAX_ROWS_SCAN + 1) break;
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return { columns: [], records: [] };

  const columns = rows[0].map((h) => h.trim());
  const norm = columns.map((h) => h.toLowerCase());
  const records: Rec[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length === 1 && cells[0].trim() === "") continue; // blank line
    const rec: Rec = {};
    for (let k = 0; k < norm.length; k++) rec[norm[k]] = (cells[k] ?? "").trim();
    records.push(rec);
    if (records.length >= MAX_ROWS_SCAN) break;
  }
  return { columns, records };
}

/** Defensive German field mapping (works for CSV + JSON; keys are lowercased). */
function mapRecord(rec: Rec): RawSignal | null {
  // Title / project description — incl. the official ZH OGD field names.
  const title = pickString(rec, [
    "projectdescription", "title", "bauvorhaben", "vorhaben", "beschreibung",
    "projekt", "bezeichnung", "zweck",
  ]);
  if (!title) return null;

  const region = pickString(rec, [
    "municipality_name", "gemeinde", "ort", "municipality", "region", "plz_ort",
    "projectlocation_address_town",
  ]);

  // Compose a clean address from the flattened projectLocation_address_* fields,
  // falling back to a single free-text address field.
  const street = pickString(rec, [
    "projectlocation_address_street", "strasse", "adresse", "lage", "address", "standort",
  ]);
  const houseNr = pickString(rec, ["projectlocation_address_housenumber", "hausnummer"]);
  const zip = pickString(rec, ["projectlocation_address_swisszipcode", "plz", "zip"]);
  const town = pickString(rec, ["projectlocation_address_town", "ort", "gemeinde"]);
  const streetFull = [street, houseNr].filter(Boolean).join(" ").trim();
  const place =
    [streetFull, [zip, town].filter(Boolean).join(" ").trim()]
      .filter((s) => s.length > 0)
      .join(", ") || null;

  // Optional public building-permit context (company, not private contact data).
  const contractor = pickPrefixed(
    rec,
    ["buildingcontractor", "bauherr", "projectframer", "bauherrschaft"],
    ["name", "company", "firma"],
  );

  const typeText = [
    pickString(rec, ["art", "kategorie", "type", "bauart", "projekttyp"]) ?? "",
    title,
  ].join(" ");
  const date = normaliseDate(
    pickString(rec, [
      "publicationdate", "publikationsdatum", "publikation", "eingangsdatum",
      "datum", "date", "entscheiddatum",
    ]),
  );
  const url = pickString(rec, ["url", "link", "permalink"]);

  const summaryParts = [place, contractor ? `Bauherrschaft: ${contractor}` : null].filter(
    Boolean,
  ) as string[];

  return {
    title: title.slice(0, 200),
    summary: summaryParts.length > 0 ? summaryParts.join(" · ").slice(0, 300) : null,
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

/** Newest source date first; dated records before undated ones. */
function byDateDesc(a: RawSignal, b: RawSignal): number {
  const da = a.timingDate ?? "";
  const db = b.timingDate ?? "";
  if (da && db) return db.localeCompare(da);
  if (da) return -1;
  if (db) return 1;
  return 0;
}

/**
 * Fetch a capped number of recent records from the configured official endpoint
 * (CSV or JSON) and normalise them to `RawSignal`s. Never throws (failures map to
 * `status: "error"`); fetches CSV/JSON only — no scraping/HTML/PDF.
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
        Accept: "text/csv, application/json;q=0.9, */*;q=0.5",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return { status: "error", signals: [], message: `Baugesuche-Quelle antwortete mit Status ${res.status}.` };
    }

    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    const urlPath = url.split("?")[0].toLowerCase();
    const isCsv = contentType.includes("csv") || urlPath.endsWith(".csv");

    let records: Rec[];
    let columns: string[];
    if (isCsv) {
      let text = await res.text();
      if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);
      const parsed = parseCsv(text);
      records = parsed.records;
      columns = parsed.columns;
    } else {
      const data = (await res.json()) as unknown;
      records = extractJsonRecords(data);
      columns = records[0] ? Object.keys(records[0]) : [];
    }

    const signals = records.map(mapRecord).filter((s): s is RawSignal => s !== null);

    if (signals.length === 0) {
      // Customer-facing message stays simple; detected columns are returned as
      // safe diagnostics for an optional technical view only (never values).
      return {
        status: "unsupported_schema",
        signals: [],
        message: "Keine passenden Bau-Signale gefunden.",
        diagnostics: { columns: columns.slice(0, 40) },
      };
    }

    signals.sort(byDateDesc);
    return { status: "ok", signals: signals.slice(0, limit) };
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
