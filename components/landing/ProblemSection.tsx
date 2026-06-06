import { Inbox, Clock, BellRing, Crosshair } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const PROBLEMS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Inbox,
    title: "Anfragen gehen unter",
    text: "Leads aus Web, Telefon, E-Mail und Empfehlungen landen verstreut – manche bleiben einfach liegen.",
  },
  {
    icon: Clock,
    title: "Offerten dauern zu lange",
    text: "Manuelle Offerten kosten Stunden. Oft gewinnt der schnellste Anbieter den Auftrag – nicht zwingend der beste.",
  },
  {
    icon: BellRing,
    title: "Niemand fasst nach",
    text: "Ohne konsequentes Follow-up bleibt bares Geld liegen. Die meisten Abschlüsse passieren erst nach mehreren Kontakten.",
  },
  {
    icon: Crosshair,
    title: "Keine aktive Akquise",
    text: "Neue B2B-Kunden wie Verwaltungen oder Praxen kommen nicht von allein. Wer nur wartet, wächst nicht.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Das Problem"
          title="Gute Reinigungsfirmen verlieren Aufträge – nicht wegen der Qualität."
          description="Die Arbeit stimmt. Es hakt im Verkauf: bei Tempo, beim Nachfassen und bei der aktiven Akquise."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((problem) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-semibold text-navy-900">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {problem.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
