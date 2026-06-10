"use server";

/**
 * Offer Engine — server actions (v0.3.2 foundation).
 *
 * All writes go through the **session/anon** server client, so Row Level
 * Security applies (offers + offer_items: owner/admin/sales via
 * can_write_sales). We never use the service-role/admin client. This is a
 * MANUAL offer-draft foundation: no PDF, no email/sending, no bexio, no
 * external integration.
 *
 * Defense in depth (on top of RLS): every write is scoped to the caller's
 * ACTIVE company, and a linked lead / parent offer is verified to belong to
 * the active tenant before it is referenced.
 *
 * Runs only at request time (server actions), so the build needs no env.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import type { OfferStatus } from "@/lib/database-types";
import {
  OFFER_STATUS_FLOW,
  DEFAULT_VAT_RATE_PCT,
} from "@/components/offers/offer-status";

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

/** Trimmed form field, capped at `maxLen` chars (server-side payload guard). */
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

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Parse a CHF amount; accepts comma or dot decimals. Null if invalid/negative. */
function parseAmount(raw: string | null): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/'/g, "").replace(/’/g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return null;
  return round2(n);
}

/** VAT %: blank/invalid → Swiss default; otherwise clamped to [0, 100]. */
function parseVat(raw: string | null): number {
  if (!raw) return DEFAULT_VAT_RATE_PCT;
  const n = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return DEFAULT_VAT_RATE_PCT;
  return round2(n);
}

function autoReference(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OF-${y}${m}${day}-${rand}`;
}

/* -------------------------------------------------------------------------- */
/* Create offer draft (optionally from a lead, optionally with a first item)  */
/* -------------------------------------------------------------------------- */

export async function createOffer(
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
  const supabase = await createClient();

  // Optional source lead — must belong to the ACTIVE tenant if provided.
  const leadId = field(formData, "lead_id");
  if (leadId) {
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .maybeSingle();
    if (leadError) {
      console.error("[offers] createOffer lead check failed:", leadError.message);
      return {
        status: "error",
        message: "Offerte konnte nicht erstellt werden. Bitte erneut versuchen.",
      };
    }
    if (!lead) {
      return {
        status: "error",
        message: "Lead nicht gefunden (gehört nicht zum aktiven Mandanten).",
      };
    }
  }

  const reference = field(formData, "reference", 60) ?? autoReference();
  const vatRate = parseVat(field(formData, "vat_rate_pct", 10));

  // valid_until: optional pure date (no timezone). Shape-checked.
  const validRaw = field(formData, "valid_until", 10);
  if (validRaw && !/^\d{4}-\d{2}-\d{2}$/.test(validRaw)) {
    return { status: "error", message: "Ungültiges Gültigkeitsdatum." };
  }
  const validUntil = validRaw ?? null;

  // Optional first line item — both label and amount, or neither.
  const itemLabel = field(formData, "item_label", 200);
  const itemAmountRaw = field(formData, "item_amount", 20);
  if ((itemLabel && !itemAmountRaw) || (!itemLabel && itemAmountRaw)) {
    return {
      status: "error",
      message: "Für eine Position bitte Bezeichnung UND Betrag angeben.",
    };
  }
  let itemAmount: number | null = null;
  if (itemLabel && itemAmountRaw) {
    itemAmount = parseAmount(itemAmountRaw);
    if (itemAmount === null) {
      return { status: "error", message: "Ungültiger Betrag für die Position." };
    }
  }

  const net = itemAmount ?? 0;
  const gross = round2(net * (1 + vatRate / 100));

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      company_id: companyId,
      lead_id: leadId,
      reference,
      status: "draft" as OfferStatus,
      total_net_chf: net,
      vat_rate_pct: vatRate,
      total_gross_chf: gross,
      valid_until: validUntil,
      created_by: context.user.id,
      updated_by: context.user.id,
    })
    .select("id")
    .single();

  if (error || !offer) {
    if (error?.code === "23505") {
      return {
        status: "error",
        message: "Diese Referenz existiert bereits. Bitte eine andere wählen.",
      };
    }
    console.error("[offers] createOffer insert failed:", error?.message);
    return {
      status: "error",
      message: "Offerte konnte nicht erstellt werden. Prüfen Sie Ihre Berechtigung.",
    };
  }

  // Seed the first line item if provided (offer_items has no created_by).
  if (itemLabel && itemAmount !== null) {
    const { error: itemError } = await supabase.from("offer_items").insert({
      company_id: companyId,
      offer_id: offer.id,
      label: itemLabel,
      detail: field(formData, "item_detail", 500),
      amount_chf: itemAmount,
      sort_order: 0,
    });
    if (itemError) {
      // Offer exists; the item failed. Surface it without leaking internals.
      console.error("[offers] createOffer item insert failed:", itemError.message);
      revalidatePath("/app-shell/offers");
      return {
        status: "error",
        message:
          "Offerte erstellt, aber die erste Position konnte nicht gespeichert werden.",
      };
    }
  }

  revalidatePath("/app-shell/offers");
  return { status: "success", message: `Offerte „${reference}" erstellt.` };
}

/* -------------------------------------------------------------------------- */
/* Update offer status                                                         */
/* -------------------------------------------------------------------------- */

export async function updateOfferStatus(
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

  const offerId = field(formData, "offer_id");
  const statusRaw = field(formData, "status");
  if (!offerId || !statusRaw || !(OFFER_STATUS_FLOW as string[]).includes(statusRaw)) {
    return { status: "error", message: "Ungültiger Status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .update({ status: statusRaw as OfferStatus, updated_by: context.user.id })
    .eq("id", offerId)
    .eq("company_id", context.activeCompanyId) // defense in depth
    .is("deleted_at", null)
    .select("id");

  if (error) {
    console.error("[offers] updateOfferStatus failed:", error.message);
    return {
      status: "error",
      message: "Status konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
  if (!data || data.length === 0) {
    return {
      status: "error",
      message:
        "Status konnte nicht geändert werden. Prüfen Sie Ihre Berechtigung (readonly kann nicht schreiben).",
    };
  }

  revalidatePath("/app-shell/offers");
  return { status: "success", message: "Status gespeichert." };
}

/* -------------------------------------------------------------------------- */
/* Add a line item to an existing offer (recomputes totals)                    */
/* -------------------------------------------------------------------------- */

export async function addOfferItem(
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
  const label = field(formData, "label", 200);
  if (!label) {
    return { status: "error", message: "Bezeichnung ist erforderlich." };
  }
  const amount = parseAmount(field(formData, "amount", 20));
  if (amount === null) {
    return { status: "error", message: "Ungültiger Betrag." };
  }

  const supabase = await createClient();

  // The parent offer must belong to the ACTIVE tenant and not be deleted.
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("id, vat_rate_pct")
    .eq("id", offerId)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle();
  if (offerError) {
    console.error("[offers] addOfferItem offer check failed:", offerError.message);
    return {
      status: "error",
      message: "Position konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
  if (!offer) {
    return {
      status: "error",
      message: "Offerte nicht gefunden (gehört nicht zum aktiven Mandanten).",
    };
  }

  // Existing items: for the next sort_order and to recompute the net total.
  const { data: existing, error: itemsError } = await supabase
    .from("offer_items")
    .select("amount_chf, sort_order")
    .eq("offer_id", offerId)
    .eq("company_id", companyId);
  if (itemsError) {
    console.error("[offers] addOfferItem items read failed:", itemsError.message);
    return {
      status: "error",
      message: "Position konnte nicht gespeichert werden. Bitte erneut versuchen.",
    };
  }
  const rows = (existing ?? []) as Array<{
    amount_chf: number | string;
    sort_order: number;
  }>;
  const nextOrder = rows.reduce((max, r) => Math.max(max, r.sort_order), -1) + 1;
  const existingNet = rows.reduce((sum, r) => sum + (Number(r.amount_chf) || 0), 0);

  const { error: insertError } = await supabase.from("offer_items").insert({
    company_id: companyId,
    offer_id: offerId,
    label,
    detail: field(formData, "detail", 500),
    amount_chf: amount,
    sort_order: nextOrder,
  });
  if (insertError) {
    console.error("[offers] addOfferItem insert failed:", insertError.message);
    return {
      status: "error",
      message: "Position konnte nicht gespeichert werden. Prüfen Sie Ihre Berechtigung.",
    };
  }

  // Recompute and persist the offer totals.
  const vatRate = Number(offer.vat_rate_pct) || 0;
  const net = round2(existingNet + amount);
  const gross = round2(net * (1 + vatRate / 100));
  const { error: updateError } = await supabase
    .from("offers")
    .update({
      total_net_chf: net,
      total_gross_chf: gross,
      updated_by: context.user.id,
    })
    .eq("id", offerId)
    .eq("company_id", companyId);
  if (updateError) {
    // The item was saved; only the total refresh failed. Don't claim success.
    console.error("[offers] addOfferItem total update failed:", updateError.message);
    revalidatePath("/app-shell/offers");
    return {
      status: "error",
      message: "Position gespeichert, aber die Summe konnte nicht aktualisiert werden.",
    };
  }

  revalidatePath("/app-shell/offers");
  return { status: "success", message: "Position hinzugefügt." };
}
