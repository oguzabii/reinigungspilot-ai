import {
  Crosshair,
  Building2,
  Stethoscope,
  Briefcase,
  Truck,
  UtensilsCrossed,
  MapPin,
  Send,
  Sparkles,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getPackage } from "@/lib/packages";
import { getModuleAccess } from "@/lib/package-gates";
import { DEMO_PROSPECTS } from "@/lib/demo-data";
import type { Prospect, ProspectCategory } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { ModuleHeader } from "@/components/ModuleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { LockedFeature } from "@/components/LockedFeature";

interface Props {
  pkg: PackageId;
  onSelectPackage: (id: PackageId) => void;
}

const CATEGORY_ICON: Record<ProspectCategory, LucideIcon> = {
  Immobilienverwaltung: Building2,
  Praxis: Stethoscope,
  Büro: Briefcase,
  Umzugsfirma: Truck,
  "Restaurant/Gewerbe": UtensilsCrossed,
};

export function LeadHunter({ pkg, onSelectPackage }: Props) {
  const access = getModuleAccess(pkg, "leadHunter");

  if (access === "locked") {
    return (
      <div className="space-y-6">
        <ModuleHeader
          icon={Crosshair}
          title="AI Lead Hunter"
          description="Findet aktiv neue B2B-Kunden in Ihrer Region – mit Score, Begründung und passender Erstnachricht."
          badge={<StatusBadge label="Gesperrt" tone="neutral" />}
        />
        <LockedFeature
          title="AI Lead Hunter findet aktiv neue B2B-Kunden"
          requiredPackageName="Pro"
          description="Der AI Lead Hunter durchsucht Ihre Region nach passenden Immobilienverwaltungen, Praxen, Büros, Umzugsfirmen und Gewerbebetrieben."
          icon={Crosshair}
          bullets={[
            "Qualifizierte B2B-Prospects jeden Monat",
            "Score und konkrete Begründung je Prospect",
            "Vorgeschlagene Erstnachricht – bereit zum Versand",
          ]}
          onUpgrade={() => onSelectPackage("pro")}
        />
      </div>
    );
  }

  const limit = getPackage(pkg).limits.leadHunterProspects;
  const used = Math.round(limit * 0.3);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Crosshair}
        title="AI Lead Hunter"
        description="Findet aktiv neue B2B-Kunden in Ihrer Region – mit Score, Begründung und passender Erstnachricht."
        badge={
          <StatusBadge
            label={`${used} / ${limit} Prospects diesen Monat`}
            tone="accent"
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {DEMO_PROSPECTS.map((prospect) => (
          <ProspectCard key={prospect.id} prospect={prospect} />
        ))}
      </div>
    </div>
  );
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const Icon = CATEGORY_ICON[prospect.category];
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="font-semibold text-navy-900">{prospect.name}</p>
            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
              {prospect.category}
              <span className="text-slate-300">·</span>
              <MapPin className="h-3 w-3" />
              {prospect.location}
            </p>
          </div>
        </div>
        <ScoreBadge score={prospect.score} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {prospect.reason}
      </p>

      <div className="mt-3 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Erstnachricht
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
          {prospect.suggestedMessage}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-sm font-semibold text-navy-900">
            {formatChf(prospect.estValueChf)}
          </p>
          <p className="text-xs text-slate-400">geschätztes Potenzial / Jahr</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            Als Lead
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
            Senden
          </button>
        </div>
      </div>
    </div>
  );
}
