import {
  Gauge,
  Inbox,
  FileText,
  BellRing,
  Handshake,
  TrendingUp,
  PiggyBank,
  ChartColumn,
  ArrowRight,
  CircleCheck,
} from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getModuleAccess } from "@/lib/package-gates";
import {
  DEMO_DASHBOARD,
  DEMO_TOP_OPPORTUNITIES,
  DEMO_WEEKLY_REPORT,
} from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { ModuleHeader } from "@/components/ModuleHeader";
import { DashboardMetricCard } from "@/components/DashboardMetricCard";
import { Panel, PanelTitle } from "@/components/Panel";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { LockedFeature } from "@/components/LockedFeature";

interface Props {
  pkg: PackageId;
  onSelectPackage: (id: PackageId) => void;
}

export function BossDashboard({ pkg, onSelectPackage }: Props) {
  const d = DEMO_DASHBOARD;
  const reportAccess = getModuleAccess(pkg, "advancedReports");

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Gauge}
        title="Chef-Dashboard"
        description="Der tägliche Überblick für die Geschäftsleitung: Leads, Offerten, Follow-ups und Umsatz auf einen Blick."
        badge={
          <StatusBadge label="Live-Demo" tone="info" dot />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardMetricCard
          label="Neue Leads"
          value={String(d.newLeads.value)}
          icon={Inbox}
          delta={d.newLeads.delta}
          trend={d.newLeads.trend}
          accent="blue"
        />
        <DashboardMetricCard
          label="Offerten bereit"
          value={String(d.offersReady.value)}
          icon={FileText}
          delta={d.offersReady.delta}
          trend={d.offersReady.trend}
          accent="navy"
        />
        <DashboardMetricCard
          label="Follow-ups fällig"
          value={String(d.followUpsDue.value)}
          icon={BellRing}
          delta={d.followUpsDue.delta}
          trend={d.followUpsDue.trend}
          accent="amber"
        />
        <DashboardMetricCard
          label="Gewonnene Aufträge"
          value={String(d.wonJobs.value)}
          icon={Handshake}
          delta={d.wonJobs.delta}
          trend={d.wonJobs.trend}
          accent="emerald"
        />
        <DashboardMetricCard
          label="Pipeline Umsatz"
          value={formatChf(d.pipelineRevenueChf)}
          icon={TrendingUp}
          accent="navy"
          hint="Offene Offerten & qualifizierte Leads"
        />
        <DashboardMetricCard
          label="Erwarteter Monatsumsatz"
          value={formatChf(d.expectedMonthlyRevenueChf)}
          icon={PiggyBank}
          accent="emerald"
          hint="Gewichtete Prognose laufender Monat"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top 5 opportunities */}
        <Panel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <PanelTitle>Top 5 Chancen heute</PanelTitle>
            <span className="text-xs text-slate-400">nach Score &amp; Wert</span>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {DEMO_TOP_OPPORTUNITIES.map((op, index) => (
              <li
                key={op.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-50 text-sm font-semibold text-navy-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-navy-900">
                    {op.company}
                  </p>
                  <p className="truncate text-xs text-slate-500">{op.service}</p>
                </div>
                <ScoreBadge score={op.score} />
                <div className="hidden w-24 text-right sm:block">
                  <p className="text-sm font-semibold text-navy-900">
                    {formatChf(op.valueChf)}
                  </p>
                </div>
                <span className="hidden items-center gap-1 text-xs font-medium text-blue-700 md:inline-flex">
                  {op.action}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Weekly owner report (gated) */}
        {reportAccess === "locked" ? (
          <LockedFeature
            className="lg:col-span-1"
            title="Wöchentlicher Chef-Report"
            requiredPackageName="Pro"
            description="Erhalten Sie jede Woche einen kompakten Report mit Leads, Conversion und Umsatz."
            icon={ChartColumn}
            onUpgrade={() => onSelectPackage("pro")}
          />
        ) : (
          <Panel className="lg:col-span-1">
            <div className="flex items-center justify-between">
              <PanelTitle>Chef-Report</PanelTitle>
              <StatusBadge label="Wöchentlich" tone="success" />
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">
              {DEMO_WEEKLY_REPORT.period}
            </p>
            <ul className="mt-3 space-y-2.5">
              {DEMO_WEEKLY_REPORT.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-slate-700">
                  <CircleCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                    strokeWidth={2}
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xl font-semibold text-navy-900 tabular-nums">
                  {DEMO_WEEKLY_REPORT.conversionPct}%
                </p>
                <p className="text-xs text-slate-500">Conversion</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-navy-900 tabular-nums">
                  {DEMO_WEEKLY_REPORT.avgResponseHours} h
                </p>
                <p className="text-xs text-slate-500">Ø Reaktionszeit</p>
              </div>
            </div>
            {reportAccess === "full" && (
              <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-50/70 px-3 py-2 text-xs font-medium text-blue-800">
                <PlusBadge />
                Monatlicher Strategie-Report inklusive
              </p>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}

function PlusBadge() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
      +
    </span>
  );
}
