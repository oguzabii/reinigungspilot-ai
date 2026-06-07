import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { BROCHURE } from "@/lib/brochure";
import { PRODUCT_MODULES } from "@/lib/modules";
import { PACKAGE_LIST, getPackageName } from "@/lib/packages";
import { ADDONS } from "@/lib/addons";
import type { AddOn } from "@/lib/addons";
import { PILOT } from "@/lib/pilot";
import { NOT_INCLUDED_V1 } from "@/lib/scope";
import { DEMO_SUCCESS_TIMELINE } from "@/lib/demo-data";
import { formatChf, formatChfRange } from "@/lib/format";

export const metadata: Metadata = {
  title: "Broschüre – ReinigungsPilot AI",
  description:
    "Verkaufsbroschüre für ReinigungsPilot AI: Problem, Lösung, Module, Pakete, Pilotprogramm, Add-ons, 12-Monats-Plan und Abgrenzung.",
};

function addonShort(a: AddOn): string {
  if (a.setupFromChf != null && a.setupToChf != null) {
    return formatChfRange(a.setupFromChf, a.setupToChf);
  }
  if (a.monthlyChf != null && a.setupChf != null) {
    return `${formatChf(a.monthlyChf)}/Monat + ${formatChf(a.setupChf)} Setup`;
  }
  if (a.monthlyChf != null) {
    return `${formatChf(a.monthlyChf)}/Monat${a.unit ? ` ${a.unit}` : ""}`;
  }
  if (a.setupChf != null) return `${formatChf(a.setupChf)} Setup`;
  if (a.oneTimeChf != null) return `${formatChf(a.oneTimeChf)} einmalig`;
  return "Auf Anfrage";
}

export default function BrochurePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        {/* Title */}
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-3xl px-4 py-14 lg:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Verkaufsbroschüre
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy-900">
              {BROCHURE.title}
            </h1>
            <p className="mt-2 text-lg font-medium text-slate-700">
              {BROCHURE.subtitle}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              {BROCHURE.intro}
            </p>
            <p className="mt-4 text-xs text-slate-400">
              Hinweis: Diese Seite ist die Grundlage für eine spätere
              PDF-Broschüre. Ein PDF-Export ist noch nicht enthalten.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 lg:px-6">
          {/* Problem */}
          <DocSection title={BROCHURE.problemTitle}>
            <p className="text-slate-600">{BROCHURE.problemText}</p>
            <ul className="mt-4 space-y-2">
              {BROCHURE.problems.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {p}
                </li>
              ))}
            </ul>
          </DocSection>

          {/* Solution */}
          <DocSection title={BROCHURE.solutionTitle}>
            <p className="text-slate-600">{BROCHURE.solutionText}</p>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2">
              {BROCHURE.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] font-semibold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-lg bg-blue-50/70 px-4 py-3 text-sm font-medium text-blue-900">
              {BROCHURE.controlNote}
            </p>
          </DocSection>

          {/* Modules */}
          <DocSection title="Module">
            <ul className="space-y-3">
              {PRODUCT_MODULES.map((m) => (
                <li key={m.id} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-navy-900">{m.label}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      ab {getPackageName(m.availableFrom)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                </li>
              ))}
            </ul>
          </DocSection>

          {/* Packages */}
          <DocSection title="Pakete">
            <div className="grid gap-4 sm:grid-cols-3">
              {PACKAGE_LIST.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    {pkg.productName}
                  </p>
                  <p className="text-lg font-semibold text-navy-900">{pkg.name}</p>
                  <p className="mt-1 text-sm font-semibold text-navy-900">
                    {formatChf(pkg.monthlyChf)}
                    <span className="font-normal text-slate-500"> / Monat</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatChf(pkg.setupChf)} Einrichtung
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{pkg.tagline}</p>
                </div>
              ))}
            </div>
          </DocSection>

          {/* Pilot */}
          <DocSection title="Pilotprogramm">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
              <p className="text-sm font-medium text-navy-900">
                Für die ersten {PILOT.slots} Pilotfirmen:{" "}
                {formatChf(PILOT.setupChf)} Einrichtung ·{" "}
                {formatChf(PILOT.monthlyChf)} / Monat · {PILOT.durationDays} Tage
                · danach {PILOT.afterPilot}.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Persönliche Begleitung, klare Erfolgsmessung, kein automatischer
                Vertrag. Der Pilotpreis ist kein öffentlicher Standardpreis.
              </p>
            </div>
          </DocSection>

          {/* Add-ons */}
          <DocSection title="Add-ons">
            <ul className="grid gap-2 sm:grid-cols-2">
              {ADDONS.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 text-sm"
                >
                  <span className="text-slate-700">{a.name}</span>
                  <span className="shrink-0 font-medium text-navy-900">
                    {addonShort(a)}
                  </span>
                </li>
              ))}
            </ul>
          </DocSection>

          {/* 12-month plan */}
          <DocSection title="12-Monats-Erfolgsplan">
            <ol className="grid gap-2 sm:grid-cols-2">
              {DEMO_SUCCESS_TIMELINE.map((m) => (
                <li key={m.month} className="flex items-start gap-2.5 text-sm">
                  <span className="shrink-0 font-semibold text-blue-600">
                    {m.label}
                  </span>
                  <span className="text-slate-700">{m.title}</span>
                </li>
              ))}
            </ol>
          </DocSection>

          {/* Not included */}
          <DocSection title="Was nicht enthalten ist">
            <ul className="grid gap-2 sm:grid-cols-2">
              {NOT_INCLUDED_V1.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" strokeWidth={2.4} />
                  {item}
                </li>
              ))}
            </ul>
          </DocSection>

          {/* Closing CTA */}
          <DocSection title={BROCHURE.closingTitle}>
            <p className="text-slate-600">{BROCHURE.closingText}</p>
            <div className="mt-5 flex flex-wrap gap-3 pb-16">
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Demo ansehen
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
              <Link
                href="/pilot"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <Check className="h-4 w-4" strokeWidth={2.2} />
                Pilot anfragen
              </Link>
            </div>
          </DocSection>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-100 py-10 first:border-0">
      <h2 className="text-xl font-semibold tracking-tight text-navy-900">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
