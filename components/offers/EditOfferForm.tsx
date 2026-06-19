"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save, FileText, ArrowLeft, AlertTriangle } from "lucide-react";
import { updateOffer, type ActionState } from "@/app/app-shell/offers/actions";
import { DEFAULT_VAT_RATE_PCT } from "@/components/offers/offer-status";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

const initialState: ActionState = { status: "idle" };

export interface EditOfferInitial {
  offerId: string;
  reference: string;
  isSent: boolean;
  customerName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  service: string;
  cleaningDate: string;
  handover: string;
  notes: string;
  itemLabel: string;
  itemDetail: string;
  itemAmount: string;
  vatRatePct: string;
  validUntil: string;
}

/**
 * Edit an existing offer. Submits to `updateOffer` (session client + RLS): the
 * customer (lead), the primary line item and the offer meta are updated and the
 * totals recomputed — so the PDF reflects the changes immediately.
 */
export function EditOfferForm({ initial }: { initial: EditOfferInitial }) {
  const [state, formAction, pending] = useActionState(updateOffer, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="offer_id" value={initial.offerId} />

      {initial.isSent && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          Änderungen aktualisieren die PDF-Vorlage. Bereits versendete E-Mails bleiben unverändert.
        </p>
      )}

      {/* Customer */}
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">Kunde</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="eo_customer" className={labelClass}>Kundenname *</label>
            <input id="eo_customer" name="customer_name" type="text" required defaultValue={initial.customerName} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_contact" className={labelClass}>Ansprechpartner</label>
            <input id="eo_contact" name="contact_name" type="text" defaultValue={initial.contactName} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_phone" className={labelClass}>Telefon</label>
            <input id="eo_phone" name="phone" type="tel" defaultValue={initial.phone} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_email" className={labelClass}>E-Mail</label>
            <input id="eo_email" name="email" type="email" defaultValue={initial.email} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_address" className={labelClass}>Adresse</label>
            <input id="eo_address" name="address" type="text" placeholder="Strasse, PLZ Ort" defaultValue={initial.address} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Object / timing */}
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">Objekt &amp; Termin</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="eo_service" className={labelClass}>Leistung / Objekt</label>
            <input id="eo_service" name="service" type="text" defaultValue={initial.service} className={inputClass} />
          </div>
          <div />
          <div>
            <label htmlFor="eo_cleaning" className={labelClass}>Reinigungsdatum</label>
            <input id="eo_cleaning" name="cleaning_date" type="text" placeholder="z. B. 28.07.2026" defaultValue={initial.cleaningDate} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_handover" className={labelClass}>Übergabe</label>
            <input id="eo_handover" name="handover" type="text" placeholder="z. B. 31.07.2026 / 14:00" defaultValue={initial.handover} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Offer position */}
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">Offerte (erste Position)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="eo_item_label" className={labelClass}>Positions-Bezeichnung *</label>
            <input id="eo_item_label" name="item_label" type="text" required defaultValue={initial.itemLabel} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_item_amount" className={labelClass}>Preis CHF *</label>
            <input id="eo_item_amount" name="item_amount" type="text" inputMode="decimal" required defaultValue={initial.itemAmount} className={`${inputClass} text-right tabular-nums`} />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="eo_item_detail" className={labelClass}>Positions-Detail (optional)</label>
            <input id="eo_item_detail" name="item_detail" type="text" defaultValue={initial.itemDetail} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_vat" className={labelClass}>MwSt-Satz %</label>
            <input id="eo_vat" name="vat_rate_pct" type="text" inputMode="decimal" defaultValue={initial.vatRatePct || DEFAULT_VAT_RATE_PCT.toFixed(2)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="eo_valid" className={labelClass}>Gültig bis</label>
            <input id="eo_valid" name="valid_until" type="date" defaultValue={initial.validUntil} className={inputClass} />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="eo_notes" className={labelClass}>Notizen (optional)</label>
          <textarea id="eo_notes" name="notes" rows={2} defaultValue={initial.notes} className={inputClass} />
        </div>
      </fieldset>

      {state.status !== "idle" && state.message && (
        <p role={state.status === "error" ? "alert" : "status"} className={state.status === "success" ? successBoxClass : errorBoxClass}>
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={submitClass}>
          <Save className="h-4 w-4" strokeWidth={2.2} />
          {pending ? "Speichern…" : "Offerte speichern"}
        </button>
        <a
          href={`/app-shell/offers/${initial.offerId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <FileText className="h-4 w-4" /> PDF Vorschau
        </a>
        <Link
          href="/app-shell/pipeline"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Pipeline
        </Link>
      </div>
    </form>
  );
}
