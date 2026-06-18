import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
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
  Rocket,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { SafeModeBanner } from "@/components/revenue-autopilot/SafeModeBanner";
import {
  autopilotTier,
  isPremiumExperience,
  tierRank,
} from "@/components/app-shell/autopilot-tier";
import { EmptyState } from "@/components/app-shell/EmptyState";
import { RunDiscoveryForm } from "./RunDiscoveryForm";
import { scoreBadgeClass } from "@/components/lead-hunter/opportunity-meta";
import { SIGNAL_ADAPTERS } from "@/lib/discovery/adapters";
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isBaugesucheConfigured } from "@/lib/discovery/baugesuche-zh";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getAutopilotPolicy,
  getProspects,
  getDiscoveryRuns,
  getHiddenDiscoveryRuns,
  type DiscoveryRunLog,
} from "@/lib/auth/tenant-data";
import { HideRunButton, HideAllRunsButton } from "./HideRunControls";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approved Discovery Autopilot (intern) – Klarsa",
  description:
    "Approved Discovery Autopilot: Klarsa findet über offizielle, freigegebene Quellen (Google Places, Baugesuche Zürich) passende Chancen und erstellt – wenn erlaubt – kalte Kandidaten. Kein Scraping, keine Kontaktaufnahme.",
  robots: { index: false, follow: false },
};

function formatDateTime(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

function sourceLabel(s: string | null): string {
  if (s === "google" || s === "google_places") return "Google Places";
  if (s === "baugesuche" || s === "baugesuche_zh") return "Baugesuche Zürich";
  return s ?? "—";
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

  const googleConfigured = isDiscoveryConfigured();
  const baugesucheConfigured = isBaugesucheConfigured();
  const anySource = googleConfigured || baugesucheConfigured;

  const [summary, toggles, prospects, runs, hiddenRuns] = await Promise.all([
    getCompanySummary(companyId),
    getAutopilotPolicy(companyId),
    getProspects(companyId),
    getDiscoveryRuns(companyId),
    getHiddenDiscoveryRuns(companyId),
  ]);

  // UI-level hide (audit logs are never mutated): drop runs the owner hid.
  const visibleRuns = runs.filter(
    (r) =>
      !hiddenRuns.hiddenIds.includes(r.id) &&
      (!hiddenRuns.hiddenBefore || r.createdAt >= hiddenRuns.hiddenBefore),
  );

  const tier = summary?.tier ?? "starter";
  const tierInfo = autopilotTier(tier, summary?.billingStatus);
  const isPremium = isPremiumExperience(tier, summary?.billingStatus);
  const isPro = tierRank(tier) >= 1;

  // Cold candidates from approved discovery sources (Google + official feeds).
  const discovered = prospects.filter(
    (p) => p.sourceType === "google" || p.sourceType === "other",
  );
  const lastRun = runs[0] ?? null;

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
              Approved Discovery Autopilot
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {tierInfo.label}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SafeModeBanner />
        </div>

        {/* Approved sources — official adapters only */}
        <SectionTitle icon={Globe} title="Freigegebene Quellen" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SIGNAL_ADAPTERS.filter((a) => a.phase === "live").map((a) => (
            <SourceCard
              key={a.key}
              title={a.label}
              configured={a.isConfigured()}
              description={a.description}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Geplant (gesondert freizugeben):{" "}
          {SIGNAL_ADAPTERS.filter((a) => a.phase === "planned")
            .map((a) => a.label)
            .join(" · ")}
          . Nur offizielle APIs / freigegebene Open-Data – kein Scraping, kein
          HTML/PDF, kein Headless-Browser.
        </p>

        {isPro ? (
          <>
            {/* Discovery Autopilot status */}
            <SectionTitle icon={Activity} title="Discovery-Autopilot-Status" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <StatusCard
                ok={anySource}
                title="Quellen-Verbindung"
                okText={
                  lastRun
                    ? "Aktiv – mindestens eine freigegebene Quelle verbunden."
                    : "Bereit – freigegebene Quelle verbunden, noch kein Lauf."
                }
                offText="Kanal nicht verbunden – noch keine freigegebene Quelle aktiv."
              />
              <StatusCard
                ok={toggles.autoCreateColdCandidates}
                title="Auto-Erstellung kalter Kandidaten"
                okText="EIN – Treffer werden automatisch als Kandidat (kalt) erstellt."
                offText="AUS – nur Vorschau. In den Richtlinien aktivierbar."
                neutral
              />
            </div>

            {/* Premium framing */}
            <div className="mt-3 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <p className="text-sm leading-relaxed text-navy-800">
                {isPremium ? (
                  <>
                    <strong className="font-semibold">Premium:</strong> Klarsa kann
                    die Discovery über verbundene, freigegebene Quellen{" "}
                    <strong className="font-semibold">automatisch und kanalweise</strong>{" "}
                    ausführen – jeder Lauf bleibt sichtbar und protokolliert. Heute
                    läuft sie auf Ihre Auslösung.
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">Geführt (Pro):</strong> Sie
                    starten Läufe selbst; Treffer werden – je nach Richtlinie –
                    automatisch als Kandidaten erstellt.{" "}
                    <Link href="/pricing" className="font-semibold text-blue-700 underline">
                      Upgrade für Vollautomatik
                    </Link>
                    .
                  </>
                )}
              </p>
            </div>

            {/* Last run */}
            {lastRun && <LastRunCard run={lastRun} />}

            {/* Next recommended action */}
            <NextActionCard
              anySource={anySource}
              autoCreate={toggles.autoCreateColdCandidates}
              discoveredCount={discovered.length}
            />

            {/* Run discovery */}
            <section
              id="run"
              className="mt-8 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-lg font-semibold tracking-tight text-navy-900">
                Discovery starten
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Lauf über eine freigegebene, offizielle Quelle (max. 10 Treffer,
                Duplikat-geprüft, gedeckelt). Kein automatischer Zeitplan, kein
                Scraping.
              </p>
              <div className="mt-4">
                <RunDiscoveryForm
                  googleConfigured={googleConfigured}
                  baugesucheConfigured={baugesucheConfigured}
                  canRun={canManage}
                />
              </div>
              <p className="mt-3 inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
                <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" />
                Treffer sind kalt: nicht kontaktiert, Cold-Outreach per Richtlinie
                gesperrt. Kontaktaufnahme nur nach manueller Freigabe.
              </p>
            </section>
          </>
        ) : (
          /* Starter — locked / upgrade state (never broken) */
          <section className="mt-8 rounded-2xl border border-violet-200 bg-violet-50/70 p-6 text-center sm:p-8">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200">
              <Rocket className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="mt-3 text-base font-semibold text-navy-900">
              Approved Discovery Autopilot ist ab Pro verfügbar
            </p>
            <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
              Im Pro-Paket findet Klarsa neue Firmen über freigegebene Quellen; im
              Premium-Paket läuft die Discovery vollautomatisch und kanalweise. Ihr
              Offert-Büro bleibt voll nutzbar.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
            >
              Upgrade für Vollautomatik
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </section>
        )}

        {/* Why now? — Opportunity Signals */}
        <Link
          href="/app-shell/revenue-autopilot/signals"
          className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
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
                description="Starten Sie oben einen Discovery-Lauf über eine freigegebene Quelle. Treffer erscheinen hier als kalte Kandidaten – ohne Kontaktaufnahme."
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {discovered.slice(0, 20).map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-navy-900">{p.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreBadgeClass(p.score)}`}
                      >
                        Score {p.score ?? "—"}
                      </span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                        Kalt · Outreach gesperrt
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    {p.region && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {p.region}
                      </span>
                    )}
                    {p.category && (
                      <span className="inline-flex items-center gap-1.5 text-slate-500">
                        {p.category}
                      </span>
                    )}
                  </div>
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

        {/* Recent runs — audit transparency (owner can hide clutter) */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
              <History className="h-4 w-4 text-blue-600" />
              Letzte Läufe
            </h2>
            {canManage && visibleRuns.length > 0 && <HideAllRunsButton />}
          </div>
          {visibleRuns.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              {runs.length === 0 ? "Noch keine Discovery-Läufe." : "Keine Läufe sichtbar (ausgeblendet)."}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {visibleRuns.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <span className="text-navy-800">
                    <span className="font-medium">{sourceLabel(r.source)}</span>
                    {r.query ? ` · ${r.query}` : ""}
                    {r.region ? ` · ${r.region}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {r.found ?? 0} gefunden · {r.created ?? 0} erstellt ·{" "}
                      {r.deduped ?? 0} bereits/übersprungen · {formatDateTime(r.createdAt)}
                    </span>
                    {canManage && <HideRunButton runId={r.id} />}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Honest, calm note */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-emerald-900">
            <strong className="font-semibold">Sichtbar, gebunden und protokolliert.</strong>{" "}
            Discovery nutzt nur offizielle, freigegebene Quellen, läuft mit hartem
            Trefferlimit und erstellt höchstens kalte Kandidaten. Es erfolgt{" "}
            <strong className="font-semibold">keine</strong> Kontaktaufnahme. Was
            automatisch erlaubt ist, steuern die{" "}
            <Link href="/app-shell/revenue-autopilot/policy" className="font-medium text-emerald-900 underline">
              Autopilot-Richtlinien
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Globe;
  title: string;
}) {
  return (
    <h2 className="mt-8 inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
      <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
      {title}
    </h2>
  );
}

function SourceCard({
  title,
  configured,
  description,
}: {
  title: string;
  configured: boolean;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-navy-900">{title}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
            configured
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-slate-100 text-slate-500 ring-slate-200"
          }`}
        >
          {configured ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {configured ? "Verbunden" : "Nicht verbunden"}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>
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

function LastRunCard({ run }: { run: DiscoveryRunLog }) {
  return (
    <div className="mt-3 rounded-2xl border border-navy-100 bg-navy-50/50 p-4">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-navy-500">
        <Activity className="h-3.5 w-3.5 text-blue-600" />
        Letzter Lauf · {sourceLabel(run.source)}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-navy-800">
        <span><strong className="font-semibold tabular-nums">{run.found ?? 0}</strong> gefunden</span>
        <span><strong className="font-semibold tabular-nums">{run.created ?? 0}</strong> erstellt</span>
        <span><strong className="font-semibold tabular-nums">{run.deduped ?? 0}</strong> bereits/übersprungen</span>
        <span className="text-slate-500">{formatDateTime(run.createdAt)}</span>
      </div>
    </div>
  );
}

function NextActionCard({
  anySource,
  autoCreate,
  discoveredCount,
}: {
  anySource: boolean;
  autoCreate: boolean;
  discoveredCount: number;
}) {
  let text: string;
  let cta: { label: string; href: string } | null;
  if (!anySource) {
    text =
      "Freigegebene Discovery-Quelle verbinden (durch den Inhaber), dann einen Lauf starten.";
    cta = null;
  } else if (!autoCreate) {
    text =
      "Auto-Erstellung in den Richtlinien aktivieren, damit Treffer automatisch als Kandidaten entstehen.";
    cta = { label: "Zu den Richtlinien", href: "/app-shell/revenue-autopilot/policy" };
  } else if (discoveredCount > 0) {
    text = "Neue Kandidaten im Lead Hunter prüfen und freigeben.";
    cta = { label: "Zum Lead Hunter", href: "/app-shell/lead-hunter" };
  } else {
    text = "Discovery starten – Treffer werden automatisch als Kandidaten erstellt.";
    cta = { label: "Discovery starten", href: "#run" };
  }
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
      <p className="inline-flex items-start gap-2 text-sm text-navy-800">
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <span>
          <span className="font-semibold">Nächste empfohlene Aktion: </span>
          {text}
        </span>
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
        >
          {cta.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
