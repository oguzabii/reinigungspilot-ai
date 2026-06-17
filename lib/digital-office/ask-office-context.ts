/**
 * Ask Office — safe context object + builder (vNext).
 *
 * The ONE place that defines what context Ask Office is allowed to see. It is a
 * strictly tenant-scoped, non-secret, serializable snapshot: company name,
 * package, workers, setup progress, mailbox/template/pricing status, task and
 * approval counts, the current route and the feature gates.
 *
 * It NEVER contains: credentials, raw env values, API keys, service-role data,
 * or any other secret. Pure + client/server-safe.
 */

import type {
  AskOfficeLevel,
  AutomationLevel,
  OfficePackageId,
  PricingRulesLevel,
} from "./pricing";
import type {
  MailboxStatus,
  SetupStatus,
  WorkerRuntime,
} from "./office";

export interface AskOfficeContext {
  packageId: OfficePackageId;
  packageName: string;
  askOfficeLevel: AskOfficeLevel;
  /** Feature gates relevant to suggestions. */
  pricingRulesLevel: PricingRulesLevel;
  automationLevel: AutomationLevel;

  companyName: string;
  /** Current route, e.g. "/app-shell/digital-office". */
  route: string;

  setupDone: number;
  setupTotal: number;
  /** German labels of the steps still open. */
  missingSteps: string[];

  /** German names of the active workers. */
  activeWorkers: string[];
  /** German names of the workers available in a higher package. */
  availableWorkers: string[];

  pendingApprovals: number;
  openTasks: number;

  mailboxStatus: MailboxStatus;
  hasTemplate: boolean;
  hasPricingRules: boolean;
}

export interface BuildAskOfficeContextInput {
  packageId: OfficePackageId;
  packageName: string;
  askOfficeLevel: AskOfficeLevel;
  pricingRulesLevel: PricingRulesLevel;
  automationLevel: AutomationLevel;
  companyName: string;
  route: string;
  setup: SetupStatus;
  runtimes: WorkerRuntime[];
  activeWorkers: string[];
  availableWorkers: string[];
  hasTemplate: boolean;
  hasPricingRules: boolean;
  mailboxStatus: MailboxStatus;
  openTasks: number;
}

/** Build the safe Ask Office context from already-derived office state. */
export function buildAskOfficeContext(
  input: BuildAskOfficeContextInput,
): AskOfficeContext {
  return {
    packageId: input.packageId,
    packageName: input.packageName,
    askOfficeLevel: input.askOfficeLevel,
    pricingRulesLevel: input.pricingRulesLevel,
    automationLevel: input.automationLevel,
    companyName: input.companyName,
    route: input.route,
    setupDone: input.setup.doneCount,
    setupTotal: input.setup.totalCount,
    missingSteps: input.setup.steps.filter((s) => !s.done).map((s) => s.label),
    activeWorkers: input.activeWorkers,
    availableWorkers: input.availableWorkers,
    pendingApprovals: input.runtimes.filter(
      (r) => r.status === "waiting_approval",
    ).length,
    openTasks: input.openTasks,
    mailboxStatus: input.mailboxStatus,
    hasTemplate: input.hasTemplate,
    hasPricingRules: input.hasPricingRules,
  };
}
