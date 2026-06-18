import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FilePlus2, Inbox, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { NewOfferForm } from "@/components/offers/NewOfferForm";
import { ManualOfferForm } from "@/components/offers/ManualOfferForm";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getLeads } from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Neue Offerte erstellen (intern) – Klarsa",
  description:
    "Neue Offerte: aus einem bestehenden Lead übernehmen oder einen neuen Kunden manuell erfassen. RLS-gefiltert, kein automatischer Versand.",
  robots: { index: false, follow: false },
};

export default async function AppShellNewOfferPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, leads] = await Promise.all([
    getCompanySummary(companyId),
    getLeads(companyId),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell/pipeline"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Zur Pipeline
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <FilePlus2 className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Neue Offerte erstellen
            </h1>
            <p className="text-sm text-slate-500">
              Aus einem bestehenden Lead übernehmen – oder einen neuen Kunden
              gleich miterfassen.
            </p>
          </div>
        </div>

        {/* Calm status note */}
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          Die Offerte wird als Entwurf gespeichert. PDF herunterladen und Status
          pflegen erfolgt anschliessend auf der Offerte.
        </div>

        {/* Mode A — from an existing lead */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-blue-600" strokeWidth={2} />
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">
              Aus Lead übernehmen
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {leads.length > 0
              ? "Wählen Sie einen Lead – Referenz wird automatisch vergeben, eine erste Position ist optional."
              : "Noch keine Leads vorhanden. Erfassen Sie unten direkt einen neuen Kunden."}
          </p>
          <div className="mt-4">
            <NewOfferForm
              leads={leads.map((l) => ({ id: l.id, name: l.companyName }))}
            />
          </div>
        </section>

        {/* Mode B — manual new customer */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" strokeWidth={2} />
            <h2 className="text-lg font-semibold tracking-tight text-navy-900">
              Manuell erfassen (neuer Kunde)
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Kunde und Offerte in einem Schritt. Der Kunde wird als Lead
            gespeichert und bleibt im System – für PDF, Auftrag und Übergabe.
          </p>
          <div className="mt-4">
            <ManualOfferForm />
          </div>
        </section>
      </main>
    </div>
  );
}
