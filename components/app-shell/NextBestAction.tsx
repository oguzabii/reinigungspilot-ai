import Link from "next/link";
import {
  Banknote,
  Send,
  Search,
  BellRing,
  Flame,
  Radar,
  FilePlus2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { NextAction, NextActionTone } from "@/components/app-shell/sales-flow";

/**
 * "Nächste beste Aktion" (v0.5.14) — the single, prominent thing the owner
 * should do now to move money. The Cockpit shows exactly ONE of these (chosen
 * by `nextBestAction`), so the answer to "what do I do now?" is never a wall of
 * options. One big primary button takes them straight to where they act.
 */

const TONE: Record<NextActionTone, LucideIcon> = {
  money: Banknote,
  send: Send,
  contact: Search,
  warm: BellRing,
  opportunity: Flame,
  find: Radar,
  offer: FilePlus2,
};

export function NextBestAction({ action }: { action: NextAction }) {
  const Icon = TONE[action.tone] ?? Banknote;
  return (
    <section className="overflow-hidden rounded-2xl border border-navy-900 surface-hero p-6 text-white shadow-sm sm:p-7">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
        <Banknote className="h-3.5 w-3.5" />
        Nächste beste Aktion
      </p>
      <div className="mt-3 flex items-start gap-4">
        <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/20 sm:inline-flex">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {action.title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-navy-100">
            {action.detail}
          </p>
          <Link
            href={action.href}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:bg-blue-50"
          >
            {action.ctaLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
