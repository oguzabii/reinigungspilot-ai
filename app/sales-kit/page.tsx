import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Sparkles,
  Clock,
  Quote,
  Mail,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Handshake,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { SALES_KIT } from "@/lib/sales-kit";
import { OBJECTIONS } from "@/lib/objections";

export const metadata: Metadata = {
  title: "Sales-Kit (intern) – Klarsa",
  description:
    "Internes Sales-Kit: Positionierung, Pitches, Cold-E-Mails, Nachrichten, Telefonskript, Einwandbehandlung und Abschlusssätze.",
  robots: { index: false, follow: false },
};

export default function SalesKitPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Sales-Support · Intern
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
          Sales-Kit
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Kopierfertige Verkaufsmaterialien für Gespräche mit Schweizer KMU.
          Nur für den internen Gebrauch. Tipp: Text markieren und kopieren,
          Platzhalter wie [Name] und [Firma] ersetzen.
        </p>

        {/* Positioning */}
        <Section icon={Sparkles} eyebrow="Positionierung" title="In einem Satz">
          <div className="mt-2 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
            <p className="text-lg font-semibold text-navy-900">
              {SALES_KIT.positioning}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {SALES_KIT.positioningLong}
            </p>
          </div>
        </Section>

        {/* 30s pitch */}
        <Section icon={Clock} eyebrow="Pitch" title="30-Sekunden-Pitch">
          <CopyBox text={SALES_KIT.pitch30} />
        </Section>

        {/* 2min pitch */}
        <Section icon={Quote} eyebrow="Pitch" title="2-Minuten-Pitch">
          <CopyBox text={SALES_KIT.pitch120.join("\n\n")} />
        </Section>

        {/* Cold emails */}
        <Section icon={Mail} eyebrow="E-Mail" title="Cold-E-Mail-Vorlagen">
          <div className="mt-2 space-y-4">
            {SALES_KIT.coldEmails.map((email) => (
              <div
                key={email.audience}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-navy-900">
                    {email.audience}
                  </h3>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {email.note}
                  </span>
                </div>
                <p className="mt-3 text-sm">
                  <span className="text-slate-400">Betreff: </span>
                  <span className="font-medium text-navy-900">
                    {email.subject}
                  </span>
                </p>
                <div className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-inset ring-slate-100">
                  {email.body}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Messages */}
        <Section
          icon={MessageSquare}
          eyebrow="LinkedIn / Nachricht"
          title="Kurznachrichten-Vorlagen"
        >
          <div className="mt-2 space-y-3">
            {SALES_KIT.messages.map((msg) => (
              <div
                key={msg.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {msg.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Phone script */}
        <Section icon={PhoneCall} eyebrow="Telefon" title="Telefon-Skript">
          <ol className="mt-2 space-y-3">
            {SALES_KIT.phoneScript.map((s, index) => (
              <li
                key={s.step}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[11px] text-white">
                    {index + 1}
                  </span>
                  {s.step}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Objections */}
        <Section
          icon={ShieldCheck}
          eyebrow="Einwände"
          title="Einwandbehandlung"
        >
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

        {/* Closing lines */}
        <Section icon={Handshake} eyebrow="Abschluss" title="Abschluss-Sätze">
          <div className="mt-2 space-y-3">
            {SALES_KIT.closingLines.map((line) => (
              <div
                key={line.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {line.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {line.text}
                </p>
              </div>
            ))}
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
  children: ReactNode;
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

function CopyBox({ text }: { text: string }) {
  return (
    <div className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700 shadow-sm">
      {text}
    </div>
  );
}
