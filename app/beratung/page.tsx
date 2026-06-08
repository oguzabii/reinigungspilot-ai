import type { Metadata } from "next";
import Link from "next/link";
import {
  PhoneCall,
  ArrowRight,
  Check,
  Users,
  Search,
  BadgeCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { PageHero } from "@/components/PageHero";
import { SectionHeader } from "@/components/SectionHeader";
import { BERATUNG, BERATUNG_MAILTO } from "@/lib/beratung";
import { CONTACT_EMAIL } from "@/lib/contact";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Beratung – Klarsa",
  description:
    "Unverbindliche Beratung: Wir prüfen gemeinsam, ob Klarsa zu Ihrem KMU passt – mit Demo an Ihrem Beispiel und der passenden Branchenvorlage.",
};

export default function BeratungPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Beratung"
          title="Wir prüfen gemeinsam, ob es zu Ihrem Betrieb passt."
          description="In einer kurzen, unverbindlichen Beratung schauen wir uns Ihren Verkaufsprozess an und zeigen Klarsa an Ihrem Beispiel – mit der passenden Branchenvorlage."
        >
          <a
            href={BERATUNG_MAILTO}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <PhoneCall className="h-4 w-4" strokeWidth={2.2} />
            Beratung anfragen
          </a>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Demo ansehen
          </Link>
        </PageHero>

        {/* For whom */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 lg:px-6">
            <ChecklistCard
              icon={Users}
              title="Für wen die Beratung gedacht ist"
              items={BERATUNG.forWhom}
            />
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <SectionHeader
              align="center"
              eyebrow="Ablauf"
              title="So läuft die Beratung"
              description="Kurz, konkret und ohne Verpflichtung."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BERATUNG.steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-navy-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* We look at / you get */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 lg:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ChecklistCard
                icon={Search}
                title="Was wir uns anschauen"
                items={BERATUNG.weLookAt}
              />
              <ChecklistCard
                icon={BadgeCheck}
                title="Was Sie erhalten"
                items={BERATUNG.youGet}
              />
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Gut zu wissen
              </p>
              <ul className="mt-2 space-y-1.5">
                {BERATUNG.notes.map((note) => (
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
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              System für Ihr Unternehmen prüfen
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
              Senden Sie uns eine kurze Nachricht – wir melden uns für ein
              unverbindliches Erstgespräch.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={BERATUNG_MAILTO}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <PhoneCall className="h-4 w-4" strokeWidth={2.2} />
                System für mein Unternehmen prüfen
              </a>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Preise ansehen
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
            </div>
            <p className="mt-4 text-sm text-navy-200">
              oder direkt an{" "}
              <a
                href={BERATUNG_MAILTO}
                className="font-medium text-white underline-offset-2 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function ChecklistCard({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-6 shadow-sm")}>
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <h3 className="font-semibold text-navy-900">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
