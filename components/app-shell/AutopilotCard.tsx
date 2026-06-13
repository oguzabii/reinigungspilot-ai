import Link from "next/link";
import {
  Sparkles,
  Banknote,
  Send,
  Flame,
  BellRing,
  ChevronRight,
  CheckCircle2,
  Radar,
  ShieldCheck,
} from "lucide-react";
import type { CeoKpis } from "@/components/ceo/kpi";
import {
  buildAutopilotActions,
  type AutopilotAction,
  type AutopilotTone,
} from "@/components/app-shell/autopilot";

/**
 * Autopilot card — "where the money is and what to do next." A read-only,
 * UI-only assistant surface built purely from the tenant's existing data
 * (via the CEO KPIs). It NEVER sends, scrapes, books or calls anything
 * external; every row links the human to the page where they decide and act.
 *
 * Three honest states:
 *   - brand-new tenant (no data)      → "Klarsa ist bereit …" + capture CTA
 *   - data, but nothing pending       → calm "Alles erledigt" confirmation
 *   - pending actions                 → prioritised, money-first action list
 */

const TONE: Record<
  AutopilotTone,
  { icon: typeof Banknote; badge: string; iconWrap: string }
> = {
  money: {
    icon: Banknote,
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  pipeline: {
    icon: Send,
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    iconWrap: "bg-blue-50 text-blue-600 ring-blue-100",
  },
  opportunity: {
    icon: Flame,
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    iconWrap: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  warm: {
    icon: BellRing,
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    iconWrap: "bg-violet-50 text-violet-600 ring-violet-100",
  },
};

export function AutopilotCard({
  kpis,
  hasData,
  ctaHref,
}: {
  kpis: CeoKpis;
  hasData: boolean;
  /** When set, the header links to the full Revenue Autopilot command center. */
  ctaHref?: string;
}) {
  const actions = buildAutopilotActions(kpis);

  return (
    <section className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
      {/* Header on a restrained navy band */}
      <div className="flex items-center gap-3 border-b border-navy-100 bg-navy-50/60 px-5 py-4">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-navy-900">
            Autopilot · Nächste Schritte für Umsatz
          </h2>
          <p className="text-xs text-slate-500">
            Wo liegt Geld – und was tun Sie als Nächstes? Aus Ihren eigenen Daten.
          </p>
        </div>
        {ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
          >
            {actions.length > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[10px] font-bold tabular-nums">
                {actions.length}
              </span>
            )}
            <span className="hidden sm:inline">Revenue Autopilot</span>
            <span className="sm:hidden">Autopilot</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="p-5">
        {!hasData ? (
          <ReadyState />
        ) : actions.length === 0 ? (
          <AllClearState />
        ) : (
          <ul className="space-y-2.5">
            {actions.map((a) => (
              <ActionRow key={a.id} action={a} />
            ))}
          </ul>
        )}

        {/* Honest guardrail note */}
        <p className="mt-4 inline-flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-500" />
          Klarsa schlägt nur vor. Es wird nichts automatisch gesucht, versendet
          oder gebucht – jeden Schritt bestätigen Sie selbst.
        </p>
      </div>
    </section>
  );
}

function ActionRow({ action }: { action: AutopilotAction }) {
  const tone = TONE[action.tone];
  const Icon = tone.icon;
  return (
    <li>
      <Link
        href={action.href}
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-blue-300 hover:bg-blue-50/40"
      >
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${tone.iconWrap}`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-navy-900">
              {action.title}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset ${tone.badge}`}
            >
              {action.count}
            </span>
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
            {action.detail}
          </span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-blue-700 sm:inline-flex">
          {action.ctaLabel}
          <ChevronRight className="h-4 w-4" />
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 sm:hidden" />
      </Link>
    </li>
  );
}

function ReadyState() {
  return (
    <div className="rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/60 to-white px-5 py-8 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
        <Radar className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-sm font-semibold text-navy-900">
        Klarsa ist bereit
      </p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
        Erfassen Sie die erste reale Opportunity – danach zeigt Ihnen der
        Autopilot, wo Geld liegt und was als Nächstes zu tun ist.
      </p>
      <Link
        href="/app-shell/lead-hunter"
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
      >
        <Radar className="h-4 w-4" strokeWidth={2.2} />
        Erste Opportunity erfassen
      </Link>
    </div>
  );
}

function AllClearState() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      <p className="text-sm font-medium text-emerald-800">
        Alles erledigt – aktuell keine offenen Schritte. Erfassen Sie neue
        Opportunities, um die Pipeline zu füllen.
      </p>
    </div>
  );
}
