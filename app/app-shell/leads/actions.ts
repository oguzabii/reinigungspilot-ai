"use server";

/**
 * Lead Inbox — server actions.
 *
 * All writes go through the **session/anon** server client, so Row Level
 * Security applies (leads: owner/admin/sales via can_write_sales;
 * followup_tasks: sales OR ops). We never use the service-role/admin client.
 * No external intake/sending — manual entry only.
 *
 * Defense in depth (on top of RLS): every write is additionally scoped to the
 * caller's ACTIVE company (`activeCompanyId`). A user with memberships in two
 * companies is a member of both as far as RLS is concerned — the explicit
 * company_id scoping prevents writes that cross the UI's active-tenant context
 * (e.g. linking a follow-up in company A to a lead of company B).
 *
 * Runs only at request time (server actions), so the build needs no env.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import type { LeadStatus, SourceType, FollowupStage } from "@/lib/database-types";
import {
  LEAD_STATUS_FLOW,
  FOLLOWUP_STAGES,
  FOLLOWUP_CHANNELS,
} from "@/components/leads/lead-status";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Back-compat alias (NewLeadForm imported this name in v0.3.0). */
export type CreateLeadState = ActionState;

const ALLOWED_SOURCES: SourceType[] = [
  "manual",
  "website",
  "email",
  "google",
  "referral",
  "partner",
  "other",
];

/**
 * Read a trimmed form field, capped at `maxLen` chars (server-side guard
 * against multi-MB payloads into unconstrained text columns — finding F7).
 */
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

/* -------------------------------------------------------------------------- */
/* Create lead (v0.3.0)                                                        */
/* -------------------------------------------------------------------------- */

export async function createLead(
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

  const companyName = field(formData, "company_name");
  if (!companyName) {
    return { status: "error", message: "Firma / Name ist erforderlich." };
  }

  const sourceRaw = field(formData, "source_type");
  const sourceType: SourceType =
    sourceRaw && (ALLOWED_SOURCES as string[]).includes(sourceRaw)
      ? (sourceRaw as SourceType)
      : "manual";

  const statusRaw = field(formData, "status");
  const status: LeadStatus =
    statusRaw && (LEAD_STATUS_FLOW as string[]).includes(statusRaw)
      ? (statusRaw as LeadStatus)
      : "new";

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    company_id: context.activeCompanyId,
    company_name: companyName,
    contact_name: field(formData, "contact_name", 200),
    email: field(formData, "email", 320),
    phone: field(formData, "phone", 50),
    service_interest: field(formData, "service_interest", 200),
    source_type: sourceType,
    status,
    notes: field(formData, "notes", 2000),
    created_by: context.user.id,
    updated_by: context.user.id,
  });

  if (error) {
    // Don't leak DB internals; RLS rejections land here.
    console.error("[leads] createLead insert failed:", error.message);
    return {
      status: "error",
      message: "Lead konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }

  revalidatePath("/app-shell/leads");
  return { status: "success", message: `Lead „${companyName}" erfasst.` };
}

/* -------------------------------------------------------------------------- */
/* Update lead status (v0.3.1)                                                 */
/* -------------------------------------------------------------------------- */

export async function updateLeadStatus(
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

  const leadId = field(formData, "lead_id");
  const statusRaw = field(formData, "status");
  if (!leadId || !statusRaw || !(LEAD_STATUS_FLOW as string[]).includes(statusRaw)) {
    return { status: "error", message: "Ungültiger Status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ status: statusRaw as LeadStatus, updated_by: context.user.id })
    .eq("id", leadId)
    .eq("company_id", context.activeCompanyId) // defense in depth (see header)
    .is("deleted_at", null) // soft-deleted leads are not editable (finding F5)
    .select("id");

  // Distinguish infra errors from RLS/not-found (0 rows) — finding F9.
  if (error) {
    console.error("[leads] updateLeadStatus failed:", error.message);
    return {
      status: "error",
      message: "Status konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
  if (!data || data.length === 0) {
    // RLS rejections (e.g. readonly role) and foreign/deleted leads land here.
    return {
      status: "error",
      message:
        "Status konnte nicht geändert werden. Prüfen Sie Ihre Berechtigung (readonly kann nicht schreiben).",
    };
  }

  revalidatePath("/app-shell/leads");
  return { status: "success", message: "Status gespeichert." };
}

/* -------------------------------------------------------------------------- */
/* Create follow-up (v0.3.1)                                                   */
/* -------------------------------------------------------------------------- */

export async function createFollowup(
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

  const leadId = field(formData, "lead_id");
  if (!leadId) {
    return { status: "error", message: "Bitte einen Lead auswählen." };
  }

  const stageRaw = field(formData, "stage");
  if (!stageRaw || !(FOLLOWUP_STAGES as string[]).includes(stageRaw)) {
    return { status: "error", message: "Ungültige Follow-up-Stufe." };
  }

  // Due date (findings F2 + F10): prefer `due_at_iso` — an instant the BROWSER
  // computed from the user's local time (the server's timezone must not
  // reinterpret wall-clock input). Fallback: the raw datetime-local value,
  // strictly shape-checked. Either way the resulting instant must be plausible.
  const isoRaw = field(formData, "due_at_iso", 40);
  const localRaw = field(formData, "due_at", 40);
  let dueDate: Date | null = null;
  if (isoRaw) {
    const d = new Date(isoRaw);
    if (!Number.isNaN(d.getTime())) dueDate = d;
  }
  if (!dueDate && localRaw && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(localRaw)) {
    const d = new Date(localRaw);
    if (!Number.isNaN(d.getTime())) dueDate = d;
  }
  const minDue = Date.UTC(2020, 0, 1);
  const maxDue = Date.now() + 5 * 365 * 24 * 60 * 60 * 1000; // ~5 years out
  if (!dueDate || dueDate.getTime() < minDue || dueDate.getTime() > maxDue) {
    return {
      status: "error",
      message: "Bitte ein gültiges Fälligkeitsdatum angeben.",
    };
  }

  const note = field(formData, "note", 500);
  if (!note) {
    return {
      status: "error",
      message: "Titel / Notiz ist erforderlich.",
    };
  }

  // Channel: the UI select is cosmetic — enforce the allowlist server-side (F7).
  const channelRaw = field(formData, "channel", 50);
  const channel =
    channelRaw && (FOLLOWUP_CHANNELS as readonly string[]).includes(channelRaw)
      ? channelRaw
      : null;

  const supabase = await createClient();

  // Defense in depth: the linked lead must belong to the ACTIVE company.
  // (No composite FK guarantees followup.company_id = lead.company_id.)
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("company_id", context.activeCompanyId)
    .is("deleted_at", null)
    .maybeSingle();

  // Distinguish infra errors from a genuine cross-tenant/missing lead (F3).
  if (leadError) {
    console.error("[leads] createFollowup lead check failed:", leadError.message);
    return {
      status: "error",
      message:
        "Follow-up konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
  if (!lead) {
    return {
      status: "error",
      message: "Lead nicht gefunden (gehört nicht zum aktiven Mandanten).",
    };
  }

  const { error } = await supabase.from("followup_tasks").insert({
    company_id: context.activeCompanyId,
    lead_id: leadId,
    stage: stageRaw as FollowupStage,
    due_at: dueDate.toISOString(),
    channel,
    status: "planned",
    note,
    created_by: context.user.id,
    updated_by: context.user.id,
  });

  if (error) {
    console.error("[leads] createFollowup insert failed:", error.message);
    return {
      status: "error",
      message:
        "Follow-up konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }

  revalidatePath("/app-shell/leads");
  return { status: "success", message: "Follow-up erstellt." };
}
