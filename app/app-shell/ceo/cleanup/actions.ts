"use server";

/**
 * Workspace cleanup / reset — server action (v0.5.11). OWNER/ADMIN only.
 *
 * Archives ALL active working data of the active tenant so the owner can clear
 * test/old entries and start clean. SOFT only (reversible at the data layer):
 * sets `deleted_at` on prospects/leads/offers/jobs and `status='skipped'` on
 * follow-ups — every list filters these out. Requires a typed confirmation.
 *
 * NEVER touched: tenant/company row, settings, services, users/memberships,
 * auth, package/tier, and audit logs (we ADD one audit entry for transparency).
 * Session client + RLS (sales/ops domain via owner/admin) — never service-role.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { RESET_PHRASE } from "./constants";

export interface ResetActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function resetWorkspace(
  _prev: ResetActionState,
  formData: FormData,
): Promise<ResetActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  if (role !== "owner" && role !== "admin") {
    return { status: "error", message: "Nur Inhaber/Admin dürfen den Arbeitsbereich bereinigen." };
  }

  const confirm = (formData.get("confirm") as string | null)?.trim() ?? "";
  if (confirm !== RESET_PHRASE) {
    return {
      status: "error",
      message: `Bestätigung stimmt nicht. Bitte „${RESET_PHRASE}" exakt eingeben.`,
    };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const softDelete = async (table: string): Promise<number> => {
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: now, updated_by: context.user.id })
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .select("id");
    if (error) {
      console.error(`[cleanup] ${table} archive failed:`, error.message);
      throw new Error(table);
    }
    return data?.length ?? 0;
  };

  try {
    const prospects = await softDelete("prospects");
    const leads = await softDelete("leads");
    const offers = await softDelete("offers");
    const jobs = await softDelete("jobs");

    const { data: fu, error: fuError } = await supabase
      .from("followup_tasks")
      .update({ status: "skipped", updated_by: context.user.id })
      .eq("company_id", companyId)
      .neq("status", "skipped")
      .select("id");
    if (fuError) {
      console.error("[cleanup] followups archive failed:", fuError.message);
      throw new Error("followup_tasks");
    }
    const followups = fu?.length ?? 0;

    // Transparency: record the reset (counts only, no PII). Never deletes logs.
    await supabase.from("audit_logs").insert({
      company_id: companyId,
      actor_user_id: context.user.id,
      action: "system",
      entity_type: "workspace_reset",
      metadata: { prospects, leads, offers, jobs, followups },
    });

    [
      "/app-shell",
      "/app-shell/lead-hunter",
      "/app-shell/leads",
      "/app-shell/offers",
      "/app-shell/jobs",
      "/app-shell/bexio",
      "/app-shell/revenue-autopilot",
      "/app-shell/revenue-autopilot/outreach",
      "/app-shell/ceo",
      "/app-shell/ceo/cleanup",
    ].forEach((p) => revalidatePath(p));

    const total = prospects + leads + offers + jobs + followups;
    return {
      status: "success",
      message:
        total === 0
          ? "Arbeitsbereich war bereits leer – nichts zu bereinigen."
          : `Bereinigt: ${prospects} Firmen/Chancen, ${leads} Leads, ${offers} Offerten, ${jobs} Aufträge, ${followups} Follow-ups archiviert.`,
    };
  } catch {
    return {
      status: "error",
      message: "Bereinigung fehlgeschlagen. Bitte erneut versuchen oder Berechtigung prüfen.",
    };
  }
}
