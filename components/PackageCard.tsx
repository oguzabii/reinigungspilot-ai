import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import type { PackageDef } from "@/lib/packages";
import { formatChf } from "@/lib/format";
import { cn } from "@/lib/cn";

interface PackageCardProps {
  pkg: PackageDef;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
}

export function PackageCard({
  pkg,
  ctaHref = "/demo",
  ctaLabel = "Live-Demo ansehen",
  className,
}: PackageCardProps) {
  const highlight = pkg.highlight;
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
        highlight
          ? "border-blue-500 shadow-lg ring-1 ring-blue-500"
          : "border-slate-200",
        className,
      )}
    >
      {pkg.badge && (
        <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {pkg.badge}
        </span>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          {pkg.productName}
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-navy-900">
          {pkg.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {pkg.tagline}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight text-navy-900">
            {formatChf(pkg.monthlyChf)}
          </span>
          <span className="text-sm font-medium text-slate-500">/ Monat</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatChf(pkg.setupChf)} einmalige Einrichtung
        </p>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {pkg.focus.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
              strokeWidth={2.5}
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={cn(
          "mt-7 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
          highlight
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-navy-900 text-white hover:bg-navy-800",
        )}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
      </Link>
    </div>
  );
}
