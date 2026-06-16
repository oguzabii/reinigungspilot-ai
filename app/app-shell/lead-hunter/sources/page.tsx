import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Library,
  ListChecks,
  Power,
  ShieldCheck,
  Info,
  Crosshair,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { GroupStations } from "@/components/app-shell/GroupStations";
import { NewSourceForm } from "@/components/lead-hunter/NewSourceForm";
import {
  SOURCE_TYPE_META,
  SOURCE_PHASE_META,
  phaseFor,
  enabledBadge,
  type SourcePhase,
} from "@/components/lead-hunter/source-meta";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getLeadSources,
  type LeadSourceListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Hunter · Quellen-Registry (intern) – Klarsa",
  description:
    "Geschützte Quellen-Registry: kontrollierte, von Menschen freigegebene Lead-Quellen verwalten. RLS-gefiltert, kein Scraping, keine externen Abfragen.",
  robots: { index: false, follow: false },
};

export default async function AppShellLeadSourcesPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const activeRole =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  // SETTINGS domain (`can_write_settings`): only owner/admin may register.
  const canManage = activeRole === "owner" || activeRole === "admin";

  const [summary, sources] = await Promise.all([
    getCompanySummary(companyId),
    getLeadSources(companyId),
  ]);

  const total = sources.length;
  const activeCount = sources.filter((s) => s.enabled).length;
  const phaseCounts = (
    ["manual", "future_api", "future_registry"] as SourcePhase[]
  )
    .map((p) => ({
      phase: p,
      count: sources.filter((s) => phaseFor(s.type) === p).length,
    }))
    .filter((p) => p.count > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Library className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Lead Hunter · Quellen-Registry
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {total} Quelle
              {total === 1 ? "" : "n"}
            </p>
          </div>
        </div>

        {/* Chancen group navigator */}
        <div className="mt-6">
          <GroupStations group="chancen" active="sources" />
        </div>

        {/* Calm status note */}
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          Von Ihnen freigegebene Quellen – die Basis für die Discovery.
        </div>

        {/* Overview */}
        {total > 0 && (
          <section className="mt-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard icon={Library} label="Quellen" value={String(total)} />
              <StatCard
                icon={Power}
                label="Aktiv"
                value={String(activeCount)}
              />
              <StatCard
                icon={ListChecks}
                label="Inaktiv"
                value={String(total - activeCount)}
              />
            </div>
            {phaseCounts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {phaseCounts.map(({ phase, count }) => {
                  const meta = SOURCE_PHASE_META[phase];
                  return (
                    <span
                      key={phase}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${meta.className}`}
                    >
                      {meta.label}
                      <span className="rounded-full bg-white/70 px-1.5 tabular-nums">
                        {count}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Create form (owner/admin) or read-only hint */}
        {canManage ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">
              Quelle registrieren
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pflichtfeld: Bezeichnung. Wählen Sie eine Vorlage oder erfassen Sie
              frei – jede Quelle wird von einem Menschen freigegeben.
            </p>
            <div className="mt-4">
              <NewSourceForm />
            </div>
          </section>
        ) : (
          <section className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-sm leading-relaxed text-slate-600">
              Nur <strong className="font-medium text-navy-800">Inhaber</strong>{" "}
              oder <strong className="font-medium text-navy-800">Admin</strong>{" "}
              dürfen Quellen verwalten. Sie können die Registry ansehen, aber
              keine Quelle anlegen.
            </p>
          </section>
        )}

        {/* List / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Registrierte Quellen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Aus jeder Quelle lässt sich manuell eine Opportunity vorbereiten –
            kein automatisches Auslesen, keine externe Abfrage.
          </p>
          {total === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Library
                className="mx-auto h-8 w-8 text-slate-300"
                strokeWidth={1.8}
              />
              <p className="mt-2 text-sm font-medium text-navy-900">
                Noch keine Quellen registriert.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {canManage
                  ? "Registrieren Sie oben die erste kontrollierte Quelle – manuell, ohne externe Abfrage."
                  : "Ein Inhaber/Admin kann hier die erste kontrollierte Quelle registrieren."}
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {sources.map((src) => (
                <SourceRow key={src.id} src={src} />
              ))}
            </ul>
          )}
        </section>

        {/* Future phases note */}
        <section className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-medium text-navy-800">Spätere Phasen</strong>{" "}
            (separat, gesondert freizugeben): Google/Maps-API, ZEFIX-/
            Handelsregister-Validierung, SIMAP-Ausschreibungen. Bis dahin bleibt
            jede Quelle manuell und ohne automatische Abfrage.
          </p>
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
  icon: typeof Library;
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

function SourceRow({ src }: { src: LeadSourceListItem }) {
  const typeMeta = SOURCE_TYPE_META[src.type] ?? SOURCE_TYPE_META.manual;
  const phaseMeta = SOURCE_PHASE_META[phaseFor(src.type)];
  const active = enabledBadge(src.enabled);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{src.label}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${active.className}`}
          >
            {active.label}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${phaseMeta.className}`}
          >
            {phaseMeta.label}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          Typ: {typeMeta.label}
        </span>
      </div>

      {src.notes && (
        <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-100">
          {src.notes}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/app-shell/lead-hunter/sources/${src.id}/execute`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
          >
            <ListChecks className="h-3.5 w-3.5" />
            Quelle abarbeiten
          </Link>
          <Link
            href={`/app-shell/lead-hunter?source=${src.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Opportunity vorbereiten
          </Link>
        </div>
        <span className="text-xs text-slate-400">
          registriert {src.createdAt.slice(0, 10)}
        </span>
      </div>
    </li>
  );
}
