import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Inbox,
  ArrowLeft,
  Mail,
  Phone,
  UserRound,
  Tag,
  Lock,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { NewLeadForm } from "@/components/leads/NewLeadForm";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getLeads,
  getServiceLabels,
  type LeadListItem,
} from "@/lib/auth/tenant-data";
import type { LeadStatus } from "@/lib/database-types";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Inbox (intern) – Klarsa",
  description:
    "Geschützte Lead Inbox: Tenant-Leads anzeigen und manuell erfassen. RLS-gefiltert, keine externen Integrationen.",
  robots: { index: false, follow: false },
};

const STATUS_LABELS: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: "Neu", className: "bg-blue-50 text-blue-700 ring-blue-100" },
  qualified: { label: "Qualifiziert", className: "bg-violet-50 text-violet-700 ring-violet-100" },
  offer_ready: { label: "Offerte bereit", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  offer_sent: { label: "Offerte gesendet", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  waiting_reply: { label: "Wartet", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  followup_due: { label: "Follow-up fällig", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  won: { label: "Gewonnen", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  lost: { label: "Verloren", className: "bg-rose-50 text-rose-700 ring-rose-100" },
  archived: { label: "Archiviert", className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export default async function AppShellLeadsPage() {
  // Delegate setup / no-tenant states to /app-shell (which renders them).
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, leads, serviceLabels] = await Promise.all([
    getCompanySummary(companyId),
    getLeads(companyId),
    getServiceLabels(companyId),
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
            <Inbox className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Lead Inbox
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {leads.length} Lead
              {leads.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* No-real-data / RLS note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            Manuelle Erfassung – <strong className="font-semibold">keine
            externen Integrationen</strong> (kein Scraping, keine E-Mail-Anbindung).
            Alle Leads werden über die <strong className="font-semibold">RLS</strong>{" "}
            gefiltert und nur über den Session-Client geschrieben.
          </p>
        </div>

        {/* Create form */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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

        {/* List / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Leads
          </h2>
          {leads.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Inbox className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.8} />
              <p className="mt-2 text-sm font-medium text-navy-900">
                Noch keine Leads.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Erfassen Sie oben den ersten Lead für diesen Mandanten.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function LeadRow({ lead }: { lead: LeadListItem }) {
  const status = STATUS_LABELS[lead.status] ?? STATUS_LABELS.new;
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

      <p className="mt-2 text-xs text-slate-400">
        Quelle: {lead.sourceType} · erfasst {lead.createdAt.slice(0, 10)}
      </p>
    </li>
  );
}
