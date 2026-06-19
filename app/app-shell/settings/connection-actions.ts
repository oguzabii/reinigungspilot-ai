"use server";

/**
 * Source connection test — server action (v0.5.17). Owner/admin only.
 *
 * Runs a SAFE, bounded, OWNER-TRIGGERED connection test for one source adapter
 * and returns a simple status (connected / error / access_required / …). It
 * NEVER returns or logs a secret/token, makes at most one timeout-bounded
 * request, and persists nothing. Official endpoints only — no scraping/headless.
 */

import { getCurrentCompanyContext } from "@/lib/auth/session";
import { testSourceConnection } from "@/lib/discovery/adapters";
import type { ConnectionStatus } from "@/lib/discovery/connection";

export interface TestConnState {
  status: ConnectionStatus | "idle";
  message?: string;
}

const ALLOWED = new Set(["google_places", "baugesuche", "simap", "zefix"]);

export async function testConnection(
  _prev: TestConnState,
  formData: FormData,
): Promise<TestConnState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const role =
    context.memberships.find((m) => m.companyId === context.activeCompanyId)?.role ?? null;
  if (role !== "owner" && role !== "admin") {
    return { status: "error", message: "Nur Inhaber/Admin können Verbindungen testen." };
  }

  const raw = formData.get("source");
  const source = typeof raw === "string" ? raw : "";
  if (!ALLOWED.has(source)) {
    return { status: "error", message: "Unbekannte Quelle." };
  }

  // Bounded, never-throws test; returns a simple status only.
  const result = await testSourceConnection(source);
  return { status: result.status, message: result.message };
}
