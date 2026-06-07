"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getPackage } from "@/lib/packages";
import { isModuleUnlocked } from "@/lib/package-gates";
import {
  DEMO_VIEWS,
  DEMO_NAV_GROUPS,
  type DemoViewId,
} from "@/lib/modules";
import { DEMO_COMPANY } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { cn } from "@/lib/cn";

import { Logo } from "@/components/Logo";
import { PackageToggle } from "@/components/PackageToggle";
import { DemoContextBar } from "@/components/DemoContextBar";

import { BossDashboard } from "@/components/modules/BossDashboard";
import { LeadInbox } from "@/components/modules/LeadInbox";
import { LeadHunter } from "@/components/modules/LeadHunter";
import { OfferEngine } from "@/components/modules/OfferEngine";
import { FollowUpCenter } from "@/components/modules/FollowUpCenter";
import { JobOrganizer } from "@/components/modules/JobOrganizer";
import { MarketingAssistant } from "@/components/modules/MarketingAssistant";
import { AddOnStore } from "@/components/modules/AddOnStore";
import { PackageComparison } from "@/components/modules/PackageComparison";
import { CustomerSuccess } from "@/components/modules/CustomerSuccess";

export function DemoShell() {
  const [pkg, setPkg] = useState<PackageId>("pro");
  const [activeView, setActiveView] = useState<DemoViewId>("dashboard");
  const pkgDef = getPackage(pkg);

  function renderView() {
    switch (activeView) {
      case "dashboard":
        return <BossDashboard pkg={pkg} onSelectPackage={setPkg} />;
      case "leadInbox":
        return <LeadInbox pkg={pkg} />;
      case "leadHunter":
        return <LeadHunter pkg={pkg} onSelectPackage={setPkg} />;
      case "offerEngine":
        return <OfferEngine pkg={pkg} />;
      case "followUp":
        return <FollowUpCenter />;
      case "jobOrganizer":
        return <JobOrganizer pkg={pkg} onSelectPackage={setPkg} />;
      case "marketingAssistant":
        return <MarketingAssistant pkg={pkg} onSelectPackage={setPkg} />;
      case "addOns":
        return <AddOnStore />;
      case "comparison":
        return <PackageComparison pkg={pkg} onSelectPackage={setPkg} />;
      case "customerSuccess":
        return <CustomerSuccess />;
    }
  }

  function isLocked(viewId: DemoViewId): boolean {
    const view = DEMO_VIEWS.find((v) => v.id === viewId);
    return view?.gate ? !isModuleUnlocked(pkg, view.gate) : false;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Link href="/" className="inline-flex items-center">
            <Logo variant="light" className="hidden sm:inline-flex" />
            <Logo variant="light" showName={false} className="sm:hidden" />
          </Link>

          <div className="order-3 flex max-w-full justify-center overflow-x-auto sm:order-2 sm:w-auto sm:justify-start">
            <PackageToggle
              value={pkg}
              onChange={setPkg}
              size="sm"
              theme="dark"
            />
          </div>

          <Link
            href="/"
            className="order-2 text-sm font-medium text-navy-200 transition-colors hover:text-white sm:order-3"
          >
            <span aria-hidden="true">←</span> Zur Website
          </Link>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 border-r border-white/5 bg-navy-900 lg:sticky lg:top-[57px] lg:block lg:h-[calc(100vh-57px)] lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">
              {DEMO_COMPANY.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {DEMO_COMPANY.name}
              </p>
              <p className="truncate text-xs text-navy-300">
                {DEMO_COMPANY.region}
              </p>
            </div>
          </div>

          <nav className="px-3 py-3">
            {DEMO_NAV_GROUPS.map((group) => {
              const views = DEMO_VIEWS.filter((v) => v.group === group);
              if (views.length === 0) return null;
              return (
                <div key={group} className="pb-2">
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                    {group}
                  </p>
                  {views.map((view) => (
                    <NavButton
                      key={view.id}
                      view={view}
                      active={activeView === view.id}
                      locked={isLocked(view.id)}
                      onClick={() => setActiveView(view.id)}
                    />
                  ))}
                </div>
              );
            })}

            <div className="mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
              <p className="text-[11px] uppercase tracking-wide text-navy-400">
                Aktives Paket
              </p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {pkgDef.name} · {pkgDef.productName}
              </p>
              <p className="text-xs text-navy-300">
                {formatChf(pkgDef.monthlyChf)} / Monat
              </p>
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Mobile nav */}
          <div className="border-b border-slate-200 bg-white lg:hidden">
            <div className="flex gap-1 overflow-x-auto px-3 py-2">
              {DEMO_VIEWS.map((view) => {
                const active = activeView === view.id;
                const locked = isLocked(view.id);
                const Icon = view.icon;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setActiveView(view.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-navy-900 text-white"
                        : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {view.label}
                    {locked && <Lock className="h-3 w-3 opacity-70" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
            <DemoContextBar pkg={pkg} />
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavButton({
  view,
  active,
  locked,
  onClick,
}: {
  view: (typeof DEMO_VIEWS)[number];
  active: boolean;
  locked: boolean;
  onClick: () => void;
}) {
  const Icon = view.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-white/10 text-white"
          : "text-navy-200 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1 truncate text-left">{view.label}</span>
      {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-navy-400" />}
    </button>
  );
}
