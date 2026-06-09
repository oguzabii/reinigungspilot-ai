"use server";

/**
 * Lead Inbox — server actions.
 *
 * `createLead` inserts a manually entered lead through the **session/anon**
 * server client, so Row Level Security applies: only owner/admin/sales of the
 * active company may write (readonly/ops are rejected by the DB). We never use
 * the service-role/admin client here. No external intake — manual entry only.
 *
 * Runs only at request time (server action), so the build needs no env.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import type { LeadStatus, SourceType } from "@/lib/database-types";

export interface CreateLeadState {
  status: "idle" | "success" | "error";
  message?: string;
}

const ALLOWED_SOURCES: SourceType[] = [
  "manual",
  "website",
  "email",
  "google",
  "referral",
  "partner",
  "other",
];

const ALLOWED_STATUSES: LeadStatus[] = [
  "new",
  "qualified",
  "offer_ready",
  "won",
  "lost",
];

function field(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createLead(
  _prev: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
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
    statusRaw && (ALLOWED_STATUSES as string[]).includes(statusRaw)
      ? (statusRaw as LeadStatus)
      : "new";

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    company_id: context.activeCompanyId,
    company_name: companyName,
    contact_name: field(formData, "contact_name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    service_interest: field(formData, "service_interest"),
    source_type: sourceType,
    status,
    notes: field(formData, "notes"),
    created_by: context.user.id,
    updated_by: context.user.id,
  });

  if (error) {
    // Don't leak DB internals; RLS rejections and missing columns land here.
    return {
      status: "error",
      message: "Lead konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }

  revalidatePath("/app-shell/leads");
  return { status: "success", message: `Lead „${companyName}" erfasst.` };
}
