import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="surface-hero">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Bereit, Ihr Verkaufsbüro zu automatisieren?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
          Erleben Sie in der interaktiven Demo, wie ReinigungsPilot AI Leads,
          Offerten und Follow-ups für die Muster Reinigung GmbH übernimmt – in
          Starter, Pro und Premium.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Live-Demo ansehen
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <Link
            href="#pakete"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Pakete vergleichen
          </Link>
        </div>
      </div>
    </section>
  );
}
