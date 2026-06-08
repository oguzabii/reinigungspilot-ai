import {
  Crosshair,
  Gauge,
  FileText,
  BellRing,
  CalendarCheck,
  ChartColumn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const STEPS: {
  step: number;
  icon: LucideIcon;
  title: string;
  text: string;
}[] = [
  {
    step: 1,
    icon: Crosshair,
    title: "Leads finden",
    text: "KI Lead Hunter & zentrale Inbox für alle Anfragen.",
  },
  {
    step: 2,
    icon: Gauge,
    title: "Leads bewerten",
    text: "Automatisches Scoring nach Potenzial und Dringlichkeit.",
  },
  {
    step: 3,
    icon: FileText,
    title: "Offerten erstellen",
    text: "Preisvorschlag, PDF-Offerte und E-Mail in Minuten.",
  },
  {
    step: 4,
    icon: BellRing,
    title: "Follow-up",
    text: "24h-, 48h- und 5-Tage-Sequenzen automatisch getaktet.",
  },
  {
    step: 5,
    icon: CalendarCheck,
    title: "Aufträge organisieren",
    text: "Gewonnene Offerten werden zu geplanten Aufträgen.",
  },
  {
    step: 6,
    icon: ChartColumn,
    title: "Umsatz reporten",
    text: "Pipeline und Prognose im Chef-Dashboard.",
  },
];

export function SolutionSection() {
  return (
    <section id="loesung" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Die Lösung"
          title="Ein durchgängiger Verkaufsprozess – statt Zettelwirtschaft."
          description="Klarsa führt jeden Lead durch denselben sauberen Ablauf: von der ersten Anfrage bis zum gewonnenen Auftrag und Umsatz-Report."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold text-slate-300 tabular-nums">
                    {item.step.toString().padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-600">
          In jedem Schritt gilt: Die KI bereitet vor, Sie behalten die Kontrolle
          und geben frei – keine automatischen Massen-Mails.
        </p>
      </div>
    </section>
  );
}
