import { SectionHeader } from "@/components/SectionHeader";
import { PRODUCT_MODULES } from "@/lib/modules";
import type { PackageId } from "@/lib/packages";
import { getPackageName } from "@/lib/packages";
import { cn } from "@/lib/cn";

const FROM_STYLE: Record<PackageId, string> = {
  starter: "bg-slate-100 text-slate-600",
  pro: "bg-blue-100 text-blue-700",
  premium: "bg-navy-100 text-navy-700",
};

export function ModulesOverview() {
  return (
    <section id="module" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Module"
          title="Alle Module – sauber nach Paket gestaffelt."
          description="Jede Funktion gehört zu einem Paket. So zahlen Sie nur für das, was Sie brauchen – und wachsen Schritt für Schritt."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      FROM_STYLE[module.availableFrom],
                    )}
                  >
                    ab {getPackageName(module.availableFrom)}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-navy-900">
                  {module.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {module.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
