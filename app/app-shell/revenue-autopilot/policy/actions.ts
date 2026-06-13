"use server";

/**
 * Autopilot policy — server action to update the safe-mode toggles (v0.5.2).
 *
 * Persists the toggles into `company_settings.settings` jsonb (key `autopilot`)
 * — NO schema change. Writes go through the **session/anon** server client, so
 * Row Level Security applies. `company_settings` is the SETTINGS domain: only
 * owner/admin may write (`can_write_settings`). We never use the service-role
 * client. Toggles can only ENABLE the SAFE modes — cold outreach, auto-calls and
 * silent booking are hard-blocked in `policy.ts` and not represented here.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import type { AutopilotToggles } from "@/components/revenue-autopilot/policy";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function updateAutopilotPolicy(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  // SETTINGS domain = owner/admin only (RLS is the real gate; this is a
  // friendlier early check for sales/ops/readonly).
  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  if (role !== "owner" && role !== "admin") {
    return { status: "error", message: "Nur Inhaber/Admin dürfen die Richtlinien ändern." };
  }

  const toggles: AutopilotToggles = {
    autoCreateColdCandidates: formData.get("autoCreateColdCandidates") != null,
    autoReplyInbound: formData.get("autoReplyInbound") != null,
    autoFollowupExistingApproved: formData.get("autoFollowupExistingApproved") != null,
    autoAppointmentProposal: formData.get("autoAppointmentProposal") != null,
  };

  const supabase = await createClient();

  // Merge into the existing settings jsonb so we never drop other keys.
  const { data: existing } = await supabase
    .from("company_settings")
    .select("settings")
    .eq("company_id", companyId)
    .maybeSingle();
  const settings = {
    ...((existing?.settings as Record<string, unknown> | null) ?? {}),
    autopilot: toggles,
  };

  const { error } = await supabase
    .from("company_settings")
    .upsert(
      { company_id: companyId, settings, updated_by: context.user.id },
      { onConflict: "company_id" },
    );

  if (error) {
    console.error("[autopilot] updateAutopilotPolicy failed:", error.message);
    return {
      status: "error",
      message: "Richtlinien konnten nicht gespeichert werden. Prüfen Sie Ihre Berechtigung.",
    };
  }

  revalidatePath("/app-shell/revenue-autopilot/policy");
  revalidatePath("/app-shell/revenue-autopilot/discovery");
  revalidatePath("/app-shell/revenue-autopilot");
  return { status: "success", message: "Autopilot-Richtlinien gespeichert." };
}
