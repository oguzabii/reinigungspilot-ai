import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Radar,
  Lock,
  MapPin,
  Tag,
  Gauge,
  Target,
  ListChecks,
  Library,
  ChevronRight,
  X,
  Map as MapIcon,
  Compass,
  Crosshair,
  ArrowRightToLine,
  FileText,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import {
  NewOpportunityForm,
  type OpportunitySeed,
} from "@/components/lead-hunter/NewOpportunityForm";
import {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_SOURCES,
  PROSPECT_STATUS_META,
  ACTIVE_PURSUIT_STATUSES,
  scoreBadgeClass,
} from "@/components/lead-hunter/opportunity-meta";
import { SOURCE_TYPE_META } from "@/components/lead-hunter/source-meta";
import { matchServices } from "@/components/lead-hunter/scoring";
import { PromoteOpportunityButton } from "@/components/lead-hunter/PromoteOpportunityButton";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getProspects,
  getLeadSourceById,
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

export default async function AppShellLeadHunterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const sp = await searchParams;
  const sourceParam = typeof sp.source === "string" ? sp.source : undefined;

  const [summary, opportunities, source] = await Promise.all([
    getCompanySummary(companyId),
    getProspects(companyId),
    sourceParam
      ? getLeadSourceById(companyId, sourceParam)
      : Promise.resolve(null),
  ]);

  // Seed the capture form from a registered source (manual workflow — the user
  // still confirms + saves; nothing auto-runs).
  const allowedSourceValues = OPPORTUNITY_SOURCES.map((s) => s.value as string);
  const seed: OpportunitySeed | undefined = source
    ? {
        sourceId: source.id,
        sourceLabel: source.label,
        sourceType: allowedSourceValues.includes(source.type)
          ? source.type
          : "other",
        reason:
          `Aus Quelle: ${source.label} (${SOURCE_TYPE_META[source.type].label}).` +
          (source.notes ? `\n${source.notes}` : ""),
      }
    : undefined;

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
  const highScore = opportunities.filter(
    (o) => o.score !== null && o.score >= 70,
  ).length;
  const typeCounts = OPPORTUNITY_TYPES.map((t) => ({
    type: t,
    count: opportunities.filter((o) => (o.category ?? "Manuell") === t).length,
  })).filter((t) => t.count > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Radar className="h-5 w-5" strokeWidth={2} />
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

        {/* Money-focused hero — "where are new jobs hiding?" */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-navy-900 surface-hero p-6 text-white shadow-sm sm:p-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
            <Compass className="h-3.5 w-3.5" />
            Opportunity Radar
          </p>
          <h2 className="mt-2 max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
            Wo verstecken sich Ihre nächsten Aufträge?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-100">
            Halten Sie jede reale Chance fest – aus Empfehlungen, Verwaltungen,
            Bauprojekten oder Ausschreibungen. Klarsa bewertet sie, ordnet sie der
            Region und dem passenden Service zu und führt Sie Schritt für Schritt
            zum Abschluss. Sie behalten die Kontrolle – nichts wird automatisch
            gesucht oder versendet.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="#erfassen"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-blue-50"
            >
              <Crosshair className="h-4 w-4 text-blue-600" strokeWidth={2.2} />
              Opportunity erfassen
            </Link>
            <Link
              href="/app-shell/lead-hunter/radar"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <MapIcon className="h-4 w-4" strokeWidth={2.2} />
              Schweiz-Radar öffnen
            </Link>
          </div>
        </section>

        {/* The 4-step path to revenue */}
        <section className="mt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard
              n={1}
              icon={Library}
              title="Quelle wählen"
              text="Kontrollierte Lead-Quelle aus der Registry."
              href="/app-shell/lead-hunter/sources"
              cta="Quellen-Registry"
            />
            <StepCard
              n={2}
              icon={Crosshair}
              title="Opportunity erfassen"
              text="Chance festhalten – Klarsa bewertet & ordnet zu."
              href="#erfassen"
              cta="Jetzt erfassen"
            />
            <StepCard
              n={3}
              icon={ArrowRightToLine}
              title="Lead übernehmen"
              text="Heisse Chance in den Lead Inbox holen."
              href="#opportunities"
              cta="Zur Liste"
            />
            <StepCard
              n={4}
              icon={FileText}
              title="Follow-up / Offerte"
              text="Nachfassen und Offerte vorbereiten."
              href="/app-shell/offers"
              cta="Zur Offer Engine"
            />
          </div>
        </section>

        {/* Connected tools */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/app-shell/lead-hunter/sources"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Library className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">
                Quellen-Registry
              </span>
              <span className="block text-sm text-slate-500">
                Von Menschen freigegebene Lead-Quellen – kein Scraping.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
          <Link
            href="/app-shell/lead-hunter/radar"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <MapIcon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">
                Schweiz-Radar
              </span>
              <span className="block text-sm text-slate-500">
                Chancen nach Region/Kanton – manuell, kein Kartenanbieter.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
        </section>

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
            <div className="grid gap-3 sm:grid-cols-4">
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
              <StatCard
                icon={Target}
                label="High-Score (≥70)"
                value={String(highScore)}
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

        {/* Source given but not found for this tenant — honest, non-leaking note */}
        {sourceParam && !source && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Quelle nicht gefunden (gehört nicht zum aktiven Mandanten). Sie können
            unten trotzdem manuell erfassen.
          </div>
        )}

        {/* Capture form (optionally seeded from a registered source) */}
        <section
          id="erfassen"
          className="mt-8 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            {seed ? "Opportunity aus Quelle erstellen" : "Opportunity erfassen"}
          </h2>
          {seed ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <Library className="h-4 w-4 text-blue-600" />
                Vorbereitet aus Quelle{" "}
                <strong className="font-semibold text-navy-800">
                  {seed.sourceLabel}
                </strong>
                . Felder prüfen, ergänzen und speichern.
              </p>
              <Link
                href="/app-shell/lead-hunter"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" /> Quelle entfernen
              </Link>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              Pflichtfeld: Titel / Firma / Projekt. Übrige Felder optional.
            </p>
          )}
          <div className="mt-4">
            <NewOpportunityForm seed={seed} />
          </div>
        </section>

        {/* Opportunity list / empty state */}
        <section id="opportunities" className="mt-8 scroll-mt-28">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Opportunities
          </h2>
          {total === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Radar}
                tone="ready"
                title="Noch keine Opportunities – der Radar ist bereit."
                description="Erfassen Sie oben die erste reale Chance. Klarsa bewertet sie sofort, ordnet Region und Service zu und zeigt Ihnen den nächsten Schritt."
                cta={{ label: "Erste Opportunity erfassen", href: "#erfassen" }}
              />
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

function StepCard({
  n,
  icon: Icon,
  title,
  text,
  href,
  cta,
}: {
  n: number;
  icon: typeof Library;
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
          {n}
        </span>
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
      </div>
      <p className="mt-3 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-0.5 flex-1 text-xs leading-relaxed text-slate-500">{text}</p>
      <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-blue-700">
        {cta}
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
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
  const matched = matchServices({
    name: op.name,
    category: op.category ?? "Manuell",
    region: op.region ?? "",
    servicePotential: op.servicePotential ?? "",
    sourceType: op.sourceType,
    score: op.score,
  });
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
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {op.sourceLabel && <Library className="h-3 w-3 text-blue-600" />}
          Quelle: {op.sourceLabel ?? op.sourceType}
        </span>
      </div>

      {matched.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">
            Service-Match:
          </span>
          {matched.map((svc) => (
            <span
              key={svc}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100"
            >
              <Target className="h-3 w-3" />
              {svc}
            </span>
          ))}
        </div>
      )}

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

      <div className="mt-3 border-t border-slate-100 pt-3">
        <PromoteOpportunityButton
          opportunityId={op.id}
          promoted={op.promotedLeadId !== null}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400">
        erfasst {op.createdAt.slice(0, 10)}
      </p>
    </li>
  );
}
