import { cn } from "@/lib/cn";

interface ScoreTone {
  text: string;
  bar: string;
  chip: string;
}

function scoreTone(score: number): ScoreTone {
  if (score >= 85) {
    return {
      text: "text-emerald-700",
      bar: "bg-emerald-500",
      chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }
  if (score >= 70) {
    return {
      text: "text-blue-700",
      bar: "bg-blue-500",
      chip: "bg-blue-50 text-blue-700 ring-blue-200",
    };
  }
  if (score >= 50) {
    return {
      text: "text-amber-800",
      bar: "bg-amber-500",
      chip: "bg-amber-50 text-amber-800 ring-amber-200",
    };
  }
  return {
    text: "text-slate-600",
    bar: "bg-slate-400",
    chip: "bg-slate-100 text-slate-600 ring-slate-200",
  };
}

interface ScoreBadgeProps {
  score: number;
  /** Render a thin progress bar next to the number. */
  showBar?: boolean;
  className?: string;
}

/** Lead/prospect score (0–100) with threshold-based colour. */
export function ScoreBadge({ score, showBar = false, className }: ScoreBadgeProps) {
  const tone = scoreTone(score);

  if (showBar) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full", tone.bar)}
            style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          />
        </div>
        <span className={cn("text-sm font-semibold tabular-nums", tone.text)}>
          {score}
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset",
        tone.chip,
        className,
      )}
    >
      {score}
    </span>
  );
}
