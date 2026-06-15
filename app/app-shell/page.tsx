import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Lock,
  LogOut,
  KeyRound,
  UserRound,
  Crown,
  ChevronRight,
  ShieldCheck,
  Banknote,
  Target,
  Users,
  Briefcase,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { AutopilotCard } from "@/components/app-shell/AutopilotCard";
import { ChainStepper } from "@/components/app-shell/ChainStepper";
import { computeCeoKpis } from "@/components/ceo/kpi";
import { isSupabaseConfigured } from "@/lib/env";
import {
  getCurrentProfile,
  getCurrentCompanyContext,
} from "@/lib/auth/session";
import {
  getCompanySummary,
  getTenantCounts,
  getProspects,
  getLeads,
  getOffers,
  getJobs,
  getInvoiceHandoffJobs,
  getFollowups,
  type TenantCounts,
} from "@/lib/auth/tenant-data";
import type { CeoKpis } from "@/components/ceo/kpi";
import { getPackageName } from "@/lib/packages";

// Reads the session/cookies -> always rendered on demand, never prerendered.
// This is what keeps `next build` env-free.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "App-Shell (intern) – Klarsa",
  description:
    "Geschützter Klarsa-Arbeitsbereich. Mandanten-Kontext via Supabase mit role-aware RLS.",
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

  // State 4 — authenticated tenant cockpit (RLS-scoped data).
  const activeMembership =
    context.memberships.find((m) => m.companyId === companyId) ??
    context.memberships[0];

  const [summary, counts, opportunities, leads, offers, jobs, handoffJobs, followups] =
    await Promise.all([
      getCompanySummary(companyId),
      getTenantCounts(companyId),
      getProspects(companyId),
      getLeads(companyId),
      getOffers(companyId),
      getJobs(companyId),
      getInvoiceHandoffJobs(companyId),
      getFollowups(companyId),
    ]);

  const now = new Date();
  const kpis = computeCeoKpis({
    opportunities,
    leads,
    offers,
    jobs,
    handoffJobs,
    followupLeadIds: followups.map((f) => f.leadId),
    nowIso: now.toISOString(),
  });
  const hasData =
    kpis.oppsTotal + kpis.leadsTotal + kpis.offersTotal + kpis.jobsTotal > 0;

  return (
    <TenantCockpit
      displayName={displayName}
      email={context.user.email}
      companyName={summary?.name ?? "Unbekannter Mandant"}
      role={activeMembership.role}
      tierLabel={summary ? getPackageName(summary.tier) : "—"}
      counts={counts}
      kpis={kpis}
      hasData={hasData}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Edge / setup states (no tenant context yet → marketing header is fine)      */
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
            Lege die Supabase-Umgebungswerte an (siehe{" "}
            <code>docs/app-shell-staging-connection.md</code> und{" "}
            <code>.env.local.example</code>). Schlüssel/Secrets werden{" "}
            <strong className="font-semibold">nicht</strong> im Repo abgelegt.
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

/* -------------------------------------------------------------------------- */
/* Authenticated cockpit                                                       */
/* -------------------------------------------------------------------------- */

function TenantCockpit({
  displayName,
  email,
  companyName,
  role,
  tierLabel,
  counts,
  kpis,
  hasData,
}: {
  displayName: string;
  email: string | null;
  companyName: string;
  role: string;
  tierLabel: string;
  counts: TenantCounts;
  kpis: CeoKpis;
  hasData: boolean;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={companyName} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Greeting / tenant context */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Klarsa · Cockpit
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-900">
            {companyName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
        </div>

        {/* Money hero — the one question the cockpit answers */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-navy-900 surface-hero p-6 text-white shadow-sm sm:p-7">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
            <Banknote className="h-3.5 w-3.5" />
            Heute Geld holen
          </p>
          <h2 className="mt-2 max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
            Klarsa zeigt die wichtigsten Umsatz-Aktionen für heute.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-100">
            Wo liegt heute Geld – und was ist der nächste Schritt? Unten sehen Sie
            die wichtigsten Aktionen, danach die drei Wege zu mehr Umsatz.
          </p>
        </section>

        {/* Top next actions — the most important thing, first */}
        <div className="mt-6">
          <AutopilotCard
            kpis={kpis}
            hasData={hasData}
            ctaHref="/app-shell/revenue-autopilot"
          />
        </div>

        {/* Three big ways to make money today */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <BigActionCard
            icon={Target}
            title="Neue Chancen finden"
            text="Revenue Autopilot, Lead Hunter, Radar und Quellen – an einem Ort."
            href="/app-shell/revenue-autopilot"
          />
          <BigActionCard
            icon={Users}
            title="Kunden nachfassen"
            text="Offene Leads ansprechen und Follow-ups konsequent planen."
            href="/app-shell/leads"
          />
          <BigActionCard
            icon={Briefcase}
            title="Aufträge abschliessen & verrechnen"
            text="Gewonnene Arbeit ausführen und an bexio übergeben."
            href="/app-shell/jobs"
          />
        </div>

        {/* The money chain, in order */}
        <div className="mt-6">
          <ChainStepper counts={counts} />
        </div>

        {/* CEO briefing entry */}
        <Link
          href="/app-shell/ceo"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-navy-900 bg-navy-900 p-4 text-white shadow-sm transition-colors hover:bg-navy-800"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
            <Crown className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">CEO-Briefing öffnen</span>
            <span className="block text-sm text-blue-100">
              Geld-Wirkung, Trichter und Kennzahlen über die ganze Kette –
              read-only, keine externen Quellen.
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-200" />
        </Link>

        {/* Honest data-protection note (production-appropriate, no fake-data claim) */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            Ihre Daten sind über <strong className="font-semibold text-navy-800">Row-Level-Security</strong>{" "}
            streng auf Ihren Betrieb isoliert – Sie sehen ausschliesslich die
            Klarsa-Daten Ihres Mandanten. Erfassung erfolgt nur über diese App:
            kein automatischer Versand, keine externen Abfragen, keine
            service-role-Zugriffe.
          </p>
        </div>
      </main>
    </div>
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

/** One of the three big "make money today" routes on the cockpit. */
function BigActionCard({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
        <Icon className="h-5 w-5 text-blue-600" strokeWidth={2} />
      </span>
      <span className="mt-3 text-base font-semibold tracking-tight text-navy-900">
        {title}
      </span>
      <span className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">
        {text}
      </span>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
        Öffnen
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
