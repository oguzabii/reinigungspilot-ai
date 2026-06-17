import { getWorker } from "@/lib/digital-office/workers";
import type {
  WorkerRuntime,
  WorkerRuntimeStatus,
} from "@/lib/digital-office/office";

/**
 * Compact KI-Mitarbeiter summary for the Übersicht tab — a tight list (not a big
 * card grid). Shows each active worker with a short status; locked workers are a
 * single friendly line. The fuller board lives in the "Mitarbeiter" tab.
 */

const STATUS: Record<
  WorkerRuntimeStatus,
  { label: string; chip: string; dot: string }
> = {
  working: { label: "aktiv", chip: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  idle: { label: "bereit", chip: "bg-slate-50 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  waiting_approval: { label: "wartet", chip: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  blocked: { label: "wartet", chip: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-500" },
  locked: { label: "premium", chip: "bg-violet-50 text-violet-700 ring-violet-100", dot: "bg-violet-400" },
};

export function WorkerSummary({ runtimes }: { runtimes: WorkerRuntime[] }) {
  const active = runtimes.filter((r) => !r.locked);
  const lockedCount = runtimes.filter((r) => r.locked).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
        KI-Mitarbeiter
      </h3>
      <ul className="mt-3 divide-y divide-slate-100">
        {active.map((r) => {
          const worker = getWorker(r.id);
          const Icon = worker.icon;
          const meta = STATUS[r.status];
          return (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${worker.accent.bg} ${worker.accent.text} ${worker.accent.ring}`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-navy-900">
                  {worker.name}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {r.currentTask}
                </span>
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.chip}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>
      {lockedCount > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          + {lockedCount} weitere Mitarbeiter ab höherem Paket
        </p>
      )}
    </section>
  );
}
