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
  CheckCircle2,
  CircleDashed,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { getPackageName } from "@/lib/packages";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary } from "@/lib/auth/tenant-data";
import { isSendConfigured, sendProviderLabel } from "@/lib/outreach/send-provider";
import { isInboxConfigured, inboxProviderLabel } from "@/lib/outreach/inbox-provider";
import { isDiscoveryConfigured } from "@/lib/discovery/google-places";
import { isBaugesucheConfigured } from "@/lib/discovery/baugesuche-zh";
import { isSimapConfigured } from "@/lib/discovery/simap";
import { isZefixConfigured } from "@/lib/discovery/zefix";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Einstellungen & Bereitschaft (intern) – Klarsa",
  description:
    "Bereitschafts-Überblick: welche Kanäle (E-Mail-Versand, Eingang, Lead-Quellen) verbunden sind. Keine Schlüssel/Secrets sichtbar.",
  robots: { index: false, follow: false },
};

export default async function AppShellSettingsPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const role =
    context.memberships.find((m) => m.companyId === companyId)?.role ?? null;
  const canManage = role === "owner" || role === "admin";

  const summary = await getCompanySummary(companyId);

  // Pure status booleans — NEVER the underlying secrets/values.
  const emailReady = isSendConfigured();
  const inboxReady = isInboxConfigured();
  const placesReady = isDiscoveryConfigured();
  const baugesucheReady = isBaugesucheConfigured();
  const simapReady = isSimapConfigured();
  const zefixReady = isZefixConfigured();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <SettingsIcon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Einstellungen &amp; Bereitschaft
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · was ist verbunden – und was Klarsa
              braucht, um automatisch zu arbeiten.
            </p>
          </div>
        </div>

        {/* Package tier */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
              <Crown className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">Ihr Paket</p>
              <p className="text-sm text-slate-500">
                Bestimmt, was Klarsa automatisch tun darf.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
            {summary ? getPackageName(summary.tier) : "—"}
          </span>
        </section>

        {/* Channels / readiness */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Kanäle &amp; Quellen
          </h2>
          <ul className="mt-3 space-y-3">
            <ReadinessRow
              icon={Mail}
              title="E-Mail-Versand"
              ready={emailReady}
              readyText={`Verbunden${
                sendProviderLabel() ? ` · ${sendProviderLabel()}` : ""
              } – kontrollierter Einzelversand (Premium) möglich.`}
              notReadyText="Nicht verbunden. Für echten Versand SMTP/Resend hinterlegen (Owner, ausserhalb des Repos)."
            />
            <ReadinessRow
              icon={Inbox}
              title="Antwort-Eingang (IMAP)"
              ready={inboxReady}
              readyText={`Vorbereitet${
                inboxProviderLabel() ? ` · ${inboxProviderLabel()}` : ""
              } – Antwort-Erkennung kann aktiviert werden.`}
              notReadyText="Nicht verbunden. IMAP ist als Eingang-Fundament vorbereitet, liest aber noch keine Mails."
            />
            <ReadinessRow
              icon={Search}
              title="Lead-Quelle · Google Places"
              ready={placesReady}
              readyText="Konfiguriert – Discovery findet passende Firmen über die offizielle API."
              notReadyText="Nicht konfiguriert. Ohne Schlüssel bleibt die automatische Firmensuche aus."
            />
            <ReadinessRow
              icon={Building2}
              title="Lead-Quelle · Baugesuche Zürich"
              ready={baugesucheReady}
              readyText="Konfiguriert – offizieller Baugesuch-Feed liefert Bau-Signale."
              notReadyText="Nicht konfiguriert. Offizieller Open-Data-Feed kann hinterlegt werden."
            />
            <ReadinessRow
              icon={Landmark}
              title="Lead-Quelle · SIMAP Ausschreibungen"
              ready={simapReady}
              readyText="Konfiguriert – öffentliche Ausschreibungen passend zu Reinigung/Facility."
              notReadyText="Zugang erforderlich. Offizielle SIMAP-API hinterlegen, dann aktiv."
            />
            <ReadinessRow
              icon={Building2}
              title="Lead-Quelle · ZEFIX Firmenprüfung"
              ready={zefixReady}
              readyText="Konfiguriert – Firmenprüfung & Handelsregister-Signale."
              notReadyText="Zugang erforderlich. Offizielle ZEFIX-API hinterlegen, dann aktiv."
            />
            <ReadinessRow
              icon={FileText}
              title="Dokumentvorlagen"
              ready
              readyText="Bereit – Offerte, Auftragsbestätigung und Partner-Einsatzbestätigung als PDF."
              notReadyText=""
            />
          </ul>
        </section>

        {/* Workspace cleanup / reset (owner/admin) */}
        {canManage && (
          <Link
            href="/app-shell/ceo/cleanup"
            className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <Trash2 className="h-4 w-4 text-blue-600" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy-900">
                Arbeitsbereich bereinigen / zurücksetzen
              </span>
              <span className="block text-sm text-slate-500">
                Test- oder Altdaten aus den Arbeitslisten archivieren – sauber
                starten.
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
        )}

        {/* Calm status note — no secrets here, ever */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-slate-600">
            Diese Seite zeigt nur, <strong className="font-semibold text-navy-800">ob</strong>{" "}
            ein Kanal verbunden ist – niemals Schlüssel, Passwörter oder Adressen.
            Zugangsdaten werden ausserhalb der App hinterlegt und nie im Repo
            gespeichert.
          </p>
        </div>
      </main>
    </div>
  );
}

function ReadinessRow({
  icon: Icon,
  title,
  ready,
  readyText,
  notReadyText,
}: {
  icon: typeof Mail;
  title: string;
  ready: boolean;
  readyText: string;
  notReadyText: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-navy-900">{title}</p>
          {ready ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Verbunden
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
              <CircleDashed className="h-3 w-3" /> Nicht verbunden
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
          {ready ? readyText : notReadyText}
        </p>
      </div>
    </li>
  );
}
