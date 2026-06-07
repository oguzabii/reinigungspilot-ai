/**
 * Central package definitions for ReinigungsPilot AI.
 *
 * This is the single source of truth for package pricing and limits.
 * Components must read limits from here — never hardcode them inline.
 */

export type PackageId = "starter" | "pro" | "premium";

export interface PackageLimits {
  /** Administrator seats included. */
  adminUsers: number;
  /** Team member seats included. */
  teamUsers: number;
  /** Incoming leads processed per month. */
  leadsPerMonth: number;
  /** Configurable cleaning services. */
  services: number;
  /** Configurable pricing models. */
  pricingModels: number;
  /** PDF offers that can be generated per month. */
  pdfOffersPerMonth: number;
  /** Connected mailboxes. */
  mailboxes: number;
  /** AI Lead Hunter prospects per month (0 = not included). */
  leadHunterProspects: number;
  /** Included campaign landing pages. */
  campaignLandingPages: number;
  /** Support hours per month. */
  supportHoursPerMonth: number;
  /** Job & calendar organizer available. */
  jobOrganizer: boolean;
  /** Weekly owner report included. */
  weeklyOwnerReport: boolean;
  /** Monthly strategy report included. */
  monthlyStrategyReport: boolean;
  /** Advanced B2B pipeline included. */
  advancedB2bPipeline: boolean;
  /** bexio handover level: none | connect | plus. */
  bexio: "none" | "connect" | "plus";
}

export interface PackageDef {
  id: PackageId;
  /** Tier name, e.g. "Pro". */
  name: string;
  /** Product name, e.g. "AI Sales Autopilot". */
  productName: string;
  /** One-line positioning. */
  tagline: string;
  /** Short paragraph describing the focus of the package. */
  description: string;
  /** Short audience chip, e.g. "Beste Wahl". */
  audienceTag: string;
  /** "Für wen geeignet?" — one-sentence recommendation. */
  audience: string;
  setupChf: number;
  monthlyChf: number;
  /** The package we primarily want to sell. */
  highlight: boolean;
  /** Optional marketing badge. */
  badge?: string;
  /** Key focus bullet points. */
  focus: string[];
  limits: PackageLimits;
}

export const PACKAGES: Record<PackageId, PackageDef> = {
  starter: {
    id: "starter",
    name: "Starter",
    productName: "AI Offer Büro",
    tagline: "Das digitale Offert-Büro für eingehende Anfragen.",
    description:
      "Sammelt eingehende Leads zentral, berechnet Preise automatisch und erstellt professionelle PDF-Offerten inklusive Follow-up-Erinnerungen.",
    audienceTag: "Für kleine Teams",
    audience:
      "Ideal für kleinere Betriebe, die bereits Anfragen erhalten und zuerst Ordnung, Tempo und professionelle Offerten wollen.",
    setupChf: 2490,
    monthlyChf: 299,
    highlight: false,
    focus: [
      "Eingehende Leads zentral erfassen",
      "Automatische Preisberechnung",
      "PDF-Offerten in Minuten",
      "Follow-up-Erinnerungen",
    ],
    limits: {
      adminUsers: 1,
      teamUsers: 1,
      leadsPerMonth: 100,
      services: 3,
      pricingModels: 1,
      pdfOffersPerMonth: 50,
      mailboxes: 1,
      leadHunterProspects: 0,
      campaignLandingPages: 0,
      supportHoursPerMonth: 1,
      bexio: "none",
      jobOrganizer: false,
      weeklyOwnerReport: false,
      monthlyStrategyReport: false,
      advancedB2bPipeline: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    productName: "AI Sales Autopilot",
    tagline: "Der Verkaufsmotor, der aktiv neue B2B-Kunden findet.",
    description:
      "Alles aus Starter – plus AI Lead Hunter, Auftrags- und Kalenderplanung, bexio Connect und ein wöchentlicher Chef-Report.",
    audienceTag: "Beste Wahl",
    audience:
      "Die beste Wahl für die meisten Service-Betriebe: für KMU, die aktiv neue B2B-Kunden gewinnen und ihren Verkauf systematisieren wollen.",
    setupChf: 4990,
    monthlyChf: 599,
    highlight: true,
    badge: "Beliebteste Wahl",
    focus: [
      "Alles aus Starter",
      "AI Lead Hunter findet neue B2B-Kunden",
      "Auftrags- & Kalenderplanung",
      "bexio Connect: Übergabe an die Buchhaltung",
      "Wöchentlicher Chef-Report",
    ],
    limits: {
      adminUsers: 1,
      teamUsers: 3,
      leadsPerMonth: 300,
      services: 6,
      pricingModels: 3,
      pdfOffersPerMonth: 150,
      mailboxes: 2,
      leadHunterProspects: 100,
      campaignLandingPages: 0,
      supportHoursPerMonth: 2,
      bexio: "connect",
      jobOrganizer: true,
      weeklyOwnerReport: true,
      monthlyStrategyReport: false,
      advancedB2bPipeline: false,
    },
  },
  premium: {
    id: "premium",
    name: "Premium",
    productName: "AI Growth Office",
    tagline: "Das komplette Wachstumsbüro für ambitionierte Betriebe.",
    description:
      "Alles aus Pro – plus bexio Connect Plus, erweiterte B2B-Pipeline, Content- und Strategie-Reports sowie deutlich höhere Limiten.",
    audienceTag: "Für Wachstum & B2B",
    audience:
      "Für wachstumsorientierte Betriebe mit mehreren Teams und ehrgeiziger B2B-Expansion über mehrere Regionen.",
    setupChf: 7490,
    monthlyChf: 999,
    highlight: false,
    focus: [
      "Alles aus Pro",
      "bexio Connect Plus",
      "Erweiterte B2B-Pipeline",
      "Content- & Strategie-Reports",
      "Mehr Nutzer & höhere Limiten",
    ],
    limits: {
      adminUsers: 1,
      teamUsers: 10,
      leadsPerMonth: 1000,
      services: 10,
      pricingModels: 6,
      pdfOffersPerMonth: 500,
      mailboxes: 5,
      leadHunterProspects: 250,
      campaignLandingPages: 1,
      supportHoursPerMonth: 4,
      bexio: "plus",
      jobOrganizer: true,
      weeklyOwnerReport: true,
      monthlyStrategyReport: true,
      advancedB2bPipeline: true,
    },
  },
};

export const PACKAGE_ORDER: PackageId[] = ["starter", "pro", "premium"];

export const PACKAGE_LIST: PackageDef[] = PACKAGE_ORDER.map((id) => PACKAGES[id]);

export function getPackage(id: PackageId): PackageDef {
  return PACKAGES[id];
}

export function getPackageName(id: PackageId): string {
  return PACKAGES[id].name;
}
