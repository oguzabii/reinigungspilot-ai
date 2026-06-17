"use server";

/**
 * Approved Discovery Autopilot — server action (v0.5.7). Owner/admin-triggered.
 *
 * Klarsa's first real automation lane: it finds **approved** business
 * opportunities through OFFICIAL adapters only and, when policy allows,
 * auto-creates them as COLD candidates (prospects). Sources:
 *   - `google` → official Google Places Text Search (env GOOGLE_PLACES_API_KEY)
 *   - `baugesuche` → official Kanton-Zürich Baugesuche feed (env BAUGESUCHE_ZH_SIGNAL_URL)
 *
 * Hard guardrails: OFFICIAL APIs/feeds ONLY (NO scraping/HTML/PDF/headless),
 * package-gated (Starter locked, Pro/Premium may run), auto-create gated by the
 * `autoCreateColdCandidates` policy toggle, dedupe + per-run cap, session/anon
 * client + RLS only (NEVER service-role), NEVER any outreach/sending/booking.
 * Every run is written to `audit_logs` (entity_type 'discovery_run'). No schema
 * change.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getAutopilotPolicy, getCompanySummary } from "@/lib/auth/tenant-data";
import { tierRank } from "@/components/app-shell/autopilot-tier";
import { isDiscoveryConfigured, runPlacesTextSearch } from "@/lib/discovery/google-places";
import { isBaugesucheConfigured, runBaugesucheZh } from "@/lib/discovery/baugesuche-zh";
import { analyzeOpportunity } from "@/components/lead-hunter/scoring";

export type DiscoverySource = "google" | "baugesuche";

export interface DiscoveryResultBreakdown {
  source: DiscoverySource;
  found: number;
  created: number;
  /** Duplicates against existing tenant prospects. */
  existing: number;
  /** In-batch duplicates / invalid rows skipped. */
  skipped: number;
  errors: number;
  autoCreate: boolean;
  candidates: Array<{ name: string; region: string | null }>;
}

export interface DiscoveryActionState {
  status: "idle" | "success" | "error" | "not_configured" | "locked";
  message?: string;
  result?: DiscoveryResultBreakdown;
}

/** Safety cap on candidates created in a single run (sources also cap at ~10). */
const MAX_CREATE_PER_RUN = 15;

const CALM_UNREACHABLE =
  "Quelle momentan nicht erreichbar (Zugriff oder Kontingent prüfen). Klarsa hat nichts geändert – bitte später erneut versuchen.";

/** A source candidate normalised onto the prospects schema (existing columns only). */
interface NormCandidate {
  name: string;
  region: string | null;
  category: string;
  /** Existing source_type enum value only. */
  sourceType: "google" | "other";
  searchQuery: string | null;
  reason: string;
  score: number | null;
  /** In-batch dedupe key (provider id / source url), if any. */
  providerKey: string | null;
  /** Contact path already returned by the official source (cheap auto-enrich). */
  contactPhone: string | null;
  contactWebsite: string | null;
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

  // Package gating: Starter is locked; Pro/Premium may run.
  const summary = await getCompanySummary(companyId);
  if (tierRank(summary?.tier ?? "starter") < 1) {
    return {
      status: "locked",
      message:
        "Approved Discovery Autopilot ist ab Pro verfügbar. Mit Premium läuft die Discovery vollautomatisch – Upgrade für Vollautomatik.",
    };
  }

  const source: DiscoverySource =
    field(formData, "source", 20) === "baugesuche" ? "baugesuche" : "google";
  const keyword = field(formData, "keyword", 120);
  const region = field(formData, "region", 80);
  const service = field(formData, "service", 80);

  // Gather normalised candidates from the chosen approved source.
  let candidates: NormCandidate[];

  if (source === "google") {
    if (!isDiscoveryConfigured()) {
      return {
        status: "not_configured",
        message: "Google-Places-Quelle noch nicht verbunden.",
      };
    }
    if (!keyword) {
      return { status: "error", message: "Suchbegriff ist erforderlich." };
    }
    const query = `${keyword} ${region}`.trim();
    const res = await runPlacesTextSearch({ query, limit: 10 });
    if (res.status === "not_configured") {
      return { status: "not_configured", message: "Google-Places-Quelle noch nicht verbunden." };
    }
    if (res.status === "error") {
      return { status: "error", message: CALM_UNREACHABLE };
    }
    candidates = res.candidates.map((c) => {
      const analysis = analyzeOpportunity({
        name: c.name,
        category: "Firma",
        region,
        servicePotential: service,
        sourceType: "google",
        score: null,
      });
      const parts = [
        "Automatisch entdeckt via Google Places (kalt). Nicht kontaktiert – Cold-Outreach per Richtlinie gesperrt.",
      ];
      if (c.website) parts.push(`Website: ${c.website}`);
      if (c.address) parts.push(`Adresse: ${c.address}`);
      return {
        name: c.name,
        region: region || null,
        category: "Firma",
        sourceType: "google",
        searchQuery: service || null,
        reason: parts.join("\n"),
        score: analysis.suggestedScore,
        providerKey: c.providerId,
        contactPhone: c.phone,
        contactWebsite: c.website,
      };
    });
  } else {
    if (!isBaugesucheConfigured()) {
      return {
        status: "not_configured",
        message: "Baugesuche-Quelle (Kanton Zürich) noch nicht verbunden.",
      };
    }
    const res = await runBaugesucheZh({ query: keyword || "Baugesuche", region, limit: 10 });
    if (res.status === "not_configured") {
      return { status: "not_configured", message: "Baugesuche-Quelle noch nicht verbunden." };
    }
    if (res.status === "unsupported_schema") {
      return {
        status: "error",
        message:
          "Quelle erreichbar, aber das Datenformat wurde nicht erkannt. Konfiguration prüfen.",
      };
    }
    if (res.status === "error") {
      return { status: "error", message: CALM_UNREACHABLE };
    }
    candidates = res.signals.map((s) => {
      const svc = s.suggestedServices[0] ?? null;
      const sigRegion = s.region ?? (region || null);
      const analysis = analyzeOpportunity({
        name: s.title,
        category: "Bauprojekt",
        region: sigRegion ?? "",
        servicePotential: svc ?? "",
        sourceType: "other",
        score: null,
      });
      const parts = [
        "Automatisch entdeckt aus der offiziellen Baugesuche-Quelle (Kanton Zürich, kalt). Nicht kontaktiert – Cold-Outreach gesperrt.",
      ];
      if (s.timingLabel) parts.push(s.timingLabel);
      if (s.locationText) parts.push(`Lage: ${s.locationText}`);
      if (s.sourceUrl) parts.push(`Quelle: ${s.sourceUrl}`);
      return {
        name: s.title,
        region: sigRegion,
        category: "Bauprojekt",
        sourceType: "other",
        searchQuery: svc,
        reason: parts.join("\n"),
        score: analysis.suggestedScore,
        providerKey: s.sourceUrl,
        contactPhone: null,
        contactWebsite: null,
      };
    });
  }

  const found = candidates.length;
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
  const existingSet = new Set(
    ((existingRows ?? []) as Array<{ name: string; region: string | null }>).map(
      (r) => `${r.name.toLowerCase()}|${(r.region ?? "").toLowerCase()}`,
    ),
  );

  const seen = new Set<string>();
  let existing = 0;
  let skipped = 0;
  const fresh: NormCandidate[] = [];
  for (const c of candidates) {
    const key = `${c.name.toLowerCase()}|${(c.region ?? "").toLowerCase()}`;
    if (existingSet.has(key)) {
      existing++;
      continue;
    }
    if (seen.has(key) || (c.providerKey && seen.has(c.providerKey))) {
      skipped++;
      continue;
    }
    seen.add(key);
    if (c.providerKey) seen.add(c.providerKey);
    fresh.push(c);
  }

  const toCreate = fresh.slice(0, MAX_CREATE_PER_RUN);
  // Anything beyond the per-run cap is skipped (not created).
  skipped += fresh.length - toCreate.length;

  let created = 0;
  let errors = 0;
  if (autoCreate && toCreate.length > 0) {
    const rows = toCreate.map((c) => ({
      company_id: companyId,
      name: c.name,
      category: c.category,
      region: c.region,
      source_type: c.sourceType,
      search_query: c.searchQuery,
      score: c.score,
      reason: c.reason,
      status: "raw" as const,
      // Cheap auto-enrich: store the contact path the official source returned.
      contact_phone: c.contactPhone,
      contact_website: c.contactWebsite,
      created_by: context.user.id,
      updated_by: context.user.id,
    }));
    const { data: inserted, error: insertError } = await supabase
      .from("prospects")
      .insert(rows)
      .select("id");
    if (insertError) {
      console.error("[discovery] prospect insert failed:", insertError.message);
      errors = toCreate.length;
    } else {
      created = inserted?.length ?? 0;
    }
  }

  // Audit transparency — no silent actions. Counts + query only (no PII names).
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: context.user.id,
    action: "system",
    entity_type: "discovery_run",
    metadata: {
      provider: source === "google" ? "google_places" : "baugesuche_zh",
      source,
      query: keyword || null,
      region: region || null,
      found,
      created,
      deduped: existing + skipped,
      existing,
      skipped,
      errors,
      autoCreate,
      status: "ok",
    },
  });

  revalidatePath("/app-shell/revenue-autopilot/discovery");
  revalidatePath("/app-shell/lead-hunter");
  revalidatePath("/app-shell/revenue-autopilot");

  const summaryLine =
    `${found} gefunden · ${created} neu erstellt · ${existing} bereits vorhanden · ` +
    `${skipped} übersprungen` +
    (errors > 0 ? ` · ${errors} Fehler` : "");
  const message = autoCreate
    ? errors > 0
      ? `${summaryLine}. Einige Kandidaten konnten nicht erstellt werden – bitte Berechtigung prüfen.`
      : summaryLine
    : `${summaryLine}. Auto-Erstellung ist AUS – nur Vorschau. In den Richtlinien aktivierbar.`;

  return {
    status: "success",
    message,
    result: {
      source,
      found,
      created,
      existing,
      skipped,
      errors,
      autoCreate,
      candidates: candidates.map((c) => ({ name: c.name, region: c.region })),
    },
  };
}
