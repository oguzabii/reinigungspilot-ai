"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { FilePlus2, ChevronRight } from "lucide-react";
import { createManualOffer, type ActionState } from "@/app/app-shell/offers/actions";
import { DEFAULT_VAT_RATE_PCT } from "@/components/offers/offer-status";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

const initialState: ActionState = { status: "idle" };

/**
 * "Manuell erfassen" — create a brand-new customer AND an offer in one step.
 * Submits to the `createManualOffer` server action (session client + RLS): it
 * stores the customer as a lead so the offer, PDF and later Auftrag all resolve
 * the customer. No PDF/sending here — this only drafts the offer.
 */
export function ManualOfferForm() {
  const [state, formAction, pending] = useActionState(createManualOffer, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {/* Customer */}
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">Kunde</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="mo_customer" className={labelClass}>
              Kundenname *
            </label>
            <input
              id="mo_customer"
              name="customer_name"
              type="text"
              required
              placeholder="z. B. Familie Meier / Verwaltung AG"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mo_contact" className={labelClass}>
              Ansprechpartner (optional)
            </label>
            <input id="mo_contact" name="contact_name" type="text" className={inputClass} />
          </div>
          <div>
            <label htmlFor="mo_phone" className={labelClass}>
              Telefon (optional)
            </label>
            <input id="mo_phone" name="phone" type="tel" className={inputClass} />
          </div>
          <div>
            <label htmlFor="mo_email" className={labelClass}>
              E-Mail (optional)
            </label>
            <input id="mo_email" name="email" type="email" className={inputClass} />
          </div>
          <div>
            <label htmlFor="mo_address" className={labelClass}>
              Adresse (optional)
            </label>
            <input
              id="mo_address"
              name="address"
              type="text"
              placeholder="Strasse, PLZ Ort"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      {/* Object / timing */}
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">
          Objekt &amp; Termin
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mo_service" className={labelClass}>
              Leistung / Objekt
            </label>
            <input
              id="mo_service"
              name="service"
              type="text"
              placeholder="z. B. Umzugsreinigung 3.5-Zimmer"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mo_object_size" className={labelClass}>
              Zimmer / Grösse (optional)
            </label>
            <input
              id="mo_object_size"
              name="object_size"
              type="text"
              placeholder="z. B. 3.5 Zimmer / 85 m²"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mo_cleaning_date" className={labelClass}>
              Reinigungsdatum (optional)
            </label>
            <input id="mo_cleaning_date" name="cleaning_date" type="date" className={inputClass} />
          </div>
          <div>
            <label htmlFor="mo_handover" className={labelClass}>
              Übergabe (optional)
            </label>
            <input
              id="mo_handover"
              name="handover"
              type="text"
              placeholder="z. B. 14:00 / nach Vereinbarung"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      {/* Offer position */}
      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">Offerte</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="mo_item_label" className={labelClass}>
              Positions-Bezeichnung
            </label>
            <input
              id="mo_item_label"
              name="item_label"
              type="text"
              placeholder="leer = Leistung übernehmen"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mo_item_amount" className={labelClass}>
              Preis CHF *
            </label>
            <input
              id="mo_item_amount"
              name="item_amount"
              type="text"
              inputMode="decimal"
              required
              placeholder="0.00"
              className={`${inputClass} text-right tabular-nums`}
            />
          </div>
          <div>
            <label htmlFor="mo_vat" className={labelClass}>
              MwSt-Satz %
            </label>
            <input
              id="mo_vat"
              name="vat_rate_pct"
              type="text"
              inputMode="decimal"
              defaultValue={DEFAULT_VAT_RATE_PCT.toFixed(2)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mo_valid_until" className={labelClass}>
              Gültig bis (optional)
            </label>
            <input id="mo_valid_until" name="valid_until" type="date" className={inputClass} />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="mo_notes" className={labelClass}>
            Notizen (optional)
          </label>
          <textarea
            id="mo_notes"
            name="notes"
            rows={2}
            placeholder="Interne Hinweise zum Kunden / Objekt"
            className={inputClass}
          />
        </div>
      </fieldset>

      {state.status !== "idle" && state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "success" ? successBoxClass : errorBoxClass}
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={submitClass}>
          <FilePlus2 className="h-4 w-4" strokeWidth={2.2} />
          {pending ? "Speichern…" : "Kunde + Offerte erstellen"}
        </button>
        {state.status === "success" && (
          <Link
            href="/app-shell/offers"
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Zur Offerte (PDF herunterladen)
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </form>
  );
}
