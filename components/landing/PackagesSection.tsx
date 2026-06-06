import { SectionHeader } from "@/components/SectionHeader";
import { PackageCard } from "@/components/PackageCard";
import { PACKAGE_LIST } from "@/lib/packages";

export function PackagesSection() {
  return (
    <section id="pakete" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Pakete"
          title="Drei Pakete – ein klarer Wachstumspfad."
          description="Vom digitalen Offert-Büro bis zum kompletten Wachstumsbüro. Jederzeit erweiterbar mit Add-ons."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-start">
          {PACKAGE_LIST.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Alle Preise in CHF, zzgl. MwSt. Einrichtung einmalig, Abo monatlich.
        </p>
      </div>
    </section>
  );
}
