import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const POINTS = [
  "Unverbindlich & kostenlos",
  "Demo an Ihrem Beispiel",
  "Empfehlung für das passende Paket",
];

export function CtaSection() {
  return (
    <section id="beratung" className="surface-hero">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-inset ring-white/15">
          Beratung
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Prüfen wir gemeinsam, ob es zu Ihrem Betrieb passt.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
          In einer kurzen, unverbindlichen Beratung schauen wir uns Ihren
          Verkaufsprozess an und zeigen Klarsa an Ihrem Beispiel – mit
          der passenden Branchenvorlage.
        </p>

        <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2">
          {POINTS.map((point) => (
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
          <Link
            href="/beratung"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Beratung anfragen
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
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
