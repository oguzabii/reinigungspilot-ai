import { Layers } from "lucide-react";
import { INDUSTRIES, DEFAULT_INDUSTRY_ID } from "@/lib/industries";
import type { IndustryPreset } from "@/lib/industries";
import { ModuleHeader } from "@/components/ModuleHeader";
import { StatusBadge } from "@/components/StatusBadge";

export function IndustryPresets() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Layers}
        title="Branchenvorlagen"
        description="ReinigungsPilot AI ist ein Verkaufsbüro für Schweizer KMU. Jede Branche hat eine eigene Vorlage – mit typischen Leads, Offertfeldern, Follow-ups und Abläufen."
        badge={<StatusBadge label={`${INDUSTRIES.length} Branchen`} tone="accent" />}
      />

      <p className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
        Reinigung ist die aktive Vorlage in dieser Demo. Die weiteren Branchen
        sind als Vorlage vorbereitet und werden beim Setup an Ihren Betrieb
        angepasst.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {INDUSTRIES.map((industry) => (
          <IndustryCard key={industry.id} industry={industry} />
        ))}
      </div>
    </div>
  );
}

function IndustryCard({ industry }: { industry: IndustryPreset }) {
  const Icon = industry.icon;
  const active = industry.id === DEFAULT_INDUSTRY_ID;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="font-semibold text-navy-900">{industry.label}</p>
            <p className="text-xs text-slate-500">{industry.tagline}</p>
          </div>
        </div>
        {active && <StatusBadge label="Aktive Vorlage" tone="success" dot />}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChipList label="Typische Leads" items={industry.typicalLeads} />
        <ChipList label="Beispiel-Leistungen" items={industry.exampleServices} />
        <ChipList label="Offert-Felder" items={industry.offerFields} />
        <ChipList label="Follow-ups" items={industry.followUps} />
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Workflow
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {industry.workflow.join("  →  ")}
        </p>
      </div>
    </div>
  );
}

function ChipList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
