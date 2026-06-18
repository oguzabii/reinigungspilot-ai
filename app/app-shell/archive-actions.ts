"use server";

/**
 * Archive ("Aus Arbeitsliste entfernen") — server actions (v0.5.11).
 *
 * Lets the owner remove unwanted entries (test/old data) from the active work
 * lists. SOFT only: rows with a `deleted_at` column are set to deleted (they
 * leave every list, which already filters `deleted_at is null`); follow-ups have
 * no `deleted_at`, so they are set to status `skipped` (also filtered out).
 * Nothing is hard-deleted. Writes go through the session client, so Row Level
 * Security applies (sales/ops domain) — never service-role.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";

export type ArchivableEntity =
  | "prospect"
  | "lead"
  | "offer"
  | "job"
  | "followup"
  | "source";

export interface ArchiveActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

const TABLE: Record<ArchivableEntity, string> = {
  prospect: "prospects",
  lead: "leads",
  offer: "offers",
  job: "jobs",
  followup: "followup_tasks",
  // Lead sources: soft-archive only (SETTINGS domain via RLS). Prospects keep
  // their source_id, so soft-deleting a source never breaks their display.
  source: "lead_sources",
};

const PATHS = [
  "/app-shell",
  "/app-shell/lead-hunter",
  "/app-shell/lead-hunter/sources",
  "/app-shell/lead-hunter/radar",
  "/app-shell/leads",
  "/app-shell/offers",
  "/app-shell/pipeline",
  "/app-shell/jobs",
  "/app-shell/revenue-autopilot",
  "/app-shell/revenue-autopilot/outreach",
];

export async function archiveEntity(
  _prev: ArchiveActionState,
  formData: FormData,
): Promise<ArchiveActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const entityRaw = formData.get("entity");
  const idRaw = formData.get("id");
  const entity =
    typeof entityRaw === "string" && entityRaw in TABLE
      ? (entityRaw as ArchivableEntity)
      : null;
  const id = typeof idRaw === "string" ? idRaw.trim() : "";
  if (!entity || !id) {
    return { status: "error", message: "Eintrag konnte nicht entfernt werden." };
  }

  const supabase = await createClient();

  // Follow-ups have no deleted_at — mark them 'skipped' (filtered from the list).
  if (entity === "followup") {
    const { data, error } = await supabase
      .from("followup_tasks")
      .update({ status: "skipped", updated_by: context.user.id })
      .eq("id", id)
      .eq("company_id", companyId)
      .neq("status", "skipped")
      .select("id");
    if (error) {
      console.error("[archive] followup update failed:", error.message);
      return { status: "error", message: "Konnte nicht entfernt werden. Bitte Berechtigung prüfen." };
    }
    if (!data || data.length === 0) {
      return { status: "success", message: "Bereits entfernt." };
    }
    PATHS.forEach((p) => revalidatePath(p));
    return { status: "success", message: "Aus Arbeitsliste entfernt." };
  }

  // Everything else: soft delete via deleted_at.
  const { data, error } = await supabase
    .from(TABLE[entity])
    .update({ deleted_at: new Date().toISOString(), updated_by: context.user.id })
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error(`[archive] ${entity} soft-delete failed:`, error.message);
    return { status: "error", message: "Konnte nicht entfernt werden. Bitte Berechtigung prüfen." };
  }
  if (!data || data.length === 0) {
    return { status: "success", message: "Bereits entfernt." };
  }

  PATHS.forEach((p) => revalidatePath(p));
  return { status: "success", message: "Aus Arbeitsliste entfernt." };
}
