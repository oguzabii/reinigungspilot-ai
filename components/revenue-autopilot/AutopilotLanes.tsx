import Link from "next/link";
import {
  Globe,
  Send,
  BellRing,
  FileText,
  CalendarClock,
  PlugZap,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { LANE_STATE_META, type AutopilotLane } from "./lanes";

/**
 * Renders the Autopilot lanes as the Premium command center overview (v0.5.6).
 * Each lane links to where the owner acts; the badge shows its honest state
 * (Aktiv · Wartet auf Freigabe · Kanal nicht verbunden · Bereit für Premium ·
 * Premium-Funktion · Nächste Aktion geplant). Presentational only.
 */

const LANE_ICON: Record<string, LucideIcon> = {
  discovery: Globe,
  outreach: Send,
  followup: BellRing,
  offer: FileText,
  appointment: CalendarClock,
  handoff: PlugZap,
};

export function AutopilotLanes({ lanes }: { lanes: AutopilotLane[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lanes.map((lane) => {
        const Icon = LANE_ICON[lane.key] ?? Globe;
        const meta = LANE_STATE_META[lane.state];
        return (
          <Link
            key={lane.key}
            href={lane.href}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-navy-900">
                  {lane.title}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${meta.className}`}
                >
                  {meta.label}
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                {lane.description}
              </span>
              <span className="mt-1 block text-xs font-medium text-slate-600">
                {lane.note}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-300" />
          </Link>
        );
      })}
    </div>
  );
}
