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

export type AdapterStatus = "ok" | "not_configured" | "error";

export interface AdapterRunResult {
  status: AdapterStatus;
  signals: RawSignal[];
  message?: string;
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
    label: "SIMAP (öffentliche Ausschreibungen)",
    description:
      "Geplant: öffentliche Ausschreibungen für Büro-/Unterhaltsreinigung. Quelle prüfen, Eingabefristen einhalten. GO erforderlich.",
    phase: "planned",
    isConfigured: () => false,
    run: notConfigured,
  },
  {
    key: "zefix",
    label: "ZEFIX (Firmen-Validierung / Neugründungen)",
    description:
      "Geplant: Firmen-Validierung & Neugründungs-Signale (Gewerbereinigung-Potenzial). Nur offizielle Quelle, kein Bulk-Harvesting. GO erforderlich.",
    phase: "planned",
    isConfigured: () => false,
    run: notConfigured,
  },
];
