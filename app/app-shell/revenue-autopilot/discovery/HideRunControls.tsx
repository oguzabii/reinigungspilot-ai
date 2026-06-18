"use client";

import { useActionState } from "react";
import { X, EyeOff } from "lucide-react";
import { hideDiscoveryRun, hideAllDiscoveryRuns, type HideRunState } from "./hide-actions";

const initial: HideRunState = { status: "idle" };

/** Small "X" to hide a single discovery run from the list. */
export function HideRunButton({ runId }: { runId: string }) {
  const [state, formAction, pending] = useActionState(hideDiscoveryRun, initial);
  if (state.status === "success") return null; // row disappears on next render
  return (
    <form action={formAction} className="inline-flex">
      <input type="hidden" name="run_id" value={runId} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Lauf ausblenden"
        title="Ausblenden"
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-60"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

/** "Alle Läufe ausblenden" — sets a hidden-before cutoff. */
export function HideAllRunsButton() {
  const [, formAction, pending] = useActionState(hideAllDiscoveryRuns, initial);
  return (
    <form action={formAction} className="inline-flex">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 disabled:opacity-60"
      >
        <EyeOff className="h-3.5 w-3.5" />
        {pending ? "Ausblenden…" : "Alle Läufe ausblenden"}
      </button>
    </form>
  );
}
