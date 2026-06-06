/**
 * Module & navigation metadata.
 *
 * - DEMO_VIEWS drives the demo dashboard sidebar (label, icon, group, gate).
 * - PRODUCT_MODULES drives the marketing "modules overview" on the landing page.
 *
 * Gating itself lives in package-gates.ts — this file only describes the views.
 */

import type { LucideIcon } from "lucide-react";
import {
  Gauge,
  Inbox,
  Crosshair,
  FileText,
  BellRing,
  CalendarCheck,
  Megaphone,
  Store,
  Table2,
  Route,
  ChartColumn,
  Workflow,
  Globe,
} from "lucide-react";
import type { ModuleId } from "./package-gates";
import type { PackageId } from "./packages";

export type DemoViewId =
  | "dashboard"
  | "leadInbox"
  | "leadHunter"
  | "offerEngine"
  | "followUp"
  | "jobOrganizer"
  | "marketingAssistant"
  | "addOns"
  | "comparison"
  | "customerSuccess";

export type DemoNavGroup =
  | "Überblick"
  | "Vertrieb"
  | "Betrieb"
  | "Wachstum"
  | "Konto";

export interface DemoView {
  id: DemoViewId;
  label: string;
  description: string;
  icon: LucideIcon;
  group: DemoNavGroup;
  /** If set, the view's availability follows this gated module. */
  gate?: ModuleId;
}

export const DEMO_VIEWS: DemoView[] = [
  {
    id: "dashboard",
    label: "Chef-Dashboard",
    description: "Überblick über Leads, Offerten, Follow-ups und Umsatz.",
    icon: Gauge,
    group: "Überblick",
  },
  {
    id: "leadInbox",
    label: "Lead Inbox",
    description: "Alle eingehenden Anfragen zentral und priorisiert.",
    icon: Inbox,
    group: "Vertrieb",
    gate: "leadInbox",
  },
  {
    id: "leadHunter",
    label: "AI Lead Hunter",
    description: "Findet aktiv neue B2B-Kunden in Ihrer Region.",
    icon: Crosshair,
    group: "Vertrieb",
    gate: "leadHunter",
  },
  {
    id: "offerEngine",
    label: "AI Offerten-Engine",
    description: "Preisvorschlag, PDF-Offerte und E-Mail in Minuten.",
    icon: FileText,
    group: "Vertrieb",
    gate: "offerEngine",
  },
  {
    id: "followUp",
    label: "Follow-up Center",
    description: "24h-, 48h- und 5-Tage-Follow-ups automatisch getaktet.",
    icon: BellRing,
    group: "Vertrieb",
    gate: "followUp",
  },
  {
    id: "jobOrganizer",
    label: "Auftrags-Organizer",
    description: "Gewonnene Offerten werden zu geplanten Aufträgen.",
    icon: CalendarCheck,
    group: "Betrieb",
    gate: "jobOrganizer",
  },
  {
    id: "marketingAssistant",
    label: "AI Marketing-Assistent",
    description: "Content für Google, Social Media und lokales SEO.",
    icon: Megaphone,
    group: "Wachstum",
    gate: "marketingAssistant",
  },
  {
    id: "addOns",
    label: "Add-on Store",
    description: "Erweitern Sie Ihr Paket mit zusätzlichen Modulen.",
    icon: Store,
    group: "Konto",
  },
  {
    id: "comparison",
    label: "Paketvergleich",
    description: "Alle Limiten und Leistungen im direkten Vergleich.",
    icon: Table2,
    group: "Konto",
  },
  {
    id: "customerSuccess",
    label: "12-Monats-Plan",
    description: "Ihr Begleit- und Retentionsplan über 12 Monate.",
    icon: Route,
    group: "Konto",
  },
];

export const DEMO_NAV_GROUPS: DemoNavGroup[] = [
  "Überblick",
  "Vertrieb",
  "Betrieb",
  "Wachstum",
  "Konto",
];

export interface ProductModule {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Lowest package that includes this module. */
  availableFrom: PackageId;
}

export const PRODUCT_MODULES: ProductModule[] = [
  {
    id: "leadInbox",
    label: "Lead Inbox",
    description:
      "Jede Anfrage aus Web, Telefon, E-Mail und Empfehlungen landet zentral und priorisiert an einem Ort.",
    icon: Inbox,
    availableFrom: "starter",
  },
  {
    id: "offerEngine",
    label: "AI Offerten-Engine",
    description:
      "Berechnet faire Preise, erstellt PDF-Offerten und formuliert die passende E-Mail – in Minuten statt Stunden.",
    icon: FileText,
    availableFrom: "starter",
  },
  {
    id: "followUp",
    label: "Follow-up Center",
    description:
      "Automatische 24h-, 48h- und 5-Tage-Sequenzen, damit keine Offerte mehr vergessen geht.",
    icon: BellRing,
    availableFrom: "starter",
  },
  {
    id: "leadHunter",
    label: "AI Lead Hunter",
    description:
      "Findet aktiv neue B2B-Kunden – Verwaltungen, Praxen, Büros, Umzugsfirmen und Gewerbe – inklusive Erstnachricht.",
    icon: Crosshair,
    availableFrom: "pro",
  },
  {
    id: "jobOrganizer",
    label: "Auftrags-Organizer",
    description:
      "Gewonnene Offerten werden zu geplanten Aufträgen mit Termin, Team-Notiz und Kalenderstatus.",
    icon: CalendarCheck,
    availableFrom: "pro",
  },
  {
    id: "ownerReport",
    label: "Chef-Report",
    description:
      "Wöchentlicher Überblick für die Inhaberin oder den Inhaber: Leads, Conversion, Umsatz und nächste Schritte.",
    icon: ChartColumn,
    availableFrom: "pro",
  },
  {
    id: "marketingAssistant",
    label: "AI Marketing-Assistent",
    description:
      "Erstellt Google-Business-Posts, Social-Captions, Kampagnenideen und lokale SEO-Themen.",
    icon: Megaphone,
    availableFrom: "pro",
  },
  {
    id: "b2bPipeline",
    label: "Erweiterte B2B-Pipeline",
    description:
      "Strukturierte Pipeline für grössere B2B-Abschlüsse mit mehreren Phasen und Verantwortlichkeiten.",
    icon: Workflow,
    availableFrom: "premium",
  },
  {
    id: "landingPage",
    label: "Kampagnen-Landingpage",
    description:
      "Eine inkludierte, konversionsstarke Landingpage für gezielte Akquise-Kampagnen.",
    icon: Globe,
    availableFrom: "premium",
  },
];
