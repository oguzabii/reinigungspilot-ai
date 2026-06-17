import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { OfficeHero } from "@/components/digital-office/OfficeHero";
import { SetupChecklist } from "@/components/digital-office/SetupChecklist";
import { WorkerBoard } from "@/components/digital-office/WorkerBoard";
import {
  MailboxCard,
  OfferTemplateCard,
  PricingRulesCard,
  ActivityFeed,
  QuickActionGrid,
} from "@/components/digital-office/OfficeSections";
import { AskOffice, AskOfficeCtaCard } from "@/components/digital-office/AskOffice";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { loadOfficeView } from "@/lib/digital-office/office-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Digital Office Builder – Klarsa",
  description:
    "Bauen Sie Ihr digitales Büro mit KI-Mitarbeitern: Mailbox, Offerten-Vorlage und Preisregeln konfigurieren und Ihre digitalen Mitarbeiter live arbeiten sehen.",
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

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={view.companyName} />
      <AskOffice
        context={view.askContext}
        initialMode={view.askMode}
        providerLabel={view.providerLabel}
      />

      <main className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:py-10">
        <OfficeHero
          companyName={view.companyName}
          packageName={view.pkg.name}
          monthlyChf={view.pkg.monthlyChf}
          setupDone={view.setup.doneCount}
          setupTotal={view.setup.totalCount}
          activeWorkerCount={view.activeWorkers.length}
          workerLimit={view.workerLimit}
        />

        <QuickActionGrid>
          <AskOfficeCtaCard enabled={view.askEnabled} />
        </QuickActionGrid>

        <SetupChecklist status={view.setup} />

        <WorkerBoard runtimes={view.runtimes} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MailboxCard
            status={view.mailboxStatus}
            senderName={view.signals.senderName}
            senderEmail={view.signals.senderEmail}
            outgoingLabel={view.sendConfigured ? (view.sendLabel ?? "E-Mail") : null}
            incomingLabel={view.inboxConfigured ? (view.inboxLabel ?? "IMAP") : null}
          />
          <OfferTemplateCard templateCount={0} templateLimit={view.templateLimit} />
          <PricingRulesCard
            ruleCount={0}
            advanced={view.pkg.limits.pricingRules === "advanced"}
          />
          <ActivityFeed items={view.activity} />
        </div>

        {/* Honest automation-status note (owner-facing, non-technical). */}
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-navy-800">
              Ehrlich und kontrolliert.
            </strong>{" "}
            Ihr digitales Büro zeigt nur echte Daten Ihres Betriebs. Es wird nichts
            automatisch gesendet oder gebucht – jede Aktion läuft über Entwurf und
            Freigabe. Mailbox, Offerten-Vorlage und Preisregeln sind als Fundament
            vorbereitet; das Speichern eigener Einstellungen folgt im nächsten
            Schritt.
          </p>
        </div>
      </main>
    </div>
  );
}
