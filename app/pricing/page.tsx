import type { Metadata } from "next";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { AddOnsOverview } from "@/components/landing/AddOnsOverview";
import { CtaSection } from "@/components/landing/CtaSection";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { PricingCard } from "@/components/PricingCard";
import { ComparisonTable } from "@/components/ComparisonTable";
import { NotIncludedSection } from "@/components/NotIncludedSection";
import { PACKAGE_LIST } from "@/lib/packages";

export const metadata: Metadata = {
  title: "Preise & Pakete – Klarsa",
  description:
    "Transparente Preise für Klarsa: Starter, Pro und Premium mit exakten Limiten, plus flexible Add-ons. Demo ansehen oder Beratung anfragen.",
};

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Preise & Pakete"
          title="Transparente Preise – ein klarer Wachstumspfad."
          description="Starter, Pro und Premium mit exakten Limiten. Jederzeit erweiterbar mit Add-ons – ohne versteckte Kosten."
        />

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
              {PACKAGE_LIST.map((pkg) => (
                <PricingCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">
              Alle Preise in CHF, zzgl. MwSt. Einrichtung einmalig, Abo monatlich.
            </p>
          </div>
        </section>

        <section id="vergleich" className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <SectionHeader
              align="center"
              eyebrow="Vergleich"
              title="Alle Limiten im direkten Vergleich"
              description="Was in welchem Paket steckt – transparent und ohne Kleingedrucktes."
            />
            <div className="mt-10">
              <ComparisonTable activePkg="pro" />
            </div>
          </div>
        </section>

        <AddOnsOverview />

        <NotIncludedSection className="bg-slate-50 py-20 sm:py-24" />

        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
