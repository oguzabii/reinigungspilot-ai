import { Sparkles, Building2, Banknote } from "lucide-react";
import { formatChf } from "@/lib/format";

/**
 * The Digital Office hero — "Ihr digitales Büro". Sets the product framing
 * (build your own office with digital workers) and shows a calm package/status
 * summary. Server component: pure props, no interactivity.
 */
export function OfficeHero({
  companyName,
  packageName,
  monthlyChf,
  setupDone,
  setupTotal,
  activeWorkerCount,
  workerLimit,
}: {
  companyName: string;
  packageName: string;
  monthlyChf: number;
  setupDone: number;
  setupTotal: number;
  activeWorkerCount: number;
  workerLimit: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-navy-900 surface-hero p-6 text-white shadow-sm sm:p-8">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
        <Sparkles className="h-3.5 w-3.5" />
        Eigenständiges Produkt · läuft auf der Klarsa-Plattform
      </p>
      <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
        Digital Office Builder
      </h1>
      <p className="mt-3 max-w-2xl text-lg font-medium text-blue-50">
        Bauen Sie Ihr digitales Büro mit KI-Mitarbeitern.
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-100">
        Wählen Sie digitale Mitarbeiter, verbinden Sie Ihre Mailbox, konfigurieren
        Sie Offerten und Preisregeln – und lassen Sie Ihr digitales Büro tägliche
        Büroarbeit übernehmen.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-navy-100 ring-1 ring-inset ring-white/15">
          <Building2 className="h-3.5 w-3.5" />
          {companyName}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100 ring-1 ring-inset ring-blue-300/30">
          <Banknote className="h-3.5 w-3.5" />
          Paket: {packageName}
          {monthlyChf > 0 ? ` · ${formatChf(monthlyChf)}/Monat` : " · 0 CHF"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-navy-100 ring-1 ring-inset ring-white/15">
          {activeWorkerCount}/{workerLimit} Mitarbeiter aktiv
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-navy-100 ring-1 ring-inset ring-white/15">
          Einrichtung {setupDone}/{setupTotal}
        </span>
      </div>
    </section>
  );
}
