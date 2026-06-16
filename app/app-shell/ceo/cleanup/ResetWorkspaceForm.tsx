"use client";

import { useActionState, useState } from "react";
import { Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { resetWorkspace, type ResetActionState } from "./actions";
import { RESET_PHRASE } from "./constants";
import { inputClass } from "@/components/leads/form-styles";

const initial: ResetActionState = { status: "idle" };

/**
 * Typed-confirmation reset. The button stays disabled until the owner types the
 * exact phrase. Soft archive only — see the action. After success the result
 * message is shown and the lists are revalidated.
 */
export function ResetWorkspaceForm({ canManage }: { canManage: boolean }) {
  const [state, formAction, pending] = useActionState(resetWorkspace, initial);
  const [confirm, setConfirm] = useState("");
  const armed = confirm.trim() === RESET_PHRASE;

  if (!canManage) {
    return (
      <p className="text-sm text-slate-500">
        Nur Inhaber/Admin dürfen den Arbeitsbereich bereinigen.
      </p>
    );
  }

  if (state.status === "success") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>{state.message}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="reset-confirm" className="block text-sm font-medium text-navy-800">
          Zum Bestätigen <span className="font-mono font-semibold">{RESET_PHRASE}</span> eingeben
        </label>
        <input
          id="reset-confirm"
          name="confirm"
          type="text"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`${inputClass} mt-1 max-w-xs font-mono`}
          placeholder={RESET_PHRASE}
        />
      </div>
      <button
        type="submit"
        disabled={!armed || pending}
        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.2} />
        {pending ? "Bereinigen…" : "Arbeitsdaten archivieren"}
      </button>
      {state.status === "error" && state.message && (
        <p className="inline-flex items-start gap-1.5 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          {state.message}
        </p>
      )}
    </form>
  );
}
