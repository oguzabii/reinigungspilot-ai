import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Lock,
  Target,
  MapPin,
  Clock,
  Gauge,
  Lightbulb,
  ChevronRight,
  Radar,
  CheckCircle2,
  Building2,
  ExternalLink,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { SafeModeBanner } from "@/components/revenue-autopilot/SafeModeBanner";
import { EmptyState } from "@/components/app-shell/EmptyState";
import {
  buildSignalsFromProspects,
  signalFromRawSignal,
  categoryForSignalType,
  SIGNAL_TYPE_META,
  TIMING_META,
  confidenceBadge,
  type OpportunitySignal,
} from "@/components/revenue-autopilot/signals";
import { SIGNAL_ADAPTERS } from "@/lib/discovery/adapters";
import { CreateSignalOpportunityButton } from "./CreateSignalOpportunityButton";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getProspects } from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Opportunity Signals (intern) – Klarsa",
  description:
    "Opportunity Signal Engine: warum jetzt? Aus erfassten/entdeckten Kandidaten – Service-Potenzial, Timing (exakt/geschätzt), Konfidenz, nächste Aktion. Kein Scraping, kein Auto-Versand.",
  robots: { index: false, follow: false },
};

export default async function SignalsPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, prospects] = await Promise.all([
    getCompanySummary(companyId),
    getProspects(companyId),
  ]);

  const signals = buildSignalsFromProspects(prospects);

  // Live adapter signals (Baugesuche Zürich) — only when the owner configured an
  // official endpoint. Capped + timeout inside the adapter; no scraping.
  const baugesucheAdapter = SIGNAL_ADAPTERS.find((a) => a.key === "baugesuche");
  let baugesucheSignals: OpportunitySignal[] = [];
  let baugesucheError: string | null = null;
  if (baugesucheAdapter && baugesucheAdapter.isConfigured()) {
    const result = await baugesucheAdapter.run({ query: "", limit: 10 });
    if (result.status === "ok") {
      const nowIso = new Date().toISOString();
      baugesucheSignals = result.signals.map((raw, i) =>
        signalFromRawSignal(raw, {
          idPrefix: "bg",
          index: i,
          sourceType: "baugesuche",
          sourceName: "Baugesuche Zürich",
          nowIso,
        }),
      );
    } else if (result.status === "unsupported_schema") {
      // Customer-facing: a simple message, never a raw column/schema dump.
      baugesucheError = "Keine passenden Bau-Signale gefunden.";
    } else if (result.status === "error") {
      baugesucheError = result.message ?? "Baugesuche-Quelle momentan nicht erreichbar.";
    }
  }

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
            <Activity className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Opportunity Signals · Warum jetzt?
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {signals.length} Signal
              {signals.length === 1 ? "" : "e"} aus erfassten/entdeckten Kandidaten
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SafeModeBanner />
        </div>

        {/* Honest timing note */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Ehrliches Timing.</strong> Solange
            keine offizielle Quelle ein Datum liefert, ist die Zeitangabe{" "}
            <strong className="font-semibold">geschätzt</strong> (inferred) oder{" "}
            <strong className="font-semibold">unbekannt</strong> – nie als exakter
            Fertigstellungs-/Fristtermin ausgegeben. Jedes Signal zeigt Quelle,
            Warum-jetzt, Service-Vorschlag, Konfidenz, nächste Aktion und die
            Timing-Güte. <strong className="font-semibold">Kein Auto-Versand, keine
            Buchung</strong> aus Signalen.
          </p>
        </div>

        {/* Source readiness */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Signal-Quellen (Bereitschaft)
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Offizielle/freigegebene Quellen – kein Scraping. Geplante Quellen
            brauchen eine gesonderte Freigabe.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SIGNAL_ADAPTERS.map((a) => {
              const live = a.phase === "live";
              const ready = live && a.isConfigured();
              return (
                <div key={a.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-navy-900">{a.label}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                        ready
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : live
                            ? "bg-slate-100 text-slate-500 ring-slate-200"
                            : "bg-violet-50 text-violet-700 ring-violet-200"
                      }`}
                    >
                      {ready ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Aktiv
                        </>
                      ) : live ? (
                        "Nicht konfiguriert"
                      ) : (
                        <>
                          <Clock className="h-3 w-3" /> Geplant
                        </>
                      )}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{a.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Baugesuche signals (only when the source is configured) */}
        {baugesucheAdapter?.isConfigured() && (
          <section className="mt-8">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
              <Building2 className="h-4 w-4 text-blue-600" />
              Bau-Signale · Baugesuche Zürich (live)
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium tabular-nums text-emerald-700 ring-1 ring-inset ring-emerald-200">
                {baugesucheSignals.length}
              </span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aus der offiziellen, owner-konfigurierten Bauprojekt-Quelle (max. 10,
              kein Scraping). Timing nur exakt, wenn die Quelle ein Datum liefert.
            </p>
            {baugesucheError ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p>{baugesucheError}</p>
              </div>
            ) : baugesucheSignals.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Keine aktuellen Bau-Signale aus der Quelle.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {baugesucheSignals.map((s) => (
                  <SignalCard key={s.id} signal={s} />
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Signal cards */}
        <section className="mt-8">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
            <Activity className="h-4 w-4 text-blue-600" />
            Signale aus Kandidaten
          </h2>
          {signals.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                icon={Radar}
                tone="ready"
                title="Noch keine Signale."
                description="Erfassen Sie Opportunities im Lead Hunter oder starten Sie einen Discovery-Lauf. Klarsa erklärt dann pro Kandidat das Warum-jetzt, den passenden Service und die nächste Aktion."
                cta={{ label: "Zur Discovery", href: "/app-shell/revenue-autopilot/discovery" }}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {signals.map((s) => (
                <SignalCard key={s.id} signal={s} />
              ))}
            </ul>
          )}
        </section>

        {/* Honest note */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm leading-relaxed text-slate-600">
            v0.5.3 beginnt die Warum-jetzt-Intelligenz aus bestehenden
            Kandidaten. Exakte Bauabschluss-/Fristtermine kommen erst mit
            angebundenen <strong className="font-medium text-navy-800">offiziellen
            Quellen</strong> (Baugesuche, SIMAP, ZEFIX) – jeweils nach Freigabe und
            Quellenprüfung. Aus einem Signal entsteht <strong className="font-medium text-navy-800">
            kein</strong> automatischer Kontakt; Sie übernehmen es im Lead Hunter.
          </p>
        </div>
      </main>
    </div>
  );
}

function SignalCard({ signal: s }: { signal: OpportunitySignal }) {
  const typeMeta = SIGNAL_TYPE_META[s.signalType];
  const timeMeta = TIMING_META[s.timingConfidence];
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-navy-900">{s.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">Quelle: {s.sourceName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${typeMeta.className}`}>
            {typeMeta.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${confidenceBadge(s.confidenceScore)}`}>
            <Gauge className="h-3 w-3" />
            Konfidenz {s.confidenceScore}
          </span>
        </div>
      </div>

      {/* Why now */}
      <p className="mt-3 rounded-lg bg-blue-50/50 px-3 py-2 text-sm leading-relaxed text-navy-800 ring-1 ring-inset ring-blue-100">
        <span className="font-medium text-blue-700">Warum jetzt: </span>
        {s.whyNow}
      </p>

      {/* Services */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Target className="h-3 w-3" /> Service-Potenzial:
        </span>
        {s.suggestedServices.map((svc) => (
          <span
            key={svc}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100"
          >
            {svc}
          </span>
        ))}
      </div>

      {/* Meta row: region + timing */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
        {s.region && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {s.region}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${timeMeta.className}`}
          >
            {timeMeta.label}
          </span>
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.timingLabel}</p>

      {/* Next action */}
      <p className="mt-3 text-sm text-navy-800">
        <span className="font-medium text-slate-500">Nächste Aktion:</span>{" "}
        {s.nextAction}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        {s.relatedProspectId ? (
          <Link
            href="/app-shell/lead-hunter"
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
          >
            <Target className="h-3.5 w-3.5" strokeWidth={2.2} />
            Im Lead Hunter prüfen & übernehmen
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <CreateSignalOpportunityButton
            title={s.title}
            category={categoryForSignalType(s.signalType)}
            region={s.region}
            service={s.suggestedServices[0] ?? null}
            reason={`${s.whyNow}\nQuelle: ${s.sourceName}${s.sourceUrl ? ` · ${s.sourceUrl}` : ""}\nTiming: ${s.timingLabel}`}
            nextAction={s.nextAction}
            score={s.confidenceScore}
          />
        )}
        {s.sourceUrl && (
          <a
            href={s.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
          >
            Quelle öffnen <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </li>
  );
}
