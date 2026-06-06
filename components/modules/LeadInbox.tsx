import { Inbox } from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getPackage } from "@/lib/packages";
import { DEMO_LEADS } from "@/lib/demo-data";
import type { LeadStatus } from "@/lib/demo-data";
import { formatNumber } from "@/lib/format";
import { ModuleHeader } from "@/components/ModuleHeader";
import { LeadTable } from "@/components/LeadTable";
import { StatusBadge, leadStatusTone } from "@/components/StatusBadge";

const STATUS_ORDER: LeadStatus[] = [
  "Neu",
  "Qualifiziert",
  "Offerte",
  "Follow-up",
  "Gewonnen",
];

export function LeadInbox({ pkg }: { pkg: PackageId }) {
  const limit = getPackage(pkg).limits.leadsPerMonth;
  const used = Math.round(limit * 0.42);

  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: DEMO_LEADS.filter((lead) => lead.status === status).length,
  })).filter((entry) => entry.count > 0);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Inbox}
        title="Lead Inbox"
        description="Alle eingehenden Anfragen aus Web, Telefon, E-Mail und Empfehlungen – zentral gesammelt und nach Potenzial priorisiert."
        badge={
          <StatusBadge
            label={`${formatNumber(used)} / ${formatNumber(limit)} Leads`}
            tone="accent"
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Status:</span>
        {counts.map(({ status, count }) => (
          <StatusBadge
            key={status}
            label={`${status} · ${count}`}
            tone={leadStatusTone(status)}
            dot
          />
        ))}
      </div>

      <LeadTable leads={DEMO_LEADS} />
    </div>
  );
}
