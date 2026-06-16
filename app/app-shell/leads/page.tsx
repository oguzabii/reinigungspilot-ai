import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Inbox,
  Mail,
  Phone,
  UserRound,
  Tag,
  ShieldCheck,
  BellRing,
  CalendarClock,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { ArchiveButton } from "@/components/app-shell/ArchiveButton";
import { NewLeadForm } from "@/components/leads/NewLeadForm";
import { NewFollowupForm } from "@/components/leads/NewFollowupForm";
import { LeadStatusForm } from "@/components/leads/LeadStatusForm";
import {
  LEAD_STATUS_META,
  FOLLOWUP_STATUS_META,
  FOLLOWUP_STAGE_LABELS,
} from "@/components/leads/lead-status";
import type {
  FollowupStage as StageKey,
  FollowupTaskStatus as FuStatusKey,
} from "@/lib/database-types";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getLeads,
  getServiceLabels,
  getFollowups,
  type LeadListItem,
  type FollowupListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Inbox (intern) – Klarsa",
  description:
    "Geschützte Lead Inbox: Tenant-Leads anzeigen, Status pflegen, Follow-ups planen. RLS-gefiltert, keine externen Integrationen.",
  robots: { index: false, follow: false },
};

/** Deterministic, SSR-safe "YYYY-MM-DD HH:mm" from an ISO string (UTC). */
function formatDateTime(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

export default async function AppShellLeadsPage() {
  // Delegate setup / no-tenant states to /app-shell (which renders them).
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, leads, serviceLabels, followups] = await Promise.all([
    getCompanySummary(companyId),
    getLeads(companyId),
    getServiceLabels(companyId),
    getFollowups(companyId),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Inbox className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Lead Inbox
            </h1>
            <p className="text-sm text-slate-500">
              {/* "+" = list is capped; real total may be higher (finding F8). */}
              {summary?.name ?? "Mandant"} · {leads.length}
              {leads.length >= 200 ? "+" : ""} Lead
              {leads.length === 1 ? "" : "s"} · {followups.length}
              {followups.length >= 100 ? "+" : ""} Follow-up
              {followups.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Calm status note */}
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          Ihre Leads – nur Ihr Betrieb. Erfassen, Status pflegen und Follow-ups planen.
        </div>

        {/* Create lead */}
        <section
          id="neuer-lead"
          className="mt-8 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Neuen Lead erfassen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pflichtfeld: Firma / Name. Übrige Felder optional.
          </p>
          <div className="mt-4">
            <NewLeadForm serviceSuggestions={serviceLabels} />
          </div>
        </section>

        {/* Lead list / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Leads
          </h2>
          {leads.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Inbox}
                tone="ready"
                title="Noch keine Leads."
                description="Übernehmen Sie heisse Chancen aus dem Lead Hunter oder erfassen Sie oben direkt den ersten Lead. Jeder Lead ist ein möglicher Auftrag."
                cta={{ label: "Ersten Lead erfassen", href: "#neuer-lead" }}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </ul>
          )}
        </section>

        {/* Follow-ups */}
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-blue-600" strokeWidth={2} />
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">
              Follow-ups
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manuell geplante Aufgaben – kein automatischer Versand. Sortiert nach
            Fälligkeit.
          </p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-sm font-semibold text-navy-900">
              Follow-up erstellen
            </h3>
            <div className="mt-3">
              <NewFollowupForm
                leads={leads.map((l) => ({ id: l.id, name: l.companyName }))}
              />
            </div>
          </div>

          {followups.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={BellRing}
                title="Noch keine Follow-ups."
                description="Planen Sie oben das erste Follow-up zu einem Lead – ein klarer nächster Schritt sorgt dafür, dass keine Chance liegen bleibt."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {followups.map((fu) => (
                <FollowupRow key={fu.id} fu={fu} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function LeadRow({ lead }: { lead: LeadListItem }) {
  const status = LEAD_STATUS_META[lead.status] ?? LEAD_STATUS_META.new;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{lead.companyName}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        {lead.contactName && (
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-slate-400" />
            {lead.contactName}
          </span>
        )}
        {lead.email && (
          <span className="inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {lead.email}
          </span>
        )}
        {lead.phone && (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {lead.phone}
          </span>
        )}
        {lead.serviceInterest && (
          <span className="inline-flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-slate-400" />
            {lead.serviceInterest}
          </span>
        )}
      </div>

      {lead.notes && (
        <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-100">
          {lead.notes}
        </p>
      )}

      {/* Keyed on status so the uncontrolled select resyncs after refresh (F11). */}
      <LeadStatusForm
        key={`${lead.id}:${lead.status}`}
        leadId={lead.id}
        currentStatus={lead.status}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          erfasst {lead.createdAt.slice(0, 10)}
        </p>
        <ArchiveButton entity="lead" id={lead.id} />
      </div>
    </li>
  );
}

function FollowupRow({ fu }: { fu: FollowupListItem }) {
  const status =
    FOLLOWUP_STATUS_META[fu.status as FuStatusKey] ?? FOLLOWUP_STATUS_META.planned;
  const stageLabel = FOLLOWUP_STAGE_LABELS[fu.stage as StageKey] ?? fu.stage;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{fu.note ?? "Follow-up"}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
          fällig {formatDateTime(fu.dueAt)} (UTC)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Inbox className="h-3.5 w-3.5 text-slate-400" />
          {fu.leadName ?? "—"}
        </span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          Stufe: {stageLabel}
        </span>
        {fu.channel && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {fu.channel}
          </span>
        )}
      </div>
      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
        <ArchiveButton entity="followup" id={fu.id} label="Nicht relevant" />
      </div>
    </li>
  );
}
