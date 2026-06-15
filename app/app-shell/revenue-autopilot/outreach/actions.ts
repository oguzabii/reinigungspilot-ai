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
import { getCompanySummary, getCompanySettings } from "@/lib/auth/tenant-data";
import { isPremiumExperience } from "@/components/app-shell/autopilot-tier";
import { buildOutreachDrafts } from "@/components/revenue-autopilot/outreach";
import { matchServices } from "@/components/lead-hunter/scoring";
import {
  isSendConfigured,
  sendEmail,
  looksLikeEmail,
} from "@/lib/outreach/send-provider";
import type { SourceType } from "@/lib/database-types";

export interface ContactActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Read an optional, trimmed, length-capped text field (empty → null). */
function optField(formData: FormData, name: string, maxLen = 300): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return null;
  const t = raw.replace(/[\r\n]+/g, " ").trim();
  return t.length === 0 ? null : t.slice(0, maxLen);
}

function isWarmSource(sourceType: string): boolean {
  return sourceType === "referral" || sourceType === "partner";
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

/* -------------------------------------------------------------------------- */
/* Add / update a candidate's contact details (v0.5.9)                         */
/* -------------------------------------------------------------------------- */

/**
 * Save the contact details a human entered/approved for a candidate
 * (`contact_email/phone/website/person`). Sales-domain write via the session
 * client (RLS = owner/admin/sales). No sending here.
 */
export async function updateProspectContact(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const prospectId = optField(formData, "prospect_id", 60);
  if (!prospectId) return { status: "error", message: "Kein Kandidat ausgewählt." };

  const email = optField(formData, "contact_email", 200);
  if (email && !looksLikeEmail(email)) {
    return { status: "error", message: "E-Mail-Adresse ist ungültig." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .update({
      contact_email: email,
      contact_phone: optField(formData, "contact_phone", 60),
      contact_website: optField(formData, "contact_website", 300),
      contact_person: optField(formData, "contact_person", 200),
      updated_by: context.user.id,
    })
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[outreach] updateProspectContact failed:", error.message);
    return {
      status: "error",
      message: "Kontaktangaben konnten nicht gespeichert werden. Bitte Berechtigung prüfen.",
    };
  }
  if (!data || data.length === 0) {
    return { status: "error", message: "Kandidat nicht gefunden." };
  }

  revalidatePath("/app-shell/revenue-autopilot/outreach");
  revalidatePath("/app-shell/lead-hunter");
  return { status: "success", message: "Kontaktangaben gespeichert." };
}

/* -------------------------------------------------------------------------- */
/* Controlled, single-recipient, owner-approved email send (v0.5.9)            */
/* -------------------------------------------------------------------------- */

export interface SendActionState {
  status: "idle" | "success" | "error" | "locked" | "not_configured";
  message?: string;
}

/**
 * Send ONE first-contact email to ONE candidate, after an explicit owner click.
 *
 * Hard guardrails: PREMIUM/internal_founder only; a compliant provider must be
 * configured; the recipient is the candidate's OWN stored `contact_email`
 * (re-read server-side, never a client-supplied address); the body is the
 * deterministic draft rebuilt here (no client-supplied content); exactly ONE
 * message, no bulk, no schedule, no background send, no WhatsApp. On success the
 * candidate is marked `contacted` (+ `last_contacted_at`) and the run is audited.
 */
export async function sendOutreachMessage(
  _prev: SendActionState,
  formData: FormData,
): Promise<SendActionState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const prospectId = optField(formData, "prospect_id", 60);
  if (!prospectId) return { status: "error", message: "Kein Kandidat ausgewählt." };

  // Package gating: real send is Premium-only.
  const summary = await getCompanySummary(companyId);
  if (!isPremiumExperience(summary?.tier ?? "starter", summary?.billingStatus)) {
    return {
      status: "locked",
      message: "E-Mail-Versand ist eine Premium-Funktion. Freigabe erforderlich.",
    };
  }

  // A compliant send channel must be configured.
  if (!isSendConfigured()) {
    return {
      status: "not_configured",
      message: "Kanal nicht verbunden – der Versandkanal ist nicht eingerichtet.",
    };
  }

  const supabase = await createClient();
  const { data: prospect, error: readError } = await supabase
    .from("prospects")
    .select(
      "id, name, region, category, source_type, search_query, score, contact_email, contact_person, promoted_lead_id",
    )
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (readError) {
    console.error("[outreach] send read failed:", readError.message);
    return { status: "error", message: "Versand fehlgeschlagen. Bitte erneut versuchen." };
  }
  if (!prospect) {
    return { status: "error", message: "Kandidat nicht gefunden." };
  }
  const p = prospect as unknown as {
    name: string;
    region: string | null;
    category: string | null;
    source_type: SourceType;
    search_query: string | null;
    score: number | null;
    contact_email: string | null;
    contact_person: string | null;
  };

  // Recipient is the candidate's OWN stored email (never client-supplied).
  if (!p.contact_email || !looksLikeEmail(p.contact_email)) {
    return { status: "error", message: "E-Mail-Adresse fehlt – bitte zuerst Kontaktangaben ergänzen." };
  }

  // Rebuild the deterministic first-contact email (same inputs as the preview).
  const settings = await getCompanySettings(companyId);
  const matched = matchServices({
    name: p.name,
    category: p.category ?? "Manuell",
    region: p.region ?? "",
    servicePotential: p.search_query ?? "",
    sourceType: p.source_type,
    score: p.score,
  });
  const drafts = buildOutreachDrafts({
    name: p.name,
    contactName: p.contact_person,
    service: matched[0] ?? p.search_query,
    region: p.region,
    sourceLabel: null,
    warm: isWarmSource(p.source_type),
    senderPerson: settings.senderName,
    senderCompany: summary?.name ?? "Ihr Betrieb",
  });
  const email = drafts.find((d) => d.key === "email");
  if (!email || !email.subject || !email.text) {
    return { status: "error", message: "Entwurf konnte nicht erstellt werden." };
  }

  const sent = await sendEmail({
    to: p.contact_email,
    subject: email.subject,
    text: email.text,
  });
  if (sent.status === "not_configured") {
    return { status: "not_configured", message: "Kanal nicht verbunden." };
  }
  if (sent.status === "error") {
    return { status: "error", message: sent.message ?? "Versand fehlgeschlagen." };
  }

  // Mark contacted (forward-only) + audit. No recipient PII in the audit.
  await supabase
    .from("prospects")
    .update({
      status: "contacted",
      last_contacted_at: new Date().toISOString(),
      updated_by: context.user.id,
    })
    .eq("id", prospectId)
    .eq("company_id", companyId)
    .is("deleted_at", null);

  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: context.user.id,
    action: "system",
    entity_type: "outreach_send",
    metadata: { channel: "email", status: "sent" },
  });

  revalidatePath("/app-shell/revenue-autopilot/outreach");
  revalidatePath("/app-shell/lead-hunter");
  revalidatePath("/app-shell/revenue-autopilot");
  return { status: "success", message: "E-Mail gesendet und als kontaktiert markiert." };
}
