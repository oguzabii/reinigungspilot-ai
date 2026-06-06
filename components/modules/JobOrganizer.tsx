import {
  CalendarCheck,
  CalendarDays,
  Users,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getModuleAccess } from "@/lib/package-gates";
import { DEMO_JOBS } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { ModuleHeader } from "@/components/ModuleHeader";
import { StatusBadge, calendarStateTone } from "@/components/StatusBadge";
import { LockedFeature } from "@/components/LockedFeature";

interface Props {
  pkg: PackageId;
  onSelectPackage: (id: PackageId) => void;
}

export function JobOrganizer({ pkg, onSelectPackage }: Props) {
  const access = getModuleAccess(pkg, "jobOrganizer");

  if (access === "locked") {
    return (
      <div className="space-y-6">
        <ModuleHeader
          icon={CalendarCheck}
          title="Auftrags-Organizer"
          description="Aus gewonnenen Offerten werden geplante Aufträge mit Termin, Team und Kalenderstatus."
          badge={<StatusBadge label="Gesperrt" tone="neutral" />}
        />
        <LockedFeature
          title="Auftrags- & Kalenderplanung"
          requiredPackageName="Pro"
          description="Verwandeln Sie angenommene Offerten in geplante Aufträge – mit Termin, Team-Notiz, Kalenderstatus und Kunden-Übergabe."
          icon={CalendarCheck}
          bullets={[
            "Angenommene Offerten werden zu Aufträgen",
            "Termin, Team und Kalenderstatus auf einen Blick",
            "Team- und Kunden-Übergabenotizen pro Auftrag",
          ]}
          onUpgrade={() => onSelectPackage("pro")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={CalendarCheck}
        title="Auftrags-Organizer"
        description="Aus gewonnenen Offerten werden geplante Aufträge mit Termin, Team und Kalenderstatus."
        badge={<StatusBadge label={`${DEMO_JOBS.length} Aufträge`} tone="accent" />}
      />

      <div className="space-y-4">
        {DEMO_JOBS.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy-900">{job.company}</p>
                <p className="text-sm text-slate-500">
                  {job.service} · {job.location}
                </p>
              </div>
              <StatusBadge
                label={job.calendarState}
                tone={calendarStateTone(job.calendarState)}
                dot
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Detail
                icon={CalendarDays}
                label="Termin"
                value={job.jobDate}
                sub={job.timeWindow}
              />
              <Detail
                icon={Users}
                label="Team"
                value={job.team}
                sub={job.teamNote}
              />
              <Detail
                icon={MessageSquare}
                label="Kunden-Übergabe"
                value={job.handoverNote}
              />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400">Auftragswert</span>
              <span className="font-semibold text-navy-900">
                {formatChf(job.valueChf)}{" "}
                <span className="text-xs font-normal text-slate-400">
                  {job.valueUnit}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-navy-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
