"use client";

import { useActionState } from "react";
import { Archive, Check } from "lucide-react";
import {
  archiveEntity,
  type ArchivableEntity,
  type ArchiveActionState,
} from "@/app/app-shell/archive-actions";

const initial: ArchiveActionState = { status: "idle" };

/**
 * "Aus Arbeitsliste entfernen" — soft-archives one entry so it leaves the active
 * lists. One subtle, secondary button (not a primary action). After success it
 * shows a quiet "Entfernt" chip; the row disappears on the next render.
 */
export function ArchiveButton({
  entity,
  id,
  label = "Aus Arbeitsliste",
}: {
  entity: ArchivableEntity;
  id: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState(archiveEntity, initial);

  if (state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        <Check className="h-3.5 w-3.5" />
        Entfernt
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 disabled:opacity-60"
      >
        <Archive className="h-3.5 w-3.5" />
        {pending ? "Entfernen…" : label}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}
