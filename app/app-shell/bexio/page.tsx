import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  PlugZap,
  Lock,
  CheckCircle2,
  ListChecks,
  Receipt,
  Building2,
  MapPin,
  CalendarDays,
  Info,
  ShieldCheck,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { GroupStations } from "@/components/app-shell/GroupStations";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { formatChf } from "@/components/offers/offer-status";
import {
  HANDOFF_STATUS_META,
  READY_JOB_STATUS,
} from "@/components/bexio/handoff-meta";
import { PrepareHandoffButton } from "@/components/bexio/PrepareHandoffButton";
import { MarkInvoicedButton } from "@/components/bexio/MarkInvoicedButton";
import { HandoffSummary } from "@/components/bexio/HandoffSummary";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getInvoiceHandoffJobs,
  type HandoffJobItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "bexio-Übergabe (intern) – Klarsa",
  description:
    "Manuelle bexio-/Rechnungs-Übergabe für abgeschlossene Aufträge. Keine API-Verbindung, keine automatische Rechnungserstellung.",
  robots: { index: false, follow: false },
};

/** Net/VAT/gross + reference for the summary: stored handoff > offer > value. */
function amountsFor(j: HandoffJobItem): {
  net: number;
  vat: number;
  gross: number;
  ref: string | null;
} {
  if (j.handoff) {
    return {
      net: j.handoff.netChf,
      vat: j.handoff.vatRatePct,
      gross: j.handoff.grossChf,
      ref: j.handoff.invoiceDraftRef ?? j.offerReference,
    };
  }
  if (j.offerGrossChf !== null && j.offerGrossChf > 0) {
    return {
      net: j.offerNetChf ?? 0,
      vat: j.offerVatRatePct ?? 8.1,
      gross: j.offerGrossChf,
      ref: j.offerReference,
    };
  }
  const gross = j.valueChf ?? 0;
  const vat = 8.1;
  return {
    net: Math.round((gross / (1 + vat / 100)) * 100) / 100,
    vat,
    gross,
    ref: j.offerReference,
  };
}

export default async function AppShellBexioPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const activeRole =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  // bexio = the manage domain (`can_manage_company`): owner/admin only.
  const canManage = activeRole === "owner" || activeRole === "admin";

  const [summary, jobs] = await Promise.all([
    getCompanySummary(companyId),
    getInvoiceHandoffJobs(companyId),
  ]);

  const ready = jobs.filter((j) => j.status === READY_JOB_STATUS && !j.handoff);
  const prepared = jobs.filter(
    (j) => j.handoff && j.handoff.status !== "completed",
  );
  const invoiced = jobs.filter(
    (j) => j.handoff && j.handoff.status === "completed",
  );
  const notReady = jobs.filter(
    (j) => j.status !== READY_JOB_STATUS && !j.handoff,
  ).length;
  const preparedTotal = prepared.reduce(
    (s, j) => s + (j.handoff?.grossChf ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <PlugZap className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              bexio-Übergabe · Rechnungs-Vorbereitung
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {ready.length} bereit ·{" "}
              {prepared.length} vorbereitet · {invoiced.length} verrechnet
            </p>
          </div>
        </div>

        {/* Aufträge group navigator */}
        <div className="mt-6">
          <GroupStations group="auftraege" active="bexio" />
        </div>

        {/* Honest no-API note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Manuelle bexio-Übergabe, keine
            API-Verbindung.</strong>{" "}
            Es werden <strong className="font-semibold">keine</strong> Rechnungen
            automatisch erstellt und nichts an bexio übermittelt. Diese Ansicht
            bereitet die Rechnungs-/Kundendaten abgeschlossener Aufträge zum{" "}
            <strong className="font-semibold">manuellen</strong> Erfassen vor. Kein
            bexio-Token, kein Netzwerkaufruf. Alles RLS-gefiltert, nur über den
            Session-Client.
          </p>
        </div>

        {/* Overview */}
        <section className="mt-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={ListChecks} label="Bereit zur Übergabe" value={String(ready.length)} />
            <StatCard icon={PlugZap} label="Vorbereitet" value={String(prepared.length)} />
            <StatCard icon={Receipt} label="Verrechnet" value={String(invoiced.length)} />
          </div>
        </section>

        {!canManage && (
          <section className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-sm leading-relaxed text-slate-600">
              Nur <strong className="font-medium text-navy-800">Inhaber</strong>{" "}
              oder <strong className="font-medium text-navy-800">Admin</strong>{" "}
              dürfen Übergaben vorbereiten oder als verrechnet markieren. Sie
              können die Übersicht und die Zusammenfassungen ansehen.
            </p>
          </section>
        )}

        {/* Ready for handoff */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Bereit zur Übergabe
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Abgeschlossene Aufträge ohne bexio-Übergabe.
          </p>
          {ready.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Receipt}
                title="Keine abgeschlossenen Aufträge bereit."
                description="Sobald ein Auftrag auf „Abgeschlossen“ steht, erscheint er hier zur Rechnungs-Vorbereitung. Verdientes Geld zeitnah verrechnen sichert Ihren Umsatz."
                cta={{ label: "Zu den Aufträgen", href: "/app-shell/jobs" }}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {ready.map((j) => (
                <HandoffRow key={j.id} job={j} canManage={canManage} />
              ))}
            </ul>
          )}
          {notReady > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              {notReady} weitere{notReady === 1 ? "r Auftrag" : " Aufträge"} noch
              nicht abgeschlossen – erst nach Abschluss bereit.
            </p>
          )}
        </section>

        {/* Prepared + invoiced */}
        {(prepared.length > 0 || invoiced.length > 0) && (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-navy-900">
                Vorbereitet &amp; verrechnet
              </h2>
              {preparedTotal > 0 && (
                <span className="text-xs text-slate-500">
                  Vorbereiteter Betrag: CHF {formatChf(preparedTotal)}
                </span>
              )}
            </div>
            <ul className="mt-3 space-y-3">
              {[...prepared, ...invoiced].map((j) => (
                <HandoffRow key={j.id} job={j} canManage={canManage} />
              ))}
            </ul>
          </section>
        )}

        {/* Future phase note */}
        <section className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-medium text-navy-800">Spätere Phase</strong>{" "}
            (separat, gesondert freizugeben): echte bexio-Anbindung (OAuth,
            verschlüsselte Tokens, automatischer Rechnungsentwurf). Bis dahin
            bleibt die Übergabe manuell und ohne API-Aufruf.
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
  icon: typeof Receipt;
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

function HandoffRow({
  job,
  canManage,
}: {
  job: HandoffJobItem;
  canManage: boolean;
}) {
  const a = amountsFor(job);
  const statusMeta = job.handoff
    ? HANDOFF_STATUS_META[job.handoff.status]
    : { label: "Bereit", className: "bg-blue-50 text-blue-700 ring-blue-200" };
  const jobDate = (job.scheduledFor ?? job.createdAt).slice(0, 10);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">
            {job.customerName ?? job.title}
          </p>
          {job.customerName && (
            <p className="text-sm text-slate-500">{job.title}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-navy-700">
            CHF {formatChf(a.gross)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        {job.serviceInterest && (
          <span className="inline-flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5 text-slate-400" />
            {job.serviceInterest}
          </span>
        )}
        {(job.location || job.customerRegion) && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {[job.location, job.customerRegion].filter(Boolean).join(", ")}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          {jobDate}
        </span>
        {a.ref && (
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            {a.ref}
          </span>
        )}
      </div>

      <HandoffSummary
        customerName={job.customerName}
        customerContact={job.customerContact}
        customerEmail={job.customerEmail}
        customerPhone={job.customerPhone}
        customerRegion={job.customerRegion}
        service={job.serviceInterest ?? job.title}
        location={job.location}
        jobDate={job.scheduledFor ?? job.createdAt}
        reference={a.ref}
        netChf={a.net}
        vatRatePct={a.vat}
        grossChf={a.gross}
      />

      {canManage && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {!job.handoff ? (
            <PrepareHandoffButton jobId={job.id} />
          ) : job.handoff.status !== "completed" ? (
            <MarkInvoicedButton handoffId={job.handoff.id} />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verrechnet
            </span>
          )}
        </div>
      )}
    </li>
  );
}
