import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Globe,
  ArrowLeft,
  Lock,
  Radar,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  History,
  Settings2,
  ShieldAlert,
  Activity,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { SafeModeBanner } from "@/components/revenue-autopilot/SafeModeBanner";
import { isPremiumExperience } from "@/components/app-shell/autopilot-tier";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { RunDiscoveryForm } from "./RunDiscoveryForm";
import { scoreBadgeClass } from "@/components/lead-hunter/opportunity-meta";
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getAutopilotPolicy,
  getProspects,
  getDiscoveryRuns,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Automatische Discovery (intern) – Klarsa",
  description:
    "Kontrollierte automatische Discovery über die offizielle Google-Places-API (env-gated, owner-initiiert, kein Scraping, kein Cron). Kalt entdeckte Kandidaten – Cold-Outreach gesperrt.",
  robots: { index: false, follow: false },
};

function formatDateTime(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

export default async function DiscoveryPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  const canManage = role === "owner" || role === "admin";

  const configured = isDiscoveryConfigured();

  const [summary, toggles, prospects, runs] = await Promise.all([
    getCompanySummary(companyId),
    getAutopilotPolicy(companyId),
    getProspects(companyId),
    getDiscoveryRuns(companyId),
  ]);

  // Auto-discovered candidates = cold prospects from Google Places.
  const discovered = prospects.filter((p) => p.sourceType === "google");

  const isPremium = isPremiumExperience(
    summary?.tier ?? "starter",
    summary?.billingStatus,
  );

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
            <Globe className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Automatische Discovery
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · kontrolliert, owner-initiiert, kein Scraping
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SafeModeBanner />
        </div>

        {/* Provider + policy status */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <StatusCard
            ok={configured}
            title="Discovery-API (Google Places)"
            okText="Konfiguriert – offizielle API, owner-initiiert."
            offText="Nicht konfiguriert. Inhaber setzt GOOGLE_PLACES_API_KEY in der Umgebung (nie im Repo)."
          />
          <StatusCard
            ok={toggles.autoCreateColdCandidates}
            title="Auto-Erstellung kalter Kandidaten"
            okText="EIN – Treffer werden als Prospect (kalt) erstellt."
            offText="AUS – Treffer werden nur angezeigt. In den Richtlinien aktivierbar."
            neutral
          />
        </section>

        {/* Premium auto-discovery — package-aware, honest */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm leading-relaxed text-navy-800">
            {isPremium ? (
              <>
                <strong className="font-semibold">Premium:</strong> Sobald eine
                freigegebene Discovery-Quelle verbunden ist, kann Klarsa die
                Discovery <strong className="font-semibold">automatisch und
                kanalweise</strong> ausführen – jeder Lauf bleibt sichtbar und
                protokolliert. Heute läuft sie auf Ihre Auslösung.
              </>
            ) : (
              <>
                <strong className="font-semibold">Premium-Funktion:</strong> Im
                Premium-Paket führt Klarsa die Discovery automatisch aus, sobald
                eine freigegebene Quelle verbunden ist. In Ihrem Paket starten Sie
                Läufe selbst.
              </>
            )}
          </p>
        </div>

        {/* Why now? — Opportunity Signals */}
        <Link
          href="/app-shell/revenue-autopilot/signals"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Activity className="h-4 w-4 text-blue-600" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-navy-900">
              Opportunity Signals · Warum jetzt?
            </span>
            <span className="block text-sm text-slate-500">
              Aus entdeckten Kandidaten: Service-Potenzial, Timing (exakt/
              geschätzt), Konfidenz und nächste Aktion.
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </Link>

        {/* Run discovery */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Discovery starten
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manueller Lauf über die offizielle Places-API (max. 10 Treffer,
            Duplikat-geprüft). Kein automatischer Zeitplan, kein Scraping.
          </p>
          <div className="mt-4">
            <RunDiscoveryForm configured={configured} canRun={canManage} />
          </div>
          <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
            <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" />
            Treffer sind kalt: nicht kontaktiert, Cold-Outreach per Richtlinie
            gesperrt. Kontaktaufnahme nur nach manueller Freigabe.
          </p>
        </section>

        {/* Discovered candidates */}
        <section className="mt-8">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
            <Building2 className="h-4 w-4 text-blue-600" />
            Entdeckte Kandidaten (kalt)
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-500">
              {discovered.length}
            </span>
          </h2>
          {discovered.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Radar}
                tone="ready"
                title="Noch keine automatisch entdeckten Kandidaten."
                description="Starten Sie oben einen Discovery-Lauf (sofern die API konfiguriert ist). Treffer erscheinen hier als kalte Kandidaten – ohne Kontaktaufnahme."
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {discovered.slice(0, 20).map((p) => (
                <li key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-navy-900">{p.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreBadgeClass(p.score)}`}>
                        Score {p.score ?? "—"}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                        Kalt · Outreach gesperrt
                      </span>
                    </div>
                  </div>
                  {p.region && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {p.region}
                    </p>
                  )}
                  <Link
                    href="/app-shell/lead-hunter"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
                  >
                    Im Lead Hunter prüfen / freigeben →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent runs — audit transparency */}
        <section className="mt-8">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
            <History className="h-4 w-4 text-blue-600" />
            Letzte Läufe (Audit)
          </h2>
          {runs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Noch keine Discovery-Läufe.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {runs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <span className="text-navy-800">
                    <span className="font-medium">{r.query ?? "—"}</span>
                    {r.region ? ` · ${r.region}` : ""}
                  </span>
                  <span className="text-xs text-slate-500">
                    {r.found ?? 0} gefunden · {r.created ?? 0} erstellt · {r.deduped ?? 0} Duplikate
                    {" · "}
                    {formatDateTime(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Honest note */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Nur offizielle API, kein Scraping.</strong>{" "}
            Klarsa liest keine Google-Maps-Seiten/HTML aus. Die Discovery läuft nur
            mit vom Inhaber gesetztem API-Schlüssel (nie im Repo), nur auf manuelle
            Auslösung (kein Cron), mit hartem Trefferlimit. Entdeckte Betriebe sind
            kalt – es erfolgt <strong className="font-semibold">keine</strong>{" "}
            automatische Kontaktaufnahme. Richtlinien unter{" "}
            <Link href="/app-shell/revenue-autopilot/policy" className="font-medium text-amber-900 underline">
              Autopilot-Richtlinien
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function StatusCard({
  ok,
  title,
  okText,
  offText,
  neutral,
}: {
  ok: boolean;
  title: string;
  okText: string;
  offText: string;
  neutral?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className={`h-4 w-4 ${neutral ? "text-blue-600" : "text-emerald-600"}`} />
        ) : (
          <XCircle className="h-4 w-4 text-slate-400" />
        )}
        <span className="text-sm font-semibold text-navy-900">{title}</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {ok ? okText : offText}
      </p>
      {neutral && (
        <Link
          href="/app-shell/revenue-autopilot/policy"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
        >
          <Settings2 className="h-3.5 w-3.5" /> Richtlinien
        </Link>
      )}
    </div>
  );
}
