import Link from "next/link";
import { Check, Minus, Star, ArrowRight, Tag } from "lucide-react";
import type { PackageDef } from "@/lib/packages";
import { getPackageName } from "@/lib/packages";
import { splitModulesByPackage } from "@/lib/modules";
import { formatChf, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export function PricingCard({ pkg }: { pkg: PackageDef }) {
  const { included, excluded } = splitModulesByPackage(pkg.id);
  const highlight = pkg.highlight;
  const limits = pkg.limits;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
        highlight
          ? "border-blue-500 shadow-lg ring-1 ring-blue-500"
          : "border-slate-200",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          <Tag className="h-3 w-3" />
          {pkg.audienceTag}
        </span>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            Empfohlen
          </span>
        )}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
        {pkg.productName}
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-navy-900">
        {pkg.name}
      </h3>

      <div className="mt-4 border-t border-slate-100 pt-4">
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

      <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Für wen geeignet?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {pkg.audience}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <Limit label="Leads / Monat" value={formatNumber(limits.leadsPerMonth)} />
        <Limit
          label="Nutzer"
          value={`${limits.adminUsers} Admin · ${limits.teamUsers} Team`}
        />
        <Limit
          label="PDF-Offerten / Monat"
          value={formatNumber(limits.pdfOffersPerMonth)}
        />
        <Limit label="Support" value={`${limits.supportHoursPerMonth} h / Monat`} />
      </dl>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Was ist enthalten?
        </p>
        <ul className="mt-2 space-y-1.5">
          {included.map((m) => (
            <li key={m.id} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
              <span>{m.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {excluded.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Was ist nicht enthalten?
          </p>
          <ul className="mt-2 space-y-1.5">
            {excluded.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-2 text-sm text-slate-400"
              >
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" strokeWidth={2.4} />
                <span>
                  {m.label}
                  <span className="text-slate-400"> · ab {getPackageName(m.availableFrom)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-5">
        <Link
          href="/demo"
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
            highlight
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-navy-900 text-white hover:bg-navy-800",
          )}
        >
          Demo ansehen
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </Link>
        <Link
          href="/beratung"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          Beratung anfragen
        </Link>
      </div>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 px-3 py-2">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-sm font-semibold text-navy-900">{value}</dd>
    </div>
  );
}
