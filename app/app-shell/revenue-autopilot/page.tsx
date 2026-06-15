import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Rocket,
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
  Globe,
  SlidersHorizontal,
  Activity,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { AutopilotCard } from "@/components/app-shell/AutopilotCard";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { GroupStations } from "@/components/app-shell/GroupStations";
import {
  autopilotTier,
  isPremiumExperience,
} from "@/components/app-shell/autopilot-tier";
import { SafeModeBanner } from "@/components/revenue-autopilot/SafeModeBanner";
import { AutopilotLanes } from "@/components/revenue-autopilot/AutopilotLanes";
import { buildAutopilotLanes } from "@/components/revenue-autopilot/lanes";
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
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isBaugesucheConfigured } from "@/lib/discovery/baugesuche-zh";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getCompanySettings,
  getAutopilotPolicy,
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
    toggles,
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
    getAutopilotPolicy(companyId),
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
  const discoveryConfigured = isDiscoveryConfigured();
  const baugesucheConfigured = isBaugesucheConfigured();
  const discoveredCount = prospects.filter((p) => p.sourceType === "google").length;
  // Signals = open (not-yet-promoted) candidates with a "why now" reading.
  const signalsCount = prospects.filter((p) => p.promotedLeadId === null).length;

  // Package-aware Autopilot positioning + command-center lanes (v0.5.6).
  const tier = summary?.tier ?? "starter";
  const tierInfo = autopilotTier(tier, summary?.billingStatus);
  const isPremium = isPremiumExperience(tier, summary?.billingStatus);
  const lanes = buildAutopilotLanes({
    tier,
    billingStatus: summary?.billingStatus,
    providers: {
      discovery: discoveryConfigured || baugesucheConfigured,
      send: false,
      calendar: false,
    },
  });

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
              {senderCompany} · {tierInfo.label}
            </p>
          </div>
        </div>

        {/* Chancen group navigator */}
        <div className="mt-6">
          <GroupStations group="chancen" active="autopilot" />
        </div>

        {/* Command-center hero — the brain that prioritises the day */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-navy-900 surface-hero p-6 text-white shadow-sm sm:p-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
            <Rocket className="h-3.5 w-3.5" />
            Command Center
          </p>
          <h2 className="mt-2 max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
            Klarsa priorisiert, was heute Geld bringt.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-100">
            Das Gehirn Ihres Verkaufs: Klarsa bündelt Quellen, heisse Chancen,
            Leads, Offerten und Termine und sortiert sie nach Umsatz-Wirkung. Alle
            Texte sind <strong className="font-semibold text-white">vorbereitet zum
            Kopieren</strong> – Sie behalten die Kontrolle.
          </p>
          <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/15">
            vorbereiten <span aria-hidden className="text-blue-200">→</span> prüfen{" "}
            <span aria-hidden className="text-blue-200">→</span> freigeben{" "}
            <span aria-hidden className="text-blue-200">→</span> senden
          </p>
        </section>

        {/* Autopilot lanes — the command-center overview, package-aware */}
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
              <Activity className="h-4 w-4 text-blue-600" strokeWidth={2} />
              Autopilot-Status
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
              {tierInfo.statusLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Jede Lane zeigt ihren Status: Aktiv, Wartet auf Freigabe, Kanal nicht
            verbunden, Bereit für Premium oder Premium-Funktion. Premium-Vollautomatik
            wird kanalweise aktiviert.
          </p>
          <div className="mt-3">
            <AutopilotLanes lanes={lanes} />
          </div>
          {!isPremium && (
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-800"
            >
              <Rocket className="h-4 w-4" /> Upgrade für Vollautomatik
            </Link>
          )}
        </section>

        {/* Prioritised next actions */}
        <div className="mt-8">
          <AutopilotCard kpis={kpis} hasData={hasData} />
        </div>

        {/* Automatik — Discovery + Rules engine (v0.5.2) */}
        <SectionHeader
          icon={Globe}
          title="Automatik"
          subtitle="Automatische Discovery und Richtlinien – sicher, per Policy kontrolliert."
        />
        <div className="mt-3">
          <SafeModeBanner />
        </div>
        {/* Opportunity Signals — "Warum jetzt?" */}
        <Link
          href="/app-shell/revenue-autopilot/signals"
          className="mt-3 flex items-center gap-3 rounded-2xl border border-navy-900 bg-navy-900 p-4 text-white shadow-sm transition-colors hover:bg-navy-800"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
            <Activity className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold">Neue Signale gefunden</span>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                {signalsCount}
              </span>
            </span>
            <span className="block text-sm text-blue-100">
              Opportunity Signals · Warum jetzt? – Service-Potenzial, Timing,
              Konfidenz und nächste Aktion je Kandidat. Bau-Signal-Quelle
              (Baugesuche Zürich): {baugesucheConfigured ? "bereit" : "nicht konfiguriert"}.
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-200" />
        </Link>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link
            href="/app-shell/revenue-autopilot/discovery"
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Globe className="h-4 w-4 text-blue-600" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy-900">
                  Automatische Discovery
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                    discoveryConfigured
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}
                >
                  {discoveryConfigured ? "API konfiguriert" : "API nicht konfiguriert"}
                </span>
              </span>
              <span className="mt-0.5 block text-sm text-slate-500">
                {discoveredCount} kalte Kandidaten · Auto-Erstellung{" "}
                {toggles.autoCreateColdCandidates ? "EIN" : "AUS"} · kein Scraping.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
          <Link
            href="/app-shell/revenue-autopilot/policy"
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">
                Autopilot-Richtlinien
              </span>
              <span className="mt-0.5 block text-sm text-slate-500">
                Was automatisch erlaubt ist – Cold-Outreach gesperrt, keine stille
                Buchung.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
        </div>

        {/* A — Source execution queue */}
        <SectionHeader
          icon={Library}
          title="Quellen abarbeiten"
          subtitle="Worklist: Quelle öffnen → Kandidaten recherchieren → Opportunity erfassen → Kontakt vorbereiten."
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
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link
            href={task.executeHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
          >
            <Crosshair className="h-3.5 w-3.5" strokeWidth={2.2} />
            Quelle abarbeiten
          </Link>
          <Link
            href={task.captureHref}
            className="text-[11px] font-medium text-blue-700 hover:text-blue-800"
          >
            oder direkt erfassen →
          </Link>
        </div>
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
