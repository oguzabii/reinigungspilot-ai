import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Lock,
  LogOut,
  Building2,
  KeyRound,
  Inbox,
  Sparkles,
  FileText,
  BellRing,
  Briefcase,
  PlugZap,
  ChartColumn,
  UserRound,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { isSupabaseConfigured } from "@/lib/env";
import {
  getCurrentProfile,
  getCurrentCompanyContext,
} from "@/lib/auth/session";
import {
  getCompanySummary,
  getTenantCounts,
  type TenantCounts,
} from "@/lib/auth/tenant-data";
import { getPackageName } from "@/lib/packages";

// Reads the session/cookies -> always rendered on demand, never prerendered.
// This is what keeps `next build` env-free.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "App-Shell (intern) – Klarsa",
  description:
    "Geschützter Klarsa-Arbeitsbereich. Staging-Tenant-Kontext via Supabase. Keine echten Kundendaten.",
  robots: { index: false, follow: false },
};

export default async function AppShellPage() {
  // State 1 — no Supabase env: safe setup message (no redirect loop, build-safe).
  if (!isSupabaseConfigured()) {
    return <SetupNeeded />;
  }

  // State 2 — no session: protect the route.
  const context = await getCurrentCompanyContext();
  if (!context) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  const displayName = profile?.displayName ?? context.user.email ?? "Nutzer:in";

  // State 3 — signed in, but no active tenant membership.
  const companyId = context.activeCompanyId;
  if (context.memberships.length === 0 || !companyId) {
    return <NoTenant email={context.user.email} />;
  }

  // State 4 — authenticated tenant shell (RLS-scoped fake staging data).
  const activeMembership =
    context.memberships.find((m) => m.companyId === companyId) ??
    context.memberships[0];
  const [summary, counts] = await Promise.all([
    getCompanySummary(companyId),
    getTenantCounts(companyId),
  ]);

  return (
    <TenantShell
      displayName={displayName}
      email={context.user.email}
      companyName={summary?.name ?? "Unbekannter Mandant"}
      role={activeMembership.role}
      tierLabel={summary ? getPackageName(summary.tier) : "—"}
      counts={counts}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* State views                                                                */
/* -------------------------------------------------------------------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">{children}</main>
    </div>
  );
}

function SetupNeeded() {
  return (
    <Shell>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
        Klarsa Core · App-Shell
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
        Setup erforderlich
      </h1>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Supabase ist in dieser Umgebung nicht konfiguriert.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Lege eine lokale <code>.env.local</code> mit den Staging-Werten an
            (siehe <code>docs/app-shell-staging-connection.md</code> und{" "}
            <code>.env.local.example</code>). Es werden{" "}
            <strong className="font-semibold">keine</strong> echten Kundendaten
            verwendet – nur fiktive <code>@example.test</code>-Staging-Daten.
          </p>
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-500">
        <Link href="/workspace" className="font-medium text-blue-700 hover:text-blue-800">
          <span aria-hidden="true">←</span> Zur App-Foundation
        </Link>
      </p>
    </Shell>
  );
}

function NoTenant({ email }: { email: string | null }) {
  return (
    <Shell>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
        Klarsa App
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
        Kein aktiver Mandant
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
        Angemeldet als{" "}
        <strong className="font-semibold text-navy-900">{email ?? "—"}</strong>,
        aber diesem Konto ist (noch) kein aktiver Mandant zugeordnet. Ein
        Administrator muss eine aktive Mitgliedschaft (<code>company_members</code>)
        anlegen.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <LogoutButton />
        <Link
          href="/workspace"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          App-Foundation
        </Link>
      </div>
    </Shell>
  );
}

const MODULES: Array<{
  name: string;
  icon: typeof Inbox;
  countKey: keyof TenantCounts | null;
  tier: string;
  href?: string;
}> = [
  { name: "Lead Inbox", icon: Inbox, countKey: "leads", tier: "Alle Pakete", href: "/app-shell/leads" },
  { name: "Lead Hunter", icon: Sparkles, countKey: "prospects", tier: "Ab Pro" },
  { name: "Offer Engine", icon: FileText, countKey: "offers", tier: "Alle Pakete" },
  { name: "Follow-ups", icon: BellRing, countKey: "followupTasks", tier: "Alle Pakete" },
  { name: "Jobs", icon: Briefcase, countKey: "jobs", tier: "Ab Pro" },
  { name: "bexio Übergabe", icon: PlugZap, countKey: "bexioHandoffs", tier: "Ab Pro" },
  { name: "Reports", icon: ChartColumn, countKey: null, tier: "Ab Pro" },
];

function TenantShell({
  displayName,
  email,
  companyName,
  role,
  tierLabel,
  counts,
}: {
  displayName: string;
  email: string | null;
  companyName: string;
  role: string;
  tierLabel: string;
  counts: TenantCounts;
}) {
  return (
    <Shell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Klarsa App · Staging
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
            {companyName}
          </h1>
        </div>
        <LogoutButton />
      </div>

      {/* Tenant context */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-navy-100">
          <Building2 className="h-3.5 w-3.5" />
          {companyName}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
          <KeyRound className="h-3.5 w-3.5" />
          Rolle: {role}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
          Paket: {tierLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          <UserRound className="h-3.5 w-3.5" />
          {displayName}
          {email ? ` · ${email}` : ""}
        </span>
      </div>

      {/* No-real-data note */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm leading-relaxed text-amber-800">
          Staging-Ansicht mit fiktiven <code>@example.test</code>-Daten –{" "}
          <strong className="font-semibold">keine echten Kundendaten</strong>.
          Die Zahlen unten werden über die <strong className="font-semibold">RLS</strong>
          {" "}gefiltert und zeigen ausschliesslich Ihren Mandanten.
        </p>
      </div>

      {/* Modules with RLS-scoped counts */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const value = m.countKey === null ? null : counts[m.countKey];
          const inner = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-semibold text-navy-900">
                  <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                  {m.name}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {m.tier}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-navy-900">
                {value === null ? "—" : value}
              </p>
              <p className="text-xs text-slate-400">
                {m.href
                  ? "Öffnen →"
                  : m.countKey === null
                    ? "geplant"
                    : "Einträge (Staging)"}
              </p>
            </>
          );
          return m.href ? (
            <Link
              key={m.name}
              href={m.href}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={m.name}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Öffnen Sie die <strong className="font-semibold text-navy-900">Lead
        Inbox</strong>, um Leads anzuzeigen und manuell zu erfassen. Architektur:{" "}
        <code>docs/clean24-lead-inbox-foundation.md</code>. Nächster Schritt:{" "}
        <strong className="font-semibold text-navy-900">
          v0.3.1 – Lead-Status &amp; Follow-ups
        </strong>
        .
      </p>
    </Shell>
  );
}

function LogoutButton() {
  return (
    <form action="/logout" method="post">
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
      >
        <LogOut className="h-4 w-4" strokeWidth={2.2} />
        Abmelden
      </button>
    </form>
  );
}
