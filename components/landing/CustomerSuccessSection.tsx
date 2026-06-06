import { SectionHeader } from "@/components/SectionHeader";
import { SuccessTimeline } from "@/components/SuccessTimeline";

export function CustomerSuccessSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Customer Success"
          title="12 Monate Begleitung – nicht nur ein Tool."
          description="Ein klarer Plan über das ganze Jahr: vom Setup über regelmässige Reviews bis zur Verlängerung mit Treue-Angebot."
        />
        <div className="mx-auto mt-12 max-w-3xl">
          <SuccessTimeline />
        </div>
      </div>
    </section>
  );
}
