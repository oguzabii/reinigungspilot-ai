"use client";

import { useActionState, useEffect, useRef } from "react";
import { CalendarClock, X } from "lucide-react";
import { updateJobSchedule, type ActionState } from "@/app/app-shell/jobs/actions";

const initialState: ActionState = { status: "idle" };

const miniInput =
  "rounded-lg border border-slate-300 px-2 py-1 text-xs text-navy-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

/**
 * Per-job scheduling control. Submits to `updateJobSchedule` (session client +
 * RLS; jobs are the ops domain). The datetime input starts EMPTY (no pre-fill)
 * so SSR and client agree on timezone; the browser converts the chosen local
 * time to a real instant (`scheduled_iso`). "Termin setzen" sets the schedule;
 * "Entfernen" clears it. An empty submit errors rather than wiping the date.
 */
export function JobScheduleForm({
  jobId,
  hasSchedule,
}: {
  jobId: string;
  hasSchedule: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateJobSchedule,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-2">
      <div className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="job_id" value={jobId} />
        <input ref={isoRef} type="hidden" name="scheduled_iso" />
        <div>
          <label htmlFor={`job-schedule-${jobId}`} className="block text-[11px] font-medium text-slate-500">
            Termin
          </label>
          <input
            id={`job-schedule-${jobId}`}
            name="scheduled_local"
            type="datetime-local"
            className={`${miniInput} mt-0.5`}
            onChange={(e) => {
              if (!isoRef.current) return;
              const d = new Date(e.target.value);
              isoRef.current.value = Number.isNaN(d.getTime())
                ? ""
                : d.toISOString();
            }}
          />
        </div>
        <button
          type="submit"
          name="intent"
          value="set"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700 disabled:opacity-60"
        >
          <CalendarClock className="h-3 w-3" strokeWidth={2.4} />
          {pending ? "…" : "Termin setzen"}
        </button>
        {hasSchedule && (
          <button
            type="submit"
            name="intent"
            value="clear"
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
          >
            <X className="h-3 w-3" strokeWidth={2.4} />
            Entfernen
          </button>
        )}
      </div>
      {state.status === "error" && state.message && (
        <p role="alert" className="mt-1 text-xs text-amber-700">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="mt-1 text-xs text-emerald-600">
          ✓ {state.message}
        </p>
      )}
    </form>
  );
}
