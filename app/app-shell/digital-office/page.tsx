import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { DigitalOfficeShell } from "@/components/digital-office/DigitalOfficeShell";
import { OfficeHero } from "@/components/digital-office/OfficeHero";
import {
  OfficeJourney,
  DigitalOfficeTabs,
  OfficeQuickActions,
  type TabDef,
} from "@/components/digital-office/DigitalOfficeClient";
import { WorkerBoard } from "@/components/digital-office/WorkerBoard";
import { WorkerSummary } from "@/components/digital-office/WorkerSummary";
import {
  MailboxCard,
  OfferTemplateCard,
  PricingRulesCard,
  ActivityFeed,
} from "@/components/digital-office/OfficeSections";
import { AskOfficeDock } from "@/components/digital-office/AskOffice";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { loadOfficeView } from "@/lib/digital-office/office-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digital Office Builder",
  description:
    "Bauen Sie Ihr digitales Büro mit KI-Mitarbeitern: Bürotyp wählen, Mitarbeiter auswählen, Mailbox & Regeln verbinden und Ihr Büro aktivieren.",
  robots: { index: false, follow: false },
};

export default async function DigitalOfficePage() {
  // Delegate setup / no-tenant states to /app-shell (mirrors the other sub-pages).
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const view = await loadOfficeView(companyId);

  const tabs: TabDef[] = [
    {
      id: "overview",
      label: "Übersicht",
      content: (
        <div className="space-y-6">
          <WorkerSummary runtimes={view.runtimes} />
          <ActivityFeed items={view.activity} />
        </div>
      ),
    },
    {
      id: "workers",
      label: "Mitarbeiter",
      content: <WorkerBoard runtimes={view.runtimes} />,
    },
    {
      id: "mailbox",
      label: "Mailbox",
      content: (
        <MailboxCard
          status={view.mailboxStatus}
          senderName={view.signals.senderName}
          senderEmail={view.signals.senderEmail}
          outgoingLabel={view.sendConfigured ? (view.sendLabel ?? "E-Mail") : null}
          incomingLabel={view.inboxConfigured ? (view.inboxLabel ?? "IMAP") : null}
        />
      ),
    },
    {
      id: "rules",
      label: "Regeln",
      content: (
        <div className="space-y-4">
          <PricingRulesCard
            ruleCount={0}
            advanced={view.pkg.limits.pricingRules === "advanced"}
          />
          <OfferTemplateCard templateCount={0} templateLimit={view.templateLimit} />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <DigitalOfficeShell companyName={view.companyName} />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:pt-8 lg:pb-10">
        <OfficeHero
          companyName={view.companyName}
          packageName={view.pkg.name}
          monthlyChf={view.pkg.monthlyChf}
          setupDone={view.setup.doneCount}
          setupTotal={view.setup.totalCount}
          activeWorkerCount={view.activeWorkers.length}
          workerLimit={view.workerLimit}
        />

        <div className="mt-5">
          <OfficeQuickActions />
        </div>

        {/* Standalone surface: product content owns the page; Ask Office docked right. */}
        <div className="mt-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
          <div className="space-y-6">
            <OfficeJourney journey={view.journey} />
            <DigitalOfficeTabs tabs={tabs} />

            {/* Honest automation-status note (owner-facing, non-technical). */}
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-relaxed text-slate-600">
                <strong className="font-semibold text-navy-800">
                  Ehrlich und kontrolliert.
                </strong>{" "}
                Ihr digitales Büro zeigt nur echte Daten Ihres Betriebs. Es wird
                nichts automatisch gesendet oder gebucht – jede Aktion läuft über
                Entwurf und Freigabe. Mailbox, Vorlage und Regeln sind als Fundament
                vorbereitet; das Speichern eigener Einstellungen folgt im nächsten
                Schritt.
              </p>
            </div>
          </div>

          <div className="mt-6 lg:mt-0">
            <AskOfficeDock
              context={view.askContext}
              initialMode={view.askMode}
              providerLabel={view.providerLabel}
            />
          </div>
        </div>
      </main>

      {/* Mobile: a sticky shortcut to the assistant (docked on desktop). */}
      <a
        href="#ask-office"
        className="fixed bottom-4 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-lg lg:hidden"
      >
        <Sparkles className="h-4 w-4 text-blue-300" />
        Frag Ihr digitales Büro
      </a>
    </div>
  );
}
