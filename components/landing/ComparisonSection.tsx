import { SectionHeader } from "@/components/SectionHeader";
import { ComparisonTable } from "@/components/ComparisonTable";

export function ComparisonSection() {
  return (
    <section id="vergleich" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Vergleich"
          title="Was steckt in welchem Paket?"
          description="Alle Limiten und Leistungen im direkten Vergleich – transparent und ohne Kleingedrucktes."
        />
        <div className="mt-12">
          <ComparisonTable activePkg="pro" />
        </div>
      </div>
    </section>
  );
}
