"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { addOfferItem, type ActionState } from "@/app/app-shell/offers/actions";

const initialState: ActionState = { status: "idle" };

const miniInput =
  "rounded-lg border border-slate-300 px-2 py-1 text-xs text-navy-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

/**
 * Inline "add line item" form shown under each offer. Submits to the
 * `addOfferItem` server action (session client + RLS; the parent offer is
 * verified to belong to the active tenant, then totals are recomputed).
 */
export function AddOfferItemForm({ offerId }: { offerId: string }) {
  const [state, formAction, pending] = useActionState(addOfferItem, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-3">
      <div className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="offer_id" value={offerId} />
        <div className="flex-1 min-w-[10rem]">
          <label htmlFor={`item-label-${offerId}`} className="block text-[11px] font-medium text-slate-500">
            Position
          </label>
          <input
            id={`item-label-${offerId}`}
            name="label"
            type="text"
            required
            placeholder="z. B. Grundreinigung"
            className={`${miniInput} mt-0.5 w-full`}
          />
        </div>
        <div className="w-28">
          <label htmlFor={`item-amount-${offerId}`} className="block text-[11px] font-medium text-slate-500">
            Betrag CHF
          </label>
          <input
            id={`item-amount-${offerId}`}
            name="amount"
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            className={`${miniInput} mt-0.5 w-full text-right tabular-nums`}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
        >
          <Plus className="h-3 w-3" strokeWidth={2.6} />
          {pending ? "…" : "Position"}
        </button>
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="mt-1 text-xs text-amber-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
