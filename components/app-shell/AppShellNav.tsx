"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Target,
  Users,
  FileText,
  Briefcase,
  Crown,
  LogOut,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";

/**
 * App-shell navigation — the persistent header for the protected Klarsa
 * workspace. Unlike `InternalHeader` (which links to the marketing/sales pages),
 * this groups the product into six plain-language areas so the owner instantly
 * knows where money is and what to do next:
 *
 *   Cockpit → Chancen → Kunden → Offerten → Aufträge → Chefansicht
 *
 * The bundled stations live one level down and are surfaced on each group's
 * pages via `GroupStations` (Chancen = Autopilot/Lead Hunter/Radar/Quellen,
 * Aufträge = Aufträge/bexio) — so nothing is removed, only de-cluttered.
 *
 * Client component: it reads `usePathname()` to highlight the active group
 * (the documented Next.js active-link pattern). No data fetching, no state —
 * just navigation, the brand mark and a logout form.
 */

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Active test covers every sub-route the group bundles. */
  isActive: (pathname: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Cockpit",
    href: "/app-shell",
    icon: LayoutGrid,
    isActive: (p) => p === "/app-shell",
  },
  {
    label: "Chancen",
    href: "/app-shell/revenue-autopilot",
    icon: Target,
    isActive: (p) =>
      p.startsWith("/app-shell/revenue-autopilot") ||
      p.startsWith("/app-shell/lead-hunter"),
  },
  {
    label: "Kunden",
    href: "/app-shell/leads",
    icon: Users,
    isActive: (p) => p === "/app-shell/leads" || p.startsWith("/app-shell/leads/"),
  },
  {
    label: "Offerten",
    href: "/app-shell/offers",
    icon: FileText,
    isActive: (p) => p === "/app-shell/offers" || p.startsWith("/app-shell/offers/"),
  },
  {
    label: "Aufträge",
    href: "/app-shell/jobs",
    icon: Briefcase,
    isActive: (p) =>
      p.startsWith("/app-shell/jobs") || p.startsWith("/app-shell/bexio"),
  },
  {
    label: "CEO / Finanzen",
    href: "/app-shell/ceo",
    icon: Crown,
    isActive: (p) => p === "/app-shell/ceo" || p.startsWith("/app-shell/ceo/"),
  },
];

export function AppShellNav({ companyName }: { companyName?: string }) {
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/95 backdrop-blur supports-[backdrop-filter]:bg-navy-900/80">
      {/* Top row: brand · tenant · logout */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/app-shell" className="flex items-center gap-2.5">
          <Logo priority />
          <span className="hidden text-sm font-semibold tracking-tight text-white sm:inline">
            Klarsa
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {companyName && (
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-navy-100 ring-1 ring-inset ring-white/15 sm:inline-flex">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </span>
          )}
          <form action="/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-navy-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </form>
        </div>
      </div>

      {/* Group row: the six workspace areas, horizontally scrollable on mobile */}
      <nav
        aria-label="Klarsa-Bereiche"
        className="mx-auto max-w-5xl overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(pathname);
            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white text-navy-900 shadow-sm"
                      : "text-navy-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? "text-blue-600" : ""}`}
                    strokeWidth={2}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
