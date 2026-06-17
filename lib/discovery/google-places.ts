/**
 * Automatic Discovery adapter — Google Places Text Search (v0.5.2). SERVER-ONLY.
 *
 * Uses the OFFICIAL Places API (`places:searchText`). It is **NOT** scraping:
 * no Google Maps HTML/pages are fetched or parsed. It runs ONLY when the owner
 * has configured `GOOGLE_PLACES_API_KEY` (in Vercel/Supabase env, never the
 * repo) and only when an owner/admin triggers it manually (no cron in v0.5.2).
 *
 * Build/runtime safety:
 *   - Nothing runs at import time; the key is read lazily at call time.
 *   - Missing key → `{ status: "not_configured" }`; the app keeps working.
 *   - The key is NEVER logged and NEVER sent to the client.
 *   - Hard result cap, request timeout, and total isolation from the DB (this
 *     module returns normalised candidates; persistence is the caller's job).
 */

/** Hard upper bound on results per run, regardless of the requested limit. */
const MAX_RESULTS = 10;
const REQUEST_TIMEOUT_MS = 8000;
const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

export interface DiscoveryCandidate {
  /** Stable provider id (Google place id) — used for dedupe. */
  providerId: string;
  name: string;
  /** Free-text address as returned by the provider. */
  address: string | null;
  website: string | null;
  /** Public business phone, if the provider returns one. */
  phone: string | null;
}

export type DiscoveryStatus = "ok" | "not_configured" | "error";

export interface DiscoveryResult {
  status: DiscoveryStatus;
  candidates: DiscoveryCandidate[];
  /** Human-readable note for the "error" status (never contains the key). */
  message?: string;
}

/** Read the API key lazily, server-side only. Never logged, never to client. */
function readApiKey(): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env.GOOGLE_PLACES_API_KEY;
  return v && v.length > 0 ? v : undefined;
}

/** True if the discovery provider is configured (key present). Server-side. */
export function isDiscoveryConfigured(): boolean {
  return Boolean(readApiKey());
}

interface RawPlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
}

/**
 * Run a single Places Text Search. Owner/admin-triggered, manual only. Returns
 * at most `MAX_RESULTS` normalised candidates. Never throws — failures map to
 * `{ status: "error" }`.
 */
export async function runPlacesTextSearch(input: {
  query: string;
  limit?: number;
}): Promise<DiscoveryResult> {
  const key = readApiKey();
  if (!key) return { status: "not_configured", candidates: [] };

  const textQuery = input.query.trim().slice(0, 200);
  if (!textQuery) {
    return { status: "error", candidates: [], message: "Leere Suchanfrage." };
  }
  const limit = Math.min(MAX_RESULTS, Math.max(1, input.limit ?? MAX_RESULTS));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(PLACES_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        // Field mask keeps the response (and cost) minimal — public business
        // listing fields only.
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.nationalPhoneNumber",
      },
      body: JSON.stringify({ textQuery, pageSize: limit }),
      cache: "no-store",
    });

    if (!res.ok) {
      // Do NOT include the response body verbatim (avoid echoing any token).
      return {
        status: "error",
        candidates: [],
        message: `Discovery-API antwortete mit Status ${res.status}.`,
      };
    }

    const data = (await res.json()) as { places?: RawPlace[] };
    const places = Array.isArray(data.places) ? data.places.slice(0, limit) : [];
    const candidates: DiscoveryCandidate[] = places
      .filter((p) => p.id && p.displayName?.text)
      .map((p) => ({
        providerId: p.id as string,
        name: (p.displayName?.text as string).slice(0, 200),
        address: p.formattedAddress?.slice(0, 300) ?? null,
        website: p.websiteUri?.slice(0, 300) ?? null,
        phone:
          (p.internationalPhoneNumber ?? p.nationalPhoneNumber)?.slice(0, 60) ??
          null,
      }));

    return { status: "ok", candidates };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: "error",
      candidates: [],
      message: aborted
        ? "Discovery-Anfrage hat das Zeitlimit überschritten."
        : "Discovery-Anfrage fehlgeschlagen.",
    };
  } finally {
    clearTimeout(timer);
  }
}
