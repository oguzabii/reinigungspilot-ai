import { BellRing, Flame, Clock, TriangleAlert, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DEMO_FOLLOWUPS,
  type FollowUp,
  type FollowUpStage,
} from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ModuleHeader } from "@/components/ModuleHeader";
import { StatusBadge, followUpStateTone } from "@/components/StatusBadge";

const STAGES: { key: FollowUpStage; label: string }[] = [
  { key: "24h", label: "24h-Follow-up" },
  { key: "48h", label: "48h-Follow-up" },
  { key: "5-Tage-final", label: "5-Tage-Finale" },
];

type StatTone = "amber" | "red" | "blue" | "emerald";

const statToneMap: Record<StatTone, string> = {
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
};

export function FollowUpCenter() {
  const due = DEMO_FOLLOWUPS.filter((f) => f.state === "Fällig").length;
  const overdue = DEMO_FOLLOWUPS.filter((f) => f.state === "Überfällig").length;
  const hot = DEMO_FOLLOWUPS.filter((f) => f.hot).length;
  const planned = DEMO_FOLLOWUPS.filter((f) => f.state === "Geplant").length;

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={BellRing}
        title="Follow-up Center"
        description="Automatisch getaktete Sequenzen, damit keine Offerte vergessen geht – mit Fokus auf heisse und überfällige Leads."
        badge={<StatusBadge label="Automatisch getaktet" tone="info" dot />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FuStat icon={Clock} label="Fällig heute" value={due} tone="amber" />
        <FuStat icon={TriangleAlert} label="Überfällig" value={overdue} tone="red" />
        <FuStat icon={Flame} label="Heisse Leads" value={hot} tone="red" />
        <FuStat icon={CalendarClock} label="Geplant" value={planned} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {STAGES.map((stage) => {
          const items = DEMO_FOLLOWUPS.filter((f) => f.stage === stage.key);
          return (
            <div key={stage.key}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-900">
                  {stage.label}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <FollowUpCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FuStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: StatTone;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset",
            statToneMap[tone],
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-xl font-semibold text-navy-900 tabular-nums">
            {value}
          </p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FollowUpCard({ item }: { item: FollowUp }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3.5 shadow-sm",
        item.state === "Überfällig" ? "border-red-200" : "border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-navy-900">{item.company}</p>
        {item.hot && (
          <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-100">
            <Flame className="h-3 w-3" />
            Hot
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge label={item.state} tone={followUpStateTone(item.state)} />
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {item.dueLabel}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.note}</p>
      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
        <span className="text-slate-400">{item.channel}</span>
        <span className="font-semibold text-navy-900">
          {formatChf(item.valueChf)}
        </span>
      </div>
    </div>
  );
}
