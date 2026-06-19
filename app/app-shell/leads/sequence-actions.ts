"use server";

/**
 * Automatic follow-up sequence — server actions (v0.5.16).
 *
 * A "sequence" is just three `followup_tasks` for a lead (stages 24h / 48h /
 * 5d_final) — NO migration, the schema already models it. The owner starts the
 * sequence explicitly; Klarsa schedules the steps and tracks them. Sending is
 * SEPARATE and gated: `sendDueFollowups` only sends when a provider is
 * configured (Premium), the owner triggers it, one message per due step, capped,
 * and audited without recipient PII. Nothing is sent in the background here —
 * the cron endpoint (`/api/cron/followups`) is a prepared, non-sending stub
 * because cross-tenant background writes would need service-role (intentionally
 * not used). All writes go through the session client (RLS), never service-role.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getCompanySettings } from "@/lib/auth/tenant-data";
import { isPremiumExperience } from "@/components/app-shell/autopilot-tier";
import { isSendConfigured, sendEmail, looksLikeEmail } from "@/lib/outreach/send-provider";
import type { FollowupStage } from "@/lib/database-types";

export interface SequenceState {
  status: "idle" | "success" | "error" | "locked" | "not_configured";
  message?: string;
}

/** Step offsets in hours: 24h → 48h → 5 days. */
const STEPS: Array<{ stage: FollowupStage; hours: number; label: string }> = [
  { stage: "24h", hours: 24, label: "Schritt 1/3 · nach 24 h, falls keine Antwort" },
  { stage: "48h", hours: 48, label: "Schritt 2/3 · nach 48 h, falls keine Antwort" },
  { stage: "5d_final", hours: 120, label: "Schritt 3/3 · finale Erinnerung nach 5 Tagen" },
];

/** Max messages sent per owner-triggered run (no bulk). */
const SEND_CAP = 5;

function leadId(formData: FormData): string {
  const raw = formData.get("lead_id");
  return typeof raw === "string" ? raw.trim() : "";
}

/** Start the 24h/48h/5d follow-up sequence for a lead. */
export async function startFollowupSequence(
  _prev: SequenceState,
  formData: FormData,
): Promise<SequenceState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;
  const lid = leadId(formData);
  if (!lid) return { status: "error", message: "Kein Lead ausgewählt." };

  const supabase = await createClient();

  // The lead must belong to the active tenant.
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("id", lid)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!lead) return { status: "error", message: "Lead nicht gefunden." };

  // Already an active sequence? (any planned/due step)
  const { data: open } = await supabase
    .from("followup_tasks")
    .select("id")
    .eq("company_id", companyId)
    .eq("lead_id", lid)
    .in("status", ["planned", "due", "overdue"])
    .limit(1);
  if (open && open.length > 0) {
    return { status: "success", message: "Eine Follow-up-Sequenz läuft bereits." };
  }

  // Optionally link the lead's newest open offer for context.
  const { data: offer } = await supabase
    .from("offers")
    .select("id")
    .eq("company_id", companyId)
    .eq("lead_id", lid)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const offerId = (offer as { id: string } | null)?.id ?? null;

  const now = Date.now();
  const rows = STEPS.map((s) => ({
    company_id: companyId,
    lead_id: lid,
    offer_id: offerId,
    stage: s.stage,
    due_at: new Date(now + s.hours * 60 * 60 * 1000).toISOString(),
    channel: "E-Mail",
    status: "planned" as const,
    note: `Automatische Follow-up-Sequenz · ${s.label}`,
    created_by: context.user.id,
    updated_by: context.user.id,
  }));

  const { error } = await supabase.from("followup_tasks").insert(rows);
  if (error) {
    console.error("[sequence] start insert failed:", error.message);
    return { status: "error", message: "Sequenz konnte nicht gestartet werden. Berechtigung prüfen." };
  }

  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: context.user.id,
    action: "system",
    entity_type: "followup_sequence",
    entity_id: lid,
    metadata: { event: "start", steps: STEPS.length },
  });

  revalidatePath("/app-shell/pipeline");
  revalidatePath("/app-shell/leads");
  return { status: "success", message: "Follow-up-Sequenz gestartet (24h · 48h · 5 Tage)." };
}

/** Stop the sequence — manually or because a reply arrived. */
export async function stopFollowupSequence(
  _prev: SequenceState,
  formData: FormData,
): Promise<SequenceState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;
  const lid = leadId(formData);
  if (!lid) return { status: "error", message: "Kein Lead ausgewählt." };
  const reasonRaw = formData.get("reason");
  const reason = reasonRaw === "reply" ? "reply" : "manual";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("followup_tasks")
    .update({ status: "skipped", updated_by: context.user.id })
    .eq("company_id", companyId)
    .eq("lead_id", lid)
    .in("status", ["planned", "due", "overdue"])
    .select("id");
  if (error) {
    console.error("[sequence] stop failed:", error.message);
    return { status: "error", message: "Sequenz konnte nicht gestoppt werden. Berechtigung prüfen." };
  }

  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: context.user.id,
    action: "system",
    entity_type: "followup_sequence",
    entity_id: lid,
    metadata: { event: "stop", reason, stopped: data?.length ?? 0 },
  });

  revalidatePath("/app-shell/pipeline");
  revalidatePath("/app-shell/leads");
  return {
    status: "success",
    message:
      reason === "reply"
        ? "Antwort erhalten – Sequenz gestoppt."
        : "Follow-up-Sequenz gestoppt.",
  };
}

/**
 * Owner-triggered send of DUE follow-up steps (status planned/due/overdue,
 * due_at <= now). Provider + Premium gated, capped, audited. One email per step
 * to the lead's stored address; the step is marked `done` on success. NOT
 * background — the owner clicks this. Optional `lead_id` limits it to one lead.
 */
export async function sendDueFollowups(
  _prev: SequenceState,
  formData: FormData,
): Promise<SequenceState> {
  const context = await getCurrentCompanyContext();
  if (!context || !context.activeCompanyId) {
    return { status: "error", message: "Kein aktiver Mandant – bitte erneut anmelden." };
  }
  const companyId = context.activeCompanyId;

  const summary = await getCompanySummary(companyId);
  if (!isPremiumExperience(summary?.tier ?? "starter", summary?.billingStatus)) {
    return { status: "locked", message: "Automatischer Versand ist eine Premium-Funktion." };
  }
  if (!isSendConfigured()) {
    return { status: "not_configured", message: "Kanal nicht verbunden – kein Versand möglich." };
  }

  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const lid = leadId(formData);

  let query = supabase
    .from("followup_tasks")
    .select("id, lead_id, offer_id, stage, leads ( company_name, email ), offers ( reference )")
    .eq("company_id", companyId)
    .in("status", ["planned", "due", "overdue"])
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(SEND_CAP);
  if (lid) query = query.eq("lead_id", lid);
  const { data: due, error } = await query;
  if (error) {
    console.error("[sequence] sendDue read failed:", error.message);
    return { status: "error", message: "Fällige Follow-ups konnten nicht geladen werden." };
  }
  if (!due || due.length === 0) {
    return { status: "success", message: "Keine fälligen Follow-up-Schritte." };
  }

  const settings = await getCompanySettings(companyId);
  const sender = settings.senderName ?? summary?.name ?? "Ihr Reinigungsteam";
  let sent = 0;

  for (const raw of due) {
    const t = raw as unknown as {
      id: string;
      leads: { company_name: string; email: string | null } | Array<{ company_name: string; email: string | null }> | null;
      offers: { reference: string } | Array<{ reference: string }> | null;
    };
    const lead = Array.isArray(t.leads) ? t.leads[0] : t.leads;
    const offer = Array.isArray(t.offers) ? t.offers[0] : t.offers;
    const to = lead?.email ?? null;
    if (!to || !looksLikeEmail(to)) continue; // skip steps without a valid address

    const ref = offer?.reference ? ` (Offerte ${offer.reference})` : "";
    const subject = `Nachfassen – ${summary?.name ?? "Ihr Anliegen"}`;
    const text =
      `Guten Tag\n\n` +
      `gerne fassen wir kurz nach zu Ihrer Anfrage${ref}. ` +
      `Falls Sie Fragen haben oder ein Termin passt, melden Sie sich jederzeit – wir helfen gern weiter.\n\n` +
      `Freundliche Grüsse\n${sender}`;

    const res = await sendEmail({ to, subject, text });
    if (res.status !== "ok") continue;

    await supabase
      .from("followup_tasks")
      .update({ status: "done", updated_by: context.user.id })
      .eq("id", t.id)
      .eq("company_id", companyId);
    sent++;
  }

  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_user_id: context.user.id,
    action: "system",
    entity_type: "followup_send",
    metadata: { sent, considered: due.length },
  });

  revalidatePath("/app-shell/pipeline");
  return {
    status: "success",
    message:
      sent > 0
        ? `${sent} fällige${sent === 1 ? "s Follow-up" : " Follow-ups"} gesendet.`
        : "Keine Follow-ups gesendet (Kontaktadresse fehlt).",
  };
}
