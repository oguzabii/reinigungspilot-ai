import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Crosshair,
  ArrowLeft,
  Lock,
  Target,
  Library,
  ListChecks,
  Sparkles,
  ChevronRight,
  Rocket,
  Info,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { ResearchTools } from "@/components/revenue-autopilot/ResearchTools";
import { DraftChannels } from "@/components/revenue-autopilot/DraftChannels";
import { buildOutreachDrafts } from "@/components/revenue-autopilot/outreach";
import { buildAppointmentDrafts } from "@/components/revenue-autopilot/appointment";
import { sourceTaskFor } from "@/components/revenue-autopilot/source-queue";
import {
  SOURCE_TYPE_META,
  SOURCE_PHASE_META,
  phaseFor,
  enabledBadge,
} from "@/components/lead-hunter/source-meta";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getCompanySettings,
  getLeadSourceById,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quelle abarbeiten (intern) – Klarsa",
  description:
    "Geführte Quellen-Abarbeitung: Ziel, eigene Recherche-Links, Qualifizierung, manuelle Erfassung und Kontakt-Entwürfe. Kein Scraping, kein Abruf, kein Versand.",
  robots: { index: false, follow: false },
};

const CHECKLIST = [
  "Region passt – im Einzugsgebiet von Clean24.",
  "Service-Bedarf wahrscheinlich (Reinigung/Unterhalt sichtbar oder plausibel).",
  "Kontaktkanal sichtbar (Telefon, E-Mail oder Kontaktformular).",
  "Nicht offensichtlich irrelevant (kein reiner Privathaushalt ohne Bedarf, kein Mitbewerber).",
  "Gutes Potenzial für Clean24 (Grösse / Wiederkehr / Erreichbarkeit).",
  "Notizen festhalten – im Erfassungsformular, nicht hier.",
];

export default async function SourceExecutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const { id } = await params;

  const [summary, settings, source] = await Promise.all([
    getCompanySummary(companyId),
    getCompanySettings(companyId),
    getLeadSourceById(companyId, id),
  ]);

  // Foreign / unknown id → null (RLS-scoped). Honest, non-leaking state.
  if (!source) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppShellNav companyName={summary?.name} />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <Link
            href="/app-shell/lead-hunter/sources"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" /> Quellen-Registry
          </Link>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Quelle nicht gefunden (gehört nicht zum aktiven Mandanten oder wurde
            entfernt). Zurück zur{" "}
            <Link
              href="/app-shell/lead-hunter/sources"
              className="font-medium text-amber-900 underline"
            >
              Quellen-Registry
            </Link>
            .
          </div>
        </main>
      </div>
    );
  }

  const task = sourceTaskFor(source);
  const typeMeta = SOURCE_TYPE_META[source.type] ?? SOURCE_TYPE_META.manual;
  const phaseMeta = SOURCE_PHASE_META[phaseFor(source.type)];
  const active = enabledBadge(source.enabled);
  const warm = source.type === "referral" || source.type === "partner";

  const senderCompany = summary?.name ?? "Ihr Betrieb";
  const senderPerson = settings.senderName;

  // Generic, source-based drafts (placeholder firm until a real lead exists).
  const outreach = buildOutreachDrafts({
    name: "[Firma]",
    contactName: null,
    service: task.service,
    region: null,
    sourceLabel: source.label,
    warm,
    senderPerson,
    senderCompany,
  });
  const appointment = buildAppointmentDrafts({
    name: "[Firma]",
    contactName: null,
    service: task.service,
    senderPerson,
    senderCompany,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell/lead-hunter/sources"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> Quellen-Registry
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
              <Crosshair className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
                Quelle abarbeiten
              </h1>
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                <Library className="h-3.5 w-3.5 text-blue-600" />
                {source.label} · {typeMeta.label}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${active.className}`}>
              {active.label}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${phaseMeta.className}`}>
              {phaseMeta.label}
            </span>
          </div>
        </div>

        {/* Honest guardrail note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Geführte Recherche.</strong>{" "}
            Die Recherche-Links öffnen Ihre <strong className="font-semibold">eigene
            Suche im Browser</strong>. Sie recherchieren, prüfen und erfassen jede
            Firma selbst – alles bleibt nur in Ihrem Betrieb.
          </p>
        </div>

        {/* Worklist steps */}
        <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
          {["Ziel", "Recherchieren", "Qualifizieren", "Erfassen", "Kontakt vorbereiten"].map(
            (s, i) => (
              <li key={s} className="inline-flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {s}
                {i < 4 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              </li>
            ),
          )}
        </ol>

        {/* 1 — Ziel */}
        <Section icon={Target} step={1} title="Ziel für heute">
          <div className="rounded-2xl border border-navy-100 bg-navy-50/50 p-5">
            <p className="text-lg font-semibold tracking-tight text-navy-900">
              {task.goal}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.hint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-slate-200">
                <Target className="h-3 w-3 text-blue-600" />
                Service-Vorschlag: {task.service}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-navy-700 ring-1 ring-inset ring-slate-200">
                Richtwert: ≈{task.target} Kandidaten
              </span>
            </div>
          </div>
        </Section>

        {/* 2 + 4 — Recherchieren & erfassen */}
        <Section icon={Crosshair} step={2} title="Recherchieren & erfassen">
          <p className="text-sm text-slate-500">
            Suchbegriff und Region anpassen, eigene Recherche öffnen, passende Firma
            danach manuell erfassen. Schritt&nbsp;4 (Erfassen) ist die Schaltfläche
            am Ende.
          </p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ResearchTools
              sourceId={source.id}
              defaultKeyword={task.keyword}
              service={task.service}
            />
          </div>
        </Section>

        {/* 3 — Qualifizieren */}
        <Section icon={ListChecks} step={3} title="Qualifizieren – lohnt sich der Kontakt?">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ul className="space-y-2.5">
              {CHECKLIST.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <input
                    id={`chk_${i}`}
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600"
                  />
                  <label htmlFor={`chk_${i}`} className="text-sm leading-relaxed text-slate-700">
                    {item}
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="h-3 w-3" />
              Lokale Merkhilfe – wird nicht gespeichert. Erst erfassen, wenn die
              Punkte stimmen.
            </p>
          </div>
        </Section>

        {/* 5 — Kontakt vorbereiten (generic, source-based drafts) */}
        <Section icon={Sparkles} step={5} title="Kontakt vorbereiten (Vorlage)">
          <p className="text-sm text-slate-500">
            Generische Vorlagen für diese Quelle – Platzhalter wie{" "}
            <code className="rounded bg-slate-100 px-1 text-xs">[Firma]</code>{" "}
            ersetzen Sie nach dem Erfassen. Kopieren, anpassen und{" "}
            <strong className="font-medium text-navy-800">selbst senden</strong>.
          </p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <DraftChannels
              channels={outreach}
              summary="Erstkontakt-Entwurf (kopieren & selbst senden)"
            />
            <DraftChannels
              channels={appointment}
              summary="Termin vorschlagen (kopieren & selbst senden)"
            />
          </div>
        </Section>

        {/* Footer links */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link
            href="/app-shell/revenue-autopilot"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Rocket className="h-4 w-4 text-blue-600" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">
                Revenue Autopilot
              </span>
              <span className="block text-sm text-slate-500">
                Zurück zur Tages-Worklist.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
          <Link
            href="/app-shell/lead-hunter/sources"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Library className="h-4 w-4 text-blue-600" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">
                Quellen-Registry
              </span>
              <span className="block text-sm text-slate-500">
                Andere Quelle abarbeiten.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({
  icon: Icon,
  step,
  title,
  children,
}: {
  icon: typeof Target;
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
          {step}
        </span>
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
