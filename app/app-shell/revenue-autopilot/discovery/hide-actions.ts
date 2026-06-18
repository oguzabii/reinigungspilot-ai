"use server";

/**
 * Hide discovery runs from the owner UI (v0.5.15). UI-LEVEL ONLY: the run hist-
 * ory is derived from `audit_logs`, which we NEVER mutate (the audit trail stays
 * intact). Instead we store a small "hidden" config in `company_settings.settings`
 * (key `discoveryRunsHidden`): a list of hidden run ids and/or a "hidden before"
 * timestamp. Writes go through the session client (RLS, SETTINGS domain =
 * owner/admin). No migration, no service-role.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";

export interface HideRunState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Cap the stored hidden-id list so the jsonb can't grow unbounded. */
const MAX_HIDDEN_IDS = 200;

async function loadSettings(
  companyId: string,
): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_settings")
    .select("settings")
    .eq("company_id", companyId)
    .maybeSingle();
  return (data?.settings as Record<string, unknown> | null) ?? {};
}

async function persist(
  companyId: string,
  userId: string,
  settings: Record<string, unknown>,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("company_settings")
    .upsert(
      { company_id: companyId, settings, updated_by: userId },
      { onConflict: "company_id" },
    );
  if (error) {
    console.error("[discovery] hide persist failed:", error.message);
    return false;
  }
  return true;
}

function requireManager(
  context: Awaited<ReturnType<typeof getCurrentCompanyContext>>,
): { companyId: string; userId: string } | null {
  if (!context || !context.activeCompanyId) return null;
  const role =
    context.memberships.find((m) => m.companyId === context.activeCompanyId)?.role ?? null;
  if (role !== "owner" && role !== "admin") return null;
  return { companyId: context.activeCompanyId, userId: context.user.id };
}

/** Hide one run by its audit-log id. */
export async function hideDiscoveryRun(
  _prev: HideRunState,
  formData: FormData,
): Promise<HideRunState> {
  const context = await getCurrentCompanyContext();
  const who = requireManager(context);
  if (!who) {
    return { status: "error", message: "Nur Inhaber/Admin können Läufe ausblenden." };
  }

  const raw = formData.get("run_id");
  const runId = typeof raw === "string" ? raw.trim() : "";
  if (!runId) return { status: "error", message: "Kein Lauf ausgewählt." };

  const settings = await loadSettings(who.companyId);
  const h = (settings.discoveryRunsHidden ?? {}) as Record<string, unknown>;
  const ids = Array.isArray(h.hiddenIds)
    ? (h.hiddenIds.filter((v) => typeof v === "string") as string[])
    : [];
  if (!ids.includes(runId)) ids.unshift(runId);
  settings.discoveryRunsHidden = {
    ...h,
    hiddenIds: ids.slice(0, MAX_HIDDEN_IDS),
  };

  if (!(await persist(who.companyId, who.userId, settings))) {
    return { status: "error", message: "Konnte nicht ausgeblendet werden. Bitte erneut versuchen." };
  }
  revalidatePath("/app-shell/revenue-autopilot/discovery");
  return { status: "success", message: "Lauf ausgeblendet." };
}

/**
 * Hide all current runs by setting a "hidden before now" timestamp. Zero-arg by
 * design — it ignores the form payload (useActionState still binds it as a form
 * action; React's extra args are simply unused).
 */
export async function hideAllDiscoveryRuns(): Promise<HideRunState> {
  const context = await getCurrentCompanyContext();
  const who = requireManager(context);
  if (!who) {
    return { status: "error", message: "Nur Inhaber/Admin können Läufe ausblenden." };
  }

  const settings = await loadSettings(who.companyId);
  const h = (settings.discoveryRunsHidden ?? {}) as Record<string, unknown>;
  settings.discoveryRunsHidden = {
    ...h,
    hiddenBefore: new Date().toISOString(),
    // Past explicit ids become redundant under the cutoff; keep them small.
    hiddenIds: [],
  };

  if (!(await persist(who.companyId, who.userId, settings))) {
    return { status: "error", message: "Konnte nicht ausgeblendet werden. Bitte erneut versuchen." };
  }
  revalidatePath("/app-shell/revenue-autopilot/discovery");
  return { status: "success", message: "Alle bisherigen Läufe ausgeblendet." };
}
