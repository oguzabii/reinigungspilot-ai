import Link from "next/link";
import { Lock, ArrowRight, MessageSquare } from "lucide-react";
import {
  DIGITAL_WORKERS,
  getWorker,
  type WorkerDef,
} from "@/lib/digital-office/workers";
import type {
  WorkerRuntime,
  WorkerRuntimeStatus,
} from "@/lib/digital-office/office";

/**
 * Live office board: the digital workers as cards. Active workers show their
 * honest runtime status (idle / working / waiting for approval / blocked) plus
 * the current task and today's output; locked workers are shown as a friendly
 * "available in a higher package" row. Server component.
 */

const STATUS_META: Record<
  WorkerRuntimeStatus,
  { label: string; dot: string; chip: string }
> = {
  working: {
    label: "Arbeitet",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  idle: {
    label: "Bereit",
    dot: "bg-slate-400",
    chip: "bg-slate-50 text-slate-600 ring-slate-200",
  },
  waiting_approval: {
    label: "Wartet auf Freigabe",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  blocked: {
    label: "Wartet auf Einrichtung",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  locked: {
    label: "Gesperrt",
    dot: "bg-slate-300",
    chip: "bg-slate-50 text-slate-500 ring-slate-200",
  },
};

function WorkerCard({
  worker,
  runtime,
}: {
  worker: WorkerDef;
  runtime: WorkerRuntime;
}) {
  const Icon = worker.icon;
  const meta = STATUS_META[runtime.status];

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${worker.accent.bg} ${worker.accent.text} ${worker.accent.ring}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy-900">
            {worker.name}
          </p>
          <p className="truncate text-xs text-slate-500">{worker.role}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 text-slate-400">Aufgabe</dt>
          <dd className="min-w-0 flex-1 text-navy-800">{runtime.currentTask}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-slate-400">Heute</dt>
          <dd className="min-w-0 flex-1 text-slate-600">{runtime.todayOutput}</dd>
        </div>
      </dl>
    </div>
  );
}

export function WorkerBoard({ runtimes }: { runtimes: WorkerRuntime[] }) {
  const active = runtimes.filter((r) => !r.locked);
  const locked = runtimes.filter((r) => r.locked);

  return (
    <section id="mitarbeiter" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">
          Digitale Mitarbeiter
        </h2>
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <MessageSquare className="h-3.5 w-3.5" />
          Aufgaben geben Sie über Ask Office
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((runtime) => (
          <WorkerCard
            key={runtime.id}
            worker={getWorker(runtime.id)}
            runtime={runtime}
          />
        ))}
      </div>

      {locked.length > 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Weitere Mitarbeiter
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Upgrade, wenn Sie mehr digitale Mitarbeiter brauchen
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {locked.map((runtime) => {
              const worker = getWorker(runtime.id);
              const Icon = worker.icon;
              return (
                <span
                  key={runtime.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500"
                >
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  {worker.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Catalog hint: how many worker types exist in total. */}
      <p className="mt-2 text-xs text-slate-400">
        {DIGITAL_WORKERS.length} Mitarbeiter-Typen im Katalog · {active.length}{" "}
        aktiv
      </p>
    </section>
  );
}
