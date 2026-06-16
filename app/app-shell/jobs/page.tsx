import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Briefcase,
  ShieldCheck,
  Receipt,
  UserRound,
  CalendarClock,
  CalendarPlus,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { GroupStations } from "@/components/app-shell/GroupStations";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { ArchiveButton } from "@/components/app-shell/ArchiveButton";
import { JOB_STATUS_META } from "@/components/jobs/job-status";
import { JobStatusForm } from "@/components/jobs/JobStatusForm";
import { JobScheduleForm } from "@/components/jobs/JobScheduleForm";
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
    "Geschützte Auftragsliste: aus angenommenen Offerten erstellte Aufträge (Status, Termin, Kunde, Quell-Offerte). RLS-gefiltert, keine externen Integrationen.",
  robots: { index: false, follow: false },
};

/** Deterministic, SSR-safe "YYYY-MM-DD HH:mm" from an ISO string (UTC). */
function formatDateTime(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

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
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3">
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

        {/* Aufträge group navigator */}
        <div className="mt-6">
          <GroupStations group="auftraege" active="jobs" />
        </div>

        {/* Calm status note */}
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          Aufträge aus angenommenen Offerten. Status & Termin pflegen, Termin als .ics herunterladen.
        </div>

        {/* Job list / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Auftragsliste
          </h2>
          {jobs.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Briefcase}
                title="Noch keine Aufträge."
                description="Aufträge entstehen aus angenommenen Offerten. Markieren Sie eine Offerte als „Angenommen“ und erstellen Sie daraus mit einem Klick den Auftrag."
                cta={{ label: "Zur Offer Engine", href: "/app-shell/offers" }}
              />
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
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
          {job.scheduledFor
            ? `${formatDateTime(job.scheduledFor)} (UTC)`
            : "Kein Termin"}
        </span>
        {job.valueChf !== null && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 tabular-nums">
            CHF {formatChf(job.valueChf)}
          </span>
        )}
      </div>

      {/* Workflow controls (ops domain via RLS) */}
      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {/* Keyed on status so the uncontrolled select resyncs after refresh. */}
        <JobStatusForm
          key={`${job.id}:${job.status}`}
          jobId={job.id}
          currentStatus={job.status}
        />
        <JobScheduleForm jobId={job.id} hasSchedule={job.scheduledFor !== null} />
        {job.scheduledFor && (
          <a
            href={`/app-shell/jobs/${job.id}/ics`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Termin (.ics)
          </a>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          erstellt {job.createdAt.slice(0, 10)}
        </p>
        <ArchiveButton entity="job" id={job.id} />
      </div>
    </li>
  );
}
