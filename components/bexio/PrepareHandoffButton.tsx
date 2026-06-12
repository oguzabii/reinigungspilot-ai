"use client";

import { useActionState } from "react";
import { PlugZap } from "lucide-react";
import { prepareHandoff, type ActionState } from "@/app/app-shell/bexio/actions";

const initialState: ActionState = { status: "idle" };

/**
 * "Für bexio vorbereiten" — shown on a completed job without a handoff yet.
 * Submits to the `prepareHandoff` server action (session client + RLS; bexio is
 * the owner/admin domain). No real bexio API, no token, no network call.
 */
export function PrepareHandoffButton({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(prepareHandoff, initialState);

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="job_id" value={jobId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <PlugZap className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Vorbereiten…" : "Für bexio vorbereiten"}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
