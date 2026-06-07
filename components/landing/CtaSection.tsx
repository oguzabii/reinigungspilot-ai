import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const PILOT_POINTS = [
  "Früher Zugang zu ReinigungsPilot AI",
  "Enge Begleitung beim Setup & Go-Live",
  "Vorzugskonditionen als Pilotfirma",
];

export function CtaSection() {
  return (
    <section id="pilot" className="surface-hero">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-inset ring-white/15">
          Pilotprogramm
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Werden Sie eine unserer Pilotfirmen.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
          Wir nehmen eine begrenzte Zahl von Reinigungsfirmen ins Pilotprogramm
          auf und richten ReinigungsPilot AI gemeinsam auf Ihren Betrieb ein.
          Sehen Sie zuerst die Demo – oder melden Sie direkt Ihr Interesse an.
        </p>

        <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2">
          {PILOT_POINTS.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-1.5 text-sm text-navy-100"
            >
              <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.4} />
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:kontakt@reinigungspilot.ai?subject=Pilotfirma%20werden%20-%20ReinigungsPilot%20AI"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Pilotfirma werden
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </a>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Demo ansehen
          </Link>
        </div>
      </div>
    </section>
  );
}
