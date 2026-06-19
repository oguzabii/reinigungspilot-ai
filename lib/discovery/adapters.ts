/**
 * Signal source adapters — interfaces + registry (v0.5.3). SERVER-SAFE.
 *
 * A clean seam for future official / approved signal sources. Each adapter
 * normalises its source into the same `RawSignal` shape (which maps onto
 * `OpportunitySignal`). v0.5.3 ships:
 *   - `google_places` — LIVE when GOOGLE_PLACES_API_KEY is set (supporting data
 *     only; discovery itself runs from the Discovery page).
 *   - `baugesuche`, `simap`, `zefix` — STUBS, `phase: "planned"`,
 *     `isConfigured() === false`, `run()` returns `not_configured`.
 *
 * HARD RULES for any future adapter:
 *   - OFFICIAL API / approved open data ONLY. NO scraping of HTML/pages.
 *   - Source-by-source explicit owner GO + a documented compliance note.
 *   - Env-gated keys (never in repo, never logged), result caps, timeouts.
 *   - Adapters NEVER contact anyone; they only surface candidates for review.
 */

import type { SignalType } from "@/components/revenue-autopilot/signals";
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isBaugesucheConfigured, runBaugesucheZh } from "@/lib/discovery/baugesuche-zh";
import { isSimapConfigured, runSimap, testSimapConnection } from "@/lib/discovery/simap";
import { isZefixConfigured, runZefix, testZefixConnection } from "@/lib/discovery/zefix";
import {
  staticStatus,
  type ConnectionResult,
  type ConnectionStatus,
} from "@/lib/discovery/connection";

export type AdapterPhase = "live" | "planned";

export interface RawSignal {
  title: string;
  summary: string | null;
  sourceUrl: string | null;
  region: string | null;
  locationText: string | null;
  signalType: SignalType;
  /** Source-provided timing, if any. */
  timingLabel: string | null;
  timingDate: string | null;
  timingIsInferred: boolean;
  suggestedServices: string[];
}

export interface AdapterRunInput {
  query: string;
  region?: string;
  limit?: number;
}

export type AdapterStatus = "ok" | "not_configured" | "error" | "unsupported_schema";

export interface AdapterRunResult {
  status: AdapterStatus;
  signals: RawSignal[];
  message?: string;
  /** Safe diagnostics (e.g. detected column names) — never values/secrets. */
  diagnostics?: { columns?: string[] };
}

export interface SignalAdapter {
  key: string;
  label: string;
  description: string;
  /** Whether the source is wired up (live) or documented for later (planned). */
  phase: AdapterPhase;
  /** Server-side configured check (e.g. an env key present). */
  isConfigured: () => boolean;
  /** Run the adapter. Stubs return `not_configured` and fetch nothing. */
  run: (input: AdapterRunInput) => Promise<AdapterRunResult>;
}

const notConfigured = async (): Promise<AdapterRunResult> => ({
  status: "not_configured",
  signals: [],
  message: "Quelle noch nicht angebunden – benötigt offizielle API/Freigabe.",
});

/**
 * Adapter registry. The pages read `phase` + `isConfigured()` for a readiness
 * panel. In v0.5.3 the actual signals are computed from existing prospects;
 * adapters that go live later feed the same `OpportunitySignal` shape.
 */
export const SIGNAL_ADAPTERS: SignalAdapter[] = [
  {
    key: "google_places",
    label: "Google Places",
    description:
      "Offizielle Places-API – findet Betriebe (Stützdaten). Discovery läuft auf der Discovery-Seite.",
    phase: "live",
    isConfigured: () => isDiscoveryConfigured(),
    run: notConfigured, // discovery runs from the Discovery page, not here
  },
  {
    key: "baugesuche",
    label: "Baugesuche / Bauprojekte Zürich",
    description:
      "Offizielle Bau-/Projekt-Open-Data (Kanton/Stadt Zürich), owner-konfiguriert via BAUGESUCHE_ZH_SIGNAL_URL. Nur offizielle JSON-API, kein Scraping/HTML/PDF. Ohne validierten Endpoint: nicht konfiguriert.",
    phase: "live",
    isConfigured: () => isBaugesucheConfigured(),
    run: runBaugesucheZh,
  },
  {
    key: "simap",
    label: "SIMAP Ausschreibungen",
    description:
      "Öffentliche Ausschreibungen passend zu Reinigung/Facility Services. Nur offizielle SIMAP-API (owner-konfiguriert), kein Scraping. Ohne Zugang: nicht konfiguriert.",
    phase: "live",
    isConfigured: () => isSimapConfigured(),
    run: runSimap,
  },
  {
    key: "zefix",
    label: "ZEFIX Firmenprüfung",
    description:
      "Neue Firmen / Handelsregister-Signale & Firmen-Validierung. Nur offizielle ZEFIX-REST-API (owner-konfiguriert), kein Bulk-Harvesting/Scraping. Ohne Zugang: nicht konfiguriert.",
    phase: "live",
    isConfigured: () => isZefixConfigured(),
    run: runZefix,
  },
];

/**
 * Customer-facing source readiness for the Lead Radar + Settings. Pure status
 * (configured / access required / not configured) — never secrets. `needsAccess`
 * marks sources that require official access you must request (SIMAP/ZEFIX);
 * `testable` marks sources with a safe live connection test. The static `status`
 * never reports "connected" — only an actual test (settings button) can.
 */
export interface SourceReadiness {
  key: string;
  label: string;
  configured: boolean;
  /** Requires official access/credentials (vs just a key/URL). */
  needsAccess: boolean;
  /** Has a safe, bounded live connection test (settings "Verbindung testen"). */
  testable: boolean;
  /** Static status (no live test): configured_not_tested / access_required / not_configured. */
  status: ConnectionStatus;
}

/** Sources that require requesting official access before they can connect. */
const ACCESS_GATED = new Set(["simap", "zefix"]);
/** Sources with a safe, bounded live connection test. */
const TESTABLE = new Set(["baugesuche", "simap", "zefix"]);

export function sourceReadiness(): SourceReadiness[] {
  return SIGNAL_ADAPTERS.map((a) => {
    const configured = a.isConfigured();
    const needsAccess = ACCESS_GATED.has(a.key);
    return {
      key: a.key,
      label: a.label,
      configured,
      needsAccess,
      testable: TESTABLE.has(a.key),
      status: staticStatus(configured, needsAccess),
    };
  });
}

/**
 * Run a safe, bounded live connection test for a source. Owner-triggered (from
 * Settings) — never on page load. Returns a simple status only (no secrets).
 * Google Places has no live test (a probe would cost API quota), so it reports
 * its static config state.
 */
export async function testSourceConnection(key: string): Promise<ConnectionResult> {
  if (key === "simap") return testSimapConnection();
  if (key === "zefix") return testZefixConnection();
  if (key === "baugesuche") {
    if (!isBaugesucheConfigured()) {
      return { status: "not_configured", message: "Kein Baugesuche-Feed konfiguriert." };
    }
    const r = await runBaugesucheZh({ query: "", limit: 1 });
    if (r.status === "ok" || r.status === "unsupported_schema") {
      return { status: "connected", message: "Feed erreichbar." };
    }
    return { status: "error", message: r.message ?? "Feed nicht erreichbar." };
  }
  if (key === "google_places") {
    return isDiscoveryConfigured()
      ? { status: "configured_not_tested", message: "Schlüssel gesetzt – Live-Test verbraucht API-Kontingent und wird übersprungen." }
      : { status: "not_configured", message: "Kein Schlüssel konfiguriert." };
  }
  return { status: "not_configured" };
}
