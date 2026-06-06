import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { DEMO_DASHBOARD, DEMO_LEADS } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatusBadge, leadStatusTone } from "@/components/StatusBadge";

export function Hero() {
  return (
    <section className="surface-hero relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2 lg:items-center lg:px-6 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-inset ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            KI-Vertriebsbüro für Reinigungsfirmen
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Das AI-Verkaufsbüro für Ihre Reinigungsfirma.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-100">
            ReinigungsPilot AI findet neue B2B-Kunden, sammelt Anfragen, erstellt
            Offerten und übernimmt Follow-ups – damit Sie mehr Aufträge gewinnen
            und weniger Zeit im Büro verlieren.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Live-Demo ansehen
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
            <Link
              href="#pakete"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Pakete ansehen
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-200">
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Für Schweizer Reinigungsfirmen
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-blue-300" />
              In Minuten zur Offerte
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-blue-300" />
              Starter · Pro · Premium
            </li>
          </ul>
        </div>

        <div className="relative">
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  const leads = DEMO_LEADS.slice(0, 3);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/95 p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy-900">Chef-Dashboard</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live-Demo
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStat label="Neue Leads" value={String(DEMO_DASHBOARD.newLeads.value)} />
        <MiniStat
          label="Offerten"
          value={String(DEMO_DASHBOARD.offersReady.value)}
        />
        <MiniStat
          label="Prognose"
          value={formatChf(DEMO_DASHBOARD.expectedMonthlyRevenueChf)}
        />
      </div>

      <div className="mt-4 space-y-2">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-navy-900">
                {lead.company}
              </p>
              <p className="truncate text-xs text-slate-500">{lead.service}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ScoreBadge score={lead.score} />
              <StatusBadge label={lead.status} tone={leadStatusTone(lead.status)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="truncate text-base font-semibold text-navy-900 tabular-nums">
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
