"use client";

import { useActionState } from "react";
import { Check, Phone } from "lucide-react";
import { markProspectContacted, type ContactActionState } from "./actions";

const initial: ContactActionState = { status: "idle" };

/**
 * "Als kontaktiert markieren" — records that the owner manually reached out to a
 * candidate (sets the prospect to `contacted`). Nothing is sent by Klarsa; this
 * only logs the human action. After success it shows a static "Kontaktiert" chip.
 */
export function MarkContactedButton({
  prospectId,
  contacted,
}: {
  prospectId: string;
  contacted: boolean;
}) {
  const [state, formAction, pending] = useActionState(markProspectContacted, initial);

  if (contacted || state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Check className="h-3.5 w-3.5" />
        Kontaktiert
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="prospect_id" value={prospectId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
      >
        <Phone className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Speichern…" : "Als kontaktiert markieren"}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
