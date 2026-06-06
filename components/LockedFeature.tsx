import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface LockedFeatureProps {
  title: string;
  requiredPackageName: string;
  description?: string;
  icon?: LucideIcon;
  bullets?: string[];
  /** Switch the demo to the required package (used inside the demo shell). */
  onUpgrade?: () => void;
  /** Link target when no in-place upgrade handler is provided. */
  upgradeHref?: string;
  className?: string;
}

/** Upgrade / locked state shown when a module is not in the active package. */
export function LockedFeature({
  title,
  requiredPackageName,
  description,
  icon: Icon = Lock,
  bullets,
  onUpgrade,
  upgradeHref,
  className,
}: LockedFeatureProps) {
  const ctaLabel = `Im ${requiredPackageName}-Demo ansehen`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center surface-grid",
        className,
      )}
    >
      <div className="mx-auto max-w-md">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-navy-700 shadow-sm ring-1 ring-slate-200">
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </span>

        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5 text-blue-300" />
          Verfügbar ab {requiredPackageName}
        </span>

        <h3 className="mt-4 text-lg font-semibold tracking-tight text-navy-900">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        )}

        {bullets && bullets.length > 0 && (
          <ul className="mx-auto mt-5 max-w-sm space-y-2 text-left">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2.5 text-sm text-slate-600"
              >
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Lock className="h-2.5 w-2.5" strokeWidth={2.6} />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {onUpgrade ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </button>
        ) : (
          upgradeHref && (
            <Link
              href={upgradeHref}
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          )
        )}
      </div>
    </div>
  );
}
