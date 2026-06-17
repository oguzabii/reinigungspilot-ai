"use client";

import { useActionState } from "react";
import { Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { enrichProspectContact, type EnrichActionState } from "./actions";

const initial: EnrichActionState = { status: "idle" };

/**
 * "Kontakt automatisch finden" — runs the Contact Enrichment Autopilot for one
 * candidate (stored data → official Google Places → the candidate's own public
 * website, bounded). Fills only missing fields; the card re-renders with the
 * found contact details. Shows a calm result line.
 */
export function EnrichContactButton({ prospectId }: { prospectId: string }) {
  const [state, formAction, pending] = useActionState(enrichProspectContact, initial);

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="prospect_id" value={prospectId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Suche läuft…" : "Kontakt automatisch finden"}
      </button>
      {state.status === "success" && state.message && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {state.message}
        </span>
      )}
      {(state.status === "error" || state.status === "locked") && state.message && (
        <span role="alert" className="inline-flex items-center gap-1 text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          {state.message}
        </span>
      )}
    </form>
  );
}
