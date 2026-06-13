import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Crown,
  Lock,
  Banknote,
  CheckCircle2,
  Briefcase,
  Target,
  Users,
  FileText,
  PlugZap,
  Activity,
  ChevronsRight,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { AutopilotCard } from "@/components/app-shell/AutopilotCard";
import { formatChf } from "@/components/offers/offer-status";
import { getPackageName } from "@/lib/packages";
import { computeCeoKpis, type CeoKpis } from "@/components/ceo/kpi";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getProspects,
  getLeads,
  getOffers,
  getJobs,
  getInvoiceHandoffJobs,
  getFollowups,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CEO-Briefing (intern) – Klarsa",
  description:
    "Read-only KPI-Überblick über die Klarsa-Kette (Opportunities → Leads → Offerten → Aufträge → bexio). Keine externen Quellen, keine KI, kein bexio-API.",
  robots: { index: false, follow: false },
};

function formatDateCh(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

export default async function AppShellCeoPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, opportunities, leads, offers, jobs, handoffJobs, followups] =
    await Promise.all([
      getCompanySummary(companyId),
      getProspects(companyId),
      getLeads(companyId),
      getOffers(companyId),
      getJobs(companyId),
      getInvoiceHandoffJobs(companyId),
      getFollowups(companyId),
    ]);

  const now = new Date();
  const nowIso = now.toISOString();
  const kpis = computeCeoKpis({
    opportunities,
    leads,
    offers,
    jobs,
    handoffJobs,
    followupLeadIds: followups.map((f) => f.leadId),
    nowIso,
  });
  const hasData =
    kpis.oppsTotal + kpis.leadsTotal + kpis.offersTotal + kpis.jobsTotal > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white ring-1 ring-inset ring-navy-900">
              <Crown className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
                CEO-Briefing
              </h1>
              <p className="text-sm text-slate-500">
                {summary?.name ?? "Mandant"} · Stand {formatDateCh(nowIso)}
              </p>
            </div>
          </div>
          {summary && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
              Paket: {getPackageName(summary.tier)}
            </span>
          )}
        </div>

        {/* Next actions — the most important thing, first */}
        <div className="mt-7">
          <AutopilotCard kpis={kpis} hasData={hasData} />
        </div>

        {/* Money impact */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Geld-Wirkung (CHF)
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MoneyCard
              icon={Banknote}
              label="Offene Pipeline"
              hint="Geld in offenen Offerten"
              value={kpis.pipelineOpenChf}
            />
            <MoneyCard
              icon={CheckCircle2}
              label="Gewonnen (angenommen)"
              hint="Angenommene Offerten"
              value={kpis.acceptedChf}
              accent
            />
            <MoneyCard
              icon={Briefcase}
              label="Erbracht (abgeschlossen)"
              hint="Abgeschlossene Aufträge"
              value={kpis.completedJobChf}
            />
          </div>
        </section>

        {/* KPI tiles */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Kennzahlen
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiTile
              icon={Target}
              label="Opportunities"
              value={kpis.oppsTotal}
              sub={`${kpis.oppsPromoted} übernommen`}
            />
            <KpiTile
              icon={Users}
              label="Leads"
              value={kpis.leadsTotal}
              sub={`${kpis.leadsOpen} offen`}
            />
            <KpiTile
              icon={FileText}
              label="Offerten"
              value={kpis.offersTotal}
              sub={`${kpis.offersAccepted} angenommen`}
            />
            <KpiTile
              icon={Briefcase}
              label="Aufträge"
              value={kpis.jobsTotal}
              sub={`${kpis.jobsCompleted} abgeschlossen`}
            />
            <KpiTile
              icon={PlugZap}
              label="bexio-Übergaben"
              value={kpis.handoffsTotal}
              sub={`${kpis.handoffsQueued} vorbereitet · ${kpis.handoffsCompleted} verrechnet`}
            />
          </div>
        </section>

        {/* Funnel */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Trichter
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Opportunity → Lead → Offerte → Auftrag → bexio. Mengen-Überblick mit
            Übergangsquoten (keine strikte Kohorte).
          </p>
          <FunnelRow kpis={kpis} />
        </section>

        {/* Activity last 7 days */}
        <section className="mt-8">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Activity className="h-4 w-4 text-blue-600" />
            Letzte 7 Tage
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActivityChip label="Opportunities" value={kpis.newOpps7d} />
            <ActivityChip label="Leads" value={kpis.newLeads7d} />
            <ActivityChip label="Offerten" value={kpis.newOffers7d} />
            <ActivityChip label="Aufträge" value={kpis.newJobs7d} />
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Read-only KPI-Überblick</strong> auf
            Basis Ihrer bestehenden Klarsa-Daten (RLS-gefiltert, nur Ihr Mandant).
            Keine externen Quellen, <strong className="font-semibold">keine
            KI</strong>, keine bexio-API, kein E-Mail. Die Übersicht je Modul ist
            auf die neuesten Einträge begrenzt (Fundament).
          </p>
        </div>

        {/* Future note */}
        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          Deterministischer KPI-Überblick – keine KI, keine Empfehlungen aus
          externen Modellen. Ein optionaler KI-CEO-Agent (Zusammenfassung +
          Handlungsempfehlungen mit menschlicher Freigabe) ist eine spätere,
          gesonderte Phase.
        </p>
      </main>
    </div>
  );
}

function MoneyCard({
  icon: Icon,
  label,
  hint,
  value,
  accent,
}: {
  icon: typeof Banknote;
  label: string;
  hint: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        accent
          ? "border-navy-900 bg-navy-900 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <span
        className={`inline-flex items-center gap-2 text-xs font-medium ${
          accent ? "text-blue-100" : "text-slate-500"
        }`}
      >
        <Icon className={`h-4 w-4 ${accent ? "text-blue-200" : "text-blue-600"}`} strokeWidth={2} />
        {label}
      </span>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums ${
          accent ? "text-white" : "text-navy-900"
        }`}
      >
        CHF {formatChf(value)}
      </p>
      <p className={`mt-0.5 text-xs ${accent ? "text-blue-200/80" : "text-slate-400"}`}>
        {hint}
      </p>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Target;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
        {label}
      </span>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-navy-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function ActivityChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-slate-200">
      <span className="tabular-nums text-blue-700">+{value}</span>
      {label}
    </span>
  );
}

function FunnelRow({ kpis }: { kpis: CeoKpis }) {
  const conversions = [
    kpis.oppToLeadPct,
    kpis.leadToOfferPct,
    kpis.offerToJobPct,
    kpis.jobToBexioPct,
  ];
  return (
    <div className="mt-4 flex flex-wrap items-stretch gap-2">
      {kpis.funnel.map((stage, i) => (
        <div key={stage.label} className="flex items-stretch gap-2">
          <div className="flex min-w-[5.5rem] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3">
            <span className="text-xl font-semibold tabular-nums text-navy-900">
              {stage.value}
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-slate-500">
              {stage.label}
            </span>
          </div>
          {i < kpis.funnel.length - 1 && (
            <div className="flex flex-col items-center justify-center px-0.5">
              <ChevronsRight className="h-4 w-4 text-slate-300" />
              <span className="text-[10px] font-medium tabular-nums text-slate-400">
                {conversions[i] === null ? "—" : `${conversions[i]}%`}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
