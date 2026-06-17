/**
 * Contact Enrichment Autopilot (v0.5.12). SERVER-ONLY.
 *
 * For a discovered candidate, tries to find a contact path — email, phone,
 * website, an obvious contact person — from SAFE sources, in order:
 *
 *   A) Existing discovery data already stored on the prospect (website parsed
 *      from the discovery `reason`, or a website passed in).
 *   B) Official Google Places (only if GOOGLE_PLACES_API_KEY is set) — website +
 *      phone from the top match. No scraping.
 *   C) The candidate's OWN public website — a tiny, fixed set of public pages
 *      (home, /kontakt, /impressum, /contact). HARD CAPS: max 4 pages, 5 s
 *      timeout each, HTML only, small size cap. NO headless browser, NO PDF, NO
 *      login, NO form submission, NO crawling of arbitrary links. A public-URL
 *      guard blocks localhost/private addresses (SSRF).
 *
 *   D) ZEFIX / local.ch / search.ch are intentionally NOT scraped — they are a
 *      future, approved/compliant adapter step.
 *
 * The orchestrator only fills MISSING fields; it never overwrites contact data a
 * human already entered. It returns what it found; persistence is the caller's
 * job (a server action, session client + RLS).
 */

import { isDiscoveryConfigured, runPlacesTextSearch } from "@/lib/discovery/google-places";

const MAX_PAGES = 4;
const PAGE_TIMEOUT_MS = 5000;
const MAX_HTML_CHARS = 400_000;
const MAX_CONTENT_LENGTH = 2_000_000;
const USER_AGENT = "KlarsaContactBot/0.5 (+https://klarsa.app; controlled contact lookup)";

export type EnrichStatus = "found" | "partial" | "none" | "unreachable";

export interface EnrichInput {
  name: string;
  region: string | null;
  /** A website already known for the candidate, if any. */
  website?: string | null;
  /** The discovery `reason` text (may contain "Website: ..."). */
  reason?: string | null;
}

export interface EnrichResult {
  email: string | null;
  phone: string | null;
  website: string | null;
  person: string | null;
  /** URL of the page where contact info was found, if any. */
  contactPageUrl: string | null;
  /** Which sources contributed (owner-facing, e.g. "Google Places", "Website"). */
  sources: string[];
  status: EnrichStatus;
}

/* -------------------------------------------------------------------------- */
/* Orchestrator                                                                */
/* -------------------------------------------------------------------------- */

export async function enrichContact(input: EnrichInput): Promise<EnrichResult> {
  const sources: string[] = [];
  let email: string | null = null;
  let phone: string | null = null;
  let person: string | null = null;
  let contactPageUrl: string | null = null;
  let website: string | null = input.website ?? null;
  let unreachable = false;

  // A) Existing discovery data — website parsed from the stored reason.
  if (!website && input.reason) {
    const m = input.reason.match(/Website:\s*(\S+)/i);
    if (m) {
      website = m[1];
      sources.push("vorhandene Daten");
    }
  }

  // B) Official Google Places (website + phone), only if configured.
  if ((!website || !phone) && isDiscoveryConfigured()) {
    const query = [input.name, input.region].filter(Boolean).join(" ").trim();
    if (query) {
      const res = await runPlacesTextSearch({ query, limit: 1 });
      if (res.status === "ok" && res.candidates[0]) {
        const c = res.candidates[0];
        let used = false;
        if (!website && c.website) {
          website = c.website;
          used = true;
        }
        if (!phone && c.phone) {
          phone = c.phone;
          used = true;
        }
        if (used) sources.push("Google Places");
      } else if (res.status === "error") {
        unreachable = true;
      }
    }
  }

  // C) The candidate's own public website (bounded, safe).
  if (website && (!email || !phone)) {
    const origin = safeOrigin(website);
    if (origin) {
      const fetched = await fetchContactFromWebsite(origin);
      if (fetched.unreachable && !fetched.anyOk) unreachable = true;
      if (!email && fetched.email) email = fetched.email;
      if (!phone && fetched.phone) phone = fetched.phone;
      if (!person && fetched.person) person = fetched.person;
      if (fetched.contactPageUrl) contactPageUrl = fetched.contactPageUrl;
      if (fetched.email || fetched.phone) sources.push("Website");
    }
  }

  const hasContact = Boolean(email || phone);
  const status: EnrichStatus = hasContact
    ? "found"
    : unreachable
      ? "unreachable"
      : website
        ? "partial"
        : "none";

  return { email, phone, website, person, contactPageUrl, sources, status };
}

/* -------------------------------------------------------------------------- */
/* Safety: only fetch public http(s) URLs                                      */
/* -------------------------------------------------------------------------- */

/** Reject non-http(s), localhost and private/link-local hosts (SSRF guard). */
function isSafePublicHttpUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const h = u.hostname.toLowerCase();
  if (!h || h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) {
    return false;
  }
  if (h === "::1" || h === "[::1]" || h === "0.0.0.0") return false;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return false;
  if (/^169\.254\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  return true;
}

/** Normalise a candidate website to a safe origin, or null. */
function safeOrigin(website: string): string | null {
  let candidate = website.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  if (!isSafePublicHttpUrl(candidate)) return null;
  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Source C: bounded website fetch                                             */
/* -------------------------------------------------------------------------- */

interface WebsiteContact {
  email: string | null;
  phone: string | null;
  person: string | null;
  contactPageUrl: string | null;
  /** True if at least one page was reachable. */
  anyOk: boolean;
  /** True if at least one page failed (network/timeout/non-html). */
  unreachable: boolean;
}

async function fetchContactFromWebsite(origin: string): Promise<WebsiteContact> {
  // A tiny, fixed, public-only set — never arbitrary links (max 4 pages).
  const paths = ["", "/kontakt", "/impressum", "/contact"].slice(0, MAX_PAGES);
  let email: string | null = null;
  let phone: string | null = null;
  let person: string | null = null;
  let contactPageUrl: string | null = null;
  let anyOk = false;
  let anyFail = false;

  for (const path of paths) {
    if (email && phone) break; // enough — stop early, fewer requests
    const url = `${origin}${path}`;
    const html = await fetchHtml(url);
    if (html === null) {
      anyFail = true;
      continue;
    }
    anyOk = true;
    const e = extractEmail(html, origin);
    const ph = extractPhone(html);
    const pe = extractPerson(html);
    if (!email && e) {
      email = e;
      if (path !== "") contactPageUrl = url;
    }
    if (!phone && ph) phone = ph;
    if (!person && pe) person = pe;
    if (!contactPageUrl && (e || ph) && path !== "") contactPageUrl = url;
  }

  return { email, phone, person, contactPageUrl, anyOk, unreachable: anyFail };
}

/** GET one page: HTML only, short timeout, size-capped. Null on any failure. */
async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!type.includes("text/html")) return null; // no PDF / binaries
    const len = Number(res.headers.get("content-length") ?? "0");
    if (len > MAX_CONTENT_LENGTH) return null;
    const text = await res.text();
    return text.slice(0, MAX_HTML_CHARS);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Extraction (light, deterministic)                                           */
/* -------------------------------------------------------------------------- */

function deobfuscate(s: string): string {
  return s
    .replace(/&#64;|&commat;/gi, "@")
    .replace(/&#46;/g, ".")
    .replace(/\s*[\[(]\s*at\s*[\])]\s*/gi, "@")
    .replace(/\s*[\[(]\s*dot\s*[\])]\s*/gi, ".");
}

const ASSET_EXT = /\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?)$/i;
const JUNK_EMAIL = /(sentry|wixpress|example\.|your-?email|sample|@2x|@3x|no-?reply@)/i;

function extractEmail(html: string, origin: string): string | null {
  const text = deobfuscate(html);
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,24}/g) ?? [];
  const clean = [...new Set(matches.map((m) => m.toLowerCase()))].filter(
    (m) => !ASSET_EXT.test(m) && !JUNK_EMAIL.test(m),
  );
  if (clean.length === 0) return null;

  let host = "";
  try {
    host = new URL(origin).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }
  const preferred = clean.find((m) => /^(info|kontakt|contact|hello|mail|office)@/.test(m));
  const sameDomain = host ? clean.find((m) => m.endsWith(`@${host}`)) : undefined;
  return (preferred ?? sameDomain ?? clean[0]).slice(0, 200);
}

function extractPhone(html: string): string | null {
  const tel = html.match(/tel:\+?[\d\s().\/-]{6,}/i);
  const haystack = tel ? tel[0].replace(/^tel:/i, "") : html;
  const ch = haystack.match(
    /(?:\+41|0041|0)[\s.\/-]?(?:\(0\)\s?)?\d{2}[\s.\/-]?\d{3}[\s.\/-]?\d{2}[\s.\/-]?\d{2}/,
  );
  if (!ch) return null;
  return ch[0].replace(/[\s.\/-]+/g, " ").trim().slice(0, 40);
}

function extractPerson(html: string): string | null {
  const text = html.replace(/<[^>]+>/g, " ");
  const m = text.match(
    /(?:Ansprechpartner(?:in)?|Ansprechperson|Kontaktperson|Inhaber(?:in)?|Geschäftsführer(?:in)?)[:\s]+([A-ZÄÖÜ][a-zäöü]+(?:\s+[A-ZÄÖÜ][a-zäöü]+){1,2})/,
  );
  return m ? m[1].trim().slice(0, 80) : null;
}
