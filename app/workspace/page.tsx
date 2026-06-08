import type { Metadata } from "next";
import {
  Gauge,
  Sparkles,
  Inbox,
  FileText,
  BellRing,
  Briefcase,
  PlugZap,
  ChartColumn,
  Building2,
  Star,
  MapPin,
  Lock,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { CLEAN24_TENANT } from "@/lib/tenant-clean24";

export const metadata: Metadata = {
  title: "Klarsa App Foundation (intern) – Klarsa",
  description:
    "Statisches Fundament der künftigen Klarsa-App (Multi-Tenant). Clean24 als erster Tenant, geplante Module. Noch kein Login, keine echten Kundendaten.",
  robots: { index: false, follow: false },
};

const PLANNED_MODULES = [
  {
    icon: Sparkles,
    name: "Lead Hunter",
    tier: "Ab Pro",
    desc: "Kontrollierte B2B-Discovery mit Quellen-Tracking, Begründung und menschlicher Freigabe.",
  },
  {
    icon: Inbox,
    name: "Lead Inbox",
    tier: "Alle Pakete",
    desc: "Zentrale, nach Potenzial bewertete Sammlung aller eingehenden Anfragen.",
  },
  {
    icon: FileText,
    name: "Offer Engine",
    tier: "Alle Pakete",
    desc: "Offerten mit Positionen, Preisen und PDF-Entwurf in Minuten.",
  },
  {
    icon: BellRing,
    name: "Follow-ups",
    tier: "Alle Pakete",
    desc: "Getaktete 24h-, 48h- und 5-Tage-Sequenzen pro Lead.",
  },
  {
    icon: Briefcase,
    name: "Jobs",
    tier: "Ab Pro",
    desc: "Gewonnene Aufträge planen, Teams und Termine organisieren.",
  },
  {
    icon: PlugZap,
    name: "bexio Übergabe",
    tier: "Ab Pro",
    desc: "Saubere Übergabe gewonnener Aufträge an die Buchhaltung (bexio Connect).",
  },
  {
    icon: ChartColumn,
    name: "Reports",
    tier: "Ab Pro",
    desc: "Wöchentlicher Chef-Report, monatlicher Strategie-Report (Premium).",
  },
];

export default function WorkspacePage() {
  const t = CLEAN24_TENANT;

  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Klarsa Core · Intern · Plan
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
          Klarsa App Foundation
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Statisches Fundament der künftigen Klarsa-App als{" "}
          <strong className="font-semibold text-navy-900">
            Multi-Tenant-SaaS
          </strong>{" "}
          für Schweizer KMU. Diese Seite zeigt den Architektur-Plan und den
          ersten Tenant. Es gibt hier noch keine Logik, keine Datenbank und keine
          echten Daten.
        </p>

        {/* Warning banner */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Noch kein Login, keine echten Kundendaten.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              Echte Daten gehen erst live, wenn Auth, Rollen, Mandantentrennung
              (RLS), Audit-Logs und Backup/Restore stehen. Harte Regel:{" "}
              <strong className="font-semibold">
                „No Security = No Customer Data.“
              </strong>
            </p>
          </div>
        </div>

        {/* First tenant */}
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Building2 className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                Erster Tenant
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-navy-900">
                {t.legalName}
              </h2>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                Live-Proof
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Marke: {t.brandName}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Branche: Reinigung
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Plan-Paket: Pro
              </span>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Leistungen
                </p>
                <ul className="mt-2 space-y-1.5">
                  {t.services.map((s) => (
                    <li
                      key={s.key}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-navy-900">
                        {s.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {s.priceLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Lead-Quellen
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {t.sources.map((src) => (
                    <li
                      key={src.type}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    >
                      {src.label}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Regionen
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  Alle {t.cantons.length} Kantone · u. a.{" "}
                  {t.cityExamples.slice(0, 6).join(", ")} …
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Planned modules */}
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Gauge className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                Geplante Module
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-navy-900">
                Klarsa Core
              </h2>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLANNED_MODULES.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.name}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 font-semibold text-navy-900">
                      <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                      {m.name}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {m.tier}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Docs pointer */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-navy-900">
            Architektur-Dokumentation
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Der vollständige Plan liegt unter <code>docs/</code>:
            Phase-2-Architektur, Datenmodell, Security-Architektur,
            Lead-Hunter-Engine und bexio-Architektur. Nächster Schritt:{" "}
            <strong className="font-semibold text-navy-900">
              v0.2.1 – Supabase-Schema-Fundament
            </strong>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
