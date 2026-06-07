/**
 * Package gating matrix.
 *
 * Defines which module is available for which package. This is the single
 * source of truth for feature gating — components ask these helpers instead of
 * hardcoding package logic.
 *
 * Access levels:
 *  - "full"    full access to the module
 *  - "limited" partial / preview access (e.g. Marketing on Pro)
 *  - "locked"  not included, shows an upgrade state
 */

import type { PackageId } from "./packages";
import { PACKAGE_ORDER, getPackageName } from "./packages";

export type ModuleId =
  | "leadInbox"
  | "offerEngine"
  | "followUp"
  | "leadHunter"
  | "jobOrganizer"
  | "marketingAssistant"
  | "advancedReports"
  | "landingPage"
  | "b2bPipeline"
  | "bexio";

export type ModuleAccess = "full" | "limited" | "locked";

export const MODULE_GATES: Record<ModuleId, Record<PackageId, ModuleAccess>> = {
  leadInbox: { starter: "full", pro: "full", premium: "full" },
  offerEngine: { starter: "full", pro: "full", premium: "full" },
  followUp: { starter: "full", pro: "full", premium: "full" },
  leadHunter: { starter: "locked", pro: "full", premium: "full" },
  jobOrganizer: { starter: "locked", pro: "full", premium: "full" },
  marketingAssistant: { starter: "locked", pro: "limited", premium: "full" },
  advancedReports: { starter: "locked", pro: "limited", premium: "full" },
  landingPage: { starter: "locked", pro: "locked", premium: "full" },
  b2bPipeline: { starter: "locked", pro: "locked", premium: "full" },
  bexio: { starter: "locked", pro: "full", premium: "full" },
};

export function getModuleAccess(pkg: PackageId, moduleId: ModuleId): ModuleAccess {
  return MODULE_GATES[moduleId][pkg];
}

export function isModuleUnlocked(pkg: PackageId, moduleId: ModuleId): boolean {
  return getModuleAccess(pkg, moduleId) !== "locked";
}

export function isModuleLimited(pkg: PackageId, moduleId: ModuleId): boolean {
  return getModuleAccess(pkg, moduleId) === "limited";
}

/** The lowest package id that unlocks the given module. */
export function requiredPackageFor(moduleId: ModuleId): PackageId {
  const found = PACKAGE_ORDER.find((id) => isModuleUnlocked(id, moduleId));
  return found ?? "premium";
}

/** Human-readable required package name, e.g. "Pro". */
export function requiredPackageName(moduleId: ModuleId): string {
  return getPackageName(requiredPackageFor(moduleId));
}
