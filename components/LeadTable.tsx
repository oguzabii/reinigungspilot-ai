import { MapPin } from "lucide-react";
import type { Lead } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { StatusBadge, leadStatusTone } from "./StatusBadge";
import { ScoreBadge } from "./ScoreBadge";
import { LeadCard } from "./LeadCard";

const HEADERS = [
  "Firma",
  "Service",
  "Ort",
  "Status",
  "Score",
  "Wert",
  "Nächste Aktion",
];

export function LeadTable({ leads }: { leads: Lead[] }) {
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {HEADERS.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <p className="font-semibold text-navy-900">{lead.company}</p>
                  <p className="text-xs text-slate-500">{lead.contact}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                  {lead.service}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {lead.location}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={lead.status}
                    tone={leadStatusTone(lead.status)}
                    dot
                  />
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={lead.score} showBar />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-semibold text-navy-900">
                    {formatChf(lead.valueChf)}
                  </p>
                  <p className="text-xs text-slate-400">{lead.valueUnit}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{lead.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
