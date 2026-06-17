/**
 * Digital Office Builder — office state derivation (vNext).
 *
 * Pure, deterministic helpers that turn REAL tenant signals (counts read via
 * RLS, sender settings, configured mail channels) into the honest state the
 * office page renders: setup progress, per-worker runtime status and an activity
 * feed. No I/O, no secrets, client- and server-safe.
 *
 * HONESTY RULES (mirrored from the mail/outreach foundations):
 *   - A mailbox is only "connected" when a real send channel is configured.
 *     Otherwise it is "configured" (sender known) or "not_connected".
 *   - Workers never claim to have done external work that did not happen. A
 *     worker that depends on an unconfigured channel is "waiting"/"blocked".
 *   - Templates and pricing rules have no persistence yet, so their counts come
 *     in as 0 unless a future persistence layer provides them.
 *
 * Data models for mailbox config, offer templates and pricing rules live here as
 * TYPES so the UI and the (later) persistence layer share one shape.
 */

import { DIGITAL_WORKERS, type WorkerDef, type WorkerId } from "./workers";
import { featureLimit } from "./feature-gates";
import type { OfficePackageId } from "./pricing";

/* -------------------------------------------------------------------------- */
/* Data models (shared by the UI and the future persistence layer)             */
/* -------------------------------------------------------------------------- */

export type MailboxMode = "draft_only" | "approval_required" | "automatic_allowed";
export type MailboxStatus = "not_connected" | "configured" | "connected" | "error";

export interface MailboxConfig {
  incomingEmail: string | null;
  outgoingEmail: string | null;
  senderName: string | null;
  replyToEmail: string | null;
  signature: string | null;
  mode: MailboxMode;
  status: MailboxStatus;
}

export interface OfferTemplate {
  templateName: string;
  companyLogoUrl: string | null;
  companyAddress: string | null;
  contactEmail: string | null;
  phone: string | null;
  paymentTerms: string | null;
  footerNote: string | null;
  /** e.g. "inkl. 8.1% MwSt." */
  taxLabel: string | null;
  defaultLanguage: "de" | "fr" | "it" | "en";
  defaultOfferIntro: string | null;
  defaultOfferFooter: string | null;
}

export type PricingRuleType =
  | "fixed_price"
  | "hourly_rate"
  | "package_price"
  | "add_on"
  | "percentage_adjustment"
  | "minimum_price";

export interface PricingRule {
  id: string;
  name: string;
  category: string | null;
  type: PricingRuleType;
  value: number;
  currency: string;
  active: boolean;
}

/* -------------------------------------------------------------------------- */
/* Inputs + runtime state                                                      */
/* -------------------------------------------------------------------------- */

/** Real, RLS-scoped signals the page computes before deriving office state. */
export interface OfficeSignals {
  packageId: OfficePackageId;
  companyName: string;
  /** From company_settings (RLS), or null. */
  senderName: string | null;
  senderEmail: string | null;
  /** From the server-only send/inbox providers (env-based). */
  sendChannelConfigured: boolean;
  sendChannelLabel: string | null;
  inboxChannelConfigured: boolean;
  inboxChannelLabel: string | null;
  /** RLS-scoped counts. */
  leads: number;
  prospects: number;
  offers: number;
  /** Offers still in play (draft/ready/sent). */
  openOffers: number;
  jobs: number;
  followups: number;
  /** Foundation placeholders — 0 until a persistence layer provides them. */
  templateCount: number;
  pricingRuleCount: number;
}

export type WorkerRuntimeStatus =
  | "idle"
  | "working"
  | "waiting_approval"
  | "blocked"
  | "locked";

export interface WorkerRuntime {
  id: WorkerId;
  status: WorkerRuntimeStatus;
  /** German one-line current task. */
  currentTask: string;
  /** German one-line of today's honest output. */
  todayOutput: string;
  locked: boolean;
}

export type SetupStepId =
  | "company"
  | "workers"
  | "mailbox"
  | "template"
  | "pricing"
  | "approval"
  | "launch";

export interface SetupStep {
  id: SetupStepId;
  label: string;
  done: boolean;
  hint: string;
  /** In-page anchor or route the CTA links to. */
  href?: string;
}

export interface SetupStatus {
  steps: SetupStep[];
  doneCount: number;
  totalCount: number;
}

export type ActivityTone = "ready" | "waiting" | "info" | "done";

export interface ActivityItem {
  id: string;
  worker: string;
  text: string;
  tone: ActivityTone;
}

/* -------------------------------------------------------------------------- */
/* Workers: active vs. locked (bounded by the package worker limit)            */
/* -------------------------------------------------------------------------- */

/**
 * The package's worker allowance splits the catalog into active and locked.
 * For this foundation the active set is the first N workers of the catalog
 * (a config-backed default selection); persistence of a custom selection is a
 * documented next step.
 */
export function splitWorkers(pkg: OfficePackageId): {
  active: WorkerDef[];
  locked: WorkerDef[];
} {
  const allowance = Math.min(featureLimit(pkg, "worker_count"), DIGITAL_WORKERS.length);
  return {
    active: DIGITAL_WORKERS.slice(0, allowance),
    locked: DIGITAL_WORKERS.slice(allowance),
  };
}

/* -------------------------------------------------------------------------- */
/* Mailbox status                                                              */
/* -------------------------------------------------------------------------- */

export function deriveMailboxStatus(signals: OfficeSignals): MailboxStatus {
  if (signals.sendChannelConfigured) return "connected";
  if (signals.senderEmail || signals.senderName) return "configured";
  return "not_connected";
}

export function mailboxIsUsable(status: MailboxStatus): boolean {
  return status !== "not_connected";
}

/* -------------------------------------------------------------------------- */
/* Setup progress (7 steps)                                                    */
/* -------------------------------------------------------------------------- */

export function buildSetupStatus(signals: OfficeSignals): SetupStatus {
  const mailbox = deriveMailboxStatus(signals);
  const hasCompany = signals.companyName.trim().length > 0;
  const hasWorkers = splitWorkers(signals.packageId).active.length > 0;
  const hasMailbox = mailboxIsUsable(mailbox);
  const hasTemplate = signals.templateCount > 0;
  const hasPricing = signals.pricingRuleCount > 0;
  // Approval mode always has a safe default (Freigabe erforderlich) → step done.
  const hasApproval = true;
  const launched = hasCompany && hasMailbox && hasTemplate && hasPricing;

  const steps: SetupStep[] = [
    {
      id: "company",
      label: "Firmenprofil",
      done: hasCompany,
      hint: hasCompany ? signals.companyName : "Firmennamen hinterlegen",
      href: "#einrichtung",
    },
    {
      id: "workers",
      label: "Digitale Mitarbeiter",
      done: hasWorkers,
      hint: hasWorkers
        ? `${splitWorkers(signals.packageId).active.length} Mitarbeiter ausgewählt`
        : "Mitarbeiter auswählen",
      href: "#mitarbeiter",
    },
    {
      id: "mailbox",
      label: "Mailbox",
      done: hasMailbox,
      hint:
        mailbox === "connected"
          ? `Verbunden${signals.sendChannelLabel ? ` (${signals.sendChannelLabel})` : ""}`
          : mailbox === "configured"
            ? "Konfiguriert – noch nicht verbunden"
            : "Noch nicht verbunden",
      href: "#mailbox",
    },
    {
      id: "template",
      label: "Offerten-/PDF-Vorlage",
      done: hasTemplate,
      hint: hasTemplate ? "Vorlage vorbereitet" : "Vorlage vorbereiten",
      href: "#vorlage",
    },
    {
      id: "pricing",
      label: "Preisregeln",
      done: hasPricing,
      hint: hasPricing ? `${signals.pricingRuleCount} Regeln aktiv` : "Preisregeln festlegen",
      href: "#preisregeln",
    },
    {
      id: "approval",
      label: "Freigabe-Modus",
      done: hasApproval,
      hint: "Freigabe erforderlich (Standard)",
      href: "#freigabe",
    },
    {
      id: "launch",
      label: "Büro starten",
      done: launched,
      hint: launched ? "Büro ist startbereit" : "Schritte oben abschliessen",
    },
  ];

  return {
    steps,
    doneCount: steps.filter((s) => s.done).length,
    totalCount: steps.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Worker runtime (honest, derived from signals)                               */
/* -------------------------------------------------------------------------- */

function runtimeFor(id: WorkerId, signals: OfficeSignals): Omit<WorkerRuntime, "id" | "locked"> {
  const mailbox = deriveMailboxStatus(signals);
  const hasPricing = signals.pricingRuleCount > 0;
  const hasData = signals.leads + signals.offers + signals.jobs + signals.prospects > 0;

  switch (id) {
    case "office_manager":
      return hasData
        ? { status: "working", currentTask: "Erstellt den Heute-Überblick", todayOutput: "Heute-Überblick erstellt" }
        : { status: "idle", currentTask: "Bereit für den ersten Überblick", todayOutput: "Wartet auf erste Daten" };
    case "secretary":
      return mailboxIsUsable(mailbox)
        ? { status: "working", currentTask: "Beobachtet die Mailbox", todayOutput: "Bereit für eingehende Nachrichten" }
        : { status: "blocked", currentTask: "Wartet auf Mailbox-Verbindung", todayOutput: "Mailbox noch nicht verbunden" };
    case "sales":
      return signals.prospects > 0
        ? { status: "working", currentTask: "Verfolgt potenzielle Kunden", todayOutput: `${signals.prospects} Firmen im Blick` }
        : { status: "idle", currentTask: "Bereit, neue Firmen zu erfassen", todayOutput: "Noch keine Firmen erfasst" };
    case "offer_assistant":
      if (!hasPricing) {
        return { status: "waiting_approval", currentTask: "Wartet auf Preisregeln", todayOutput: "Preisregeln festlegen" };
      }
      return signals.openOffers > 0
        ? { status: "working", currentTask: "Bereitet Offerten vor", todayOutput: `${signals.openOffers} Offerten offen` }
        : { status: "idle", currentTask: "Bereit für die erste Offerte", todayOutput: "Keine offenen Offerten" };
    case "followup":
      if (signals.leads === 0) {
        return { status: "idle", currentTask: "Bereit, sobald erste Kunden erfasst sind", todayOutput: "Noch keine Kunden" };
      }
      return signals.followups > 0
        ? { status: "working", currentTask: "Verfolgt offene Kunden", todayOutput: `${signals.followups} Follow-ups geplant` }
        : { status: "waiting_approval", currentTask: "Schlägt Follow-ups vor", todayOutput: "Follow-ups vorbereiten" };
    case "calendar":
      return { status: "idle", currentTask: "Bereit, Termine vorzuschlagen", todayOutput: "Keine Termine geplant" };
    case "finance":
      return signals.jobs > 0
        ? { status: "working", currentTask: "Behält Aufträge im Blick", todayOutput: `${signals.jobs} Aufträge im Blick` }
        : { status: "idle", currentTask: "Bereit, sobald Aufträge vorhanden sind", todayOutput: "Noch keine Aufträge" };
    case "operations":
      return { status: "idle", currentTask: "Bereit für operative Aufgaben", todayOutput: "Keine offenen Checklisten" };
  }
}

/** Runtime for every catalog worker, with locked workers marked accordingly. */
export function buildWorkerRuntimes(signals: OfficeSignals): WorkerRuntime[] {
  const { active } = splitWorkers(signals.packageId);
  const activeIds = new Set(active.map((w) => w.id));
  return DIGITAL_WORKERS.map((w) => {
    if (!activeIds.has(w.id)) {
      return {
        id: w.id,
        status: "locked" as const,
        currentTask: "Ab höherem Paket verfügbar",
        todayOutput: "",
        locked: true,
      };
    }
    const r = runtimeFor(w.id, signals);
    return { id: w.id, locked: false, ...r };
  });
}

/* -------------------------------------------------------------------------- */
/* Activity feed (honest, derived)                                             */
/* -------------------------------------------------------------------------- */

export function buildActivityFeed(signals: OfficeSignals): ActivityItem[] {
  const mailbox = deriveMailboxStatus(signals);
  const items: ActivityItem[] = [];

  if (!mailboxIsUsable(mailbox)) {
    items.push({
      id: "mailbox",
      worker: "Büro-Manager",
      text: "Empfiehlt: Mailbox verbinden, damit die digitale Sekretärin starten kann.",
      tone: "waiting",
    });
  } else {
    items.push({
      id: "secretary",
      worker: "Digitale Sekretärin",
      text: "Ist bereit für eingehende Nachrichten.",
      tone: "ready",
    });
  }

  if (signals.pricingRuleCount === 0) {
    items.push({
      id: "pricing",
      worker: "Offerten-Assistent",
      text: "Wartet auf Preisregeln, bevor Offerten vorbereitet werden.",
      tone: "waiting",
    });
  } else if (signals.openOffers > 0) {
    items.push({
      id: "offers",
      worker: "Offerten-Assistent",
      text: `Behält ${signals.openOffers} offene Offerte(n) im Blick.`,
      tone: "info",
    });
  }

  if (signals.prospects > 0) {
    items.push({
      id: "sales",
      worker: "Digitaler Verkäufer",
      text: `Verfolgt ${signals.prospects} potenzielle Kund(en).`,
      tone: "info",
    });
  }

  if (signals.leads === 0) {
    items.push({
      id: "followup",
      worker: "Follow-up-Mitarbeiter",
      text: "Ist bereit, sobald die ersten Kunden erfasst sind.",
      tone: "ready",
    });
  } else if (signals.followups > 0) {
    items.push({
      id: "followup",
      worker: "Follow-up-Mitarbeiter",
      text: `Hat ${signals.followups} Follow-up(s) geplant.`,
      tone: "info",
    });
  }

  if (signals.templateCount === 0) {
    items.push({
      id: "template",
      worker: "Offerten-Assistent",
      text: "Schlägt vor, eine Offerten-Vorlage vorzubereiten.",
      tone: "waiting",
    });
  }

  return items.slice(0, 6);
}
