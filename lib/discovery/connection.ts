/**
 * Source connection status (v0.5.17). SERVER-SAFE, pure types + helpers.
 *
 * A small, honest state machine for external source connections:
 *   - not_configured       — no env config at all (just needs a key/URL)
 *   - access_required      — needs official access/credentials you must request
 *                            (SIMAP / ZEFIX) and which are not configured yet
 *   - configured_not_tested — env present, but no live test has confirmed it
 *   - connected            — a live, bounded test actually succeeded
 *   - error                — a live test ran but failed (auth/endpoint/timeout)
 *
 * "connected" is ONLY ever set by an actual connection test — never by config
 * presence alone. Messages never contain tokens/secrets.
 */

export type ConnectionStatus =
  | "not_configured"
  | "access_required"
  | "configured_not_tested"
  | "connected"
  | "error";

export interface ConnectionResult {
  status: ConnectionStatus;
  /** Human-readable note (never contains a secret/token). */
  message?: string;
}

/**
 * The static status shown WITHOUT a live test (page load): configured →
 * "configured_not_tested"; otherwise "access_required" for access-gated sources
 * (SIMAP/ZEFIX) or "not_configured" for key/URL sources (Google/Baugesuche).
 */
export function staticStatus(configured: boolean, needsAccess: boolean): ConnectionStatus {
  if (configured) return "configured_not_tested";
  return needsAccess ? "access_required" : "not_configured";
}

export interface ConnectionStatusMeta {
  label: string;
  /** Tailwind badge classes (bg + text + ring). */
  className: string;
}

/** German label + badge classes per status (owner-facing). */
export const CONNECTION_STATUS_META: Record<ConnectionStatus, ConnectionStatusMeta> = {
  connected: { label: "Verbunden", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  configured_not_tested: { label: "Konfiguriert", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  access_required: { label: "Zugang erforderlich", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  not_configured: { label: "Nicht konfiguriert", className: "bg-slate-100 text-slate-500 ring-slate-200" },
  error: { label: "Fehler", className: "bg-rose-50 text-rose-700 ring-rose-200" },
};
