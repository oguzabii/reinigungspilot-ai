import { SectionHeader } from "@/components/SectionHeader";
import { AddOnCard } from "@/components/AddOnCard";
import { ADDONS } from "@/lib/addons";

export function AddOnsOverview() {
  return (
    <section id="addons" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Add-ons"
          title="Erweitern Sie Ihr Paket – genau dann, wenn Sie es brauchen."
          description="Zusätzliche Reichweite, Integrationen und Marketing-Leistungen als flexible Add-ons mit transparenten Preisen."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((addon) => (
            <AddOnCard key={addon.id} addon={addon} />
          ))}
        </div>
      </div>
    </section>
  );
}
