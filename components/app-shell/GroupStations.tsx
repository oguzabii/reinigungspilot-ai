import Link from "next/link";
import {
  Rocket,
  Radar,
  Map as MapIcon,
  Library,
  Briefcase,
  PlugZap,
  type LucideIcon,
} from "lucide-react";

/**
 * GroupStations — a small, shared "where am I in this group?" band (v0.5.5).
 *
 * The workspace is grouped into Cockpit · Chancen · Kunden · Offerten ·
 * Aufträge · Chefansicht. The two groups that bundle several stations —
 * **Chancen** (Revenue Autopilot, Lead Hunter, Radar, Quellen) and **Aufträge**
 * (Aufträge, bexio) — render this band at the top of each member page so the
 * owner always sees the siblings, what each one is for, and where they are.
 * This keeps the top navigation lean (six groups) without hiding functionality.
 *
 * Server component: it takes the active station key as a prop (no client JS).
 * Pure navigation + a one-line role per station — nothing is fetched.
 */

interface Station {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** One simple line: what this station is for. */
  role: string;
}

interface Group {
  title: string;
  intro: string;
  stations: Station[];
}

const GROUPS: Record<"chancen" | "auftraege", Group> = {
  chancen: {
    title: "Chancen",
    intro: "Von der Quelle bis zur heutigen Aktion – an einem Ort.",
    stations: [
      {
        key: "autopilot",
        label: "Revenue Autopilot",
        href: "/app-shell/revenue-autopilot",
        icon: Rocket,
        role: "Entscheidet die heutigen Aktionen",
      },
      {
        key: "lead-hunter",
        label: "Lead Hunter",
        href: "/app-shell/lead-hunter",
        icon: Radar,
        role: "Chancen erfassen & qualifizieren",
      },
      {
        key: "radar",
        label: "Radar",
        href: "/app-shell/lead-hunter/radar",
        icon: MapIcon,
        role: "Geografie sichtbar machen",
      },
      {
        key: "sources",
        label: "Quellen",
        href: "/app-shell/lead-hunter/sources",
        icon: Library,
        role: "Woher die Chancen kommen",
      },
    ],
  },
  auftraege: {
    title: "Aufträge",
    intro: "Von der gewonnenen Arbeit bis zur Rechnung.",
    stations: [
      {
        key: "jobs",
        label: "Aufträge",
        href: "/app-shell/jobs",
        icon: Briefcase,
        role: "Arbeit ausführen & terminieren",
      },
      {
        key: "bexio",
        label: "bexio-Übergabe",
        href: "/app-shell/bexio",
        icon: PlugZap,
        role: "Abschliessen & verrechnen",
      },
    ],
  },
};

export function GroupStations({
  group,
  active,
}: {
  group: "chancen" | "auftraege";
  active: string;
}) {
  const g = GROUPS[group];
  return (
    <section
      aria-label={`${g.title} – Stationen`}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          {g.title}
        </p>
        <p className="text-xs text-slate-500">{g.intro}</p>
      </div>
      <div
        className={`mt-3 grid gap-2 ${
          g.stations.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"
        }`}
      >
        {g.stations.map((s) => {
          const Icon = s.icon;
          const isActive = s.key === active;
          return (
            <Link
              key={s.key}
              href={s.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                isActive
                  ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
              }`}
            >
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${
                  isActive
                    ? "bg-white/10 text-white ring-white/20"
                    : "bg-navy-50 text-navy-700 ring-navy-100"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "" : "text-blue-600"}`}
                  strokeWidth={2}
                />
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    isActive ? "text-white" : "text-navy-900"
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`mt-0.5 block text-xs leading-snug ${
                    isActive ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {s.role}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
