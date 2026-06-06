/**
 * Central add-on catalogue for ReinigungsPilot AI.
 *
 * Add-ons extend any package. Pricing fields are structured so the UI can
 * render consistent price labels (setup / monthly / one-time / range).
 */

export type AddOnCategory =
  | "Leads"
  | "Reichweite"
  | "Integration"
  | "Marketing"
  | "Konto"
  | "Setup & Daten";

export interface AddOn {
  id: string;
  name: string;
  description: string;
  category: AddOnCategory;
  /** One-time setup fee. */
  setupChf?: number;
  /** Recurring monthly fee. */
  monthlyChf?: number;
  /** Single one-time fee (not a setup fee). */
  oneTimeChf?: number;
  /** Lower bound of a setup price range. */
  setupFromChf?: number;
  /** Upper bound of a setup price range. */
  setupToChf?: number;
  /** Pricing unit suffix, e.g. "pro Nutzer". */
  unit?: string;
  /** Frequently chosen add-on. */
  popular?: boolean;
}

export const ADDONS: AddOn[] = [
  {
    id: "extra-lead-hunter",
    name: "Extra Lead Hunter",
    description:
      "Zusätzliches AI-Lead-Hunter-Kontingent für mehr qualifizierte B2B-Prospects pro Monat.",
    category: "Leads",
    monthlyChf: 249,
    popular: true,
  },
  {
    id: "extra-region",
    name: "Extra Region",
    description:
      "Erschliessen Sie eine weitere Region oder Gemeinde für Lead-Suche und Outreach.",
    category: "Reichweite",
    monthlyChf: 99,
  },
  {
    id: "website-form",
    name: "Website Form Integration",
    description:
      "Anbindung Ihres Web-Formulars, damit Anfragen automatisch in die Lead Inbox fliessen.",
    category: "Integration",
    setupChf: 790,
  },
  {
    id: "premium-landing-page",
    name: "Premium Landing Page",
    description:
      "Konversionsstarke Kampagnen-Landingpage mit Ihrem Branding und Lead-Erfassung.",
    category: "Marketing",
    setupChf: 1490,
    monthlyChf: 49,
  },
  {
    id: "google-ads-setup",
    name: "Google Ads Setup",
    description:
      "Professionelle Einrichtung Ihrer Google-Ads-Kampagnen inklusive Tracking.",
    category: "Marketing",
    setupChf: 990,
  },
  {
    id: "google-ads-betreuung",
    name: "Google Ads Betreuung",
    description:
      "Laufende Optimierung und Reporting Ihrer Google-Ads-Kampagnen.",
    category: "Marketing",
    monthlyChf: 299,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Integration",
    description:
      "Empfangen und beantworten Sie Anfragen direkt über WhatsApp – inklusive Vorlagen.",
    category: "Integration",
    setupChf: 790,
    monthlyChf: 79,
  },
  {
    id: "review-funnel",
    name: "Review Funnel",
    description:
      "Automatisierter Bewertungs-Funnel für mehr Google-Rezensionen nach jedem Auftrag.",
    category: "Marketing",
    setupChf: 490,
    monthlyChf: 49,
    popular: true,
  },
  {
    id: "premium-pdf-design",
    name: "Premium PDF Design",
    description:
      "Individuell gestaltetes Offerten-Layout im Look Ihres Betriebs.",
    category: "Setup & Daten",
    oneTimeChf: 490,
  },
  {
    id: "extra-user",
    name: "Extra User",
    description:
      "Zusätzlicher Team-Zugang über die im Paket enthaltenen Nutzer hinaus.",
    category: "Konto",
    monthlyChf: 29,
    unit: "pro Nutzer / Monat",
  },
  {
    id: "extra-mailbox",
    name: "Extra Mailbox",
    description:
      "Zusätzliches Postfach für weitere Standorte oder Service-Bereiche.",
    category: "Konto",
    monthlyChf: 49,
    unit: "pro Postfach / Monat",
  },
  {
    id: "custom-automation",
    name: "Custom Automation",
    description:
      "Massgeschneiderte Automationen für Ihre individuellen Abläufe und Tools.",
    category: "Setup & Daten",
    setupFromChf: 490,
    setupToChf: 1500,
  },
  {
    id: "datenmigration",
    name: "Datenmigration",
    description:
      "Übernahme Ihrer bestehenden Kunden-, Service- und Offertendaten in ReinigungsPilot AI.",
    category: "Setup & Daten",
    setupFromChf: 490,
    setupToChf: 1500,
  },
  {
    id: "content-paket",
    name: "Done-for-you Content Paket",
    description:
      "Wir produzieren monatlich fertige Posts, Captions und Beiträge für Ihre Kanäle.",
    category: "Marketing",
    monthlyChf: 399,
  },
];

export const ADDON_CATEGORY_ORDER: AddOnCategory[] = [
  "Leads",
  "Reichweite",
  "Integration",
  "Marketing",
  "Konto",
  "Setup & Daten",
];
