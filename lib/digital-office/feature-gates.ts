/**
 * Digital Office Builder — feature gating (vNext).
 *
 * The single place that answers "is this feature available for this package?".
 * Every answer is DERIVED from `OFFICE_PACKAGES` limits in
 * `lib/digital-office/pricing.ts` — no numbers or tier logic are duplicated here.
 *
 * The UI uses these helpers to show three honest states: available, locked, or
 * "upgrade required". Locked copy stays friendly ("Ab Pro verfügbar") — never
 * negative. Pure functions, client- and server-safe.
 */

import {
  OFFICE_PACKAGE_ORDER,
  OFFICE_PACKAGES,
  getOfficePackage,
  getOfficePackageName,
  officePackageRank,
  type OfficePackageId,
} from "./pricing";

/** Boolean (on/off) features that gate behaviour. */
export type OfficeFeature =
  | "ask_office"
  | "automatic_mode"
  | "pricing_rules_advanced"
  | "follow_up_support"
  | "offer_support"
  | "advanced_reporting"
  | "team_support";

/** Numeric (count / quota) features. */
export type OfficeCountFeature =
  | "worker_count"
  | "mailbox_count"
  | "pdf_template_count"
  | "office_count"
  | "ai_task_limit";

export type FeatureAvailability = "available" | "locked";

/** Resolve a boolean feature against a package's limits. */
export function hasFeature(pkg: OfficePackageId, feature: OfficeFeature): boolean {
  const limits = getOfficePackage(pkg).limits;
  switch (feature) {
    case "ask_office":
      return limits.askOffice !== "none";
    case "automatic_mode":
      return limits.automation === "semi_auto";
    case "pricing_rules_advanced":
      return limits.pricingRules === "advanced";
    case "follow_up_support":
      return limits.followUpSupport;
    case "offer_support":
      return limits.offerSupport;
    case "advanced_reporting":
      return limits.advancedReporting;
    case "team_support":
      return limits.teamSupport;
  }
}

/** Numeric limit for a count feature. */
export function featureLimit(
  pkg: OfficePackageId,
  feature: OfficeCountFeature,
): number {
  const limits = getOfficePackage(pkg).limits;
  switch (feature) {
    case "worker_count":
      return limits.workers;
    case "mailbox_count":
      return limits.mailboxes;
    case "pdf_template_count":
      return limits.pdfTemplates;
    case "office_count":
      return limits.offices;
    case "ai_task_limit":
      return limits.aiTasksPerMonth;
  }
}

/** Convenience: is the Ask Office assistant enabled at all for this package? */
export function isAskOfficeEnabled(pkg: OfficePackageId): boolean {
  return hasFeature(pkg, "ask_office");
}

/** `available` / `locked` for a boolean feature — the value the UI renders. */
export function featureAvailability(
  pkg: OfficePackageId,
  feature: OfficeFeature,
): FeatureAvailability {
  return hasFeature(pkg, feature) ? "available" : "locked";
}

/** The lowest package id that unlocks a boolean feature (or null if none does). */
export function requiredPackageForFeature(
  feature: OfficeFeature,
): OfficePackageId | null {
  return (
    OFFICE_PACKAGE_ORDER.find((id) => hasFeature(id, feature)) ?? null
  );
}

/** Human-readable required package name, e.g. "Pro". Empty string if none. */
export function requiredPackageNameForFeature(feature: OfficeFeature): string {
  const id = requiredPackageForFeature(feature);
  return id ? getOfficePackageName(id) : "";
}

/** Friendly German lock hint, e.g. "Ab Pro verfügbar". */
export function lockedHint(feature: OfficeFeature): string {
  const name = requiredPackageNameForFeature(feature);
  return name ? `Ab ${name} verfügbar` : "Bald verfügbar";
}

/** Friendly German upgrade CTA, e.g. "Mit Pro öffnen". */
export function upgradeCta(feature: OfficeFeature): string {
  const name = requiredPackageNameForFeature(feature);
  return name ? `Mit ${name} öffnen` : "Upgrade";
}

/** True if `pkg` is at least as high as `min` in the package order. */
export function meetsPackage(
  pkg: OfficePackageId,
  min: OfficePackageId,
): boolean {
  return officePackageRank(pkg) >= officePackageRank(min);
}

/** Re-export for callers that only need the package map. */
export { OFFICE_PACKAGES };
