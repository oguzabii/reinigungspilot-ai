"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateOfferStatus, type ActionState } from "@/app/app-shell/offers/actions";
import { OFFER_STATUS_FLOW, OFFER_STATUS_META } from "@/components/offers/offer-status";
import type { OfferStatus } from "@/lib/database-types";

const initialState: ActionState = { status: "idle" };

/**
 * Per-offer status control. Statuses are offered in canonical flow order;
 * transitions are intentionally NOT restricted (corrections must stay
 * possible). Submits to the `updateOfferStatus` server action (session client
 * + RLS); the list refreshes via revalidatePath.
 */
export function OfferStatusForm({
  offerId,
  currentStatus,
}: {
  offerId: string;
  currentStatus: OfferStatus;
}) {
  const [state, formAction, pending] = useActionState(
    updateOfferStatus,
    initialState,
  );

  return (
    <form action={formAction}>
      <div className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="offer_id" value={offerId} />
        <label htmlFor={`offer-status-${offerId}`} className="text-xs font-medium text-slate-500">
          Status:
        </label>
        <select
          id={`offer-status-${offerId}`}
          name="status"
          defaultValue={currentStatus}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-navy-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          {OFFER_STATUS_FLOW.map((s) => (
            <option key={s} value={s}>
              {OFFER_STATUS_META[s].label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
        >
          <Check className="h-3 w-3" strokeWidth={2.6} />
          {pending ? "Speichern…" : "Speichern"}
        </button>
        {state.status === "error" && state.message && (
          <span role="alert" className="text-xs text-amber-700">
            {state.message}
          </span>
        )}
        {state.status === "success" && (
          <span role="status" className="text-xs text-emerald-600">
            ✓ {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
