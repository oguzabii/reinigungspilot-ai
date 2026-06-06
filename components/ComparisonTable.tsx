import { Check, Minus } from "lucide-react";
import type { PackageId, PackageLimits } from "@/lib/packages";
import { PACKAGE_LIST } from "@/lib/packages";
import { formatChf, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

type CellValue = string | number | boolean;

interface Row {
  label: string;
  value: (limits: PackageLimits) => CellValue;
}

const ROWS: Row[] = [
  { label: "Admin-Nutzer", value: (l) => l.adminUsers },
  { label: "Team-Nutzer", value: (l) => l.teamUsers },
  { label: "Leads / Monat", value: (l) => formatNumber(l.leadsPerMonth) },
  { label: "Services", value: (l) => l.services },
  { label: "Preismodelle", value: (l) => l.pricingModels },
  {
    label: "PDF-Offerten / Monat",
    value: (l) => formatNumber(l.pdfOffersPerMonth),
  },
  { label: "Postfächer", value: (l) => l.mailboxes },
  {
    label: "AI Lead Hunter (Prospects / Monat)",
    value: (l) =>
      l.leadHunterProspects > 0 ? formatNumber(l.leadHunterProspects) : false,
  },
  { label: "Auftrags- & Kalenderplanung", value: (l) => l.jobOrganizer },
  { label: "Wöchentlicher Chef-Report", value: (l) => l.weeklyOwnerReport },
  { label: "Monatlicher Strategie-Report", value: (l) => l.monthlyStrategyReport },
  { label: "Erweiterte B2B-Pipeline", value: (l) => l.advancedB2bPipeline },
  {
    label: "Kampagnen-Landingpage",
    value: (l) =>
      l.campaignLandingPages > 0 ? `${l.campaignLandingPages} inklusive` : false,
  },
  { label: "Support / Monat", value: (l) => `${l.supportHoursPerMonth} h` },
];

interface ComparisonTableProps {
  /** Highlights this package's column. */
  activePkg?: PackageId;
  /** When provided, column headers become buttons that switch the package. */
  onSelectPackage?: (id: PackageId) => void;
}

export function ComparisonTable({
  activePkg,
  onSelectPackage,
}: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-4 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-slate-400">
              Leistung
            </th>
            {PACKAGE_LIST.map((p) => {
              const active = p.id === activePkg;
              return (
                <th
                  key={p.id}
                  className={cn(
                    "px-4 py-4 text-center align-top",
                    active && "bg-blue-50/50",
                  )}
                >
                  <PackageHead
                    name={p.name}
                    productName={p.productName}
                    monthly={formatChf(p.monthlyChf)}
                    setup={formatChf(p.setupChf)}
                    active={active}
                    onClick={
                      onSelectPackage ? () => onSelectPackage(p.id) : undefined
                    }
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ROWS.map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-3 text-left font-medium text-slate-600">
                {row.label}
              </td>
              {PACKAGE_LIST.map((p) => (
                <td
                  key={p.id}
                  className={cn(
                    "px-4 py-3 text-center",
                    p.id === activePkg && "bg-blue-50/40",
                  )}
                >
                  <Cell value={row.value(p.limits)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PackageHeadProps {
  name: string;
  productName: string;
  monthly: string;
  setup: string;
  active: boolean;
  onClick?: () => void;
}

function PackageHead({
  name,
  productName,
  monthly,
  setup,
  active,
  onClick,
}: PackageHeadProps) {
  const content = (
    <>
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-blue-600">
        {productName}
      </span>
      <span className="mt-0.5 block text-base font-semibold text-navy-900">
        {name}
      </span>
      <span className="mt-1 block font-semibold text-navy-900">
        {monthly}
        <span className="text-xs font-normal text-slate-500"> /Mt.</span>
      </span>
      <span className="block text-xs text-slate-500">{setup} Setup</span>
      {active && (
        <span className="mt-1.5 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
          Aktuell
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg px-1 py-1 transition-colors hover:bg-blue-50"
      >
        {content}
      </button>
    );
  }
  return <div className="px-1">{content}</div>;
}

function Cell({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-emerald-500" strokeWidth={2.5} />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-slate-300" strokeWidth={2.5} />
    );
  }
  return <span className="font-medium text-navy-900">{value}</span>;
}
