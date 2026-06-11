import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Radar,
  ArrowLeft,
  Lock,
  MapPin,
  Tag,
  Gauge,
  Target,
  ListChecks,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { NewOpportunityForm } from "@/components/lead-hunter/NewOpportunityForm";
import {
  OPPORTUNITY_TYPES,
  PROSPECT_STATUS_META,
  ACTIVE_PURSUIT_STATUSES,
  scoreBadgeClass,
} from "@/components/lead-hunter/opportunity-meta";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getProspects,
  type OpportunityListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Hunter (intern) – Klarsa",
  description:
    "Geschütztes Opportunity Radar: Tenant-Opportunities manuell erfassen und anzeigen. RLS-gefiltert, kein Scraping, keine externen Quellen.",
  robots: { index: false, follow: false },
};

export default async function AppShellLeadHunterPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, opportunities] = await Promise.all([
    getCompanySummary(companyId),
    getProspects(companyId),
  ]);

  // Radar overview aggregates (computed from the RLS-filtered list).
  const total = opportunities.length;
  const scored = opportunities.filter((o) => o.score !== null);
  const avgScore =
    scored.length > 0
      ? Math.round(scored.reduce((s, o) => s + (o.score ?? 0), 0) / scored.length)
      : null;
  const activeCount = opportunities.filter((o) =>
    ACTIVE_PURSUIT_STATUSES.includes(o.status),
  ).length;
  const typeCounts = OPPORTUNITY_TYPES.map((t) => ({
    type: t,
    count: opportunities.filter((o) => (o.category ?? "Manuell") === t).length,
  })).filter((t) => t.count > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> App-Shell
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Radar className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Lead Hunter · Opportunity Radar
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {total}
              {total >= 100 ? "+" : ""} Opportunit{total === 1 ? "y" : "ies"}
            </p>
          </div>
        </div>

        {/* No-real-data / no-scraping note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Manuelle Erfassung</strong> – kein
            automatisches Scraping, keine Google-/ZEFIX-/SIMAP-Abfrage, keine
            externen Quellen, kein Spam. Jede Opportunity wird von einem Menschen
            geprüft und erfasst. Alle Daten werden über die{" "}
            <strong className="font-semibold">RLS</strong> gefiltert und nur über
            den Session-Client geschrieben.
          </p>
        </div>

        {/* Radar overview */}
        {total > 0 && (
          <section className="mt-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard icon={Target} label="Opportunities" value={String(total)} />
              <StatCard
                icon={Gauge}
                label="Ø Score"
                value={avgScore === null ? "—" : String(avgScore)}
              />
              <StatCard
                icon={ListChecks}
                label="Aktiv verfolgt"
                value={String(activeCount)}
              />
            </div>
            {typeCounts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {typeCounts.map((t) => (
                  <span
                    key={t.type}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-slate-200"
                  >
                    <Tag className="h-3 w-3 text-blue-600" />
                    {t.type}
                    <span className="rounded-full bg-slate-100 px-1.5 tabular-nums text-slate-500">
                      {t.count}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Capture form */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Opportunity erfassen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pflichtfeld: Titel / Firma / Projekt. Übrige Felder optional.
          </p>
          <div className="mt-4">
            <NewOpportunityForm />
          </div>
        </section>

        {/* Opportunity list / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Opportunities
          </h2>
          {total === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Radar className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.8} />
              <p className="mt-2 text-sm font-medium text-navy-900">
                Noch keine Opportunities.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Erfassen Sie oben die erste Opportunity für diesen Mandanten –
                manuell, ohne externe Quellen.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {opportunities.map((op) => (
                <OpportunityRow key={op.id} op={op} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
        {label}
      </span>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-navy-900">
        {value}
      </p>
    </div>
  );
}

function OpportunityRow({ op }: { op: OpportunityListItem }) {
  const status = PROSPECT_STATUS_META[op.status] ?? PROSPECT_STATUS_META.raw;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{op.name}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreBadgeClass(op.score)}`}
          >
            Score {op.score ?? "—"}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        {op.category && (
          <span className="inline-flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            {op.category}
          </span>
        )}
        {op.region && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {op.region}
          </span>
        )}
        {op.servicePotential && (
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            {op.servicePotential}
          </span>
        )}
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          Quelle: {op.sourceType}
        </span>
      </div>

      {op.reason && (
        <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-100">
          {op.reason}
        </p>
      )}

      {op.nextAction && (
        <p className="mt-2 text-sm text-navy-800">
          <span className="font-medium text-slate-500">Nächste Aktion:</span>{" "}
          {op.nextAction}
        </p>
      )}

      <p className="mt-2 text-xs text-slate-400">
        erfasst {op.createdAt.slice(0, 10)}
      </p>
    </li>
  );
}
