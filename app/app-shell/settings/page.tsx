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
  type LucideIcon,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { getPackageName } from "@/lib/packages";
import { autopilotTier } from "@/components/app-shell/autopilot-tier";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getCompanySettings } from "@/lib/auth/tenant-data";
import { isSendConfigured, sendProviderLabel } from "@/lib/outreach/send-provider";
import { isInboxConfigured, inboxProviderLabel } from "@/lib/outreach/inbox-provider";
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isBaugesucheConfigured } from "@/lib/discovery/baugesuche-zh";
import { isSimapConfigured } from "@/lib/discovery/simap";
import { isZefixConfigured } from "@/lib/discovery/zefix";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Einstellungen (intern) – Klarsa",
  description:
    "Einstellungen nach Kategorien: Allgemein, Vertrieb & Automationen, E-Mail & Antworten, Dokumente, Lead-Quellen, Bereinigung. Keine Schlüssel/Secrets sichtbar.",
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

  // Pure status booleans — NEVER the underlying secrets/values.
  const emailReady = isSendConfigured();
  const inboxReady = isInboxConfigured();
  const sources = [
    { key: "google", label: "Google Places", icon: Search, ready: isDiscoveryConfigured(), ready_t: "Konfiguriert – findet passende Firmen über die offizielle API.", off_t: "Nicht konfiguriert. Ohne Schlüssel bleibt die automatische Firmensuche aus." },
    { key: "baugesuche", label: "Baugesuche Zürich", icon: Building2, ready: isBaugesucheConfigured(), ready_t: "Konfiguriert – offizieller Baugesuch-Feed liefert Bau-Signale.", off_t: "Nicht konfiguriert. Offiziellen Open-Data-Feed hinterlegen." },
    { key: "simap", label: "SIMAP Ausschreibungen", icon: Landmark, ready: isSimapConfigured(), ready_t: "Konfiguriert – öffentliche Ausschreibungen passend zu Reinigung.", off_t: "Zugang erforderlich. Offizielle SIMAP-API hinterlegen, dann aktiv." },
    { key: "zefix", label: "ZEFIX Firmenprüfung", icon: Building2, ready: isZefixConfigured(), ready_t: "Konfiguriert – Firmenprüfung & Handelsregister-Signale.", off_t: "Zugang erforderlich. Offizielle ZEFIX-API hinterlegen, dann aktiv." },
  ];
  const sourcesReady = sources.filter((s) => s.ready).length;
  const tierInfo = autopilotTier(summary?.tier ?? "starter", summary?.billingStatus);

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
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Einstellungen
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {cat === "overview" ? "Wählen Sie einen Bereich." : CATEGORIES.find((c) => c.key === cat)?.label}
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

        {/* Overview — category cards */}
        {cat === "overview" && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const hint =
                c.key === "allgemein"
                  ? summary
                    ? getPackageName(summary.tier)
                    : "—"
                  : c.key === "email"
                    ? `${[emailReady, inboxReady].filter(Boolean).length}/2 verbunden`
                    : c.key === "quellen"
                      ? `${sourcesReady}/${sources.length} aktiv`
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
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          {hint}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{c.desc}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 self-center text-slate-300" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Allgemein */}
        {cat === "allgemein" && (
          <section className="mt-8 space-y-3">
            <Row icon={Crown} title="Paket" ready value={summary ? getPackageName(summary.tier) : "—"}
              readyText="Bestimmt, was Klarsa automatisch tun darf (Offert-Büro · Geführt · Vollautomatik)." />
            <Row icon={Building2} title="Firma / Briefkopf" ready value={summary?.name ?? "—"}
              readyText="Name, Adresse, Bank und MwSt-Nummer werden für die Dokumente (Offerte, Bestätigungen) als Briefkopf verwendet." />
          </section>
        )}

        {/* Vertrieb & Automationen */}
        {cat === "vertrieb" && (
          <section className="mt-8 space-y-3">
            <Row icon={Sparkles} title="Automationsmodus" ready value={tierInfo.label} readyText={tierInfo.tagline} />
            <Row icon={Repeat} title="Follow-up-Timing" ready value="24 h · 48 h · 5 Tage"
              readyText="Automatische Follow-up-Sequenz: Erinnerung nach 24 h, 48 h und final nach 5 Tagen – stoppt, sobald eine Antwort markiert wird." />
            <Row icon={ChevronRight} title="Nächste Aktion" ready value="Im Cockpit"
              readyText="Klarsa zeigt die nächste beste Aktion im Cockpit und führt über die Pipeline – Lead → Kontakt → Offerte → Follow-up → Auftrag." />
          </section>
        )}

        {/* E-Mail & Antworten */}
        {cat === "email" && (
          <section className="mt-8 space-y-3">
            <Row icon={Mail} title="E-Mail-Versand" ready={emailReady}
              value={emailReady ? (sendProviderLabel() ?? "Verbunden") : "Nicht verbunden"}
              readyText="Kontrollierter Einzelversand (Premium) möglich – eine Nachricht pro Klick, kein Bulk."
              offText="Nicht verbunden. Für echten Versand SMTP/Resend hinterlegen (Owner, ausserhalb des Repos)." />
            <Row icon={Inbox} title="Antwort-Eingang (IMAP)" ready={inboxReady}
              value={inboxReady ? (inboxProviderLabel() ?? "Vorbereitet") : "Nicht verbunden"}
              readyText="Vorbereitet – die automatische Antwort-Erkennung kann später aktiviert werden. Heute: Antwort manuell markieren stoppt die Sequenz."
              offText="Nicht verbunden. IMAP liest noch keine Mails – Antworten stoppen Sie über „Antwort erhalten“ in der Pipeline." />
            <Row icon={Mail} title="Absender" ready={Boolean(companySettings.senderName)}
              value={companySettings.senderName ?? "Nicht gesetzt"}
              readyText="Wird in den Entwürfen als Absender-Name verwendet."
              offText="Kein Absender-Name hinterlegt – Entwürfe nutzen den Firmennamen." />
          </section>
        )}

        {/* Dokumente */}
        {cat === "dokumente" && (
          <section className="mt-8 space-y-3">
            <Row icon={FileText} title="Offerte" ready value="Bereit" readyText="Clean24-Offertenvorlage als PDF – aus echten Offerten-/Kundendaten." />
            <Row icon={FileText} title="Auftragsbestätigung" ready value="Bereit" readyText="Kundenseitige Bestätigung im Karten-Design als PDF." />
            <Row icon={FileText} title="Partner-Einsatzbestätigung" ready value="Bereit" readyText="Interne Partner-Version als PDF (ohne Kundenpreis als Headline)." />
          </section>
        )}

        {/* Lead-Quellen */}
        {cat === "quellen" && (
          <section className="mt-8 space-y-3">
            {sources.map((s) => (
              <Row key={s.key} icon={s.icon} title={s.label} ready={s.ready}
                value={s.ready ? "Aktiv" : "Nicht verbunden"} readyText={s.ready_t} offText={s.off_t} />
            ))}
            <p className="text-xs text-slate-400">
              Zugänge werden ausserhalb der App (Umgebungsvariablen) hinterlegt – nie im Repo, nie hier sichtbar.
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
  ready,
  value,
  readyText,
  offText,
}: {
  icon: LucideIcon;
  title: string;
  ready: boolean;
  value: string;
  readyText: string;
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
              ready
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-slate-100 text-slate-500 ring-slate-200"
            }`}
          >
            {ready ? <CheckCircle2 className="h-3 w-3" /> : <CircleDashed className="h-3 w-3" />}
            {value}
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
          {ready ? readyText : offText ?? readyText}
        </p>
      </div>
    </div>
  );
}
