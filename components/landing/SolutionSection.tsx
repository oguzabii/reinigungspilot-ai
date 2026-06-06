import { Inbox, FileText, Gauge } from "lucide-react";
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
    icon: Inbox,
    title: "Leads sammeln & finden",
    text: "Alle Anfragen landen zentral in der Inbox. Der AI Lead Hunter findet zusätzlich aktiv neue B2B-Kunden in Ihrer Region.",
  },
  {
    step: 2,
    icon: FileText,
    title: "Offerten & Follow-ups automatisch",
    text: "Die Offerten-Engine berechnet Preise, erstellt PDF-Offerten und E-Mail-Entwürfe. Follow-ups werden automatisch getaktet.",
  },
  {
    step: 3,
    icon: Gauge,
    title: "Aufträge & Umsatz im Blick",
    text: "Gewonnene Offerten werden zu geplanten Aufträgen. Das Chef-Dashboard zeigt Pipeline und erwarteten Umsatz.",
  },
];

export function SolutionSection() {
  return (
    <section id="loesung" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Die Lösung"
          title="ReinigungsPilot AI übernimmt Ihr Verkaufsbüro."
          description="Von der ersten Anfrage bis zum geplanten Auftrag – in einem System, sauber nach Paket gestaffelt."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    Schritt {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
