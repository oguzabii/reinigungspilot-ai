import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Settings as SettingsIcon,
  Mail,
  Inbox,
  Search,
  Building2,
  Landmark,
  FileText,
  Trash2,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  ShieldCheck,
  Crown,
  Repeat,
  Sparkles,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { TestConnectionButton } from "./TestConnectionButton";
import { getPackageName } from "@/lib/packages";
import { autopilotTier } from "@/components/app-shell/autopilot-tier";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getCompanySettings } from "@/lib/auth/tenant-data";
import { isSendConfigured, sendProviderLabel } from "@/lib/outreach/send-provider";
import { isInboxConfigured, inboxProviderLabel } from "@/lib/outreach/inbox-provider";
import { sourceReadiness } from "@/lib/discovery/adapters";
import { CONNECTION_STATUS_META, type ConnectionStatus } from "@/lib/discovery/connection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Einstellungen (intern) – Klarsa",
  description:
    "Einstellungen nach Kategorien + Produktionsbereitschaft. Quellen-Verbindungen testen. Keine Schlüssel/Secrets sichtbar.",
  robots: { index: false, follow: false },
};

type Category =
  | "overview"
  | "allgemein"
  | "vertrieb"
  | "email"
  | "dokumente"
  | "quellen"
  | "bereinigung";

const CATEGORIES: Array<{ key: Category; label: string; icon: LucideIcon; desc: string }> = [
  { key: "allgemein", label: "Allgemein", icon: Crown, desc: "Paket und Firmen-Briefkopf für Dokumente." },
  { key: "vertrieb", label: "Vertrieb & Automationen", icon: Repeat, desc: "Follow-up-Timing, Automationsmodus, nächste Aktion." },
  { key: "email", label: "E-Mail & Antworten", icon: Mail, desc: "Versandkanal, Antwort-Eingang, Absender." },
  { key: "dokumente", label: "Dokumente", icon: FileText, desc: "Offerte, Auftragsbestätigung, Partner-Einsatz." },
  { key: "quellen", label: "Lead-Quellen", icon: Search, desc: "Google Places, Baugesuche, SIMAP, ZEFIX." },
  { key: "bereinigung", label: "Bereinigung", icon: Trash2, desc: "Arbeitsbereich bereinigen / zurücksetzen." },
];

/** Per-source presentation (icon + explanation). Keyed by adapter key. */
const SOURCE_META: Record<string, { icon: LucideIcon; ready: string; off: string }> = {
  google_places: {
    icon: Search,
    ready: "Findet passende Firmen über die offizielle Google-Places-API.",
    off: "Nicht konfiguriert. Ohne API-Schlüssel bleibt die automatische Firmensuche aus.",
  },
  baugesuche: {
    icon: Building2,
    ready: "Offizieller Baugesuch-/Bauprojekt-Feed (Kanton Zürich) liefert Bau-Signale.",
    off: "Nicht konfiguriert. Offiziellen Open-Data-Feed hinterlegen.",
  },
  simap: {
    icon: Landmark,
    ready: "Öffentliche SIMAP-Projekt-Suche (ohne Login) – Ausschreibungen passend zu Reinigung/Facility. Verbindung testen.",
    off: "Offizielle SIMAP-Suche – Verbindung testen.",
  },
  zefix: {
    icon: Building2,
    ready: "Handelsregister / Firmenvalidierung (offizielle ZEFIX-REST-API).",
    off: "Zugang erforderlich. Offizielle ZEFIX-API hinterlegen, dann Verbindung testen.",
  },
};

function parseCat(raw: string | undefined): Category {
  const keys = CATEGORIES.map((c) => c.key) as string[];
  return raw && keys.includes(raw) ? (raw as Category) : "overview";
}

export default async function AppShellSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const role = context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  const canManage = role === "owner" || role === "admin";
  const cat = parseCat((await searchParams).cat);

  const [summary, companySettings] = await Promise.all([
    getCompanySummary(companyId),
    getCompanySettings(companyId),
  ]);

  // Pure status — NEVER the underlying secrets/values.
  const emailReady = isSendConfigured();
  const inboxReady = isInboxConfigured();
  const sources = sourceReadiness(); // {key,label,configured,needsAccess,testable,status}
  const byKey = (k: string) => sources.find((s) => s.key === k);
  const sourcesReady = sources.filter((s) => s.configured).length;
  const tierInfo = autopilotTier(summary?.tier ?? "starter", summary?.billingStatus);

  // Production-readiness checklist (plain language; no env names on the card).
  const checklist = [
    { label: "E-Mail-Versand", ok: emailReady, note: emailReady ? `verbunden (${sendProviderLabel()})` : "optional – für echten Versand SMTP/Resend hinterlegen" },
    { label: "Antworten / Reply-Stopp", ok: true, note: inboxReady ? "IMAP vorbereitet + manueller Stopp" : "manueller Stopp-Modus aktiv («Antwort erhalten»)" },
    { label: "Google Places", ok: Boolean(byKey("google_places")?.configured), note: byKey("google_places")?.configured ? "konfiguriert" : "optional" },
    { label: "Baugesuche Zürich", ok: Boolean(byKey("baugesuche")?.configured), note: byKey("baugesuche")?.configured ? "konfiguriert" : "optional" },
    { label: "SIMAP Ausschreibungen", ok: Boolean(byKey("simap")?.configured), note: byKey("simap")?.configured ? "konfiguriert" : "Zugang erforderlich" },
    { label: "ZEFIX Firmenprüfung", ok: Boolean(byKey("zefix")?.configured), note: byKey("zefix")?.configured ? "konfiguriert" : "Zugang erforderlich" },
    { label: "PDF-Vorlagen", ok: true, note: "Offerte · Auftragsbestätigung · Partner-Einsatz bereit" },
    { label: "Follow-up-Sequenz", ok: true, note: "bereit – fällige Schritte werden manuell gesendet" },
    { label: "Bereinigung", ok: true, note: "verfügbar" },
  ];
  const readyCount = checklist.filter((c) => c.ok).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        {/* Header */}
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <SettingsIcon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Einstellungen</h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} ·{" "}
              {cat === "overview" ? "Wählen Sie einen Bereich." : CATEGORIES.find((c) => c.key === cat)?.label}
            </p>
          </div>
        </div>

        {cat !== "overview" && (
          <Link
            href="/app-shell/settings"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> Alle Einstellungen
          </Link>
        )}

        {cat === "overview" && (
          <>
            {/* Production readiness */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
                  <Rocket className="h-5 w-5 text-blue-600" strokeWidth={2} /> Produktionsbereit?
                </h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-100">
                  {readyCount}/{checklist.length} bereit
                </span>
              </div>
              <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-start gap-2">
                    {c.ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    <span className="min-w-0 text-sm text-navy-800">
                      {c.label}
                      <span className="block text-xs text-slate-500">{c.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer font-medium text-slate-600">Technische Details (Umgebungsvariablen)</summary>
                <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-500 ring-1 ring-inset ring-slate-100">
                  <p>E-Mail: RESEND_API_KEY · RESEND_FROM_EMAIL · SMTP_HOST/PORT/USER/PASSWORD/FROM</p>
                  <p>Antworten: INBOX_PROVIDER · IMAP_HOST/PORT/USER/PASSWORD</p>
                  <p>Google Places: GOOGLE_PLACES_API_KEY</p>
                  <p>Baugesuche: BAUGESUCHE_ZH_SIGNAL_URL</p>
                  <p>SIMAP: SIMAP_API_BASE_URL · SIMAP_API_TOKEN · SIMAP_API_CLIENT_ID/SECRET · SIMAP_AUTH_URL · SIMAP_SCOPE</p>
                  <p>ZEFIX: ZEFIX_API_BASE_URL · ZEFIX_API_TOKEN · ZEFIX_API_USERNAME/PASSWORD · ZEFIX_AUTH_MODE</p>
                  <p>Follow-up-Cron: FOLLOWUP_CRON_SECRET (Readiness-only – kein Hintergrund-Versand)</p>
                  <p className="not-italic text-slate-400">In Vercel → Production env hinterlegen. Niemals committen.</p>
                </div>
              </details>
            </section>

            {/* Category cards */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const hint =
                  c.key === "allgemein"
                    ? summary ? getPackageName(summary.tier) : "—"
                    : c.key === "email"
                      ? `${[emailReady, inboxReady].filter(Boolean).length}/2`
                      : c.key === "quellen"
                        ? `${sourcesReady}/${sources.length} konfiguriert`
                        : c.key === "dokumente"
                          ? "Bereit"
                          : c.key === "vertrieb"
                            ? tierInfo.label
                            : "";
                return (
                  <Link
                    key={c.key}
                    href={`/app-shell/settings?cat=${c.key}`}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                      <Icon className="h-5 w-5 text-blue-600" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-navy-900">{c.label}</span>
                        {hint && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{hint}</span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{c.desc}</span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-300" />
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Allgemein */}
        {cat === "allgemein" && (
          <section className="mt-8 space-y-3">
            <Row icon={Crown} title="Paket" ok value={summary ? getPackageName(summary.tier) : "—"}
              text="Bestimmt, was Klarsa automatisch tun darf (Offert-Büro · Geführt · Vollautomatik)." />
            <Row icon={Building2} title="Firma / Briefkopf" ok value={summary?.name ?? "—"}
              text="Name, Adresse, Bank und MwSt-Nummer werden für die Dokumente (Offerte, Bestätigungen) als Briefkopf verwendet." />
          </section>
        )}

        {/* Vertrieb & Automationen — honest about what actually runs */}
        {cat === "vertrieb" && (
          <section className="mt-8 space-y-3">
            <Row icon={Sparkles} title="Automationsmodus" ok value={tierInfo.label} text={tierInfo.tagline} />
            <Row icon={Repeat} title="Follow-up-Timing" ok value="24 h · 48 h · 5 Tage"
              text="Automatische Sequenz geplant: Erinnerungen nach 24 h, 48 h und final nach 5 Tagen." />
            <Row icon={Mail} title="Follow-up-Versand" ok={emailReady} value={emailReady ? "Manuell auslösbar" : "Kanal nötig"}
              text="Fällige Follow-ups werden owner-ausgelöst gesendet (Premium + Kanal), gedeckelt und auditiert. Kein Hintergrund-Worker, kein Bulk."
              offText="Ohne verbundenen Versandkanal sind die Schritte Erinnerungen – Versand erst nach Kanal-Verbindung." />
            <Row icon={Inbox} title="Antwort-Stopp" ok value={inboxReady ? "IMAP vorbereitet + manuell" : "Manuell"}
              text={inboxReady
                ? "IMAP ist vorbereitet; bis zur Aktivierung der automatischen Erkennung stoppen Sie per «Antwort erhalten»."
                : "Antworten stoppen die Sequenz über «Antwort erhalten» in der Pipeline (automatische IMAP-Erkennung noch nicht aktiv)."} />
            <Row icon={ChevronRight} title="Hintergrund-Cron" ok={false} value="Readiness-only"
              text=""
              offText="Der Cron-Endpunkt ist vorbereitet und secret-gated, sendet aber nicht (mandantenübergreifender Hintergrund-Versand bräuchte Service-Role – bewusst nicht genutzt)." />
          </section>
        )}

        {/* E-Mail & Antworten */}
        {cat === "email" && (
          <section className="mt-8 space-y-3">
            <Row icon={Mail} title="E-Mail-Versand" ok={emailReady}
              value={emailReady ? (sendProviderLabel() ?? "Verbunden") : "Nicht verbunden"}
              text="Kontrollierter Einzelversand (Premium) möglich – eine Nachricht pro Klick, kein Bulk."
              offText="Nicht verbunden. Für echten Versand SMTP/Resend hinterlegen (Owner, ausserhalb des Repos)." />
            <Row icon={Inbox} title="Antwort-Eingang (IMAP)" ok={inboxReady}
              value={inboxReady ? (inboxProviderLabel() ?? "Vorbereitet") : "Nicht verbunden"}
              text="Vorbereitet – automatische Antwort-Erkennung kann später aktiviert werden. Heute: «Antwort erhalten» stoppt die Sequenz."
              offText="Nicht verbunden. IMAP liest noch keine Mails – Antworten stoppen Sie manuell über «Antwort erhalten»." />
            <Row icon={Mail} title="Absender" ok={Boolean(companySettings.senderName)}
              value={companySettings.senderName ?? "Nicht gesetzt"}
              text="Wird in den Entwürfen als Absender-Name verwendet."
              offText="Kein Absender-Name hinterlegt – Entwürfe nutzen den Firmennamen." />
          </section>
        )}

        {/* Dokumente */}
        {cat === "dokumente" && (
          <section className="mt-8 space-y-3">
            <Row icon={FileText} title="Offerte" ok value="Bereit" text="Clean24-Offertenvorlage als PDF – aus echten Offerten-/Kundendaten." />
            <Row icon={FileText} title="Auftragsbestätigung" ok value="Bereit" text="Kundenseitige Bestätigung im Karten-Design als PDF." />
            <Row icon={FileText} title="Partner-Einsatzbestätigung" ok value="Bereit" text="Interne Partner-Version als PDF (ohne Kundenpreis als Headline)." />
          </section>
        )}

        {/* Lead-Quellen — status + safe live connection test */}
        {cat === "quellen" && (
          <section className="mt-8 space-y-3">
            {sources.map((s) => {
              const meta = SOURCE_META[s.key] ?? { icon: Search, ready: "", off: "" };
              const statusMeta = CONNECTION_STATUS_META[s.status as ConnectionStatus];
              const Icon = meta.icon;
              return (
                <div key={s.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                      <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-navy-900">{s.label}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                        {s.configured ? meta.ready : meta.off}
                      </p>
                      {s.testable && canManage && <TestConnectionButton source={s.key} />}
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-slate-400">
              «Verbunden» erscheint nur nach einem erfolgreichen Verbindungstest. Zugänge werden ausserhalb der App
              (Umgebungsvariablen) hinterlegt – nie im Repo, nie hier sichtbar.
            </p>
          </section>
        )}

        {/* Bereinigung */}
        {cat === "bereinigung" && (
          <section className="mt-8">
            {canManage ? (
              <Link
                href="/app-shell/ceo/cleanup"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                  <Trash2 className="h-5 w-5 text-blue-600" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-navy-900">Arbeitsbereich bereinigen / zurücksetzen</span>
                  <span className="block text-sm text-slate-500">Test- oder Altdaten aus den Arbeitslisten archivieren – sauber starten. Soft, kein Hard-Delete.</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-400" />
              </Link>
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                Nur Inhaber/Admin können den Arbeitsbereich bereinigen.
              </p>
            )}
          </section>
        )}

        {/* Calm status note — no secrets here, ever */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            Diese Seite zeigt nur Status und Optionen – niemals Schlüssel,
            Passwörter oder Adressen. Zugangsdaten werden ausserhalb der App
            hinterlegt und nie im Repo gespeichert.
          </p>
        </div>
      </main>
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  ok,
  value,
  text,
  offText,
}: {
  icon: LucideIcon;
  title: string;
  ok: boolean;
  value: string;
  text: string;
  offText?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-navy-900">{title}</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
              ok ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-500 ring-slate-200"
            }`}
          >
            {ok ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
            {value}
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{ok ? text : offText ?? text}</p>
      </div>
    </div>
  );
}
