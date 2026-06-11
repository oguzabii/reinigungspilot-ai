"use server";

/**
 * Lead Hunter — Source Registry server actions (v0.3.9 foundation).
 *
 * CONTROLLED, human-approved registry only: a person registers which sources
 * the Lead Hunter may eventually use. There is NO scraping, no auto-search, no
 * Google/Maps API, no ZEFIX/SIMAP/Handelsregister lookup, no external call —
 * this just stores a curated catalog row. Writes go through the **session/anon**
 * server client, so Row Level Security applies. `lead_sources` is the SETTINGS
 * domain: only owner/admin may write (`can_write_settings`). We never use the
 * service-role/admin client.
 *
 * Defence in depth (on top of RLS): we re-check the caller's role for the ACTIVE
 * company and scope the write to that company. Runs only at request time, so the
 * build needs no env.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import type { SourceType } from "@/lib/database-types";
import { REGISTRY_SOURCE_TYPE_VALUES } from "@/components/lead-hunter/source-meta";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  /**
   * Changes on every successful submit so the client form can remount-clear
   * (via React `key`). Preserved on error so a failed submit keeps the input.
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

export async function createLeadSource(
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
  const companyId = context.activeCompanyId;

  // SETTINGS domain = owner/admin only. RLS (`can_write_settings`) is the real
  // gate; this app-level check returns a friendlier message and avoids a doomed
  // write for sales/ops/readonly members.
  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  if (role !== "owner" && role !== "admin") {
    return {
      status: "error",
      message: "Nur Inhaber/Admin dürfen Quellen verwalten.",
      resetToken: _prev.resetToken,
    };
  }

  const label = field(formData, "label", 200);
  if (!label) {
    return {
      status: "error",
      message: "Bezeichnung der Quelle ist erforderlich.",
      resetToken: _prev.resetToken,
    };
  }

  // Source type (whitelist a curated subset of source_type; default "manual").
  const typeRaw = field(formData, "type", 30);
  const type: SourceType =
    typeRaw && (REGISTRY_SOURCE_TYPE_VALUES as string[]).includes(typeRaw)
      ? (typeRaw as SourceType)
      : "manual";

  // Checkbox: present (= "on") means active. Defaults to active in the form.
  const enabled = formData.get("enabled") != null;

  const supabase = await createClient();
  const { error } = await supabase.from("lead_sources").insert({
    company_id: companyId,
    type,
    label,
    enabled,
    notes: field(formData, "notes", 2000),
    created_by: context.user.id,
    updated_by: context.user.id,
  });

  if (error) {
    console.error("[lead-hunter] createLeadSource insert failed:", error.message);
    return {
      status: "error",
      message:
        "Quelle konnte nicht gespeichert werden. Prüfen Sie Ihre Berechtigung.",
      resetToken: _prev.resetToken,
    };
  }

  revalidatePath("/app-shell/lead-hunter/sources");
  revalidatePath("/app-shell/lead-hunter");
  return {
    status: "success",
    message: `Quelle „${label}" gespeichert.`,
    resetToken: `ok-${Date.now()}`,
  };
}
