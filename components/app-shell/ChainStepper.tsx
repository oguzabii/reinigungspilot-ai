import Link from "next/link";
import {
  Radar,
  Inbox,
  FileText,
  Briefcase,
  PlugZap,
  Crown,
  ChevronRight,
} from "lucide-react";
import type { TenantCounts } from "@/lib/auth/tenant-data";

/**
 * The money chain, rendered in order so the owner can see the whole revenue
 * path at a glance and jump into any station:
 *
 *   Lead Hunter → Lead Inbox → Offerten → Aufträge → bexio → CEO
 *
 * Pure presentation over the RLS-scoped counts. Horizontally scrollable on
 * small screens; each station links to its module.
 */

interface Station {
  label: string;
  sublabel: string;
  href: string;
  icon: typeof Radar;
  count: number | null;
}

export function ChainStepper({ counts }: { counts: TenantCounts }) {
  const stations: Station[] = [
    {
      label: "Lead Hunter",
      sublabel: "Chancen",
      href: "/app-shell/lead-hunter",
      icon: Radar,
      count: counts.prospects,
    },
    {
      label: "Lead Inbox",
      sublabel: "Leads",
      href: "/app-shell/leads",
      icon: Inbox,
      count: counts.leads,
    },
    {
      label: "Offerten",
      sublabel: "Angebote",
      href: "/app-shell/offers",
      icon: FileText,
      count: counts.offers,
    },
    {
      label: "Aufträge",
      sublabel: "gewonnen",
      href: "/app-shell/jobs",
      icon: Briefcase,
      count: counts.jobs,
    },
    {
      label: "bexio",
      sublabel: "verrechnen",
      href: "/app-shell/bexio",
      icon: PlugZap,
      count: counts.bexioHandoffs,
    },
    {
      label: "CEO",
      sublabel: "Überblick",
      href: "/app-shell/ceo",
      icon: Crown,
      count: null,
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-navy-900">
          Umsatz-Kette
        </h2>
        <p className="text-sm text-slate-500">
          Von der Chance zum verrechneten Auftrag.
        </p>
      </div>

      <div className="mt-4 flex items-stretch gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stations.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.href} className="flex items-stretch gap-1.5">
              <Link
                href={s.href}
                className="group flex w-[8.5rem] shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                  <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                </span>
                <span className="mt-2.5 text-sm font-semibold text-navy-900">
                  {s.label}
                </span>
                <span className="text-2xl font-semibold tabular-nums text-navy-900">
                  {s.count === null ? "—" : s.count}
                </span>
                <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {s.sublabel}
                </span>
                <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
                  Öffnen
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </Link>
              {i < stations.length - 1 && (
                <span className="flex items-center self-center text-slate-300">
                  <ChevronRight className="h-5 w-5" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
