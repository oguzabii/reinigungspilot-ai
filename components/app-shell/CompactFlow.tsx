import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

/**
 * The compact money flow (v0.5.12) — one simple sales process, five steps:
 *   Firmen finden → Kontakt finden → E-Mail senden → Nachfassen → Offerte/Auftrag
 *
 * Each step shows a count, a short status and one clear button. Presentational
 * only; the cockpit computes the numbers from the tenant's own data.
 */

export interface FlowStep {
  key: string;
  label: string;
  count: number;
  status: string;
  href: string;
  cta: string;
  icon: LucideIcon;
}

export function CompactFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <Link
            key={s.key}
            href={s.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="flex items-center justify-between">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
              </span>
              <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                {i + 1}/{steps.length}
              </span>
            </span>
            <span className="mt-2 text-sm font-semibold text-navy-900">
              {s.label}
            </span>
            <span className="text-2xl font-semibold tabular-nums text-navy-900">
              {s.count}
            </span>
            <span className="mt-0.5 text-[11px] leading-snug text-slate-500">
              {s.status}
            </span>
            <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-blue-700">
              {s.cta}
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
