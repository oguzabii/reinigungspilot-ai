/**
 * ZEFIX (Swiss commercial register) adapter (v0.5.15). SERVER-ONLY.
 *
 * Two capabilities, both via the OFFICIAL ZEFIX REST API:
 *   A) Firm validation — confirm an official company name / UID and enrich with
 *      legal form + domicile.
 *   B) Company signals — a bounded search by name/keyword that surfaces matching
 *      firms as candidates (Gewerbereinigung-Potenzial).
 *
 * SOURCE RULES (hard):
 *   - OFFICIAL ZEFIX REST API ONLY, OWNER-CONFIGURED via `ZEFIX_API_BASE_URL`
 *     (+ `ZEFIX_API_TOKEN` OR `ZEFIX_API_USERNAME`/`ZEFIX_API_PASSWORD`). We do
 *     NOT scrape zefix.ch, do NOT bulk-download the register, and never pretend
 *     the source is active.
 *   - Missing config → `not_configured` ("Zugang erforderlich").
 *   - Hard result cap, request timeout, credentials never logged / never sent to
 *     the client. Respects official rate/usage limits (small, on-demand calls).
 */

import type { RawSignal, AdapterRunInput, AdapterRunResult } from "@/lib/discovery/adapters";

const MAX_RESULTS = 10;
const REQUEST_TIMEOUT_MS = 8000;

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** True if the official ZEFIX endpoint + a credential are configured. */
export function isZefixConfigured(): boolean {
  const base = readEnv("ZEFIX_API_BASE_URL");
  const hasAuth =
    Boolean(readEnv("ZEFIX_API_TOKEN")) ||
    Boolean(readEnv("ZEFIX_API_USERNAME") && readEnv("ZEFIX_API_PASSWORD"));
  return Boolean(base && hasAuth);
}

/** Build the Authorization header from a token or basic credentials. */
function authHeader(): Record<string, string> {
  const token = readEnv("ZEFIX_API_TOKEN");
  if (token) return { Authorization: `Bearer ${token}` };
  const user = readEnv("ZEFIX_API_USERNAME");
  const pass = readEnv("ZEFIX_API_PASSWORD");
  if (user && pass) {
    const b64 = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
    return { Authorization: `Basic ${b64}` };
  }
  return {};
}

type Rec = Record<string, unknown>;

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

function extractRecords(data: unknown): Rec[] {
  let raw: Rec[] = [];
  if (Array.isArray(data)) raw = data as Rec[];
  else if (data && typeof data === "object") {
    const o = data as Rec;
    for (const key of ["list", "results", "companies", "content", "data"]) {
      if (Array.isArray(o[key])) {
        raw = o[key] as Rec[];
        break;
      }
    }
  }
  return raw.map(normaliseKeys);
}

export interface ZefixMatch {
  name: string;
  uid: string | null;
  legalForm: string | null;
  domicile: string | null;
}

function mapCompany(rec: Rec): ZefixMatch | null {
  const name = pickString(rec, ["name", "companyname", "firmenname"]);
  if (!name) return null;
  return {
    name: name.slice(0, 200),
    uid: pickString(rec, ["uid", "uidformatted", "uid_formatted", "ehraid"]),
    legalForm: pickString(rec, ["legalform", "legalformname", "rechtsform"]),
    domicile: pickString(rec, ["legalseat", "domicile", "sitz", "ort", "legalseatname"]),
  };
}

/** POST a bounded company search to the configured official ZEFIX endpoint. */
async function searchZefix(name: string): Promise<{ status: "ok" | "error" | "not_configured"; matches: ZefixMatch[]; message?: string }> {
  const base = readEnv("ZEFIX_API_BASE_URL");
  if (!base || !isZefixConfigured()) return { status: "not_configured", matches: [] };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(base, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
      body: JSON.stringify({ name: name.slice(0, 120), maxEntries: MAX_RESULTS }),
      cache: "no-store",
    });
    if (!res.ok) {
      return { status: "error", matches: [], message: `ZEFIX antwortete mit Status ${res.status}.` };
    }
    const data = (await res.json()) as unknown;
    const matches = extractRecords(data)
      .map(mapCompany)
      .filter((m): m is ZefixMatch => m !== null)
      .slice(0, MAX_RESULTS);
    return { status: "ok", matches };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: "error",
      matches: [],
      message: aborted ? "ZEFIX-Anfrage hat das Zeitlimit überschritten." : "ZEFIX-Anfrage fehlgeschlagen.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Capability A — validate a company by name. Returns the best official match
 * (name / UID / legal form / domicile), or `not_found`. Used to confirm a lead's
 * company identity. Never throws.
 */
export async function validateZefixCompany(
  name: string,
): Promise<{ status: "ok" | "not_found" | "not_configured" | "error"; match: ZefixMatch | null; message?: string }> {
  if (!name.trim()) return { status: "not_found", match: null };
  const r = await searchZefix(name.trim());
  if (r.status === "not_configured") return { status: "not_configured", match: null };
  if (r.status === "error") return { status: "error", match: null, message: r.message };
  const exact =
    r.matches.find((m) => m.name.toLowerCase() === name.trim().toLowerCase()) ?? r.matches[0] ?? null;
  return { status: exact ? "ok" : "not_found", match: exact };
}

/**
 * Capability B — company signals from a bounded search. Configured-only; without
 * a search query it stays empty (no bulk harvesting). Maps matches to
 * `new_company` signals (Gewerbereinigung-Potenzial). Never throws.
 */
export async function runZefix(input: AdapterRunInput): Promise<AdapterRunResult> {
  if (!isZefixConfigured()) {
    return {
      status: "not_configured",
      signals: [],
      message: "ZEFIX: Zugang erforderlich – offizielle API noch nicht konfiguriert.",
    };
  }
  const query = (input.query ?? "").trim();
  if (!query) {
    return { status: "ok", signals: [], message: "ZEFIX bereit – Firmennamen/Suchbegriff eingeben." };
  }
  const limit = Math.min(MAX_RESULTS, Math.max(1, input.limit ?? MAX_RESULTS));
  const r = await searchZefix(query);
  if (r.status === "not_configured") {
    return { status: "not_configured", signals: [], message: "ZEFIX: Zugang erforderlich." };
  }
  if (r.status === "error") {
    return { status: "error", signals: [], message: r.message ?? "ZEFIX-Anfrage fehlgeschlagen." };
  }
  const signals: RawSignal[] = r.matches.map((m) => ({
    title: m.name,
    summary: [m.uid ? `UID ${m.uid}` : null, m.legalForm].filter(Boolean).join(" · ") || null,
    sourceUrl: null,
    region: m.domicile,
    locationText: m.domicile,
    signalType: "new_company",
    timingLabel: "Handelsregister-Eintrag (validiert) – Reinigungsbedarf prüfen und anbieten.",
    timingDate: null,
    timingIsInferred: true,
    suggestedServices: ["Büroreinigung", "Unterhaltsreinigung", "Hauswartung"],
  }));
  return { status: "ok", signals: signals.slice(0, limit) };
}
