"use client";

import { useActionState } from "react";
import { PlugZap, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { testConnection, type TestConnState } from "./connection-actions";
import { CONNECTION_STATUS_META } from "@/lib/discovery/connection";

const initial: TestConnState = { status: "idle" };

/**
 * "Verbindung testen" — owner-triggered, bounded live test for one source. Shows
 * the resulting status badge + a short message. Never displays any secret.
 */
export function TestConnectionButton({ source }: { source: string }) {
  const [state, formAction, pending] = useActionState(testConnection, initial);
  const meta = state.status !== "idle" ? CONNECTION_STATUS_META[state.status] : null;

  return (
    <form action={formAction} className="mt-2 inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="source" value={source} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
        {pending ? "Teste…" : "Verbindung testen"}
      </button>
      {meta && (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${meta.className}`}>
          {state.status === "connected" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : state.status === "error" ? (
            <AlertTriangle className="h-3 w-3" />
          ) : null}
          {meta.label}
        </span>
      )}
      {state.status !== "idle" && state.message && (
        <span className="text-xs text-slate-500">{state.message}</span>
      )}
    </form>
  );
}
