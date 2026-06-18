import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Library,
  ListChecks,
  Power,
  ShieldCheck,
  Info,
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { ArchiveButton } from "@/components/app-shell/ArchiveButton";
import { NewSourceForm } from "@/components/lead-hunter/NewSourceForm";
import { SOURCE_TYPE_META, enabledBadge } from "@/components/lead-hunter/source-meta";
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
  title: "Lead-Quellen (intern) – Klarsa",
  description:
    "Ihre Lead-Quellen verwalten: Kanäle, über die Sie Leads gewinnen. Manuelle Kanäle sind sofort nutzbar; automatische Quellen (Google/Baugesuche/SIMAP/ZEFIX) verbinden Sie in den Einstellungen.",
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
  const canManage = activeRole === "owner" || activeRole === "admin";

  const [summary, sources] = await Promise.all([
    getCompanySummary(companyId),
    getLeadSources(companyId),
  ]);

  const total = sources.length;
  const readyCount = sources.filter((s) => s.enabled).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell/lead-hunter/radar"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Zum Lead Radar
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Library className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Lead-Quellen
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {total} Kanal{total === 1 ? "" : "e"}
            </p>
          </div>
        </div>

        {/* Calm status note */}
        <div className="mt-6 flex items-start gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Manuelle Kanäle, über die Sie Leads gewinnen – sofort nutzbar, keine
            Automatik. Automatische Quellen (Google, Baugesuche, SIMAP, ZEFIX)
            verbinden Sie in den{" "}
            <Link href="/app-shell/settings" className="font-medium text-blue-700 hover:text-blue-800">
              Einstellungen
            </Link>{" "}
            und sehen sie im{" "}
            <Link href="/app-shell/lead-hunter/radar" className="font-medium text-blue-700 hover:text-blue-800">
              Lead Radar
            </Link>
            .
          </span>
        </div>

        {/* Overview */}
        {total > 0 && (
          <section className="mt-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard icon={Library} label="Kanäle" value={String(total)} />
              <StatCard icon={Power} label="Bereit" value={String(readyCount)} />
              <StatCard icon={ListChecks} label="Inaktiv" value={String(total - readyCount)} />
            </div>
          </section>
        )}

        {/* Create form (owner/admin) or read-only hint */}
        {canManage ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">
              Lead-Quelle hinzufügen
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pflichtfeld: Bezeichnung. Wählen Sie eine Vorlage oder erfassen Sie
              frei.
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
              dürfen Lead-Quellen verwalten. Sie können die Liste ansehen.
            </p>
          </section>
        )}

        {/* List / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Ihre Lead-Quellen
          </h2>
          {total === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Library className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.8} />
              <p className="mt-2 text-sm font-medium text-navy-900">
                Noch keine Lead-Quellen.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {canManage
                  ? "Fügen Sie oben den ersten Kanal hinzu – z. B. Empfehlung, Verwaltung oder Website-Anfrage."
                  : "Ein Inhaber/Admin kann hier den ersten Kanal hinzufügen."}
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
  const badge = enabledBadge(src.enabled);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{src.label}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {typeMeta.label}
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
            Quelle prüfen
          </Link>
          <Link
            href={`/app-shell/lead-hunter?source=${src.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Lead erfassen
          </Link>
        </div>
        <ArchiveButton entity="source" id={src.id} label="Quelle archivieren" />
      </div>
    </li>
  );
}
