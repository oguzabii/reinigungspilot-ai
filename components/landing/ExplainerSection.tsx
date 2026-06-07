import { Play } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const STEPS = [
  "Anfrage erfassen",
  "Lead bewerten",
  "Offerte vorbereiten",
  "Follow-up planen",
  "Auftrag organisieren",
  "An bexio übergeben",
];

export function ExplainerSection() {
  return (
    <section id="erklaert" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="In 1 Minute erklärt"
          title="So funktioniert ReinigungsPilot AI."
          description="Von der Anfrage bis zur Übergabe an die Buchhaltung – in sechs Schritten."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Video placeholder (no real video yet) */}
          <div className="surface-hero relative aspect-video overflow-hidden rounded-2xl ring-1 ring-inset ring-white/10">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-inset ring-white/25">
                <Play className="h-7 w-7 text-white" strokeWidth={2} />
              </span>
              <p className="text-sm font-semibold text-white">
                1-Minuten-Erklärvideo
              </p>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-navy-100">
                Video folgt
              </span>
            </div>
          </div>

          {/* Steps */}
          <ol className="space-y-3">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="font-medium text-navy-900">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
