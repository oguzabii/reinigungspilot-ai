/**
 * Digital Office Builder — central package & add-on config (vNext).
 *
 * This is the SINGLE SOURCE OF TRUTH for the new self-service product direction:
 * Klarsa as a "Digital Office Builder". Components must read prices and limits
 * from here — never hardcode a CHF number or a limit inline.
 *
 * It is intentionally SEPARATE from `lib/packages.ts` (the older, setup-fee-based
 * sales packages used by the public marketing/pricing pages). That file is left
 * untouched so nothing existing breaks. The mapping `tierToOfficePackage()`
 * bridges the existing DB tier (`companies.tier` = starter | pro | premium) to
 * this new five-tier model.
 *
 * Pure data + helpers only — no I/O, no secrets, client- and server-safe.
 */

/** The five self-service packages. `free` and `business` are new vs. the DB tier. */
export type OfficePackageId = "free" | "starter" | "pro" | "premium" | "business";

/** How capable the Ask Office assistant is for a package. */
export type AskOfficeLevel = "none" | "standard" | "pro" | "full";

/** Highest automation mode a package may use. Ordered none < draft < approval < semi_auto. */
export type AutomationLevel = "none" | "draft" | "approval" | "semi_auto";

/** Pricing-rule capability for a package. */
export type PricingRulesLevel = "none" | "basic" | "advanced";

export interface OfficePackageLimits {
  /** Digital offices (workspaces) included. */
  offices: number;
  /** Digital workers that can be active at once. */
  workers: number;
  /** Mailbox configurations. */
  mailboxes: number;
  /** Offer / PDF templates. */
  pdfTemplates: number;
  /** Pricing-rule builder capability. */
  pricingRules: PricingRulesLevel;
  /** Included AI tasks/actions per month (initial defaults — tune centrally here). */
  aiTasksPerMonth: number;
  /** Ask Office assistant level. */
  askOffice: AskOfficeLevel;
  /** Highest automation mode allowed. */
  automation: AutomationLevel;
  /** Active follow-up support by the digital workers. */
  followUpSupport: boolean;
  /** Offer-creation support by the digital workers. */
  offerSupport: boolean;
  /** Advanced reporting. */
  advancedReporting: boolean;
  /** Team / role support (only where existing membership patterns allow). */
  teamSupport: boolean;
}

export interface OfficePackageDef {
  id: OfficePackageId;
  /** Display name, e.g. "Pro". */
  name: string;
  /** Monthly price in CHF (0 for Free). */
  monthlyChf: number;
  /** One-line German positioning. */
  tagline: string;
  /** Short German description. */
  description: string;
  /** The package we primarily want to sell. */
  highlight: boolean;
  /** German feature bullets for the package card. */
  features: string[];
  limits: OfficePackageLimits;
}

export const OFFICE_PACKAGES: Record<OfficePackageId, OfficePackageDef> = {
  free: {
    id: "free",
    name: "Free",
    monthlyChf: 0,
    tagline: "Ihr digitales Büro zum Ausprobieren.",
    description:
      "Lernen Sie das digitale Büro kennen: ein Mitarbeiter, Demo-Umfang, keine echte Automatisierung.",
    highlight: false,
    features: [
      "1 digitales Büro",
      "1 digitaler Mitarbeiter",
      "Demo / sehr begrenzte Nutzung",
      "Kein Ask Office",
      "Keine echte Automatisierung",
    ],
    limits: {
      offices: 1,
      workers: 1,
      mailboxes: 0,
      pdfTemplates: 0,
      pricingRules: "none",
      aiTasksPerMonth: 0,
      askOffice: "none",
      automation: "none",
      followUpSupport: false,
      offerSupport: false,
      advancedReporting: false,
      teamSupport: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthlyChf: 19,
    tagline: "Der einfache Einstieg ins digitale Büro.",
    description:
      "Drei digitale Mitarbeiter, eine Mailbox, eine Offerten-Vorlage und einfache Preisregeln – im Entwurf- und Freigabe-Modus.",
    highlight: false,
    features: [
      "1 digitales Büro",
      "3 digitale Mitarbeiter",
      "1 Mailbox-Konfiguration",
      "1 Offerten-/PDF-Vorlage",
      "Einfache Preisregeln",
      "Nur Entwurf / Freigabe-Modus",
      "Kein Ask Office",
    ],
    limits: {
      offices: 1,
      workers: 3,
      mailboxes: 1,
      pdfTemplates: 1,
      pricingRules: "basic",
      aiTasksPerMonth: 200,
      askOffice: "none",
      automation: "approval",
      followUpSupport: false,
      offerSupport: false,
      advancedReporting: false,
      teamSupport: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyChf: 49,
    tagline: "Das digitale Büro, das aktiv mitarbeitet.",
    description:
      "Sieben Mitarbeiter, mehr Mailboxen und Vorlagen, erweiterte Preisregeln, Follow-up- und Offerten-Unterstützung – mit Ask Office.",
    highlight: true,
    features: [
      "1 digitales Büro",
      "7 digitale Mitarbeiter",
      "3 Mailbox-Konfigurationen",
      "3 Offerten-/PDF-Vorlagen",
      "Erweiterte Preisregeln",
      "Follow-up-Unterstützung",
      "Offerten-Erstellung unterstützt",
      "Ask Office aktiviert",
      "Automatisierung mit Freigabe",
    ],
    limits: {
      offices: 1,
      workers: 7,
      mailboxes: 3,
      pdfTemplates: 3,
      pricingRules: "advanced",
      aiTasksPerMonth: 1000,
      askOffice: "standard",
      automation: "approval",
      followUpSupport: true,
      offerSupport: true,
      advancedReporting: false,
      teamSupport: false,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyChf: 99,
    tagline: "Mehr Mitarbeiter, mehr Automatisierung, mehr Überblick.",
    description:
      "Bis zu 15 Mitarbeiter, erweiterte Automatisierung mit Freigaben, erweitertes Reporting und Ask Office Pro.",
    highlight: false,
    features: [
      "1 digitales Büro",
      "15 digitale Mitarbeiter",
      "5 Mailbox-Konfigurationen",
      "5 Offerten-/PDF-Vorlagen",
      "Erweiterte Automatisierung",
      "Erweitertes Reporting",
      "Ask Office Pro",
      "Halbautomatische Abläufe mit Freigaben",
    ],
    limits: {
      offices: 1,
      workers: 15,
      mailboxes: 5,
      pdfTemplates: 5,
      pricingRules: "advanced",
      aiTasksPerMonth: 3000,
      askOffice: "pro",
      automation: "semi_auto",
      followUpSupport: true,
      offerSupport: true,
      advancedReporting: true,
      teamSupport: false,
    },
  },
  business: {
    id: "business",
    name: "Business",
    monthlyChf: 199,
    tagline: "Mehrere digitale Büros für wachsende Teams.",
    description:
      "Bis zu drei digitale Büros, 30 Mitarbeiter, Team-/Rollen-Unterstützung, volles Ask Office und höhere Limiten.",
    highlight: false,
    features: [
      "Bis zu 3 digitale Büros",
      "30 digitale Mitarbeiter",
      "10 Mailbox-Konfigurationen",
      "15 Offerten-/PDF-Vorlagen",
      "Team-/Rollen-Unterstützung",
      "Volles Ask Office",
      "Höhere Limiten",
    ],
    limits: {
      offices: 3,
      workers: 30,
      mailboxes: 10,
      pdfTemplates: 15,
      pricingRules: "advanced",
      aiTasksPerMonth: 10000,
      askOffice: "full",
      automation: "semi_auto",
      followUpSupport: true,
      offerSupport: true,
      advancedReporting: true,
      teamSupport: true,
    },
  },
};

/** Low → high. Drives ranking, "required package" lookups and the pricing grid. */
export const OFFICE_PACKAGE_ORDER: OfficePackageId[] = [
  "free",
  "starter",
  "pro",
  "premium",
  "business",
];

export const OFFICE_PACKAGE_LIST: OfficePackageDef[] = OFFICE_PACKAGE_ORDER.map(
  (id) => OFFICE_PACKAGES[id],
);

export function getOfficePackage(id: OfficePackageId): OfficePackageDef {
  return OFFICE_PACKAGES[id];
}

export function getOfficePackageName(id: OfficePackageId): string {
  return OFFICE_PACKAGES[id].name;
}

/** Position in `OFFICE_PACKAGE_ORDER` (0 = Free). Used to compare tiers. */
export function officePackageRank(id: OfficePackageId): number {
  return OFFICE_PACKAGE_ORDER.indexOf(id);
}

/**
 * Bridge the existing DB tier (`companies.tier`) to the new five-tier model.
 * The DB only knows starter | pro | premium today; a missing tier maps to Free.
 * Business is not yet reachable from the DB — see the foundation doc for the
 * planned `office_packages` persistence step.
 */
export function tierToOfficePackage(
  tier: "starter" | "pro" | "premium" | null | undefined,
): OfficePackageId {
  switch (tier) {
    case "starter":
      return "starter";
    case "pro":
      return "pro";
    case "premium":
      return "premium";
    default:
      return "free";
  }
}

/* -------------------------------------------------------------------------- */
/* Add-ons                                                                     */
/* -------------------------------------------------------------------------- */

export type OfficeAddOnBilling = "monthly" | "one_time";

export interface OfficeAddOn {
  id: string;
  /** German name. */
  name: string;
  /** German one-line description. */
  description: string;
  /** Price in CHF. */
  priceChf: number;
  billing: OfficeAddOnBilling;
  /** Optional unit suffix, e.g. "pro Mitarbeiter / Monat". */
  unit?: string;
}

export const OFFICE_ADDONS: OfficeAddOn[] = [
  {
    id: "extra-worker",
    name: "Zusätzlicher digitaler Mitarbeiter",
    description: "Erweitern Sie Ihr Büro um einen weiteren digitalen Mitarbeiter.",
    priceChf: 5,
    billing: "monthly",
    unit: "pro Mitarbeiter / Monat",
  },
  {
    id: "extra-mailbox",
    name: "Zusätzliche Mailbox",
    description: "Eine weitere Mailbox-Konfiguration für weitere Bereiche.",
    priceChf: 5,
    billing: "monthly",
    unit: "pro Mailbox / Monat",
  },
  {
    id: "extra-template",
    name: "Zusätzliche Offerten-Vorlage",
    description: "Eine weitere Offerten-/PDF-Vorlage für andere Leistungen.",
    priceChf: 5,
    billing: "monthly",
    unit: "pro Vorlage / Monat",
  },
  {
    id: "extra-office",
    name: "Zusätzliches digitales Büro",
    description: "Ein weiteres digitales Büro – z. B. für einen zweiten Standort.",
    priceChf: 19,
    billing: "monthly",
    unit: "pro Büro / Monat",
  },
  {
    id: "extra-ai-tasks",
    name: "1’000 zusätzliche KI-Aufgaben",
    description: "Ein Paket mit 1’000 zusätzlichen KI-Aufgaben/Aktionen.",
    priceChf: 9,
    billing: "one_time",
    unit: "pro 1’000 Aufgaben",
  },
];
