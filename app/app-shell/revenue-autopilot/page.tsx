import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Rocket,
  Lock,
  Library,
  Crosshair,
  Flame,
  Inbox,
  FileText,
  CalendarClock,
  PlugZap,
  Crown,
  ChevronRight,
  ArrowRight,
  MapPin,
  Target,
  Tag,
  BellRing,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { AutopilotCard } from "@/components/app-shell/AutopilotCard";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { DraftChannels } from "@/components/revenue-autopilot/DraftChannels";
import {
  buildOutreachDrafts,
  type DraftChannel,
} from "@/components/revenue-autopilot/outreach";
import { buildAppointmentDrafts } from "@/components/revenue-autopilot/appointment";
import {
  buildSourceTasks,
  type SourceTask,
} from "@/components/revenue-autopilot/source-queue";
import { matchServices } from "@/components/lead-hunter/scoring";
import { scoreBadgeClass } from "@/components/lead-hunter/opportunity-meta";
import { LEAD_STATUS_META } from "@/components/leads/lead-status";
import { formatChf } from "@/components/offers/offer-status";
import { computeCeoKpis } from "@/components/ceo/kpi";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getCompanySettings,
  getProspects,
  getLeads,
  getOffers,
  getJobs,
  getInvoiceHandoffJobs,
  getFollowups,
  getLeadSources,
  type OpportunityListItem,
  type LeadListItem,
  type OfferListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revenue Autopilot (intern) – Klarsa",
  description:
    "Command Center: Quellen-Aktionen, heisse Chancen, Follow-ups, Offerten-Nachfass und Termin-Vorschläge – Entwürfe zum Kopieren. Kein Versand, kein Scraping, keine Buchung.",
  robots: { index: false, follow: false },
};

const OPEN_LEAD_STATUSES = new Set<string>([
  "new",
  "qualified",
  "offer_ready",
  "offer_sent",
  "waiting_reply",
  "followup_due",
]);

const MAX_ROWS = 6;

/** First matched service for an opportunity (deterministic), or its free text. */
function oppService(o: OpportunityListItem): string | null {
  const matched = matchServices({
    name: o.name,
    category: o.category ?? "Manuell",
    region: o.region ?? "",
    servicePotential: o.servicePotential ?? "",
    sourceType: o.sourceType,
    score: o.score,
  });
  return matched[0] ?? o.servicePotential ?? null;
}

function isWarm(sourceType: string): boolean {
  return sourceType === "referral" || sourceType === "partner";
}

/** A short follow-up draft for a sent offer (copy-only). */
function offerFollowupDrafts(
  offer: OfferListItem,
  senderPerson: string | null,
  senderCompany: string,
): DraftChannel[] {
  const sig = senderPerson
    ? `Freundliche Grüsse\n${senderPerson}\n${senderCompany}`
    : `Freundliche Grüsse\n${senderCompany}`;
  const who = offer.leadName ?? "Sie";
  const email = [
    "Guten Tag,",
    "",
    `gerne komme ich kurz auf unsere Offerte ${offer.reference} für ${who} zurück.`,
    offer.validUntil ? `Sie ist gültig bis ${offer.validUntil}.` : "",
    "",
    "Darf ich offene Fragen beantworten oder die nächsten Schritte mit Ihnen besprechen? Ein kurzes Telefonat diese Woche genügt.",
    "",
    sig,
  ]
    .filter((l) => l !== "")
    .join("\n");
  const wa = [
    `Guten Tag, kurze Rückfrage zu unserer Offerte ${offer.reference}.`,
    "Passt das Angebot so für Sie, oder dürfen wir etwas anpassen?",
    senderPerson ? `Freundliche Grüsse, ${senderPerson}` : "Freundliche Grüsse",
  ].join("\n");
  return [
    { key: "offer_email", label: "E-Mail", subject: `Offerte ${offer.reference}`, text: email },
    { key: "offer_wa", label: "WhatsApp / SMS", text: wa },
  ];
}

export default async function RevenueAutopilotPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [
    summary,
    settings,
    prospects,
    leads,
    offers,
    jobs,
    handoffJobs,
    followups,
    leadSources,
  ] = await Promise.all([
    getCompanySummary(companyId),
    getCompanySettings(companyId),
    getProspects(companyId),
    getLeads(companyId),
    getOffers(companyId),
    getJobs(companyId),
    getInvoiceHandoffJobs(companyId),
    getFollowups(companyId),
    getLeadSources(companyId),
  ]);

  const senderCompany = summary?.name ?? "Ihr Betrieb";
  const senderPerson = settings.senderName;

  const now = new Date();
  const kpis = computeCeoKpis({
    opportunities: prospects,
    leads,
    offers,
    jobs,
    handoffJobs,
    followupLeadIds: followups.map((f) => f.leadId),
    nowIso: now.toISOString(),
  });
  const hasData =
    kpis.oppsTotal + kpis.leadsTotal + kpis.offersTotal + kpis.jobsTotal > 0;

  // Source execution queue (enabled sources only).
  const sourceTasks = buildSourceTasks(leadSources);

  // Hot opportunities: unpromoted, highest score first.
  const allHot = prospects
    .filter((o) => o.promotedLeadId === null)
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const hotOpps = allHot.slice(0, MAX_ROWS);

  // Leads needing a follow-up: open + no planned follow-up task.
  const followupLeadIds = new Set(followups.map((f) => f.leadId));
  const allLeadsNeeding = leads.filter(
    (l) => OPEN_LEAD_STATUSES.has(l.status) && !followupLeadIds.has(l.id),
  );
  const leadsNeeding = allLeadsNeeding.slice(0, MAX_ROWS);

  // Offers waiting for a reply (sent).
  const allWaiting = offers.filter((o) => o.status === "sent");
  const offersWaiting = allWaiting.slice(0, MAX_ROWS);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
            <Rocket className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Revenue Autopilot
            </h1>
            <p className="text-sm text-slate-500">
              {senderCompany} · Ihr Command Center für neue Aufträge
            </p>
          </div>
        </div>

        {/* Money hero */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-navy-900 surface-hero p-6 text-white shadow-sm sm:p-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
            <Rocket className="h-3.5 w-3.5" />
            Heute Geld holen
          </p>
          <h2 className="mt-2 max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
            Klarsa zeigt Ihnen, was heute Umsatz bringt.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-100">
            Quellen abarbeiten, heisse Chancen ansprechen, Leads nachfassen,
            Offerten nachhaken und Termine vorschlagen – alle Texte sind{" "}
            <strong className="font-semibold text-white">vorbereitet zum Kopieren</strong>.
            Sie prüfen, passen an und senden selbst. Klarsa sucht, sendet und bucht
            nichts automatisch.
          </p>
        </section>

        {/* Honest guardrail note */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Vorbereiten, nicht automatisieren.</strong>{" "}
            Kein Scraping, keine automatische Suche, kein automatischer E-Mail-/
            WhatsApp-Versand, keine automatische Terminbuchung, keine bexio-API.
            Jeder Schritt wird von Ihnen geprüft, freigegeben und manuell
            ausgeführt. Alle Daten sind RLS-gefiltert (nur Ihr Mandant).
          </p>
        </div>

        {/* Prioritised next actions */}
        <div className="mt-6">
          <AutopilotCard kpis={kpis} hasData={hasData} />
        </div>

        {/* A — Source execution queue */}
        <SectionHeader
          icon={Library}
          title="Quellen abarbeiten"
          subtitle="Wo neue Chancen entstehen – manuell recherchieren und erfassen."
        />
        {sourceTasks.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Library}
              tone="ready"
              title="Noch keine aktiven Quellen."
              description="Registrieren Sie kontrollierte Lead-Quellen (Verwaltungen, Empfehlungen, Bauprojekte). Klarsa schlägt dann pro Quelle konkrete Rechercheschritte vor."
              cta={{ label: "Quellen-Registry öffnen", href: "/app-shell/lead-hunter/sources" }}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {sourceTasks.map((t) => (
              <SourceTaskRow key={t.sourceId} task={t} />
            ))}
          </ul>
        )}

        {/* B — Hot opportunities + outreach drafts */}
        <SectionHeader
          icon={Flame}
          title="Heisse Chancen ansprechen"
          subtitle="Top-Opportunities, die noch nicht im Lead Inbox sind – Outreach vorbereiten."
        />
        {hotOpps.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Crosshair}
              tone="ready"
              title="Noch keine offenen Chancen."
              description="Erfassen Sie im Lead Hunter die erste Opportunity. Klarsa bereitet danach passende Erstkontakt-Texte vor."
              cta={{ label: "Zum Lead Hunter", href: "/app-shell/lead-hunter" }}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {hotOpps.map((o) => (
              <OppCard
                key={o.id}
                op={o}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            ))}
            {allHot.length > hotOpps.length && (
              <MoreLink
                href="/app-shell/lead-hunter"
                text={`${allHot.length - hotOpps.length} weitere Chancen im Lead Hunter`}
              />
            )}
          </ul>
        )}

        {/* C — Leads needing follow-up + outreach/appointment drafts */}
        <SectionHeader
          icon={BellRing}
          title="Leads nachfassen & Termin vorschlagen"
          subtitle="Offene Leads ohne geplantes Follow-up – Nachricht und Terminvorschlag vorbereiten."
        />
        {leadsNeeding.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Inbox}
              title="Keine offenen Leads ohne Follow-up."
              description="Sobald ein offener Lead kein geplantes Follow-up hat, erscheint er hier mit fertigen Entwürfen für Nachricht und Termin."
              cta={{ label: "Zum Lead Inbox", href: "/app-shell/leads" }}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {leadsNeeding.map((l) => (
              <LeadCard
                key={l.id}
                lead={l}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            ))}
            {allLeadsNeeding.length > leadsNeeding.length && (
              <MoreLink
                href="/app-shell/leads"
                text={`${allLeadsNeeding.length - leadsNeeding.length} weitere Leads im Lead Inbox`}
              />
            )}
          </ul>
        )}

        {/* D — Offers waiting for reply */}
        <SectionHeader
          icon={FileText}
          title="Offerten nachfassen"
          subtitle="Versendete Offerten ohne Antwort – freundlich nachhaken."
        />
        {offersWaiting.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={FileText}
              title="Keine offenen Offerten zum Nachfassen."
              description="Sobald eine Offerte den Status „Versendet“ hat, erscheint sie hier mit einem fertigen Nachfass-Entwurf."
              cta={{ label: "Zur Offer Engine", href: "/app-shell/offers" }}
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {offersWaiting.map((o) => (
              <OfferRow
                key={o.id}
                offer={o}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            ))}
            {allWaiting.length > offersWaiting.length && (
              <MoreLink
                href="/app-shell/offers"
                text={`${allWaiting.length - offersWaiting.length} weitere offene Offerten`}
              />
            )}
          </ul>
        )}

        {/* E — Close the loop */}
        <SectionHeader
          icon={Crown}
          title="Abschliessen & verrechnen"
          subtitle="Gewonnene Arbeit zu Geld machen und den Überblick behalten."
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <LinkCard
            icon={PlugZap}
            title="bexio-Übergabe"
            text="Abgeschlossene Aufträge verrechnen."
            href="/app-shell/bexio"
          />
          <LinkCard
            icon={Crown}
            title="CEO-Briefing"
            text="Geld-Wirkung & Kennzahlen im Überblick."
            href="/app-shell/ceo"
          />
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Library;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mt-10">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function SourceTaskRow({ task }: { task: SourceTask }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 font-semibold text-navy-900">
            <Library className="h-3.5 w-3.5 text-blue-600" />
            {task.sourceLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-navy-800">{task.action}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{task.hint}</p>
        </div>
        <Link
          href={task.href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
        >
          <Crosshair className="h-3.5 w-3.5" strokeWidth={2.2} />
          Opportunity vorbereiten
        </Link>
      </div>
    </li>
  );
}

function OppCard({
  op,
  senderPerson,
  senderCompany,
}: {
  op: OpportunityListItem;
  senderPerson: string | null;
  senderCompany: string;
}) {
  const service = oppService(op);
  const drafts = buildOutreachDrafts({
    name: op.name,
    contactName: null,
    service,
    region: op.region,
    sourceLabel: op.sourceLabel,
    warm: isWarm(op.sourceType),
    senderPerson,
    senderCompany,
  });
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-navy-900">{op.name}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreBadgeClass(op.score)}`}
        >
          Score {op.score ?? "—"}
        </span>
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
        {service && (
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            {service}
          </span>
        )}
      </div>
      <DraftChannels channels={drafts} summary="Erstkontakt vorbereiten (kopieren & selbst senden)" />
      <Link
        href="/app-shell/lead-hunter"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
      >
        Im Lead Hunter übernehmen
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </li>
  );
}

function LeadCard({
  lead,
  senderPerson,
  senderCompany,
}: {
  lead: LeadListItem;
  senderPerson: string | null;
  senderCompany: string;
}) {
  const status = LEAD_STATUS_META[lead.status] ?? LEAD_STATUS_META.new;
  const outreach = buildOutreachDrafts({
    name: lead.companyName,
    contactName: lead.contactName,
    service: lead.serviceInterest,
    region: null,
    sourceLabel: null,
    warm: isWarm(lead.sourceType),
    senderPerson,
    senderCompany,
  });
  const appointment = buildAppointmentDrafts({
    name: lead.companyName,
    contactName: lead.contactName,
    service: lead.serviceInterest,
    senderPerson,
    senderCompany,
  });
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
            <Inbox className="h-3.5 w-3.5 text-slate-400" />
            {lead.contactName}
          </span>
        )}
        {lead.serviceInterest && (
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            {lead.serviceInterest}
          </span>
        )}
      </div>
      <DraftChannels channels={outreach} summary="Nachricht vorbereiten (kopieren & selbst senden)" />
      <DraftChannels
        channels={appointment}
        summary="Termin vorschlagen (kopieren & selbst senden)"
      />
      <Link
        href="/app-shell/leads"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
      >
        Follow-up im Lead Inbox planen
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </li>
  );
}

function OfferRow({
  offer,
  senderPerson,
  senderCompany,
}: {
  offer: OfferListItem;
  senderPerson: string | null;
  senderCompany: string;
}) {
  const drafts = offerFollowupDrafts(offer, senderPerson, senderCompany);
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 font-semibold text-navy-900">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          {offer.reference}
        </p>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-navy-700">
          CHF {formatChf(offer.totalGrossChf)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Inbox className="h-3.5 w-3.5 text-slate-400" />
          {offer.leadName ?? "Ohne Lead"}
        </span>
        {offer.validUntil && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
            gültig bis {offer.validUntil}
          </span>
        )}
      </div>
      <DraftChannels channels={drafts} summary="Nachfass-Entwurf (kopieren & selbst senden)" />
      <Link
        href="/app-shell/offers"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
      >
        Offerte in der Offer Engine öffnen
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </li>
  );
}

function MoreLink({ href, text }: { href: string; text: string }) {
  return (
    <li>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
      >
        {text}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </li>
  );
}

function LinkCard({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: typeof PlugZap;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy-900">{title}</span>
        <span className="block text-sm text-slate-500">{text}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  );
}
