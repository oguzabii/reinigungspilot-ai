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
import type { ConnectionResult } from "@/lib/discovery/connection";

const MAX_RESULTS = 10;
const REQUEST_TIMEOUT_MS = 8000;

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/**
 * Official ZEFIX PublicREST base (verified against the OpenAPI spec) + company
 * search path. Base defaults to the official host; the search endpoint is
 * `POST /api/v1/company/search`. Both env-overridable so we never hardcode-guess.
 */
const ZEFIX_DEFAULT_BASE = "https://www.zefix.admin.ch/ZefixPublicREST";
const ZEFIX_SEARCH_PATH = "/api/v1/company/search";

function zefixBaseUrl(): string {
  return (readEnv("ZEFIX_API_BASE_URL") ?? ZEFIX_DEFAULT_BASE).replace(/\/+$/, "");
}

/** Full company-search URL (handles a base already pointing at the endpoint). */
function zefixSearchUrl(): string {
  const base = zefixBaseUrl();
  return /company\/search/i.test(base) ? base : `${base}${ZEFIX_SEARCH_PATH}`;
}

/**
 * ZEFIX requires HTTP Basic auth (OpenAPI security scheme "Zefix-Credentials").
 * The base defaults to the official host, so the real gate is the credentials
 * (username + password, or an optional bearer token). Without them: access
 * required.
 */
export function isZefixConfigured(): boolean {
  return (
    Boolean(readEnv("ZEFIX_API_TOKEN")) ||
    Boolean(readEnv("ZEFIX_API_USERNAME") && readEnv("ZEFIX_API_PASSWORD"))
  );
}

/**
 * Build the Authorization header. Honours an explicit `ZEFIX_AUTH_MODE`
 * ("token" | "basic"); otherwise prefers a bearer token, then basic auth.
 * Secrets never logged / never returned to the client.
 */
function authHeader(): Record<string, string> {
  const mode = readEnv("ZEFIX_AUTH_MODE")?.toLowerCase();
  const token = readEnv("ZEFIX_API_TOKEN");
  const user = readEnv("ZEFIX_API_USERNAME");
  const pass = readEnv("ZEFIX_API_PASSWORD");
  const basic: Record<string, string> =
    user && pass
      ? { Authorization: `Basic ${Buffer.from(`${user}:${pass}`, "utf8").toString("base64")}` }
      : {};
  const bearer: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  if (mode === "basic") return basic;
  if (mode === "token") return bearer;
  if (token) return bearer;
  return basic;
}

/**
 * Bounded, owner-triggered connection test: one timeout-bounded minimal search.
 * Returns a simple status only — never a credential. Does not persist anything.
 */
export async function testZefixConnection(): Promise<ConnectionResult> {
  if (!isZefixConfigured()) {
    return { status: "access_required", message: "ZEFIX-Zugang noch nicht konfiguriert." };
  }
  const r = await searchZefix("Clean"); // bounded probe (name minLength 3)
  if (r.status === "not_configured") {
    return { status: "access_required", message: "ZEFIX-Zugang noch nicht konfiguriert." };
  }
  if (r.status === "error") {
    return {
      status: "error",
      message: r.message?.includes("401") || r.message?.includes("403")
        ? "Authentifizierung fehlgeschlagen – Zugangsdaten prüfen."
        : r.message ?? "Verbindung fehlgeschlagen.",
    };
  }
  return { status: "connected", message: "Verbindung erfolgreich getestet." };
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
  status: string | null;
  /** Official ZEFIX detail page (zefixDetailWeb), if returned. */
  detailUrl: string | null;
}

/** Pick a string from a value that may be a string or an object with `.name`. */
function pickNested(rec: Rec, keys: string[]): string | null {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
    if (v && typeof v === "object") {
      const o = v as Rec;
      const n = pickString(o, ["name", "shortname", "uid", "description"]);
      if (n) return n;
    }
  }
  return null;
}

function mapCompany(rec: Rec): ZefixMatch | null {
  const name = pickString(rec, ["name", "companyname", "firmenname"]);
  if (!name) return null;
  return {
    name: name.slice(0, 200),
    uid: pickString(rec, ["uidformatted", "uid_formatted", "uid", "ehraid"]),
    legalForm: pickNested(rec, ["legalform", "legalformname", "rechtsform"]),
    domicile: pickNested(rec, ["legalseat", "domicile", "sitz", "ort", "legalseatname"]),
    status: pickString(rec, ["status", "companystatus", "rabid"]),
    detailUrl: pickString(rec, ["zefixdetailweb", "detailurl", "url"]),
  };
}

/**
 * POST a bounded company search to the official ZEFIX endpoint
 * (`/api/v1/company/search`). Body follows `CompanySearchQuery`: `name` (the
 * spec requires minLength 3), `activeOnly`, optional `canton` (`ZEFIX_CANTON`).
 */
async function searchZefix(name: string): Promise<{ status: "ok" | "error" | "not_configured"; matches: ZefixMatch[]; message?: string }> {
  if (!isZefixConfigured()) return { status: "not_configured", matches: [] };
  const term = name.trim().slice(0, 120);
  if (term.length < 3) return { status: "ok", matches: [] }; // spec: name minLength 3

  const query: Record<string, unknown> = { name: term, activeOnly: true };
  const canton = readEnv("ZEFIX_CANTON");
  if (canton) query.canton = canton.trim().toUpperCase();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(zefixSearchUrl(), {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeader() },
      body: JSON.stringify(query),
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
    summary: [m.uid ? `UID ${m.uid}` : null, m.legalForm, m.status].filter(Boolean).join(" · ") || null,
    sourceUrl: m.detailUrl,
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
