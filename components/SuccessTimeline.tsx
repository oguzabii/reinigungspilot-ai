import { Flag } from "lucide-react";
import { DEMO_SUCCESS_TIMELINE } from "@/lib/demo-data";
import { cn } from "@/lib/cn";

/** Vertical 12-month customer-success timeline. Used in the demo and landing. */
export function SuccessTimeline() {
  const items = DEMO_SUCCESS_TIMELINE;
  return (
    <div>
      {items.map((m, index) => {
        const isFirst = m.month === 0;
        const isLast = m.month === 12;
        const isMilestone = isFirst || isLast;
        return (
          <div key={m.month} className="flex gap-4">
            {/* Rail */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                  isLast
                    ? "bg-blue-600 text-white"
                    : isFirst
                      ? "bg-navy-900 text-white"
                      : "bg-white text-navy-700 ring-1 ring-slate-200",
                )}
              >
                {isLast ? <Flag className="h-4 w-4" /> : m.month}
              </span>
              {index < items.length - 1 && (
                <span className="my-1 w-px flex-1 bg-slate-200" />
              )}
            </div>

            {/* Card */}
            <div className="flex-1 pb-5">
              <div
                className={cn(
                  "rounded-xl border p-4 shadow-sm",
                  isMilestone
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-navy-900">{m.title}</h3>
                  <span className="shrink-0 text-xs font-medium text-slate-400">
                    {m.label}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {m.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
