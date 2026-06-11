"use server";

/**
 * Jobs — server actions (v0.3.4 foundation).
 *
 * A job is created MANUALLY from an **accepted** offer. The write goes through
 * the **session/anon** server client, so Row Level Security applies (jobs are
 * the OPS domain: owner/admin/ops via can_write_ops — a sales-only user is
 * rejected by the DB). We never use the service-role/admin client.
 *
 * Defense in depth (on top of RLS): the source offer is verified to belong to
 * the caller's ACTIVE company and to be `accepted`, and a duplicate-job
 * pre-check runs before insert (migration 005 adds the real DB-level guard:
 * one live job per offer). No calendar, no email, no bexio, no external calls.
 *
 * Runs only at request time (server action), so the build needs no env.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import type { JobStatus } from "@/lib/database-types";
import { JOB_STATUS_FLOW } from "@/components/jobs/job-status";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

function field(formData: FormData, name: string): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createJobFromOffer(
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
  const companyId = context.activeCompanyId;

  const offerId = field(formData, "offer_id");
  if (!offerId) {
    return { status: "error", message: "Keine Offerte ausgewählt." };
  }

  const supabase = await createClient();

  // The source offer must belong to the ACTIVE tenant, not be deleted, and be
  // accepted. We also pull its lead + total to seed the job.
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, reference, status, lead_id, total_gross_chf, leads ( company_name )")
    .eq("id", offerId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (offerError) {
    console.error("[jobs] createJobFromOffer offer check failed:", offerError.message);
    return {
      status: "error",
      message: "Auftrag konnte nicht erstellt werden. Bitte erneut versuchen.",
    };
  }
  if (!offer) {
    return {
      status: "error",
      message: "Offerte nicht gefunden (gehört nicht zum aktiven Mandanten).",
    };
  }
  const offerRow = offer as unknown as {
    reference: string;
    status: string;
    lead_id: string | null;
    total_gross_chf: number | string;
    leads: { company_name: string } | Array<{ company_name: string }> | null;
  };
  if (offerRow.status !== "accepted") {
    return {
      status: "error",
      message:
        "Nur angenommene Offerten können in einen Auftrag überführt werden.",
    };
  }

  // Duplicate pre-check (the partial unique index in migration 005 is the real
  // guard; this gives a friendly message for the common case).
  const { data: existing, error: existingError } = await supabase
    .from("jobs")
    .select("id")
    .eq("company_id", companyId)
    .eq("offer_id", offerId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existingError) {
    console.error("[jobs] createJobFromOffer dup check failed:", existingError.message);
    return {
      status: "error",
      message: "Auftrag konnte nicht erstellt werden. Bitte erneut versuchen.",
    };
  }
  if (existing) {
    return {
      status: "error",
      message: "Für diese Offerte besteht bereits ein Auftrag.",
    };
  }

  const lead = Array.isArray(offerRow.leads) ? offerRow.leads[0] : offerRow.leads;
  const customer = lead?.company_name ?? null;
  const title = customer
    ? `${customer} – Offerte ${offerRow.reference}`
    : `Auftrag zu Offerte ${offerRow.reference}`;
  const value = Number(offerRow.total_gross_chf);

  const { error } = await supabase.from("jobs").insert({
    company_id: companyId,
    offer_id: offerId,
    lead_id: offerRow.lead_id,
    title,
    status: "planned" as JobStatus,
    value_chf: Number.isFinite(value) ? value : null,
    created_by: context.user.id,
    updated_by: context.user.id,
  });

  if (error) {
    // 23505 = the migration-005 unique index fired (a job already exists).
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Für diese Offerte besteht bereits ein Auftrag.",
      };
    }
    console.error("[jobs] createJobFromOffer insert failed:", error.message);
    return {
      status: "error",
      message:
        "Auftrag konnte nicht erstellt werden. Prüfen Sie Ihre Berechtigung (Auftragserstellung erfordert Ops, Admin oder Owner).",
    };
  }

  revalidatePath("/app-shell/offers");
  revalidatePath("/app-shell/jobs");
  return { status: "success", message: "Auftrag erstellt." };
}

/* -------------------------------------------------------------------------- */
/* Update job status (v0.3.5 workflow)                                         */
/* -------------------------------------------------------------------------- */

export async function updateJobStatus(
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

  const jobId = field(formData, "job_id");
  const statusRaw = field(formData, "status");
  if (!jobId || !statusRaw || !(JOB_STATUS_FLOW as string[]).includes(statusRaw)) {
    return { status: "error", message: "Ungültiger Status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ status: statusRaw as JobStatus, updated_by: context.user.id })
    .eq("id", jobId)
    .eq("company_id", context.activeCompanyId) // defense in depth
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[jobs] updateJobStatus failed:", error.message);
    return {
      status: "error",
      message: "Status konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
  if (!data || data.length === 0) {
    return {
      status: "error",
      message:
        "Status konnte nicht geändert werden. Prüfen Sie Ihre Berechtigung (erfordert Ops, Admin oder Owner).",
    };
  }

  revalidatePath("/app-shell/jobs");
  return { status: "success", message: "Status gespeichert." };
}

/* -------------------------------------------------------------------------- */
/* Update job schedule (v0.3.5 — manual scheduled_for)                         */
/* -------------------------------------------------------------------------- */

export async function updateJobSchedule(
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

  const jobId = field(formData, "job_id");
  if (!jobId) {
    return { status: "error", message: "Kein Auftrag ausgewählt." };
  }

  const intent = field(formData, "intent"); // "set" | "clear"
  let scheduledFor: string | null = null;

  if (intent === "clear") {
    scheduledFor = null;
  } else {
    // Prefer the browser-computed instant (so the server TZ can't reinterpret
    // wall-clock input); fall back to a strictly shape-checked local value.
    const isoRaw = field(formData, "scheduled_iso");
    const localRaw = field(formData, "scheduled_local");
    let due: Date | null = null;
    if (isoRaw) {
      const d = new Date(isoRaw);
      if (!Number.isNaN(d.getTime())) due = d;
    }
    if (!due && localRaw && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(localRaw)) {
      const d = new Date(localRaw);
      if (!Number.isNaN(d.getTime())) due = d;
    }
    const min = Date.UTC(2020, 0, 1);
    const max = Date.now() + 5 * 365 * 24 * 60 * 60 * 1000; // ~5 years out
    if (!due || due.getTime() < min || due.getTime() > max) {
      return {
        status: "error",
        message: "Bitte ein gültiges Datum/Zeit wählen (oder „Termin entfernen“).",
      };
    }
    scheduledFor = due.toISOString();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ scheduled_for: scheduledFor, updated_by: context.user.id })
    .eq("id", jobId)
    .eq("company_id", context.activeCompanyId) // defense in depth
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[jobs] updateJobSchedule failed:", error.message);
    return {
      status: "error",
      message: "Termin konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
  if (!data || data.length === 0) {
    return {
      status: "error",
      message:
        "Termin konnte nicht gespeichert werden. Prüfen Sie Ihre Berechtigung (erfordert Ops, Admin oder Owner).",
    };
  }

  revalidatePath("/app-shell/jobs");
  return {
    status: "success",
    message: intent === "clear" ? "Termin entfernt." : "Termin gespeichert.",
  };
}
