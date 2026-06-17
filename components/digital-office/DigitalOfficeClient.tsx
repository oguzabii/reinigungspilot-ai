"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Users,
  Mail,
  Tag,
  Sparkles,
  Check,
  ArrowRight,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { JourneyState, JourneyTab } from "@/lib/digital-office/office";

/**
 * Digital Office — client interactivity (vNext standalone shell).
 *
 * Groups the small client pieces that make the standalone surface feel like a
 * product: the internal section tabs, the 4-step main journey and the 3 quick
 * actions. They share one tab-switch event so the journey/quick-action CTAs can
 * open the matching tab.
 */

const TAB_EVENT = "digital-office:set-tab";

function openTab(id: JourneyTab) {
  window.dispatchEvent(new CustomEvent(TAB_EVENT, { detail: id }));
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const TAB_ICON: Record<JourneyTab, LucideIcon> = {
  overview: LayoutGrid,
  workers: Users,
  mailbox: Mail,
  rules: Tag,
};

export interface TabDef {
  id: JourneyTab;
  label: string;
  content: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                        */
/* -------------------------------------------------------------------------- */

export function DigitalOfficeTabs({ tabs }: { tabs: TabDef[] }) {
  const [active, setActive] = useState<JourneyTab>(tabs[0]?.id ?? "overview");

  useEffect(() => {
    const onSet = (e: Event) => {
      const id = (e as CustomEvent<JourneyTab>).detail;
      if (tabs.some((t) => t.id === id)) {
        setActive(id);
        document
          .getElementById("office-tabs")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener(TAB_EVENT, onSet);
    return () => window.removeEventListener(TAB_EVENT, onSet);
  }, [tabs]);

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div id="office-tabs" className="scroll-mt-20">
      <div
        role="tablist"
        aria-label="Digital-Office-Bereiche"
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const Icon = TAB_ICON[t.id];
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                on
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy-900"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">{current?.content}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main journey                                                                */
/* -------------------------------------------------------------------------- */

export function OfficeJourney({ journey }: { journey: JourneyState }) {
  const { stages, currentIndex } = journey;
  const current = stages[currentIndex];
  const next = stages[currentIndex + 1];
  const allDone = stages.every((s) => s.done);

  return (
    <section
      id="office-journey"
      className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-semibold tracking-tight text-navy-900">
        Ihr Weg zum digitalen Büro
      </h2>

      {/* 4-step stepper */}
      <ol className="mt-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stages.map((s, i) => {
          const isCurrent = i === currentIndex && !s.done;
          return (
            <li key={s.id} className="flex min-w-0 flex-1 shrink-0 items-center gap-2">
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  s.done
                    ? "bg-emerald-100 text-emerald-700"
                    : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {s.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`min-w-0 truncate text-xs font-medium ${
                  isCurrent ? "text-navy-900" : "text-slate-500"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Current + next + primary CTA */}
      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        {allDone ? (
          <p className="text-sm font-semibold text-navy-900">
            Alle Schritte erledigt — Ihr digitales Büro ist startbereit.
          </p>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Aktueller Schritt
            </p>
            <p className="mt-1 text-sm font-semibold text-navy-900">
              {current.label}
            </p>
            <p className="text-sm text-slate-500">{current.hint}</p>
            {next && (
              <p className="mt-2 text-xs text-slate-400">
                Als Nächstes: {next.label}
              </p>
            )}
            <button
              type="button"
              onClick={() => openTab(current.targetTab)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
            >
              {current.ctaLabel}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick actions (max 3)                                                       */
/* -------------------------------------------------------------------------- */

export function OfficeQuickActions() {
  const actions: { label: string; icon: LucideIcon; onClick: () => void }[] = [
    { label: "Büro einrichten", icon: Building2, onClick: () => scrollTo("office-journey") },
    { label: "Mitarbeiter auswählen", icon: Users, onClick: () => openTab("workers") },
    { label: "Ask Office öffnen", icon: Sparkles, onClick: () => scrollTo("ask-office") },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-navy-800 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
