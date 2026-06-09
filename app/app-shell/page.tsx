import type { Metadata } from "next";
import Link from "next/link";
import {
  Lock,
  LogIn,
  ShieldCheck,
  Building2,
  KeyRound,
  Workflow,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";

export const metadata: Metadata = {
  title: "App-Shell (Vorschau, intern) – Klarsa",
  description:
    "Vorschau auf den geschützten Klarsa-Arbeitsbereich. Login-/Session-Fundament geplant. Noch keine echten Kundendaten.",
  robots: { index: false, follow: false },
};

const FOUNDATION_POINTS = [
  {
    icon: KeyRound,
    title: "Login & Session (Fundament)",
    body: "Supabase Auth, server-/browser-Clients und Session-Helfer sind angelegt (v0.2.6). Der echte Login wird mit Staging-Zugang aktiv.",
  },
  {
    icon: ShieldCheck,
    title: "RLS-Kontext pro Tenant",
    body: "Nach dem Login bestimmt die Mitgliedschaft (company_id + Rolle) den Zugriff. Rollenbasierte RLS ist auf Staging bereits verifiziert.",
  },
  {
    icon: Building2,
    title: "Clean24 = erster Tenant",
    body: "Clean24 Memis GmbH bleibt der erste echte Tenant – erst nach Auth-/RLS-/Backup-Freigabe, nicht vorher.",
  },
  {
    icon: Workflow,
    title: "Module folgen schrittweise",
    body: "Lead Inbox, Offerten, Follow-ups, Jobs, bexio-Übergabe und Reports werden nach dem Auth-Fundament angebunden.",
  },
];

export default function AppShellPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Klarsa Core · App-Shell · Vorschau
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
          Geschützter Arbeitsbereich (Vorschau)
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          Hier entsteht der eingeloggte Klarsa-Arbeitsbereich. Diese Seite ist
          eine statische Vorschau des <strong className="font-semibold text-navy-900">Auth-Fundaments</strong>{" "}
          (v0.2.6) – ohne Logik, ohne Datenbankanbindung und ohne echte Daten.
        </p>

        {/* No-data warning */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Noch keine echten Kundendaten.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800">
              Etwaige Staging-Testdaten (Domain <code>example.test</code>) sind
              rein fiktiv und <strong className="font-semibold">keine</strong>{" "}
              echten Kunden.
              Harte Regel: „No Security = No Customer Data.“ Echte Daten erst nach
              validiertem Auth, RLS und Backup/Restore.
            </p>
          </div>
        </div>

        {/* Login CTA */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          >
            <LogIn className="h-4 w-4" strokeWidth={2.2} />
            Zum Login
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            App-Foundation
          </Link>
        </div>

        {/* Foundation points */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {FOUNDATION_POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="inline-flex items-center gap-2 font-semibold text-navy-900">
                  <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                  {p.title}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-navy-900">
            Auth-Architektur
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Details in <code>docs/auth-foundation.md</code>: Auth-Flow,
            Session-Handling, Cookie-/Server-Client-Strategie, Rollen-/
            Mitglieder-Lookup, Strategie für geschützte Routen und die Regeln zum
            Service-Role-Key. Nächster Schritt:{" "}
            <strong className="font-semibold text-navy-900">
              v0.2.7 – App-Shell an Supabase-Staging mit fiktiven Tenant-Daten
              anbinden
            </strong>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
