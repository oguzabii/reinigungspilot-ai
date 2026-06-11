"use server";

/**
 * Lead Hunter / Opportunity Radar — server actions (v0.3.6 foundation).
 *
 * MANUAL capture only: a human enters an opportunity. There is NO scraping, no
 * auto-search, no Google/ZEFIX/SIMAP API, no external source. Writes go through
 * the **session/anon** server client, so Row Level Security applies (prospects
 * are the SALES domain: owner/admin/sales via can_write_sales). We never use
 * the service-role/admin client.
 *
 * Defense in depth (on top of RLS): the write is scoped to the caller's ACTIVE
 * company. Runs only at request time, so the build needs no env.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import type { ProspectStatus, SourceType, LeadStatus } from "@/lib/database-types";
import {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_SOURCES,
  PROSPECT_STATUS_FLOW,
} from "@/components/lead-hunter/opportunity-meta";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  /**
   * Changes on every successful submit so the client form can remount-clear
   * (via React `key`) without a setState-in-effect. Preserved on error so a
   * failed submit keeps the user's input.
   */
  resetToken?: string;
}

function field(
  formData: FormData,
  name: string,
  maxLen = 300,
): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
}

const ALLOWED_SOURCES = OPPORTUNITY_SOURCES.map((s) => s.value) as SourceType[];

export async function createOpportunity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return {
      status: "error",
      message: "Kein aktiver Mandant – bitte erneut anmelden.",
      resetToken: _prev.resetToken,
    };
  }

  const name = field(formData, "name", 200);
  if (!name) {
    return {
      status: "error",
      message: "Titel / Firma / Projekt ist erforderlich.",
      resetToken: _prev.resetToken,
    };
  }

  // Opportunity type → category (whitelist; default "Manuell").
  const typeRaw = field(formData, "category", 50);
  const category =
    typeRaw && (OPPORTUNITY_TYPES as readonly string[]).includes(typeRaw)
      ? typeRaw
      : "Manuell";

  // Source (whitelist a subset of source_type; default "manual").
  const sourceRaw = field(formData, "source_type", 30);
  const sourceType: SourceType =
    sourceRaw && (ALLOWED_SOURCES as string[]).includes(sourceRaw)
      ? (sourceRaw as SourceType)
      : "manual";

  // Status (whitelist prospect_status; default "scored").
  const statusRaw = field(formData, "status", 30);
  const status: ProspectStatus =
    statusRaw && (PROSPECT_STATUS_FLOW as string[]).includes(statusRaw)
      ? (statusRaw as ProspectStatus)
      : "scored";

  // Score → int clamped to 0..100; null if blank/invalid.
  const scoreRaw = field(formData, "score", 6);
  let score: number | null = null;
  if (scoreRaw) {
    const n = Number.parseInt(scoreRaw, 10);
    if (Number.isFinite(n)) score = Math.min(100, Math.max(0, n));
  }

  const supabase = await createClient();

  // Optional link to a registered source (v0.3.10 Source -> Opportunity).
  // Defense in depth: only accept a source that belongs to the ACTIVE tenant and
  // is not soft-deleted — never link across tenants (the FK alone would not
  // enforce same-company). An invalid/foreign id is silently dropped to null.
  let sourceId: string | null = null;
  const sourceIdRaw = field(formData, "source_id", 60);
  if (sourceIdRaw) {
    const { data: src } = await supabase
      .from("lead_sources")
      .select("id")
      .eq("id", sourceIdRaw)
      .eq("company_id", context.activeCompanyId)
      .is("deleted_at", null)
      .maybeSingle();
    if (src) sourceId = sourceIdRaw;
  }

  const { error } = await supabase.from("prospects").insert({
    company_id: context.activeCompanyId,
    name,
    category,
    region: field(formData, "region", 200),
    source_type: sourceType,
    source_id: sourceId,
    search_query: field(formData, "service_potential", 300), // service potential
    score,
    reason: field(formData, "reason", 2000),
    suggested_message: field(formData, "next_action", 500), // next action
    status,
    created_by: context.user.id,
    updated_by: context.user.id,
  });

  if (error) {
    console.error("[lead-hunter] createOpportunity insert failed:", error.message);
    return {
      status: "error",
      message:
        "Opportunity konnte nicht gespeichert werden. Prüfen Sie Ihre Berechtigung.",
      resetToken: _prev.resetToken,
    };
  }

  revalidatePath("/app-shell/lead-hunter");
  return {
    status: "success",
    message: `Opportunity „${name}" erfasst.`,
    resetToken: `ok-${Date.now()}`,
  };
}

/* -------------------------------------------------------------------------- */
/* Promote an opportunity into the Lead Inbox (v0.3.8)                         */
/* -------------------------------------------------------------------------- */

export async function promoteOpportunity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return {
      status: "error",
      message: "Kein aktiver Mandant – bitte erneut anmelden.",
    };
  }
  const companyId = context.activeCompanyId;

  const prospectId = field(formData, "prospect_id");
  if (!prospectId) {
    return { status: "error", message: "Keine Opportunity ausgewählt." };
  }

  const supabase = await createClient();

  // The opportunity must belong to the ACTIVE tenant and not be deleted.
  const { data: prospect, error: prospectError } = await supabase
    .from("prospects")
    .select(
      "id, name, region, source_type, search_query, reason, suggested_message, promoted_lead_id",
    )
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (prospectError) {
    console.error("[lead-hunter] promote prospect read failed:", prospectError.message);
    return {
      status: "error",
      message: "Übernahme fehlgeschlagen. Bitte erneut versuchen.",
    };
  }
  if (!prospect) {
    return {
      status: "error",
      message: "Opportunity nicht gefunden (gehört nicht zum aktiven Mandanten).",
    };
  }
  const p = prospect as unknown as {
    name: string;
    region: string | null;
    source_type: SourceType;
    search_query: string | null;
    reason: string | null;
    suggested_message: string | null;
    promoted_lead_id: string | null;
  };
  if (p.promoted_lead_id) {
    return {
      status: "error",
      message: "Diese Opportunity wurde bereits in den Lead Inbox übernommen.",
    };
  }

  const noteParts: string[] = [];
  if (p.reason) noteParts.push(p.reason);
  if (p.suggested_message) noteParts.push(`Nächste Aktion: ${p.suggested_message}`);
  const notes = noteParts.length > 0 ? noteParts.join("\n\n") : null;

  // Create the lead from the opportunity (linked back via prospect_id).
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      company_id: companyId,
      company_name: p.name,
      region: p.region,
      source_type: p.source_type,
      service_interest: p.search_query,
      status: "qualified" as LeadStatus,
      notes,
      prospect_id: prospectId,
      created_by: context.user.id,
      updated_by: context.user.id,
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    console.error("[lead-hunter] promote lead insert failed:", leadError?.message);
    return {
      status: "error",
      message: "Lead konnte nicht erstellt werden. Prüfen Sie Ihre Berechtigung.",
    };
  }

  // Atomically claim the opportunity: only succeeds while promoted_lead_id is
  // still null, so a concurrent promotion can't create a second lead.
  const { data: claimed, error: claimError } = await supabase
    .from("prospects")
    .update({
      promoted_lead_id: lead.id,
      status: "converted" as ProspectStatus,
      updated_by: context.user.id,
    })
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .is("promoted_lead_id", null)
    .select("id");

  if (claimError || !claimed || claimed.length === 0) {
    // Lost the race (or update failed): soft-delete the orphaned lead.
    await supabase
      .from("leads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", lead.id)
      .eq("company_id", companyId);
    if (claimError) {
      console.error("[lead-hunter] promote claim failed:", claimError.message);
    }
    return {
      status: "error",
      message: "Diese Opportunity wurde bereits in den Lead Inbox übernommen.",
    };
  }

  revalidatePath("/app-shell/lead-hunter");
  revalidatePath("/app-shell/leads");
  return { status: "success", message: "In den Lead Inbox übernommen." };
}
