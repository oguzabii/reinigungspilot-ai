import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  ShieldCheck,
  Building2,
  Inbox,
  FileText,
  Briefcase,
  BellRing,
  Receipt,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { ResetWorkspaceForm } from "./ResetWorkspaceForm";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getTenantCounts } from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arbeitsbereich bereinigen (intern) – Klarsa",
  description:
    "Test-/Altdaten aus dem aktiven Arbeitsbereich archivieren. Owner/Admin, mit Tippbestätigung. Tenant, Einstellungen, Nutzer und Pakete bleiben unberührt.",
  robots: { index: false, follow: false },
};

export default async function CleanupPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  const canManage = role === "owner" || role === "admin";

  const [summary, counts] = await Promise.all([
    getCompanySummary(companyId),
    getTenantCounts(companyId),
  ]);

  const rows = [
    { icon: Building2, label: "Firmen / Chancen", value: counts.prospects },
    { icon: Inbox, label: "Leads", value: counts.leads },
    { icon: BellRing, label: "Follow-ups", value: counts.followupTasks },
    { icon: FileText, label: "Offerten", value: counts.offers },
    { icon: Briefcase, label: "Aufträge", value: counts.jobs },
    { icon: Receipt, label: "bexio-Übergaben", value: counts.bexioHandoffs },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell/ceo"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> Chefansicht
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
            <Trash2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Arbeitsbereich bereinigen
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · Test- und Altdaten aus den Arbeitslisten entfernen
            </p>
          </div>
        </div>

        {/* Preview counts */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Aktuell im Arbeitsbereich
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.label}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                    {r.label}
                  </span>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-navy-900">
                    {r.value ?? "—"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* What happens */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Arbeitsdaten archivieren
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Archiviert Firmen/Chancen, Leads, Follow-ups, Offerten und Aufträge aus
            den aktiven Arbeitslisten – ideal, um Test- oder Altdaten zu entfernen
            und sauber zu starten. Die Einträge verschwinden aus den Listen.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
              <p className="text-xs font-semibold text-amber-900">Wird archiviert</p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-amber-800">
                <li>Firmen / Chancen</li>
                <li>Leads</li>
                <li>Follow-ups</li>
                <li>Offerten</li>
                <li>Aufträge (inkl. bexio-Übergaben aus den Listen)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                <ShieldCheck className="h-3.5 w-3.5" /> Bleibt unberührt
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-emerald-800">
                <li>Betrieb, Einstellungen & Dienstleistungen</li>
                <li>Nutzer, Anmeldung & Paket</li>
                <li>Protokoll/Verlauf</li>
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <ResetWorkspaceForm canManage={canManage} />
          </div>
        </section>

        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Archivieren ist schonend: Einträge werden aus den Arbeitslisten entfernt,
          nicht endgültig gelöscht. Einzelne Einträge lassen sich auch direkt in der
          jeweiligen Liste entfernen.
        </p>
      </main>
    </div>
  );
}
