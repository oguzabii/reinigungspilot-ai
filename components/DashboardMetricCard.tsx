import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

type Accent = "blue" | "emerald" | "navy" | "amber";

const accentChip: Record<Accent, string> = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  navy: "bg-navy-50 text-navy-700 ring-navy-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
};

const trendStyle = {
  up: { icon: TrendingUp, className: "text-emerald-600" },
  down: { icon: TrendingDown, className: "text-amber-600" },
  flat: { icon: Minus, className: "text-slate-400" },
} as const;

interface DashboardMetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: string;
  trend?: "up" | "down" | "flat";
  hint?: string;
  accent?: Accent;
  className?: string;
}

export function DashboardMetricCard({
  label,
  value,
  icon: Icon,
  delta,
  trend = "flat",
  hint,
  accent = "blue",
  className,
}: DashboardMetricCardProps) {
  const TrendIcon = trendStyle[trend].icon;
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
            accentChip[accent],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              trendStyle[trend].className,
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
            {delta}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-navy-900 tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-600">{label}</p>
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
