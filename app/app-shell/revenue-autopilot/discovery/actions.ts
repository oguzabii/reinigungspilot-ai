"use server";

/**
 * Automatic Discovery — server action (v0.5.2). Owner/admin-triggered, MANUAL.
 *
 * Calls the official Google Places adapter (only when the owner configured
 * GOOGLE_PLACES_API_KEY), dedupes against existing prospects, and — only if the
 * `autoCreateColdCandidates` policy toggle is ON — auto-creates the found
 * businesses as COLD prospects (source_type 'google', status 'raw', NOT
 * contacted, cold outreach blocked by policy). Every run is written to
 * `audit_logs` (entity_type 'discovery_run') — no silent actions.
 *
 * Hard guardrails: NO scraping (official API only), NO cron, hard result cap,
 * session/anon client + RLS only (prospects = sales domain; owner/admin
 * qualify), NEVER service-role, NEVER auto-contact. No schema change.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getAutopilotPolicy } from "@/lib/auth/tenant-data";
import {
  isDiscoveryConfigured,
  runPlacesTextSearch,
} from "@/lib/discovery/google-places";
import { analyzeOpportunity } from "@/components/lead-hunter/scoring";

export interface DiscoveryActionState {
  status: "idle" | "success" | "error" | "not_configured";
  message?: string;
  result?: {
    found: number;
    created: number;
    deduped: number;
    autoCreate: boolean;
    candidates: Array<{ name: string; address: string | null }>;
  };
}

function field(formData: FormData, name: string, maxLen = 120): string {
  const raw = formData.get(name);
  if (typeof raw !== "string") return "";
  return raw.replace(/[\r\n]+/g, " ").trim().slice(0, maxLen);
}

export async function runDiscovery(
  _prev: DiscoveryActionState,
  formData: FormData,
): Promise<DiscoveryActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  // Owner/admin only (manual, controlled run).
  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  if (role !== "owner" && role !== "admin") {
    return { status: "error", message: "Nur Inhaber/Admin dürfen die Discovery starten." };
  }

  if (!isDiscoveryConfigured()) {
    return {
      status: "not_configured",
      message:
        "Discovery-API nicht konfiguriert (GOOGLE_PLACES_API_KEY fehlt). Der Inhaber setzt den Schlüssel in der Umgebung – nie im Repo.",
    };
  }

  const keyword = field(formData, "keyword", 120);
  const region = field(formData, "region", 80);
  const service = field(formData, "service", 80);
  if (!keyword) {
    return { status: "error", message: "Suchbegriff ist erforderlich." };
  }

  const query = `${keyword} ${region}`.trim();
  const res = await runPlacesTextSearch({ query, limit: 10 });

  if (res.status === "not_configured") {
    return { status: "not_configured", message: "Discovery-API nicht konfiguriert." };
  }
  if (res.status === "error") {
    return { status: "error", message: res.message ?? "Discovery fehlgeschlagen." };
  }

  const supabase = await createClient();
  const toggles = await getAutopilotPolicy(companyId);
  const autoCreate = toggles.autoCreateColdCandidates;

  // Dedupe against existing prospects (name + region, case-insensitive).
  const { data: existingRows } = await supabase
    .from("prospects")
    .select("name, region")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .limit(1000);
  const existing = new Set(
    ((existingRows ?? []) as Array<{ name: string; region: string | null }>).map(
      (r) => `${r.name.toLowerCase()}|${(r.region ?? "").toLowerCase()}`,
    ),
  );

  const seen = new Set<string>();
  const fresh = res.candidates.filter((c) => {
    const key = `${c.name.toLowerCase()}|${region.toLowerCase()}`;
    if (existing.has(key) || seen.has(c.providerId) || seen.has(key)) return false;
    seen.add(c.providerId);
    seen.add(key);
    return true;
  });

  const found = res.candidates.length;
  const deduped = found - fresh.length;
  let created = 0;

  if (autoCreate && fresh.length > 0) {
    const rows = fresh.map((c) => {
      const analysis = analyzeOpportunity({
        name: c.name,
        category: "Firma",
        region,
        servicePotential: service,
        sourceType: "google",
        score: null,
      });
      const reasonParts = [
        "Automatisch entdeckt via Google Places (kalt). Nicht kontaktiert – Cold-Outreach per Richtlinie gesperrt.",
      ];
      if (c.website) reasonParts.push(`Website: ${c.website}`);
      if (c.address) reasonParts.push(`Adresse: ${c.address}`);
      return {
        company_id: companyId,
        name: c.name,
        category: "Firma",
        region: region || null,
        source_type: "google" as const,
        search_query: service || null,
        score: analysis.suggestedScore,
        reason: reasonParts.join("\n"),
        status: "raw" as const,
        created_by: context.user.id,
        updated_by: context.user.id,
      };
    });
    const { data: inserted, error: insertError } = await supabase
      .from("prospects")
      .insert(rows)
      .select("id");
    if (insertError) {
      console.error("[discovery] prospect insert failed:", insertError.message);
      return {
        status: "error",
        message: "Kandidaten konnten nicht erstellt werden. Prüfen Sie Ihre Berechtigung.",
      };
    }
    created = inserted?.length ?? 0;
  }

  // Audit transparency — no silent actions. Counts + query only (no PII names).
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: context.user.id,
    action: "system",
    entity_type: "discovery_run",
    metadata: {
      provider: "google_places",
      query: keyword,
      region: region || null,
      found,
      created,
      deduped,
      autoCreate,
      status: "ok",
    },
  });

  revalidatePath("/app-shell/revenue-autopilot/discovery");
  revalidatePath("/app-shell/lead-hunter");
  revalidatePath("/app-shell/revenue-autopilot");

  return {
    status: "success",
    message: autoCreate
      ? `${found} gefunden · ${created} als Kandidat erstellt (kalt) · ${deduped} Duplikate übersprungen.`
      : `${found} gefunden · Auto-Erstellung ist AUS (nur Anzeige) · ${deduped} Duplikate.`,
    result: {
      found,
      created,
      deduped,
      autoCreate,
      candidates: res.candidates.map((c) => ({ name: c.name, address: c.address })),
    },
  };
}
