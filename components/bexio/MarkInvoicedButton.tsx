"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  markHandoffInvoiced,
  type ActionState,
} from "@/app/app-shell/bexio/actions";

const initialState: ActionState = { status: "idle" };

/**
 * "Als verrechnet markieren" — shown on a prepared (queued) handoff. Submits to
 * the `markHandoffInvoiced` server action (session client + RLS; owner/admin).
 * Flips the handoff status to completed; no real bexio API, no invoice created.
 */
export function MarkInvoicedButton({ handoffId }: { handoffId: string }) {
  const [state, formAction, pending] = useActionState(
    markHandoffInvoiced,
    initialState,
  );

  if (state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Verrechnet
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="handoff_id" value={handoffId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
      >
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Speichern…" : "Als verrechnet markieren"}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
