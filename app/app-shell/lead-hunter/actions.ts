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
import type { ProspectStatus, SourceType } from "@/lib/database-types";
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
  const { error } = await supabase.from("prospects").insert({
    company_id: context.activeCompanyId,
    name,
    category,
    region: field(formData, "region", 200),
    source_type: sourceType,
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
