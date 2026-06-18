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
  Target,
  Send,
  Briefcase,
  Search,
  BellRing,
  ArrowRight,
  Sparkles,
  Rocket,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { NextBestAction } from "@/components/app-shell/NextBestAction";
import { StatusStrip } from "@/components/app-shell/StatusStrip";
import {
  salesStageStats,
  nextBestAction,
  type StageStat,
} from "@/components/app-shell/sales-flow";
import { CompactFlow, type FlowStep } from "@/components/app-shell/CompactFlow";
import { PremiumAutopilotPanel } from "@/components/app-shell/PremiumAutopilotPanel";
import {
  autopilotTier,
  isPremiumExperience,
  type AutopilotTierInfo,
} from "@/components/app-shell/autopilot-tier";
import {
  buildPremiumDigest,
  type PremiumDigest,
} from "@/components/app-shell/premium-digest";
import { computeCeoKpis } from "@/components/ceo/kpi";
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isBaugesucheConfigured } from "@/lib/discovery/baugesuche-zh";
import { isSupabaseConfigured } from "@/lib/env";
import {
  getCurrentProfile,
  getCurrentCompanyContext,
} from "@/lib/auth/session";
import {
  getCompanySummary,
  getProspects,
  getLeads,
  getOffers,
  getJobs,
  getInvoiceHandoffJobs,
  getFollowups,
  getDiscoveryRuns,
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

  const [
    summary,
    opportunities,
    leads,
    offers,
    jobs,
    handoffJobs,
    followups,
    discoveryRuns,
  ] = await Promise.all([
    getCompanySummary(companyId),
    getProspects(companyId),
    getLeads(companyId),
    getOffers(companyId),
    getJobs(companyId),
    getInvoiceHandoffJobs(companyId),
    getFollowups(companyId),
    getDiscoveryRuns(companyId),
  ]);

  const now = new Date();
  const nowIso = now.toISOString();
  const kpis = computeCeoKpis({
    opportunities,
    leads,
    offers,
    jobs,
    handoffJobs,
    followupLeadIds: followups.map((f) => f.leadId),
    nowIso,
  });
  const hasData =
    kpis.oppsTotal + kpis.leadsTotal + kpis.offersTotal + kpis.jobsTotal > 0;

  // Compact money flow counts (from the tenant's own data).
  const PRE_CONTACT = new Set<string>(["raw", "scored", "approved"]);
  const outreachReady = opportunities.filter(
    (p) => p.promotedLeadId === null && PRE_CONTACT.has(p.status),
  );
  const flow = {
    firmen: kpis.oppsTotal,
    kontakt: outreachReady.filter((p) => !p.contactEmail).length,
    email: outreachReady.filter((p) => p.contactEmail).length,
    nachfassen: kpis.attnLeadsNoFollowup,
    abschluss: kpis.attnOffersWaiting + kpis.attnJobsNotHandedOff,
  };

  // The compact, plain-language status strip (shared with the Pipeline page).
  const stats = salesStageStats({
    prospects: opportunities,
    leads,
    offers,
    followups,
    jobs,
    bexioReady: kpis.attnJobsNotHandedOff,
  });

  // Package-aware Autopilot positioning + Premium "worked for you" digest.
  const tier = summary?.tier ?? "starter";
  const tierInfo = autopilotTier(tier, summary?.billingStatus);
  const isPremium = isPremiumExperience(tier, summary?.billingStatus);
  const providers = {
    discovery: isDiscoveryConfigured() || isBaugesucheConfigured(),
    send: false,
    calendar: false,
  };
  const digest = buildPremiumDigest({
    prospects: opportunities,
    leads,
    offers,
    jobs,
    discoveryRuns,
    providers,
    nowIso,
  });

  return (
    <TenantCockpit
      displayName={displayName}
      email={context.user.email}
      companyName={summary?.name ?? "Unbekannter Mandant"}
      role={activeMembership.role}
      tierLabel={summary ? getPackageName(summary.tier) : "—"}
      kpis={kpis}
      hasData={hasData}
      tierInfo={tierInfo}
      isPremium={isPremium}
      digest={digest}
      flow={flow}
      stats={stats}
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
  kpis,
  hasData,
  tierInfo,
  isPremium,
  digest,
  flow,
  stats,
}: {
  displayName: string;
  email: string | null;
  companyName: string;
  role: string;
  tierLabel: string;
  kpis: CeoKpis;
  hasData: boolean;
  tierInfo: AutopilotTierInfo;
  isPremium: boolean;
  digest: PremiumDigest;
  flow: {
    firmen: number;
    kontakt: number;
    email: number;
    nachfassen: number;
    abschluss: number;
  };
  stats: StageStat[];
}) {
  // The single "what should I do now?" action, money-closest first.
  const nextAction = nextBestAction({
    kpis,
    contactMissing: flow.kontakt,
    emailReady: flow.email,
    hasAnyData: hasData,
  });

  // The simple sales flow — five steps that all funnel into the Pipeline.
  const steps: FlowStep[] = [
    {
      key: "find",
      label: "Lead finden",
      count: flow.firmen,
      status: flow.firmen > 0 ? "im Radar" : "Radar öffnen",
      href: "/app-shell/lead-hunter/radar",
      cta: "Finden",
      icon: Target,
    },
    {
      key: "contact",
      label: "Kontakt finden",
      count: flow.kontakt,
      status: flow.kontakt > 0 ? "ohne Kontakt" : "alle mit Kontakt",
      href: "/app-shell/pipeline#chancen",
      cta: "Finden",
      icon: Search,
    },
    {
      key: "email",
      label: "E-Mail senden",
      count: flow.email,
      status: flow.email > 0 ? "bereit" : "—",
      href: "/app-shell/pipeline#chancen",
      cta: "Senden",
      icon: Send,
    },
    {
      key: "followup",
      label: "Nachfassen",
      count: flow.nachfassen,
      status: flow.nachfassen > 0 ? "offen" : "—",
      href: "/app-shell/pipeline#leads",
      cta: "Nachfassen",
      icon: BellRing,
    },
    {
      key: "close",
      label: "Offerte/Auftrag",
      count: flow.abschluss,
      status: flow.abschluss > 0 ? "offen" : "—",
      href: "/app-shell/pipeline#leads",
      cta: "Abschliessen",
      icon: Briefcase,
    },
  ];

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
            {/* Package-aware Autopilot positioning */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" />
              {tierInfo.label}
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
        </div>

        {/* The single most important thing, first — "Nächste beste Aktion" */}
        <div className="mt-7">
          <NextBestAction action={nextAction} />
        </div>

        {/* Compact, plain-language status strip (not a wall of KPI cards) */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Ihr Verkaufs-Status
          </h2>
          <div className="mt-3">
            <StatusStrip stats={stats} />
          </div>
        </div>

        {/* One simple sales flow — five steps that funnel into the Pipeline */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Ihr Verkaufs-Ablauf
          </h2>
          <div className="mt-3">
            <CompactFlow steps={steps} />
          </div>
        </div>

        {/* Premium → "Klarsa hat für Sie gearbeitet" (recap, below the action) */}
        {isPremium && (
          <div className="mt-6">
            <PremiumAutopilotPanel digest={digest} />
          </div>
        )}

        {/* Premium teaser for non-Premium packages (never makes them feel broken) */}
        {!isPremium && (
          <Link
            href="/pricing"
            className="mt-6 flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-50"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200">
              <Rocket className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">
                Mit Premium arbeitet Klarsa vollautomatisch für Sie
              </span>
              <span className="block text-sm text-slate-600">
                {tierInfo.mode === "guided"
                  ? "Im Pro-Paket vorbereitet, im Premium-Paket automatisierbar – Discovery, Erstkontakt, Nachfassen und Termine kanalweise."
                  : "Upgrade für Vollautomatik: Klarsa findet Firmen, kontaktiert, fasst nach und koordiniert Termine."}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700">
              Upgrade
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        )}

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

        {/* Automation-status note (owner-facing, non-technical) */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-navy-800">
              Autopilot sichtbar und kontrolliert.
            </strong>{" "}
            Klarsa arbeitet nach Ihrem Paket und Ihren Freigabe-Regeln –
            Premium-Vollautomatik wird kanalweise aktiviert. Ihre Daten bleiben
            strikt auf Ihren Betrieb getrennt, und jeder Schritt ist
            nachvollziehbar.
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

