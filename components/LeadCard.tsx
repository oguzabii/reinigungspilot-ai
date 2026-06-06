import { MapPin, ArrowRight } from "lucide-react";
import type { Lead } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { StatusBadge, leadStatusTone } from "./StatusBadge";
import { ScoreBadge } from "./ScoreBadge";

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-navy-900">{lead.company}</p>
          <p className="text-sm text-slate-500">{lead.contact}</p>
        </div>
        <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} dot />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
        <span className="font-medium text-navy-800">{lead.service}</span>
        <span className="inline-flex items-center gap-1 text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {lead.location}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <ScoreBadge score={lead.score} showBar />
        <div className="text-right">
          <p className="text-sm font-semibold text-navy-900">
            {formatChf(lead.valueChf)}
          </p>
          <p className="text-xs text-slate-400">{lead.valueUnit}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50/70 px-3 py-2 text-sm text-blue-800">
        <ArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        <span className="font-medium">{lead.nextAction}</span>
      </div>
    </div>
  );
}
