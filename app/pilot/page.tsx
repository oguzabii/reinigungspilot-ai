import type { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  PhoneCall,
  ArrowRight,
  UserCheck,
  UserX,
  BadgeCheck,
  ClipboardList,
  Check,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { PILOT } from "@/lib/pilot";
import { formatChf } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pilotprogramm – ReinigungsPilot AI",
  description:
    "Begrenztes Pilotprogramm für die ersten 3 Reinigungsfirmen: 60 Tage, reduzierte Konditionen, persönliche Begleitung. Jetzt Pilotgespräch anfragen.",
};

const PILOT_MAILTO =
  "mailto:kontakt@reinigungspilot.ai?subject=Pilotgespr%C3%A4ch%20-%20ReinigungsPilot%20AI";

export default function PilotPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Pilotprogramm"
          title={`Werden Sie eine unserer ${PILOT.slots} Pilotfirmen.`}
          description="Wir richten ReinigungsPilot AI in 60 Tagen gemeinsam auf Ihren Betrieb ein – zu einmaligen Pilot-Konditionen und mit persönlicher Begleitung."
        >
          <a
            href={PILOT_MAILTO}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <PhoneCall className="h-4 w-4" strokeWidth={2.2} />
            Pilotgespräch anfragen
          </a>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Demo ansehen
          </Link>
        </PageHero>

        {/* Offer summary */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 lg:px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Pilotplätze" value={`Nur ${PILOT.slots}`} accent />
              <Stat label="Einrichtung" value={formatChf(PILOT.setupChf)} />
              <Stat label="Monatlich" value={formatChf(PILOT.monthlyChf)} />
              <Stat label="Laufzeit" value={`${PILOT.durationDays} Tage`} />
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">
              Danach Wechsel zu {PILOT.afterPilot}. Der Pilotpreis ist kein
              öffentlicher Standardpreis.
            </p>
          </div>
        </section>

        {/* For whom / not for whom */}
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 lg:px-6">
            <SectionHeader
              align="center"
              eyebrow="Passt es?"
              title="Für wen der Pilot gedacht ist – und für wen nicht."
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <ChecklistCard
                icon={UserCheck}
                accent="emerald"
                marker="check"
                title="Der Pilot ist für Sie, wenn …"
                items={PILOT.forWhom}
              />
              <ChecklistCard
                icon={UserX}
                accent="red"
                marker="x"
                title="Eher nicht, wenn …"
                items={PILOT.notForWhom}
              />
            </div>
          </div>
        </section>

        {/* 60-day timeline */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <SectionHeader
              align="center"
              eyebrow="Ablauf"
              title={`Was in ${PILOT.durationDays} Tagen passiert`}
              description="Ein klarer Plan vom Setup bis zur Entscheidung über die Weiterführung."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PILOT.timeline.map((phase, index) => (
                <div
                  key={phase.phase}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {phase.phase}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-navy-900">
                    {phase.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {phase.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gets / we need */}
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 lg:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ChecklistCard
                icon={BadgeCheck}
                accent="blue"
                marker="check"
                title="Das bekommen Sie"
                items={PILOT.gets}
              />
              <ChecklistCard
                icon={ClipboardList}
                accent="navy"
                marker="check"
                title="Das brauchen wir von Ihnen"
                items={PILOT.weNeed}
              />
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Gut zu wissen
              </p>
              <ul className="mt-2 space-y-1.5">
                {PILOT.notes.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="surface-hero">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20 lg:px-6">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-200 ring-1 ring-inset ring-white/15">
              <Rocket className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
              Bereit für ein Pilotgespräch?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
              In einem kurzen Gespräch klären wir, ob Ihr Betrieb zum
              Pilotprogramm passt – unverbindlich und ehrlich.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={PILOT_MAILTO}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <PhoneCall className="h-4 w-4" strokeWidth={2.2} />
                Pilotgespräch anfragen
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Preise ansehen
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 text-center shadow-sm",
        accent ? "border-blue-200 bg-blue-50/60" : "border-slate-200 bg-white",
      )}
    >
      <p className="text-2xl font-semibold tracking-tight text-navy-900">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

type Accent = "emerald" | "red" | "blue" | "navy";

const accentChip: Record<Accent, string> = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  navy: "bg-navy-50 text-navy-700 ring-navy-100",
};

function ChecklistCard({
  icon: Icon,
  accent,
  marker,
  title,
  items,
}: {
  icon: LucideIcon;
  accent: Accent;
  marker: "check" | "x";
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
            accentChip[accent],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <h3 className="font-semibold text-navy-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
            {marker === "check" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" strokeWidth={2.4} />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
