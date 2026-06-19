import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Workflow,
  FilePlus2,
  FilePenLine,
  Sparkles,
  MapPin,
  Library,
  Mail,
  Phone,
  Globe,
  UserRound,
  Receipt,
  Download,
  BellRing,
  CalendarPlus,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { ArchiveButton } from "@/components/app-shell/ArchiveButton";
import { StatusStrip } from "@/components/app-shell/StatusStrip";
import { salesStageStats } from "@/components/app-shell/sales-flow";
import { isPremiumExperience } from "@/components/app-shell/autopilot-tier";
import { EnrichContactButton } from "@/app/app-shell/revenue-autopilot/outreach/EnrichContactButton";
import { SendEmailButton } from "@/app/app-shell/revenue-autopilot/outreach/SendEmailButton";
import { CandidatePipelineButtons } from "@/components/lead-hunter/CandidatePipelineButtons";
import { LeadStatusForm } from "@/components/leads/LeadStatusForm";
import { FollowupSequence, type SeqStep } from "@/components/leads/FollowupSequence";
import { CreateJobButton } from "@/components/offers/CreateJobButton";
import { FocusScroller } from "./FocusScroller";
import { JOB_STATUS_META } from "@/components/jobs/job-status";
import { LEAD_STATUS_META, FOLLOWUP_STAGE_LABELS } from "@/components/leads/lead-status";
import { OFFER_STATUS_META, formatChf } from "@/components/offers/offer-status";
import { scoreToneBadge } from "@/components/lead-hunter/swiss-radar";
import type { FollowupStage as StageKey } from "@/lib/database-types";
import { computeCeoKpis } from "@/components/ceo/kpi";
import { isSendConfigured } from "@/lib/outreach/send-provider";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getProspects,
  getLeads,
  getOffers,
  getFollowups,
  getJobs,
  getInvoiceHandoffJobs,
  type OpportunityListItem,
  type LeadListItem,
  type OfferListItem,
  type FollowupListItem,
  type JobListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pipeline (intern) – Klarsa",
  description:
    "Eine Fläche von der Chance bis zum Auftrag: Lead → Kontakt → Offerte → Follow-up → Auftrag. RLS-gefiltert, kein automatischer Versand.",
  robots: { index: false, follow: false },
};

const PRE_PROMO = new Set<string>(["raw", "scored", "approved"]);
const OPEN_FOLLOWUP = new Set<string>(["planned", "due", "overdue"]);

export default async function AppShellPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  // Deep-link focus: ?focus=lead:<id> | followups
  const focusRaw = (await searchParams).focus ?? "";
  const focusedLeadId = focusRaw.startsWith("lead:") ? focusRaw.slice(5) : null;
  const focusTargetId = focusedLeadId
    ? `lead-${focusedLeadId}`
    : focusRaw === "followups"
      ? "leads"
      : "";

  const [summary, prospects, leads, offers, followups, jobs, handoffJobs] =
    await Promise.all([
      getCompanySummary(companyId),
      getProspects(companyId),
      getLeads(companyId),
      getOffers(companyId),
      getFollowups(companyId),
      getJobs(companyId),
      getInvoiceHandoffJobs(companyId),
    ]);

  const nowIso = new Date().toISOString();
  const kpis = computeCeoKpis({
    opportunities: prospects,
    leads,
    offers,
    jobs,
    handoffJobs,
    followupLeadIds: followups.map((f) => f.leadId),
    nowIso,
  });

  const stats = salesStageStats({
    prospects,
    leads,
    offers,
    followups,
    jobs,
    bexioReady: kpis.attnJobsNotHandedOff,
  });

  // Candidates (pre-promotion), most interesting first. Capped for a calm page.
  const candidates = prospects
    .filter((p) => p.promotedLeadId === null && PRE_PROMO.has(p.status))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const candidatesShown = candidates.slice(0, 24);

  // Per-lead offer + follow-up lookups (offers/followups are already newest-first).
  const offersByLead = new Map<string, OfferListItem[]>();
  for (const o of offers) {
    if (!o.leadId) continue;
    const arr = offersByLead.get(o.leadId) ?? [];
    arr.push(o);
    offersByLead.set(o.leadId, arr);
  }
  const followupsByLead = new Map<string, FollowupListItem[]>();
  for (const f of followups) {
    if (!OPEN_FOLLOWUP.has(f.status)) continue;
    const arr = followupsByLead.get(f.leadId) ?? [];
    arr.push(f);
    followupsByLead.set(f.leadId, arr);
  }

  // All non-skipped follow-ups per lead = the sequence steps (planned/due/done).
  const seqByLead = new Map<string, SeqStep[]>();
  for (const f of followups) {
    const arr = seqByLead.get(f.leadId) ?? [];
    arr.push({ stage: f.stage, status: f.status, dueAt: f.dueAt });
    seqByLead.set(f.leadId, arr);
  }

  // Focus deep-link: bring the focused lead to the top.
  const orderedLeads = focusedLeadId
    ? [...leads.filter((l) => l.id === focusedLeadId), ...leads.filter((l) => l.id !== focusedLeadId)]
    : leads;

  // Send eligibility: Premium experience + a configured channel (per card we
  // also require a stored email). The button itself enforces this server-side.
  const canSend =
    isPremiumExperience(summary?.tier ?? "starter", summary?.billingStatus) &&
    isSendConfigured();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      {focusTargetId && <FocusScroller targetId={focusTargetId} />}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Workflow className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
                Pipeline
              </h1>
              <p className="text-sm text-slate-500">
                {summary?.name ?? "Mandant"} · von der Chance bis zum Auftrag –
                auf einer Fläche.
              </p>
            </div>
          </div>
          <Link
            href="/app-shell/offers/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
          >
            <FilePlus2 className="h-4 w-4" strokeWidth={2.2} />
            Neue Offerte erstellen
          </Link>
        </div>

        {/* Status strip — six plain-language stages */}
        <div className="mt-6">
          <StatusStrip stats={stats} />
        </div>

        {/* Stage 1–3 — discovered candidates (find lead → contact → first email) */}
        <section id="chancen" className="mt-10 scroll-mt-28">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" strokeWidth={2} />
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">
              Neue Chancen
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Gefundene Firmen mit Bewertung. Kontakt finden, erste E-Mail senden
            oder in die Pipeline übernehmen.
          </p>
          {candidatesShown.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Sparkles}
                tone="ready"
                title="Noch keine offenen Chancen."
                description="Lassen Sie Klarsa passende Firmen finden – die Quellen und das „Warum“ sehen Sie im Lead Radar."
                cta={{ label: "Zum Lead Radar", href: "/app-shell/lead-hunter/radar" }}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {candidatesShown.map((p) => (
                <CandidateCard key={p.id} prospect={p} canSend={canSend} />
              ))}
            </ul>
          )}
          {candidates.length > candidatesShown.length && (
            <p className="mt-3 text-xs text-slate-400">
              {candidates.length - candidatesShown.length} weitere Chancen – im{" "}
              <Link href="/app-shell/lead-hunter/radar" className="font-medium text-blue-700 hover:text-blue-800">
                Lead Radar
              </Link>{" "}
              sichtbar.
            </p>
          )}
        </section>

        {/* Stage 3–5 — leads with their offer + follow-up status */}
        <section id="leads" className="mt-10 scroll-mt-28">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-blue-600" strokeWidth={2} />
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">
              Leads &amp; Offerten
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Kunden in Bearbeitung – Status, Offerte und Follow-up auf einen Blick.
          </p>
          {leads.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={UserRound}
                title="Noch keine Leads."
                description="Übernehmen Sie oben eine Chance in die Pipeline – oder erstellen Sie direkt eine Offerte für einen neuen Kunden."
                cta={{ label: "Neue Offerte erstellen", href: "/app-shell/offers/new" }}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {orderedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  offers={offersByLead.get(lead.id) ?? []}
                  followups={followupsByLead.get(lead.id) ?? []}
                  seqSteps={seqByLead.get(lead.id) ?? []}
                  canSend={canSend}
                  focused={lead.id === focusedLeadId}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Stage 6 — won jobs with their documents (PDF wiring) */}
        {jobs.length > 0 && (
          <section id="auftraege" className="mt-10 scroll-mt-28">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" strokeWidth={2} />
              <h2 className="text-lg font-semibold tracking-tight text-navy-900">
                Gewonnen · Aufträge
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Dokumente herunterladen und zur Verrechnung an bexio übergeben.
            </p>
            <ul className="mt-3 space-y-3">
              {jobs.slice(0, 12).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </ul>
          </section>
        )}

        {/* Calm guardrail note */}
        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            Eine Fläche für den ganzen Ablauf – nur Ihr Betrieb. Klarsa schlägt
            vor; gesendet, gebucht oder verrechnet wird nichts automatisch –
            jeden Schritt bestätigen Sie selbst.
          </p>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Candidate card (Lead gefunden → Kontakt → Erstkontakt)                      */
/* -------------------------------------------------------------------------- */

function CandidateCard({
  prospect: p,
  canSend,
}: {
  prospect: OpportunityListItem;
  canSend: boolean;
}) {
  const source = p.sourceLabel ?? sourceTypeLabel(p.sourceType);
  const hasContact = Boolean(p.contactEmail || p.contactPhone || p.contactWebsite);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{p.name}</p>
        {p.score !== null && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreToneBadge(p.score)}`}
          >
            Score {p.score}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        {p.region && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {p.region}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Library className="h-3.5 w-3.5 text-slate-400" />
          {source}
        </span>
      </div>

      {/* Why interesting — scoring embedded in the card (no separate tab) */}
      {p.reason && (
        <p className="mt-2 rounded-lg bg-blue-50/60 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-blue-100">
          {p.reason}
        </p>
      )}

      {/* Contact status */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {hasContact ? (
          <>
            {p.contactEmail && (
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Mail className="h-3.5 w-3.5 text-emerald-600" />
                {p.contactEmail}
              </span>
            )}
            {p.contactPhone && (
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Phone className="h-3.5 w-3.5 text-emerald-600" />
                {p.contactPhone}
              </span>
            )}
            {p.contactWebsite && (
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                Website
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-amber-700">Kontakt fehlt</span>
        )}
      </div>

      {/* Actions — Kontakt finden · E-Mail · In Pipeline / Offerte vorbereiten */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <EnrichContactButton prospectId={p.id} />
        {canSend && p.contactEmail && (
          <SendEmailButton prospectId={p.id} sent={p.status === "contacted"} />
        )}
        <CandidatePipelineButtons prospectId={p.id} />
        <span className="ml-auto">
          <ArchiveButton entity="prospect" id={p.id} />
        </span>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Lead card (Lead → Offerte → Follow-up → Auftrag)                            */
/* -------------------------------------------------------------------------- */

function LeadCard({
  lead,
  offers,
  followups,
  seqSteps,
  canSend,
  focused,
}: {
  lead: LeadListItem;
  offers: OfferListItem[];
  followups: FollowupListItem[];
  seqSteps: SeqStep[];
  canSend: boolean;
  focused: boolean;
}) {
  const status = LEAD_STATUS_META[lead.status] ?? LEAD_STATUS_META.new;
  const offer = offers[0] ?? null; // newest offer for this lead
  const offerMeta = offer ? OFFER_STATUS_META[offer.status] : null;
  const acceptedNoJob = offers.find((o) => o.status === "accepted" && !o.hasJob);
  const followup = followups[0] ?? null;

  return (
    <li
      id={`lead-${lead.id}`}
      className={`scroll-mt-28 rounded-xl border bg-white p-4 shadow-sm ${
        focused ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{lead.companyName}</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Contact */}
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
      </div>

      {/* Offer + follow-up status */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {offer && offerMeta ? (
          <span className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset ${offerMeta.className}`}>
            Offerte {offer.reference} · {offerMeta.label} · CHF {formatChf(offer.totalGrossChf)}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-500">
            Keine Offerte
          </span>
        )}
        {followup ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
            <BellRing className="h-3 w-3" />
            Follow-up {FOLLOWUP_STAGE_LABELS[followup.stage as StageKey] ?? followup.stage} · fällig {followup.dueAt.slice(0, 10)}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-500">
            Kein Follow-up
          </span>
        )}
      </div>

      {/* Status control */}
      <div className="mt-3">
        <LeadStatusForm
          key={`${lead.id}:${lead.status}`}
          leadId={lead.id}
          currentStatus={lead.status}
        />
      </div>

      {/* Offer actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        {offer ? (
          <>
            <a
              href={`/app-shell/offers/${offer.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              <Download className="h-3.5 w-3.5" /> Offerte (PDF)
            </a>
            <Link
              href={`/app-shell/offers/${offer.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              <FilePenLine className="h-3.5 w-3.5" /> Offerte bearbeiten
            </Link>
          </>
        ) : (
          <Link
            href={`/app-shell/offers/new?lead=${lead.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
          >
            <FilePlus2 className="h-3.5 w-3.5" /> Offerte erstellen
          </Link>
        )}
        {acceptedNoJob && (
          <CreateJobButton offerId={acceptedNoJob.id} hasJob={false} />
        )}
        <span className="ml-auto">
          <ArchiveButton entity="lead" id={lead.id} />
        </span>
      </div>

      {/* Automatic follow-up sequence (24h · 48h · 5 Tage) */}
      <FollowupSequence leadId={lead.id} steps={seqSteps} canSend={canSend} />
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Job card (won → documents → bexio)                                          */
/* -------------------------------------------------------------------------- */

function JobCard({ job }: { job: JobListItem }) {
  const status = JOB_STATUS_META[job.status] ?? JOB_STATUS_META.planned;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">
            {job.customerName ?? job.title}
          </p>
          {job.offerReference && (
            <p className="text-sm text-slate-500">aus Offerte {job.offerReference}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {job.valueChf !== null && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-navy-700">
              CHF {formatChf(job.valueChf)}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <a
          href={`/app-shell/jobs/${job.id}/confirmation/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <Receipt className="h-3.5 w-3.5" /> Auftragsbestätigung
        </a>
        <a
          href={`/app-shell/jobs/${job.id}/partner/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          <UserRound className="h-3.5 w-3.5" /> Partner-Einsatz
        </a>
        {job.scheduledFor && (
          <a
            href={`/app-shell/jobs/${job.id}/ics`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Termin (.ics)
          </a>
        )}
        <Link
          href="/app-shell/bexio"
          className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
        >
          bexio
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </li>
  );
}

/** Plain-language label for a candidate's source type (no module jargon). */
function sourceTypeLabel(t: string): string {
  switch (t) {
    case "google":
      return "Google";
    case "referral":
      return "Empfehlung";
    case "partner":
      return "Partner";
    case "website":
      return "Website";
    case "email":
      return "E-Mail";
    case "manual":
      return "Manuell";
    default:
      return "Quelle";
  }
}
