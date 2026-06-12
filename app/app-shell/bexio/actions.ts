"use server";

/**
 * bexio handoff — server actions (v0.3.12 foundation).
 *
 * A MANUAL invoice-handoff queue: a human marks a completed job as prepared for
 * bexio and later as invoiced. There is **NO real bexio API, no token, no
 * network call, no automatic invoice creation** — these actions only write rows
 * to the existing `bexio_handoffs` table (migration 001). Writes go through the
 * **session/anon** server client, so Row Level Security applies — `bexio_handoffs`
 * is the **bexio domain: owner/admin only** (`can_manage_company`). We never use
 * the service-role/admin client.
 *
 * Defense in depth (on top of RLS): we re-check the caller's role for the ACTIVE
 * company and scope every write to that company. Runs only at request time, so
 * the build needs no env.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { READY_JOB_STATUS } from "@/components/bexio/handoff-meta";
import type { HandoffStatus, JobStatus } from "@/lib/database-types";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function field(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** owner/admin = the bexio/manage domain (`can_manage_company`). */
function activeRole(
  context: NonNullable<Awaited<ReturnType<typeof getCurrentCompanyContext>>>,
  companyId: string,
): string | null {
  return context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
}

/* -------------------------------------------------------------------------- */
/* Prepare a completed job for bexio (create a queued handoff row)            */
/* -------------------------------------------------------------------------- */

export async function prepareHandoff(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const role = activeRole(context, companyId);
  if (role !== "owner" && role !== "admin") {
    return { status: "error", message: "Nur Inhaber/Admin dürfen bexio-Übergaben vorbereiten." };
  }

  const jobId = field(formData, "job_id");
  if (!jobId) return { status: "error", message: "Kein Auftrag ausgewählt." };

  const supabase = await createClient();

  // The job must belong to the ACTIVE tenant, not be deleted, and be completed.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, status, value_chf, offers ( reference, total_net_chf, vat_rate_pct, total_gross_chf )",
    )
    .eq("id", jobId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (jobError) {
    console.error("[bexio] prepareHandoff job read failed:", jobError.message);
    return { status: "error", message: "Vorbereitung fehlgeschlagen. Bitte erneut versuchen." };
  }
  if (!job) {
    return { status: "error", message: "Auftrag nicht gefunden (gehört nicht zum aktiven Mandanten)." };
  }

  const j = job as unknown as {
    status: JobStatus;
    value_chf: number | string | null;
    offers:
      | {
          reference: string;
          total_net_chf: number | string;
          vat_rate_pct: number | string;
          total_gross_chf: number | string;
        }
      | Array<{
          reference: string;
          total_net_chf: number | string;
          vat_rate_pct: number | string;
          total_gross_chf: number | string;
        }>
      | null;
  };

  if (j.status !== READY_JOB_STATUS) {
    return {
      status: "error",
      message: "Nur abgeschlossene Aufträge können für bexio vorbereitet werden.",
    };
  }

  // One handoff per job: refuse if one already exists for this tenant + job.
  const { data: existing } = await supabase
    .from("bexio_handoffs")
    .select("id")
    .eq("company_id", companyId)
    .eq("job_id", jobId)
    .maybeSingle();
  if (existing) {
    return { status: "error", message: "Dieser Auftrag wurde bereits für bexio vorbereitet." };
  }

  // Amounts: prefer the linked offer's totals; otherwise fall back to the job
  // value as gross with the standard VAT rate.
  const offer = Array.isArray(j.offers) ? j.offers[0] : j.offers;
  let netChf: number;
  let vatRatePct: number;
  let grossChf: number;
  let ref: string | null;
  if (offer && num(offer.total_gross_chf) !== null) {
    netChf = num(offer.total_net_chf) ?? 0;
    vatRatePct = num(offer.vat_rate_pct) ?? 8.1;
    grossChf = num(offer.total_gross_chf) ?? 0;
    ref = offer.reference ?? null;
  } else {
    grossChf = num(j.value_chf) ?? 0;
    vatRatePct = 8.1;
    netChf = Math.round((grossChf / (1 + vatRatePct / 100)) * 100) / 100;
    ref = null;
  }

  const { error } = await supabase.from("bexio_handoffs").insert({
    company_id: companyId,
    job_id: jobId,
    connection_id: null, // no real bexio connection — manual handoff only
    status: "queued" as HandoffStatus,
    net_chf: netChf,
    vat_rate_pct: vatRatePct,
    gross_chf: grossChf,
    invoice_draft_ref: ref,
    queued_at: new Date().toISOString(),
    created_by: context.user.id,
    updated_by: context.user.id,
  });

  if (error) {
    console.error("[bexio] prepareHandoff insert failed:", error.message);
    return {
      status: "error",
      message: "Übergabe konnte nicht vorbereitet werden. Prüfen Sie Ihre Berechtigung.",
    };
  }

  revalidatePath("/app-shell/bexio");
  revalidatePath("/app-shell");
  return { status: "success", message: "Für bexio vorbereitet." };
}

/* -------------------------------------------------------------------------- */
/* Mark a prepared handoff as invoiced (status completed)                     */
/* -------------------------------------------------------------------------- */

export async function markHandoffInvoiced(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const role = activeRole(context, companyId);
  if (role !== "owner" && role !== "admin") {
    return { status: "error", message: "Nur Inhaber/Admin dürfen den Status ändern." };
  }

  const handoffId = field(formData, "handoff_id");
  if (!handoffId) return { status: "error", message: "Keine Übergabe ausgewählt." };

  const supabase = await createClient();

  // Idempotent: only flips a not-yet-completed handoff of the active tenant.
  const { data: updated, error } = await supabase
    .from("bexio_handoffs")
    .update({
      status: "completed" as HandoffStatus,
      sent_at: new Date().toISOString(),
      updated_by: context.user.id,
    })
    .eq("id", handoffId)
    .eq("company_id", companyId)
    .neq("status", "completed")
    .select("id");

  if (error) {
    console.error("[bexio] markHandoffInvoiced update failed:", error.message);
    return { status: "error", message: "Status konnte nicht geändert werden. Prüfen Sie Ihre Berechtigung." };
  }
  if (!updated || updated.length === 0) {
    return { status: "error", message: "Übergabe nicht gefunden oder bereits verrechnet." };
  }

  revalidatePath("/app-shell/bexio");
  revalidatePath("/app-shell");
  return { status: "success", message: "Als verrechnet markiert." };
}
