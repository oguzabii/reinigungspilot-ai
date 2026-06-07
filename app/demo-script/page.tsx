import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  Lightbulb,
  Check,
  ArrowRight,
  Star,
  Store,
  Handshake,
  MessageSquare,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { PACKAGES } from "@/lib/packages";
import { formatChf } from "@/lib/format";

export const metadata: Metadata = {
  title: "Demo-Skript (intern) – ReinigungsPilot AI",
  description:
    "Interner Gesprächsleitfaden für die Live-Demo von ReinigungsPilot AI bei Reinigungsfirmen.",
  robots: { index: false, follow: false },
};

interface FlowStep {
  time: string;
  show: string;
  say: string;
}

const FLOW: FlowStep[] = [
  {
    time: "0:00 – 0:30",
    show: "Demo öffnen, Chef-Dashboard",
    say: "Stellen Sie sich vor, das ist Ihr Betrieb: alle Anfragen an einem Ort, jede Offerte wird nachgefasst, und Sie sehen den erwarteten Umsatz auf einen Blick.",
  },
  {
    time: "0:30 – 1:30",
    show: "Lead Inbox (mit Score)",
    say: "Jede Anfrage – Web, Telefon, E-Mail, Empfehlung – landet hier und wird automatisch nach Potenzial bewertet. Ihr Team sieht sofort, wo sich der Aufwand lohnt.",
  },
  {
    time: "1:30 – 2:30",
    show: "AI Offerten-Engine",
    say: "Aus diesem Lead wird in Minuten eine fertige PDF-Offerte mit passender E-Mail – inklusive Preisvorschlag und Marge. Das spart Ihnen jeden Tag Stunden.",
  },
  {
    time: "2:30 – 3:15",
    show: "Follow-up Center",
    say: "Das System fasst automatisch nach: nach 24 Stunden, 48 Stunden und 5 Tagen. So geht kein Abschluss mehr vergessen – genau hier liegt das meiste Geld.",
  },
  {
    time: "3:15 – 4:00",
    show: "AI Lead Hunter & Auftrags-Organizer",
    say: "Ab Pro sucht das System aktiv neue B2B-Kunden – Verwaltungen, Praxen, Büros – inklusive Erstnachricht. Gewonnene Offerten werden gleich als Aufträge eingeplant.",
  },
  {
    time: "4:00 – 4:30",
    show: "Paketumschalter Starter → Pro → Premium",
    say: "Sie sehen live, was in welchem Paket steckt – und was gesperrt ist. So wird der Unterschied sofort greifbar.",
  },
  {
    time: "4:30 – 5:00",
    show: "Paketvergleich & Pilot-Abschluss",
    say: "Mein Vorschlag: Sie starten als eine unserer Pilotfirmen mit dem Pro-Paket. Wir richten alles gemeinsam ein.",
  },
];

const FIRST_TIPS = [
  "Immer mit dem Chef-Dashboard starten – Überblick schafft Vertrauen.",
  "Dann Lead Inbox → Offerten-Engine: das ist der „Aha“-Moment.",
  "AI Lead Hunter als Wachstums-Hebel zeigen (nur Pro/Premium).",
  "Sprache des Inhabers sprechen: Aufträge, Umsatz, Zeitersparnis – nicht Technik.",
];

const OBJECTIONS: { q: string; a: string }[] = [
  {
    q: "„Wir haben schon ein CRM.“",
    a: "Super – ReinigungsPilot AI ersetzt es nicht zwingend. Der Fokus liegt auf dem Verkauf: Anfragen, Offerten, Follow-up und aktive B2B-Akquise. Vieles davon leistet ein klassisches CRM nicht.",
  },
  {
    q: "„Wir bekommen genug Anfragen.“",
    a: "Sehr gut. Dann geht es nicht ums Finden, sondern ums Gewinnen: schnellere Offerten und konsequentes Nachfassen holen aus denselben Anfragen mehr Aufträge.",
  },
  {
    q: "„AI ist mir zu unsicher.“",
    a: "Verständlich. Die AI schlägt nur vor – Sie geben jeden Versand frei. Nichts geht unkontrolliert raus, und Ihre Daten gehören Ihnen.",
  },
  {
    q: "„Das ist zu teuer.“",
    a: "Rechnen wir es durch: Ein einziger zusätzlicher Auftrag pro Monat deckt das Abo meist mehrfach. Im Pilot starten Sie ausserdem zu reduzierten Konditionen.",
  },
  {
    q: "„Wir haben keine Zeit für ein neues System.“",
    a: "Genau deshalb übernehmen wir das Setup. Sie bekommen ein fertig eingerichtetes Verkaufsbüro – das spart ab Tag 1 Zeit, statt welche zu kosten.",
  },
  {
    q: "„Kann ich das auch einmalig kaufen?“",
    a: "Nein, ReinigungsPilot AI ist ein laufender Service (Einrichtung + monatliches Abo). So bleiben Updates, Optimierung und Support enthalten. Der Einstieg läuft über das Pilotprogramm.",
  },
];

function pitchPoints(id: "starter" | "pro" | "premium"): string[] {
  return PACKAGES[id].focus;
}

export default function DemoScriptPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Internal header */}
      <header className="border-b border-white/10 bg-navy-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/">
            <Logo variant="light" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-200 ring-1 ring-inset ring-amber-400/30">
              Intern
            </span>
            <Link
              href="/demo"
              className="text-sm font-medium text-navy-200 transition-colors hover:text-white"
            >
              Zur Demo
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Demo-Support · Intern
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
          Demo-Skript für die Live-Demo
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Gesprächsleitfaden, um ReinigungsPilot AI in rund 5 Minuten überzeugend
          zu zeigen – immer am Beispiel der Muster Reinigung GmbH. Diese Seite ist
          nur für den internen Gebrauch gedacht, nicht für Kunden.
        </p>

        {/* 5-minute flow */}
        <Section
          icon={Clock}
          eyebrow="Ablauf"
          title="Der 5-Minuten-Demo-Flow"
        >
          <ol className="mt-2">
            {FLOW.map((step, index) => (
              <li key={step.time} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white tabular-nums">
                    {index + 1}
                  </span>
                  {index < FLOW.length - 1 && (
                    <span className="my-1 w-px flex-1 bg-slate-200" />
                  )}
                </div>
                <div className="flex-1 pb-5">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        <Clock className="h-3 w-3" />
                        {step.time}
                      </span>
                      <span className="text-sm font-semibold text-navy-900">
                        {step.show}
                      </span>
                    </div>
                    <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <span>{step.say}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* What to show first */}
        <Section icon={Lightbulb} eyebrow="Einstieg" title="Was zuerst zeigen">
          <ul className="mt-2 space-y-2">
            {FIRST_TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Package pitches */}
        <Section icon={Star} eyebrow="Pakete" title="Was bei jedem Paket sagen">
          <div className="mt-2 space-y-4">
            <PitchCard
              name={PACKAGES.starter.name}
              product={PACKAGES.starter.productName}
              price={`${formatChf(PACKAGES.starter.setupChf)} Setup · ${formatChf(PACKAGES.starter.monthlyChf)} / Monat`}
              intro="Das digitale Offert-Büro. Ideal für Betriebe, die zuerst Ordnung und Tempo wollen."
              points={pitchPoints("starter")}
            />
            <PitchCard
              name={PACKAGES.pro.name}
              product={PACKAGES.pro.productName}
              price={`${formatChf(PACKAGES.pro.setupChf)} Setup · ${formatChf(PACKAGES.pro.monthlyChf)} / Monat`}
              intro="Unser Zielpaket – hier am meisten Zeit verbringen. Der Verkaufsmotor, der aktiv neue Kunden findet."
              points={pitchPoints("pro")}
              recommended
            />
            <PitchCard
              name={PACKAGES.premium.name}
              product={PACKAGES.premium.productName}
              price={`${formatChf(PACKAGES.premium.setupChf)} Setup · ${formatChf(PACKAGES.premium.monthlyChf)} / Monat`}
              intro="Das komplette Wachstumsbüro für ambitionierte Betriebe mit mehreren Teams."
              points={pitchPoints("premium")}
            />
          </div>
        </Section>

        {/* Add-ons */}
        <Section icon={Store} eyebrow="Add-ons" title="Wie Add-ons erklären">
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm leading-relaxed text-slate-600">
              Add-ons sind das Baukastensystem oben drauf: Extra Lead Hunter,
              WhatsApp-Integration, Google Ads, Review Funnel, Premium Landing Page
              und mehr.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "Add-ons erst nennen, wenn das Paket gesetzt ist – nie als Erstes.",
                "Immer an einen konkreten Wunsch koppeln: „Mehr Bewertungen?“ → Review Funnel.",
                "Add-ons machen das Angebot flexibel, ohne das Grundpaket zu verteuern.",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Objections */}
        <Section icon={MessageSquare} eyebrow="Einwände" title="Typische Einwände und Antworten">
          <div className="mt-2 space-y-3">
            {OBJECTIONS.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-navy-900">{item.q}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Close */}
        <Section icon={Handshake} eyebrow="Abschluss" title="Mit dem Pilot-Angebot schliessen">
          <div className="mt-2 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
            <p className="text-sm leading-relaxed text-navy-900">
              Schliessen Sie immer mit einem klaren nächsten Schritt: dem
              Pilotprogramm. „Wir nehmen aktuell wenige Reinigungsfirmen als
              Pilotfirmen auf, richten alles gemeinsam ein und Sie erhalten
              Vorzugskonditionen. Starten wir mit dem Pro-Paket?“
            </p>
            <Link
              href="/demo"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Demo erneut starten
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: typeof Clock;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function PitchCard({
  name,
  product,
  price,
  intro,
  points,
  recommended,
}: {
  name: string;
  product: string;
  price: string;
  intro: string;
  points: string[];
  recommended?: boolean;
}) {
  return (
    <div
      className={cardClass(recommended)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
            {product}
          </p>
          <h3 className="text-base font-semibold text-navy-900">{name}</h3>
        </div>
        {recommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
            Empfohlen
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">{price}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{intro}</p>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.6} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function cardClass(recommended?: boolean): string {
  return [
    "rounded-2xl border bg-white p-5 shadow-sm",
    recommended ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-200",
  ].join(" ");
}
