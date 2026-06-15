"use server";

/**
 * Outreach Autopilot — server actions (v0.5.8).
 *
 * MANUAL, human-in-the-loop only. The owner copies a prepared draft, sends it
 * themselves, then records that the candidate was contacted. There is NO
 * automatic sending here (no SMTP/Gmail/Resend/WhatsApp), NO booking, NO
 * external call. Writes go through the **session/anon** server client, so Row
 * Level Security applies (prospects = the SALES domain). NEVER service-role.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";

export interface ContactActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

/**
 * Record that the owner has manually contacted a discovered candidate: set the
 * prospect's status to `contacted`. Scoped to the active tenant; only advances
 * from a pre-contact status (raw/scored/approved) so it never regresses a
 * promoted/converted candidate. This records a human action — Klarsa sends
 * nothing.
 */
export async function markProspectContacted(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const raw = formData.get("prospect_id");
  const prospectId = typeof raw === "string" ? raw.trim() : "";
  if (!prospectId) {
    return { status: "error", message: "Kein Kandidat ausgewählt." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .update({ status: "contacted", updated_by: context.user.id })
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .is("promoted_lead_id", null)
    .in("status", ["raw", "scored", "approved"])
    .select("id");

  if (error) {
    console.error("[outreach] markProspectContacted failed:", error.message);
    return {
      status: "error",
      message: "Konnte nicht als kontaktiert markiert werden. Bitte Berechtigung prüfen.",
    };
  }
  if (!data || data.length === 0) {
    // Already contacted/promoted, or not found for this tenant — no-op.
    return { status: "success", message: "Bereits bearbeitet." };
  }

  revalidatePath("/app-shell/revenue-autopilot/outreach");
  revalidatePath("/app-shell/lead-hunter");
  revalidatePath("/app-shell/revenue-autopilot");
  return { status: "success", message: "Als kontaktiert markiert." };
}
