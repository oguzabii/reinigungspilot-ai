"use client";

import { useActionState } from "react";
import { ArrowRightToLine, FilePlus2 } from "lucide-react";
import { promoteCandidate, type ActionState } from "@/app/app-shell/lead-hunter/actions";

const initial: ActionState = { status: "idle" };

/**
 * Candidate one-click actions: promote into the Pipeline (focused on the new
 * lead) or jump straight to a prefilled offer — no Lead-Inbox detour. Both
 * submit to `promoteCandidate`, which promotes and redirects server-side.
 */
export function CandidatePipelineButtons({ prospectId }: { prospectId: string }) {
  const [pipeState, pipeAction, pipePending] = useActionState(promoteCandidate, initial);
  const [offState, offAction, offPending] = useActionState(promoteCandidate, initial);
  const err = pipeState.status === "error" ? pipeState.message : offState.status === "error" ? offState.message : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <form action={pipeAction} className="inline-flex">
        <input type="hidden" name="prospect_id" value={prospectId} />
        <input type="hidden" name="intent" value="pipeline" />
        <button
          type="submit"
          disabled={pipePending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
        >
          <ArrowRightToLine className="h-3.5 w-3.5" strokeWidth={2.2} />
          {pipePending ? "Übernehmen…" : "In Pipeline übernehmen"}
        </button>
      </form>
      <form action={offAction} className="inline-flex">
        <input type="hidden" name="prospect_id" value={prospectId} />
        <input type="hidden" name="intent" value="offer" />
        <button
          type="submit"
          disabled={offPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60"
        >
          <FilePlus2 className="h-3.5 w-3.5" strokeWidth={2.2} />
          {offPending ? "Vorbereiten…" : "Offerte vorbereiten"}
        </button>
      </form>
      {err && (
        <span role="alert" className="text-xs text-amber-700">
          {err}
        </span>
      )}
    </span>
  );
}
