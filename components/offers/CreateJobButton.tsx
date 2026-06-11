"use client";

import { useActionState } from "react";
import { Briefcase, CheckCircle2 } from "lucide-react";
import {
  createJobFromOffer,
  type ActionState,
} from "@/app/app-shell/jobs/actions";

const initialState: ActionState = { status: "idle" };

/**
 * "Auftrag erstellen" — shown on an ACCEPTED offer. Submits to the
 * `createJobFromOffer` server action (session client + RLS; jobs are the ops
 * domain). If a job already exists (`hasJob`, or after a successful create),
 * it shows a static chip instead of the button — no duplicate creation.
 */
export function CreateJobButton({
  offerId,
  hasJob,
}: {
  offerId: string;
  hasJob: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createJobFromOffer,
    initialState,
  );

  if (hasJob || state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Auftrag erstellt
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="offer_id" value={offerId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <Briefcase className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Erstellen…" : "Auftrag erstellen"}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
