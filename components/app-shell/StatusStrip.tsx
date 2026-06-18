import Link from "next/link";
import type { StageStat } from "@/components/app-shell/sales-flow";

/**
 * The compact sales status strip (v0.5.14) — six plain-language stages with
 * live counts, rendered as small linked chips (NOT a wall of KPI cards). Shared
 * by the Cockpit and the Pipeline page via `salesStageStats`, so both always
 * show the same numbers. Presentational only.
 */
export function StatusStrip({ stats }: { stats: StageStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <Link
          key={s.key}
          href={s.href}
          className="flex flex-col rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
        >
          <span className="text-xl font-semibold tabular-nums text-navy-900">
            {s.count}
          </span>
          <span className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500">
            {s.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
