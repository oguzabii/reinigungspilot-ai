/**
 * Digital Office Builder — digital worker catalog (vNext).
 *
 * The central, ordered catalog of digital workers a customer can put to work in
 * their office. Pure data: each entry carries German display copy, the worker's
 * tasks and a lucide icon for the card. Runtime status (idle / working / waiting
 * for approval / blocked / locked) is NOT here — it is derived per office from
 * real tenant data in `lib/digital-office/office.ts`.
 *
 * Which workers are active is bounded by the package's `workers` limit
 * (see `lib/digital-office/pricing.ts`). Server-rendered cards may use `icon`
 * directly; the icon is a component reference and is never passed across the
 * server/client boundary.
 */

import {
  LayoutGrid,
  Inbox,
  Target,
  FileText,
  BellRing,
  CalendarClock,
  Receipt,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export type WorkerId =
  | "office_manager"
  | "secretary"
  | "sales"
  | "offer_assistant"
  | "followup"
  | "calendar"
  | "finance"
  | "operations";

export interface WorkerDef {
  id: WorkerId;
  /** German display name. */
  name: string;
  /** Short German role line. */
  role: string;
  /** What the worker does (German bullets). */
  tasks: string[];
  icon: LucideIcon;
  /** Tailwind accent classes for the card icon chip. */
  accent: { bg: string; text: string; ring: string };
}

const ACCENTS = {
  navy: { bg: "bg-navy-50", text: "text-navy-700", ring: "ring-navy-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-100" },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-100",
  },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100" },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-100",
  },
} as const;

/** Ordered catalog. The package `workers` limit decides how many are active. */
export const DIGITAL_WORKERS: WorkerDef[] = [
  {
    id: "office_manager",
    name: "Büro-Manager",
    role: "Behält den Überblick",
    tasks: [
      "Fasst den heutigen Tag zusammen",
      "Prüft offene Aufgaben",
      "Erstellt den Inhaber-Report",
    ],
    icon: LayoutGrid,
    accent: ACCENTS.navy,
  },
  {
    id: "secretary",
    name: "Digitale Sekretärin",
    role: "Kümmert sich um die Mailbox",
    tasks: [
      "Liest eingehende Nachrichten",
      "Bereitet Antworten vor",
      "Erstellt Aufgaben aus Mails",
    ],
    icon: Inbox,
    accent: ACCENTS.blue,
  },
  {
    id: "sales",
    name: "Digitaler Verkäufer",
    role: "Findet neue Kunden",
    tasks: [
      "Bereitet Erstkontakte vor",
      "Verfolgt potenzielle Kunden",
      "Schlägt Follow-ups vor",
    ],
    icon: Target,
    accent: ACCENTS.emerald,
  },
  {
    id: "offer_assistant",
    name: "Offerten-Assistent",
    role: "Bereitet Offerten vor",
    tasks: [
      "Erstellt Offerten",
      "Nutzt Ihre Preisregeln",
      "Bereitet Offerten-Entwürfe / PDFs vor",
    ],
    icon: FileText,
    accent: ACCENTS.blue,
  },
  {
    id: "followup",
    name: "Follow-up-Mitarbeiter",
    role: "Bleibt am Kunden dran",
    tasks: [
      "Verfolgt unbeantwortete Kunden",
      "Schlägt Follow-ups vor oder bereitet sie vor",
    ],
    icon: BellRing,
    accent: ACCENTS.amber,
  },
  {
    id: "calendar",
    name: "Termin-Assistent",
    role: "Plant Termine",
    tasks: [
      "Schlägt Termine vor",
      "Bereitet Terminnachrichten vor",
    ],
    icon: CalendarClock,
    accent: ACCENTS.violet,
  },
  {
    id: "finance",
    name: "Finanz-Assistent",
    role: "Behält Rechnungen im Blick",
    tasks: [
      "Verfolgt Rechnungs-/Zahlungsaufgaben, wenn Daten vorhanden sind",
    ],
    icon: Receipt,
    accent: ACCENTS.emerald,
  },
  {
    id: "operations",
    name: "Operations-Assistent",
    role: "Hält den Betrieb am Laufen",
    tasks: [
      "Erstellt operative Aufgaben und Checklisten",
    ],
    icon: Briefcase,
    accent: ACCENTS.navy,
  },
];

export function getWorker(id: WorkerId): WorkerDef {
  const found = DIGITAL_WORKERS.find((w) => w.id === id);
  if (!found) throw new Error(`[digital-office] unknown worker: ${id}`);
  return found;
}
