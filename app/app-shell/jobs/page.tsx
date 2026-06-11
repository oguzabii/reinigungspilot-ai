import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Briefcase,
  ArrowLeft,
  Lock,
  Receipt,
  UserRound,
  CalendarClock,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { JOB_STATUS_META } from "@/components/jobs/job-status";
import { formatChf } from "@/components/offers/offer-status";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getJobs,
  type JobListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aufträge (intern) – Klarsa",
  description:
    "Geschützte Auftragsliste: aus angenommenen Offerten erstellte Aufträge (Status, Kunde, Quell-Offerte). RLS-gefiltert, keine externen Integrationen.",
  robots: { index: false, follow: false },
};

export default async function AppShellJobsPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, jobs] = await Promise.all([
    getCompanySummary(companyId),
    getJobs(companyId),
  ]);

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
            <Briefcase className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Aufträge
            </h1>
            <p className="text-sm text-slate-500">
              {/* "+" = list is capped; real total may be higher. */}
              {summary?.name ?? "Mandant"} · {jobs.length}
              {jobs.length >= 100 ? "+" : ""} Auftr{jobs.length === 1 ? "ag" : "äge"}
            </p>
          </div>
        </div>

        {/* No-real-data / scope note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            Aufträge werden manuell aus <strong className="font-semibold">angenommenen
            Offerten</strong> erstellt – <strong className="font-semibold">kein
            Kalender, keine E-Mail, keine bexio-Übergabe</strong> (noch). Alle
            Daten werden über die <strong className="font-semibold">RLS</strong>{" "}
            gefiltert und nur über den Session-Client geschrieben.
          </p>
        </div>

        {/* Job list / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Auftragsliste
          </h2>
          {jobs.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.8} />
              <p className="mt-2 text-sm font-medium text-navy-900">
                Noch keine Aufträge.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Erstellen Sie einen Auftrag aus einer angenommenen Offerte in der{" "}
                <Link href="/app-shell/offers" className="font-medium text-blue-700 hover:text-blue-800">
                  Offer Engine
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function JobRow({ job }: { job: JobListItem }) {
  const status = JOB_STATUS_META[job.status] ?? JOB_STATUS_META.planned;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{job.title}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 text-slate-400" />
          {job.customerName ?? "Ohne Kunde"}
        </span>
        {job.offerReference && (
          <span className="inline-flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-slate-400" />
            aus Offerte {job.offerReference}
          </span>
        )}
        {job.scheduledFor && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
            {job.scheduledFor.slice(0, 10)}
          </span>
        )}
        {job.valueChf !== null && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 tabular-nums">
            CHF {formatChf(job.valueChf)}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        erstellt {job.createdAt.slice(0, 10)}
      </p>
    </li>
  );
}
