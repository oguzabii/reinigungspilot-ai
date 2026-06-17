import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import type { SetupStatus } from "@/lib/digital-office/office";

/**
 * Self-service office setup — a single page section with the seven setup blocks
 * and clear progress ("4 von 7 Schritten erledigt"). Server component: the
 * done-state is derived from real signals; CTAs link to the matching section.
 */
export function SetupChecklist({ status }: { status: SetupStatus }) {
  const pct = Math.round((status.doneCount / status.totalCount) * 100);

  return (
    <section
      id="einrichtung"
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Büro einrichten
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {status.doneCount} von {status.totalCount} Schritten erledigt
          </p>
        </div>
        <span className="text-sm font-semibold text-blue-700">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-5 space-y-2">
        {status.steps.map((step) => {
          const inner = (
            <>
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "border border-slate-300 bg-white text-transparent"
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy-900">
                  {step.label}
                </span>
                <span className="block text-sm text-slate-500">{step.hint}</span>
              </span>
              {step.href && !step.done && (
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
              )}
            </>
          );

          return (
            <li key={step.id}>
              {step.href ? (
                <Link
                  href={step.href}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
