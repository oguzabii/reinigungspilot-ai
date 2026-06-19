"use client";

import { useActionState, useEffect, useRef } from "react";
import { FilePlus2 } from "lucide-react";
import { createOffer, type ActionState } from "@/app/app-shell/offers/actions";
import { DEFAULT_VAT_RATE_PCT } from "@/components/offers/offer-status";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

export interface LeadOption {
  id: string;
  name: string;
}

const initialState: ActionState = { status: "idle" };

/**
 * Manual "Neue Offerte erstellen" form. Submits to the `createOffer` server
 * action (session client + RLS). Optional source lead (verified server-side to
 * belong to the active tenant), optional reference (auto-generated if blank),
 * and an optional first line item. No PDF, no sending — this only drafts.
 */
export function NewOfferForm({
  leads,
  preselectLeadId,
}: {
  leads: LeadOption[];
  /** Preselect this lead (e.g. when arriving from "Offerte vorbereiten"). */
  preselectLeadId?: string;
}) {
  const [state, formAction, pending] = useActionState(createOffer, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="of_lead_id" className={labelClass}>
            Aus Lead (optional)
          </label>
          <select
            id="of_lead_id"
            name="lead_id"
            defaultValue={preselectLeadId ?? ""}
            className={inputClass}
          >
            <option value="">– Ohne Lead –</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="of_reference" className={labelClass}>
            Referenz (optional)
          </label>
          <input
            id="of_reference"
            name="reference"
            type="text"
            placeholder="automatisch (OF-…)"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="of_valid_until" className={labelClass}>
            Gültig bis (optional)
          </label>
          <input id="of_valid_until" name="valid_until" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="of_vat" className={labelClass}>
            MwSt-Satz %
          </label>
          <input
            id="of_vat"
            name="vat_rate_pct"
            type="text"
            inputMode="decimal"
            defaultValue={DEFAULT_VAT_RATE_PCT.toFixed(2)}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-500">
          Erste Position (optional)
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="of_item_label" className={labelClass}>
              Bezeichnung
            </label>
            <input
              id="of_item_label"
              name="item_label"
              type="text"
              placeholder="z. B. Grundreinigung"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="of_item_amount" className={labelClass}>
              Betrag CHF
            </label>
            <input
              id="of_item_amount"
              name="item_amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className={`${inputClass} text-right tabular-nums`}
            />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="of_item_detail" className={labelClass}>
            Detail (optional)
          </label>
          <input
            id="of_item_detail"
            name="item_detail"
            type="text"
            placeholder="Kurze Beschreibung"
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

      <button type="submit" disabled={pending} className={submitClass}>
        <FilePlus2 className="h-4 w-4" strokeWidth={2.2} />
        {pending ? "Speichern…" : "Offerte erstellen"}
      </button>
    </form>
  );
}
