import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SlidersHorizontal,
  ArrowLeft,
  Lock,
  CheckCircle2,
  XCircle,
  Ban,
  Globe,
  Mail,
  CalendarClock,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { SafeModeBanner } from "@/components/revenue-autopilot/SafeModeBanner";
import { PolicyToggles } from "./PolicyToggles";
import {
  policyMatrix,
  CATEGORY_META,
  HARD_BLOCKED,
  type ProviderStatus,
  type CategoryPolicy,
  type PolicyVerdict,
} from "@/components/revenue-autopilot/policy";
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getAutopilotPolicy } from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Autopilot-Richtlinien (intern) – Klarsa",
  description:
    "Autopilot Rules Engine: was Klarsa automatisch darf und was gesperrt ist – nach Kontakt-Kategorie. Cold-Outreach gesperrt, keine stille Buchung. Owner-Toggles für sichere Modi.",
  robots: { index: false, follow: false },
};

export default async function PolicyPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  const canManage = role === "owner" || role === "admin";

  const [summary, toggles] = await Promise.all([
    getCompanySummary(companyId),
    getAutopilotPolicy(companyId),
  ]);

  const providers: ProviderStatus = {
    discoveryConfigured: isDiscoveryConfigured(),
    sendConfigured: false, // no compliant send provider in v0.5.2
    calendarConfigured: false, // no calendar provider in v0.5.2
  };
  const matrix = policyMatrix(toggles, providers);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell/revenue-autopilot"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> Revenue Autopilot
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
            <SlidersHorizontal className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Autopilot-Richtlinien
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · was automatisch erlaubt ist – und was nicht
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SafeModeBanner />
        </div>

        {/* Provider status */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <ProviderCard icon={Globe} title="Discovery" ok={providers.discoveryConfigured} okText="Konfiguriert" offText="Nicht konfiguriert" />
          <ProviderCard icon={Mail} title="Versand-Provider" ok={providers.sendConfigured} okText="Konfiguriert" offText="Nicht konfiguriert (kein Auto-Versand)" />
          <ProviderCard icon={CalendarClock} title="Kalender" ok={providers.calendarConfigured} okText="Konfiguriert" offText="Nicht konfiguriert (keine Buchung)" />
        </section>

        {/* Policy matrix by category */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Was Klarsa automatisch darf – nach Kontakt-Kategorie
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Erlaubt nur für sichere Kategorien. Kalt entdeckte Kontakte: Erstellung
            ja, Outreach nein.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {matrix.map((cp) => (
              <CategoryCard key={cp.category} cp={cp} />
            ))}
          </div>
        </section>

        {/* Hard-blocked */}
        <section className="mt-8">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
            <Ban className="h-4 w-4 text-rose-600" />
            Immer gesperrt (kein Toggle)
          </h2>
          <ul className="mt-3 space-y-2">
            {HARD_BLOCKED.map((h) => (
              <li key={h.label} className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/60 p-3.5">
                <Ban className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>
                  <span className="block text-sm font-semibold text-rose-900">{h.label}</span>
                  <span className="block text-xs leading-relaxed text-rose-700">{h.reason}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Owner toggles */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Sichere Modi aktivieren
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Nur sichere Automatiken sind hier schaltbar. Cold-Outreach, Auto-Anrufe
            und stille Buchung bleiben gesperrt.
          </p>
          <div className="mt-4">
            <PolicyToggles
              toggles={toggles}
              sendConfigured={providers.sendConfigured}
              discoveryConfigured={providers.discoveryConfigured}
              canManage={canManage}
            />
          </div>
        </section>

        {/* Honest note */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            Klarsa bewegt sich Richtung Automatik, aber kontrolliert per Richtlinie.
            <strong className="font-semibold"> Voll automatischer Cold-Outreach ist
            gesperrt.</strong>{" "}
            Inbound/freigegebene/bestehende Kontakte sind der erlaubte Pfad – und
            auch dort nur mit konfiguriertem, konformem Versand-Provider (Absender-
            Identität + Opt-out). Echte Gmail-/Kalender-/Provider-Anbindung ist eine
            spätere, gesondert freizugebende Phase.
          </p>
        </div>
      </main>
    </div>
  );
}

function ProviderCard({
  icon: Icon,
  title,
  ok,
  okText,
  offText,
}: {
  icon: typeof Globe;
  title: string;
  ok: boolean;
  okText: string;
  offText: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" strokeWidth={2} />
        <span className="text-sm font-semibold text-navy-900">{title}</span>
      </div>
      <p className={`mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium ${ok ? "text-emerald-700" : "text-slate-500"}`}>
        {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        {ok ? okText : offText}
      </p>
    </div>
  );
}

function CategoryCard({ cp }: { cp: CategoryPolicy }) {
  const meta = CATEGORY_META[cp.category];
  const rows: Array<{ label: string; v: PolicyVerdict }> = [
    { label: "Auto-Erstellung", v: cp.autoCreate },
    { label: "Auto-Nachricht", v: cp.autoMessage },
    { label: "Auto-Follow-up", v: cp.autoFollowup },
    { label: "Termin-Vorschlag", v: cp.autoAppointment },
    { label: "Auto-Buchung", v: cp.autoBook },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-navy-900">{meta.label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{meta.description}</p>
      <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-start gap-2">
            {r.v.allowed ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
            )}
            <span className="min-w-0">
              <span className="text-xs font-semibold text-navy-800">{r.label}</span>
              <span className="block text-[11px] leading-relaxed text-slate-500">{r.v.reason}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
