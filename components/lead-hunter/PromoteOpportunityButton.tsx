"use client";

import { useActionState } from "react";
import { ArrowRightToLine, CheckCircle2 } from "lucide-react";
import {
  promoteOpportunity,
  type ActionState,
} from "@/app/app-shell/lead-hunter/actions";

const initialState: ActionState = { status: "idle" };

/**
 * "In Lead Inbox übernehmen" — promotes an opportunity into a lead via the
 * `promoteOpportunity` server action (session client + RLS; both prospects and
 * leads are the sales domain). If already promoted (`promoted`, or after a
 * successful promotion) it shows a static "Bereits im Lead Inbox" chip — no
 * duplicate promotion. No email, no automation, no external call.
 */
export function PromoteOpportunityButton({
  opportunityId,
  promoted,
}: {
  opportunityId: string;
  promoted: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    promoteOpportunity,
    initialState,
  );

  if (promoted || state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Bereits im Lead Inbox
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="prospect_id" value={opportunityId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <ArrowRightToLine className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Übernehmen…" : "In Lead Inbox übernehmen"}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
