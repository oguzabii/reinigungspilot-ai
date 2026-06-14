"use client";

import { useActionState } from "react";
import { Crosshair, CheckCircle2 } from "lucide-react";
import {
  createOpportunity,
  type ActionState,
} from "@/app/app-shell/lead-hunter/actions";

const initial: ActionState = { status: "idle" };

/**
 * "Als Opportunity erstellen" for an adapter-sourced signal (e.g. Baugesuche).
 * Submits to the EXISTING `createOpportunity` server action (session client +
 * RLS, sales domain) via hidden fields — no new write path, no automatic
 * outreach. The human clicks; the prospect is created with the signal context.
 */
export function CreateSignalOpportunityButton({
  title,
  category,
  region,
  service,
  reason,
  nextAction,
  score,
}: {
  title: string;
  category: string;
  region: string | null;
  service: string | null;
  reason: string;
  nextAction: string;
  score: number;
}) {
  const [state, formAction, pending] = useActionState(createOpportunity, initial);

  if (state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Als Opportunity erstellt
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="name" value={title} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="region" value={region ?? ""} />
      <input type="hidden" name="source_type" value="other" />
      <input type="hidden" name="service_potential" value={service ?? ""} />
      <input type="hidden" name="score" value={String(score)} />
      <input type="hidden" name="status" value="scored" />
      <input type="hidden" name="reason" value={reason} />
      <input type="hidden" name="next_action" value={nextAction} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <Crosshair className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Erstellen…" : "Als Opportunity erstellen"}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
