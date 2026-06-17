/**
 * Digital Office — server-side data loader (vNext). SERVER-ONLY.
 *
 * One place that reads the tenant's real, RLS-scoped data (never service-role)
 * and derives the full office view: signals, setup, worker runtime, activity,
 * mailbox status and the safe Ask Office context. Used by both the page (to
 * render) and the Ask Office chat action (so the assistant's context is fresh
 * and server-trusted, never supplied by the client).
 */

import {
  getCompanySummary,
  getCompanySettings,
  getLeads,
  getProspects,
  getOffers,
  getJobs,
  getFollowups,
} from "@/lib/auth/tenant-data";
import { isSendConfigured, sendProviderLabel } from "@/lib/outreach/send-provider";
import { isInboxConfigured, inboxProviderLabel } from "@/lib/outreach/inbox-provider";
import {
  tierToOfficePackage,
  getOfficePackage,
  type OfficePackageDef,
  type OfficePackageId,
} from "./pricing";
import { featureLimit, isAskOfficeEnabled } from "./feature-gates";
import {
  buildSetupStatus,
  buildOfficeJourney,
  buildWorkerRuntimes,
  buildActivityFeed,
  deriveMailboxStatus,
  splitWorkers,
  type OfficeSignals,
  type SetupStatus,
  type JourneyState,
  type WorkerRuntime,
  type ActivityItem,
  type MailboxStatus,
} from "./office";
import type { WorkerDef } from "./workers";
import { buildAskOfficeContext } from "./ask-office-context";
import type { AskOfficeContext } from "./ask-office-context";
import { askOfficeMode, askOfficeProviderLabel, type AskOfficeMode } from "./ask-office-chat";

export const DIGITAL_OFFICE_ROUTE = "/app-shell/digital-office";

const OPEN_OFFER_STATUSES = new Set(["draft", "ready", "sent"]);

export interface OfficeView {
  companyName: string;
  packageId: OfficePackageId;
  pkg: OfficePackageDef;
  signals: OfficeSignals;
  setup: SetupStatus;
  journey: JourneyState;
  runtimes: WorkerRuntime[];
  activity: ActivityItem[];
  mailboxStatus: MailboxStatus;
  sendConfigured: boolean;
  sendLabel: string | null;
  inboxConfigured: boolean;
  inboxLabel: string | null;
  activeWorkers: WorkerDef[];
  availableWorkers: WorkerDef[];
  workerLimit: number;
  templateLimit: number;
  askEnabled: boolean;
  askContext: AskOfficeContext;
  askMode: AskOfficeMode;
  providerLabel: string | null;
}

/** Load + derive the full office view for an already-authenticated company. */
export async function loadOfficeView(companyId: string): Promise<OfficeView> {
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
  const journey = buildOfficeJourney(signals);
  const runtimes = buildWorkerRuntimes(signals);
  const activity = buildActivityFeed(signals);
  const mailboxStatus = deriveMailboxStatus(signals);
  const { active, locked } = splitWorkers(packageId);
  const workerLimit = featureLimit(packageId, "worker_count");
  const templateLimit = featureLimit(packageId, "pdf_template_count");
  const askEnabled = isAskOfficeEnabled(packageId);

  const askContext = buildAskOfficeContext({
    packageId,
    packageName: pkg.name,
    askOfficeLevel: pkg.limits.askOffice,
    pricingRulesLevel: pkg.limits.pricingRules,
    automationLevel: pkg.limits.automation,
    companyName: signals.companyName,
    route: DIGITAL_OFFICE_ROUTE,
    setup,
    runtimes,
    activeWorkers: active.map((w) => w.name),
    availableWorkers: locked.map((w) => w.name),
    hasTemplate: signals.templateCount > 0,
    hasPricingRules: signals.pricingRuleCount > 0,
    mailboxStatus,
    openTasks: openOffers + followups.length,
  });

  return {
    companyName: signals.companyName,
    packageId,
    pkg,
    signals,
    setup,
    journey,
    runtimes,
    activity,
    mailboxStatus,
    sendConfigured,
    sendLabel,
    inboxConfigured,
    inboxLabel,
    activeWorkers: active,
    availableWorkers: locked,
    workerLimit,
    templateLimit,
    askEnabled,
    askContext,
    askMode: askOfficeMode(),
    providerLabel: askOfficeProviderLabel(),
  };
}
