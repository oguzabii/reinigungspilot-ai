import { Inbox, Clock, BellRing, Crosshair } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const PROBLEMS: {
  icon: LucideIcon;
  title: string;
  text: string;
  impact: string;
}[] = [
  {
    icon: Inbox,
    title: "Verpasste Anfragen",
    text: "Anfragen aus Web, Telefon und E-Mail landen verstreut. Wer zu spät reagiert, verliert den Auftrag an die Konkurrenz.",
    impact: "Verlorene Aufträge",
  },
  {
    icon: Clock,
    title: "Zu späte Offerten",
    text: "Manuelle Offerten kosten Stunden. Oft gewinnt schlicht der schnellste Anbieter – nicht der beste Betrieb.",
    impact: "Tiefere Abschlussquote",
  },
  {
    icon: BellRing,
    title: "Vergessene Follow-ups",
    text: "Die meisten Abschlüsse brauchen mehrere Kontakte. Ohne System bleibt planbarer Umsatz einfach liegen.",
    impact: "Umsatz bleibt liegen",
  },
  {
    icon: Crosshair,
    title: "Keine systematische B2B-Akquise",
    text: "Verwaltungen, Praxen und Büros gewinnt man nicht durch Warten, sondern durch gezielte, konsequente Ansprache.",
    impact: "Kein planbares Wachstum",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Das Problem"
          title="Gute Betriebe verlieren Aufträge – nicht wegen der Qualität."
          description="Die Arbeit stimmt. Es hakt im Verkauf: bei Tempo, beim Nachfassen und bei der aktiven Akquise neuer B2B-Kunden."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-semibold text-navy-900">
                  {problem.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {problem.text}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {problem.impact}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
