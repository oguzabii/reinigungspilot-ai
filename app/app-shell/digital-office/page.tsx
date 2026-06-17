import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { OfficeHero } from "@/components/digital-office/OfficeHero";
import { SetupChecklist } from "@/components/digital-office/SetupChecklist";
import { WorkerBoard } from "@/components/digital-office/WorkerBoard";
import {
  MailboxCard,
  OfferTemplateCard,
  PricingRulesCard,
  ActivityFeed,
  QuickActionGrid,
} from "@/components/digital-office/OfficeSections";
import { AskOffice, AskOfficeCtaCard } from "@/components/digital-office/AskOffice";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getCompanySettings,
  getLeads,
  getProspects,
  getOffers,
  getJobs,
  getFollowups,
} from "@/lib/auth/tenant-data";
import {
  isSendConfigured,
  sendProviderLabel,
} from "@/lib/outreach/send-provider";
import {
  isInboxConfigured,
  inboxProviderLabel,
} from "@/lib/outreach/inbox-provider";
import {
  tierToOfficePackage,
  getOfficePackage,
  getOfficePackageName,
} from "@/lib/digital-office/pricing";
import { featureLimit, isAskOfficeEnabled } from "@/lib/digital-office/feature-gates";
import {
  buildSetupStatus,
  buildWorkerRuntimes,
  buildActivityFeed,
  deriveMailboxStatus,
  splitWorkers,
  type OfficeSignals,
} from "@/lib/digital-office/office";
import type { AskOfficeContext } from "@/lib/digital-office/ask-office";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digitales Büro – Klarsa",
  description:
    "Bauen Sie Ihr digitales Büro mit KI-Mitarbeitern: Mailbox, Offerten-Vorlage und Preisregeln konfigurieren und Ihre digitalen Mitarbeiter live arbeiten sehen.",
  robots: { index: false, follow: false },
};

const OPEN_OFFER_STATUSES = new Set(["draft", "ready", "sent"]);

export default async function DigitalOfficePage() {
  // Delegate setup / no-tenant states to /app-shell (mirrors the other sub-pages).
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, settings, leads, prospects, offers, jobs, followups] =
    await Promise.all([
      getCompanySummary(companyId),
      getCompanySettings(companyId),
      getLeads(companyId),
      getProspects(companyId),
      getOffers(companyId),
      getJobs(companyId),
      getFollowups(companyId),
    ]);

  const packageId = tierToOfficePackage(summary?.tier);
  const pkg = getOfficePackage(packageId);
  const sendConfigured = isSendConfigured();
  const sendLabel = sendProviderLabel();
  const inboxConfigured = isInboxConfigured();
  const inboxLabel = inboxProviderLabel();

  const openOffers = offers.filter((o) => OPEN_OFFER_STATUSES.has(o.status)).length;

  const signals: OfficeSignals = {
    packageId,
    companyName: summary?.name ?? "Ihr Betrieb",
    senderName: settings.senderName,
    senderEmail: settings.senderEmail,
    sendChannelConfigured: sendConfigured,
    sendChannelLabel: sendLabel,
    inboxChannelConfigured: inboxConfigured,
    inboxChannelLabel: inboxLabel,
    leads: leads.length,
    prospects: prospects.length,
    offers: offers.length,
    openOffers,
    jobs: jobs.length,
    followups: followups.length,
    // Foundation: template & pricing-rule persistence is a documented next step.
    templateCount: 0,
    pricingRuleCount: 0,
  };

  const setup = buildSetupStatus(signals);
  const runtimes = buildWorkerRuntimes(signals);
  const activity = buildActivityFeed(signals);
  const mailboxStatus = deriveMailboxStatus(signals);
  const { active } = splitWorkers(packageId);
  const workerLimit = featureLimit(packageId, "worker_count");
  const templateLimit = featureLimit(packageId, "pdf_template_count");
  const askEnabled = isAskOfficeEnabled(packageId);

  const askContext: AskOfficeContext = {
    packageId,
    packageName: getOfficePackageName(packageId),
    askOfficeLevel: pkg.limits.askOffice,
    companyName: signals.companyName,
    route: "/app-shell/digital-office",
    setupDone: setup.doneCount,
    setupTotal: setup.totalCount,
    missingSteps: setup.steps.filter((s) => !s.done).map((s) => s.label),
    activeWorkers: active.map((w) => w.name),
    pendingApprovals: runtimes.filter((r) => r.status === "waiting_approval").length,
    openTasks: openOffers + followups.length,
    mailboxStatus,
    hasTemplate: signals.templateCount > 0,
    hasPricingRules: signals.pricingRuleCount > 0,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <AskOffice context={askContext} />

      <main className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:py-10">
        <OfficeHero
          companyName={signals.companyName}
          packageName={pkg.name}
          monthlyChf={pkg.monthlyChf}
          setupDone={setup.doneCount}
          setupTotal={setup.totalCount}
          activeWorkerCount={active.length}
          workerLimit={workerLimit}
        />

        <QuickActionGrid>
          <AskOfficeCtaCard enabled={askEnabled} />
        </QuickActionGrid>

        <SetupChecklist status={setup} />

        <WorkerBoard runtimes={runtimes} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MailboxCard
            status={mailboxStatus}
            senderName={signals.senderName}
            senderEmail={signals.senderEmail}
            outgoingLabel={sendConfigured ? (sendLabel ?? "E-Mail") : null}
            incomingLabel={inboxConfigured ? (inboxLabel ?? "IMAP") : null}
          />
          <OfferTemplateCard templateCount={0} templateLimit={templateLimit} />
          <PricingRulesCard
            ruleCount={0}
            advanced={pkg.limits.pricingRules === "advanced"}
          />
          <ActivityFeed items={activity} />
        </div>

        {/* Honest automation-status note (owner-facing, non-technical). */}
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-navy-800">
              Ehrlich und kontrolliert.
            </strong>{" "}
            Ihr digitales Büro zeigt nur echte Daten Ihres Betriebs. Es wird nichts
            automatisch gesendet oder gebucht – jede Aktion läuft über Entwurf und
            Freigabe. Mailbox, Offerten-Vorlage und Preisregeln sind als Fundament
            vorbereitet; das Speichern eigener Einstellungen folgt im nächsten
            Schritt.
          </p>
        </div>
      </main>
    </div>
  );
}
