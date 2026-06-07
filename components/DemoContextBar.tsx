import { Sparkles, Check, Star } from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getPackage } from "@/lib/packages";
import type { ModuleId } from "@/lib/package-gates";
import { isModuleUnlocked } from "@/lib/package-gates";
import { DEMO_COMPANY } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";

const BASE_FEATURES = ["Lead Inbox", "Offerten-Engine", "Follow-up"];

const EXTRA_FEATURES: { module: ModuleId; label: string }[] = [
  { module: "leadHunter", label: "AI Lead Hunter" },
  { module: "jobOrganizer", label: "Auftrags-Organizer" },
  { module: "marketingAssistant", label: "Marketing-Assistent" },
  { module: "b2bPipeline", label: "B2B-Pipeline" },
];

/**
 * Framing banner shown at the top of the demo: the sales "story" plus a clear
 * summary of what the currently selected package unlocks.
 */
export function DemoContextBar({ pkg }: { pkg: PackageId }) {
  const def = getPackage(pkg);
  const included = [
    ...BASE_FEATURES,
    ...EXTRA_FEATURES.filter((e) => isModuleUnlocked(pkg, e.module)).map(
      (e) => e.label,
    ),
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
              Demo-Story
            </p>
            <p className="text-sm font-medium text-navy-900 sm:text-base">
              So würde{" "}
              <span className="font-semibold">{DEMO_COMPANY.name}</span> mit
              ReinigungsPilot AI arbeiten.
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:min-w-[300px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Aktives Paket
            </span>
            {def.highlight && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                Empfohlen
              </span>
            )}
          </div>
          <p className="mt-1 font-semibold text-navy-900">
            {def.name} · {def.productName}
          </p>
          <p className="text-sm text-slate-500">
            {formatChf(def.monthlyChf)} / Monat
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {def.audience}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {included.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
              >
                <Check className="h-3 w-3 text-emerald-500" strokeWidth={2.6} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
