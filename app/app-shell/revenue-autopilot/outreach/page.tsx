import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Send,
  Crosshair,
  Flame,
  BellRing,
  FileText,
  CalendarClock,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Rocket,
  MapPin,
  Target,
  Tag,
  Inbox,
  Mail,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { SafeModeBanner } from "@/components/revenue-autopilot/SafeModeBanner";
import { DraftChannels } from "@/components/revenue-autopilot/DraftChannels";
import {
  buildOutreachDrafts,
  buildOfferFollowupDrafts,
} from "@/components/revenue-autopilot/outreach";
import { buildAppointmentDrafts } from "@/components/revenue-autopilot/appointment";
import {
  autopilotTier,
  isPremiumExperience,
  tierRank,
} from "@/components/app-shell/autopilot-tier";
import { matchServices } from "@/components/lead-hunter/scoring";
import { scoreBadgeClass } from "@/components/lead-hunter/opportunity-meta";
import { PromoteOpportunityButton } from "@/components/lead-hunter/PromoteOpportunityButton";
import { LEAD_STATUS_META } from "@/components/leads/lead-status";
import { formatChf } from "@/components/offers/offer-status";
import { MarkContactedButton } from "./MarkContactedButton";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getCompanySettings,
  getProspects,
  getLeads,
  getOffers,
  getFollowups,
  type OpportunityListItem,
  type LeadListItem,
  type OfferListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Outreach Autopilot (intern) – Klarsa",
  description:
    "Outreach Autopilot: aus entdeckten Chancen werden Verkaufs-Aktionen – vorbereitete Erstkontakte, Nachfass-Nachrichten und Terminvorschläge zum Kopieren. Kein automatischer Versand, keine Buchung.",
  robots: { index: false, follow: false },
};

const MAX_ROWS = 8;

const OPEN_LEAD_STATUSES = new Set<string>([
  "new",
  "qualified",
  "offer_ready",
  "offer_sent",
  "waiting_reply",
  "followup_due",
]);

const PRE_CONTACT_STATUSES = new Set<string>(["raw", "scored", "approved"]);

function isWarm(sourceType: string): boolean {
  return sourceType === "referral" || sourceType === "partner";
}

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

export default async function OutreachAutopilotPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, settings, prospects, leads, offers, followups] =
    await Promise.all([
      getCompanySummary(companyId),
      getCompanySettings(companyId),
      getProspects(companyId),
      getLeads(companyId),
      getOffers(companyId),
      getFollowups(companyId),
    ]);

  const senderCompany = summary?.name ?? "Ihr Betrieb";
  const senderPerson = settings.senderName;
  const tier = summary?.tier ?? "starter";
  const tierInfo = autopilotTier(tier, summary?.billingStatus);
  const isPremium = isPremiumExperience(tier, summary?.billingStatus);
  const isPro = tierRank(tier) >= 1;
  // No compliant send channel is connected yet (drafts are copy-only today).
  const sendConnected = false;

  // Outreach-ready candidates: unpromoted, not yet contacted.
  const outreachReady = prospects
    .filter(
      (p) => p.promotedLeadId === null && PRE_CONTACT_STATUSES.has(p.status),
    )
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const hotChances = outreachReady.filter((p) => (p.score ?? 0) >= 70);
  const newCandidates = outreachReady.filter((p) => (p.score ?? 0) < 70);

  // Open leads split by whether a follow-up is already planned.
  const followupLeadIds = new Set(followups.map((f) => f.leadId));
  const openLeads = leads.filter((l) => OPEN_LEAD_STATUSES.has(l.status));
  const leadsNoFollowup = openLeads.filter((l) => !followupLeadIds.has(l.id));
  const leadsForAppointment = openLeads.filter((l) => followupLeadIds.has(l.id));

  // Offers awaiting a reply.
  const offersWaiting = offers.filter((o) => o.status === "sent");

  if (!isPro) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppShellNav companyName={summary?.name} />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <BackLink />
          <Header tierLabel={tierInfo.label} />
          <section className="mt-8 rounded-2xl border border-violet-200 bg-violet-50/70 p-6 text-center sm:p-8">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200">
              <Rocket className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="mt-3 text-base font-semibold text-navy-900">
              Outreach Autopilot ist ab Pro verfügbar
            </p>
            <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
              Im Pro-Paket bereitet Klarsa Erstkontakte, Nachfass-Nachrichten und
              Terminvorschläge für Sie vor; im Premium-Paket wird der Versand
              kanalweise automatisierbar. Ihr Offert-Büro bleibt voll nutzbar.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
            >
              Upgrade für mehr Umsatz
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <BackLink />
        <Header tierLabel={tierInfo.label} />

        {/* Money hero */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-navy-900 surface-hero p-6 text-white shadow-sm sm:p-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
            <Send className="h-3.5 w-3.5" />
            Aus Chancen werden Aktionen
          </p>
          <h2 className="mt-2 max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
            {outreachReady.length > 0
              ? `${outreachReady.length} Kandidaten bereit für Erstkontakt.`
              : "Bereit, sobald neue Chancen entstehen."}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-100">
            Klarsa bereitet Erstkontakte, Nachfass-Nachrichten und Terminvorschläge
            vor. Sie kopieren, prüfen und senden selbst.
          </p>
          <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/15">
            vorbereiten <span aria-hidden className="text-blue-200">→</span> prüfen{" "}
            <span aria-hidden className="text-blue-200">→</span> freigeben{" "}
            <span aria-hidden className="text-blue-200">→</span> senden
          </p>
        </section>

        {/* Send-channel status (honest, money-language) */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-navy-800">
              {sendConnected ? "Versandkanal verbunden." : "Kanal nicht verbunden."}
            </strong>{" "}
            {isPremium
              ? "Bereit für automatische Erstkontakte, sobald ein Versandkanal verbunden ist. Heute bereitet Klarsa die Texte vor – Sie senden selbst."
              : "Klarsa bereitet die Texte vor – Sie kopieren, prüfen und senden selbst."}
          </p>
        </div>

        <div className="mt-4">
          <SafeModeBanner />
        </div>

        {/* 1 — New candidates ready for first contact */}
        <SectionHeader
          icon={Crosshair}
          title="Bereit für Erstkontakt"
          subtitle="Neue Kandidaten – Erstkontakt vorbereiten, dann übernehmen."
        />
        {newCandidates.length === 0 ? (
          <EmptyRow
            icon={Crosshair}
            title="Keine neuen Kandidaten."
            description="Entdecken Sie über den Approved Discovery Autopilot neue Chancen – sie erscheinen hier mit fertigen Erstkontakt-Texten."
            href="/app-shell/revenue-autopilot/discovery"
            cta="Zur Discovery"
          />
        ) : (
          <ListWithMore
            items={newCandidates}
            href="/app-shell/lead-hunter"
            moreLabel="weitere Kandidaten im Lead Hunter"
          >
            {(p) => (
              <ProspectCard
                key={p.id}
                op={p}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            )}
          </ListWithMore>
        )}

        {/* 2 — Hot chances for phone/email */}
        <SectionHeader
          icon={Flame}
          title="Heisse Chancen für Telefon/E-Mail"
          subtitle="Hoher Score – jetzt priorisiert ansprechen."
        />
        {hotChances.length === 0 ? (
          <EmptyRow
            icon={Flame}
            title="Noch keine heissen Chancen."
            description="Sobald ein Kandidat einen hohen Score erreicht, erscheint er hier mit Telefon-Skript und E-Mail."
            href="/app-shell/lead-hunter"
            cta="Zum Lead Hunter"
          />
        ) : (
          <ListWithMore
            items={hotChances}
            href="/app-shell/lead-hunter"
            moreLabel="weitere heisse Chancen im Lead Hunter"
          >
            {(p) => (
              <ProspectCard
                key={p.id}
                op={p}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            )}
          </ListWithMore>
        )}

        {/* 3 — Leads without follow-up */}
        <SectionHeader
          icon={BellRing}
          title="Leads ohne Follow-up"
          subtitle="Offene Leads ohne geplanten nächsten Schritt – Nachricht vorbereiten und Follow-up planen."
        />
        {leadsNoFollowup.length === 0 ? (
          <EmptyRow
            icon={Inbox}
            title="Alle offenen Leads haben einen nächsten Schritt."
            description="Sobald ein offener Lead kein geplantes Follow-up hat, erscheint er hier."
            href="/app-shell/leads"
            cta="Zum Lead Inbox"
          />
        ) : (
          <ListWithMore
            items={leadsNoFollowup}
            href="/app-shell/leads"
            moreLabel="weitere Leads im Lead Inbox"
          >
            {(l) => (
              <LeadOutreachCard
                key={l.id}
                lead={l}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            )}
          </ListWithMore>
        )}

        {/* 4 — Offers awaiting a reply */}
        <SectionHeader
          icon={FileText}
          title="Offerten – Antwort ausstehend"
          subtitle="Versendete Offerten ohne Antwort – freundlich nachhaken."
        />
        {offersWaiting.length === 0 ? (
          <EmptyRow
            icon={FileText}
            title="Keine offenen Offerten zum Nachfassen."
            description="Sobald eine Offerte den Status „Versendet“ hat, erscheint sie hier mit einem Nachfass-Entwurf."
            href="/app-shell/offers"
            cta="Zur Offer Engine"
          />
        ) : (
          <ListWithMore
            items={offersWaiting}
            href="/app-shell/offers"
            moreLabel="weitere offene Offerten"
          >
            {(o) => (
              <OfferWaitingRow
                key={o.id}
                offer={o}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            )}
          </ListWithMore>
        )}

        {/* 5 — Appointments to propose */}
        <SectionHeader
          icon={CalendarClock}
          title="Termine vorschlagen"
          subtitle="Warme Leads mit geplantem Follow-up – jetzt einen Termin vorschlagen."
        />
        {leadsForAppointment.length === 0 ? (
          <EmptyRow
            icon={CalendarClock}
            title="Noch keine Termine vorzubereiten."
            description="Sobald ein Lead ein geplantes Follow-up hat, erscheint er hier mit einem Terminvorschlag."
            href="/app-shell/leads"
            cta="Zum Lead Inbox"
          />
        ) : (
          <ListWithMore
            items={leadsForAppointment}
            href="/app-shell/leads"
            moreLabel="weitere warme Leads im Lead Inbox"
          >
            {(l) => (
              <LeadAppointmentCard
                key={l.id}
                lead={l}
                senderPerson={senderPerson}
                senderCompany={senderCompany}
              />
            )}
          </ListWithMore>
        )}
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout helpers                                                              */
/* -------------------------------------------------------------------------- */

function BackLink() {
  return (
    <Link
      href="/app-shell/revenue-autopilot"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
    >
      <ArrowLeft className="h-4 w-4" /> Revenue Autopilot
    </Link>
  );
}

function Header({ tierLabel }: { tierLabel: string }) {
  return (
    <div className="mt-3 flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
        <Send className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
          Outreach Autopilot
        </h1>
        <p className="text-sm text-slate-500">{tierLabel}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Send;
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

function EmptyRow({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: typeof Send;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mt-3">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        cta={{ label: cta, href }}
      />
    </div>
  );
}

function ListWithMore<T extends { id: string }>({
  items,
  href,
  moreLabel,
  children,
}: {
  items: T[];
  href: string;
  moreLabel: string;
  children: (item: T) => React.ReactNode;
}) {
  const shown = items.slice(0, MAX_ROWS);
  const extra = items.length - shown.length;
  return (
    <ul className="mt-3 space-y-3">
      {shown.map((item) => children(item))}
      {extra > 0 && (
        <li>
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            {extra} {moreLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </li>
      )}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                       */
/* -------------------------------------------------------------------------- */

function ProspectCard({
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
      <DraftChannels
        channels={drafts}
        summary="Erstkontakt vorbereiten (kopieren & selbst senden)"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <PromoteOpportunityButton opportunityId={op.id} promoted={false} />
        <MarkContactedButton prospectId={op.id} contacted={false} />
      </div>
    </li>
  );
}

function LeadOutreachCard({
  lead,
  senderPerson,
  senderCompany,
}: {
  lead: LeadListItem;
  senderPerson: string | null;
  senderCompany: string;
}) {
  const status = LEAD_STATUS_META[lead.status] ?? LEAD_STATUS_META.new;
  const drafts = buildOutreachDrafts({
    name: lead.companyName,
    contactName: lead.contactName,
    service: lead.serviceInterest,
    region: null,
    sourceLabel: null,
    warm: isWarm(lead.sourceType),
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
      <DraftChannels
        channels={drafts}
        summary="Nachricht vorbereiten (kopieren & selbst senden)"
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

function LeadAppointmentCard({
  lead,
  senderPerson,
  senderCompany,
}: {
  lead: LeadListItem;
  senderPerson: string | null;
  senderCompany: string;
}) {
  const status = LEAD_STATUS_META[lead.status] ?? LEAD_STATUS_META.new;
  const drafts = buildAppointmentDrafts({
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
      <DraftChannels
        channels={drafts}
        summary="Termin vorschlagen (kopieren & selbst senden)"
      />
      <Link
        href="/app-shell/leads"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
      >
        Im Lead Inbox öffnen
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </li>
  );
}

function OfferWaitingRow({
  offer,
  senderPerson,
  senderCompany,
}: {
  offer: OfferListItem;
  senderPerson: string | null;
  senderCompany: string;
}) {
  const drafts = buildOfferFollowupDrafts({
    reference: offer.reference,
    leadName: offer.leadName,
    validUntil: offer.validUntil,
    senderPerson,
    senderCompany,
  });
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
      <DraftChannels
        channels={drafts}
        summary="Nachfass-Entwurf (kopieren & selbst senden)"
      />
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
