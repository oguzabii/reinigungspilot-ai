import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { NotIncludedSection } from "@/components/NotIncludedSection";
import { FAQ_ITEMS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "FAQ – Klarsa",
  description:
    "Antworten auf häufige Fragen zu Klarsa: CRM, Datenhoheit, Automatisierung, Preise, Upgrades, Kündigung und mehr.",
};

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="FAQ"
          title="Häufige Fragen – ehrlich beantwortet."
          description="Was Klarsa kann, was nicht, und wie die Zusammenarbeit abläuft."
        />

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 lg:px-6">
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <NotIncludedSection className="bg-slate-50 py-20 sm:py-24" />

        {/* CTA */}
        <section className="surface-hero">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20 lg:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              Noch Fragen offen?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
              Sehen Sie sich die Demo an oder besprechen Sie Ihren Fall direkt im
              Pilotgespräch.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Demo ansehen
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
              <Link
                href="/beratung"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Beratung anfragen
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
