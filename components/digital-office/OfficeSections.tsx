import Link from "next/link";
import {
  Mail,
  FileText,
  Tag,
  Activity,
  ArrowRight,
  Building2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  MailboxStatus,
  ActivityItem,
  ActivityTone,
} from "@/lib/digital-office/office";

/**
 * The Digital Office foundation sections: mailbox status, offer/PDF template,
 * pricing-rule builder, the live activity feed and the quick-action cards.
 *
 * Honesty first: status reflects reality (a mailbox is only "Verbunden" when a
 * real send channel is configured), and template/pricing are foundation states
 * with no persistence yet — the cards say so plainly rather than pretending.
 */

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                 */
/* -------------------------------------------------------------------------- */

function SectionCard({
  id,
  icon: Icon,
  title,
  badge,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            {title}
          </h2>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-28 shrink-0 text-slate-400">{label}</dt>
      <dd className="min-w-0 flex-1 text-navy-800">{value}</dd>
    </div>
  );
}

function FoundationNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Mailbox                                                                     */
/* -------------------------------------------------------------------------- */

const MB_META: Record<MailboxStatus, { label: string; chip: string }> = {
  not_connected: {
    label: "Nicht verbunden",
    chip: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  configured: {
    label: "Konfiguriert",
    chip: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  connected: {
    label: "Verbunden",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  error: { label: "Fehler", chip: "bg-red-50 text-red-700 ring-red-100" },
};

export function MailboxCard({
  status,
  senderName,
  senderEmail,
  outgoingLabel,
  incomingLabel,
}: {
  status: MailboxStatus;
  senderName: string | null;
  senderEmail: string | null;
  outgoingLabel: string | null;
  incomingLabel: string | null;
}) {
  const meta = MB_META[status];
  return (
    <SectionCard
      id="mailbox"
      icon={Mail}
      title="Mailbox"
      badge={
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.chip}`}
        >
          {meta.label}
        </span>
      }
    >
      <dl className="mt-4 space-y-1.5">
        <Field label="Eingang" value={incomingLabel ?? "—"} />
        <Field label="Ausgang" value={outgoingLabel ?? "—"} />
        <Field label="Absender" value={senderName ?? senderEmail ?? "—"} />
        <Field label="Antwort an" value={senderEmail ?? "—"} />
        <Field label="Modus" value="Entwurf / Freigabe" />
      </dl>

      <FoundationNote>
        {status === "connected"
          ? "Versandkanal verbunden. Es wird nichts automatisch gesendet – jeder Versand erfolgt nur mit Ihrer Freigabe."
          : "Noch keine Mailbox verbunden. Absender, Signatur und Modus können vorbereitet werden; echter E-Mail-Versand startet erst nach Verbindung und Freigabe. Das Speichern der Mailbox-Einstellungen folgt im nächsten Schritt."}
      </FoundationNote>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Offer / PDF template                                                        */
/* -------------------------------------------------------------------------- */

export function OfferTemplateCard({
  templateCount,
  templateLimit,
}: {
  templateCount: number;
  templateLimit: number;
}) {
  const hasTemplate = templateCount > 0;
  return (
    <SectionCard
      id="vorlage"
      icon={FileText}
      title="Offerten-/PDF-Vorlage"
      badge={
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
          {templateCount}/{templateLimit}
        </span>
      }
    >
      {/* Generic template preview */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex h-8 w-16 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-[10px] font-medium text-slate-400">
            Logo
          </span>
          <span className="text-[10px] text-slate-400">Offerte / Vorschau</span>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-2/3 rounded bg-slate-200" />
          <div className="h-2 w-1/2 rounded bg-slate-200" />
          <div className="mt-3 h-2 w-full rounded bg-slate-100" />
          <div className="h-2 w-5/6 rounded bg-slate-100" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[10px] text-slate-400">
          <span>Zahlungsbedingungen · Fusszeile</span>
          <span>inkl. MwSt.</span>
        </div>
      </div>

      <FoundationNote>
        {hasTemplate
          ? "Ihre Vorlage ist vorbereitet. Der Offerten-Assistent kann daraus Offerten erstellen."
          : "Bereiten Sie Ihre Offerten-Vorlage einmal vor (Logo, Adresse, Zahlungsbedingungen, Standardtexte) – danach erstellt der Offerten-Assistent daraus Offerten. Das Speichern der Vorlage folgt im nächsten Schritt; bestehende Offerten-PDFs bleiben unverändert."}
      </FoundationNote>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Pricing rules                                                               */
/* -------------------------------------------------------------------------- */

/** Illustrative examples only — shown in the empty state, never real tenant data. */
const EXAMPLE_RULES = [
  { name: "3–3.5 Zimmer Umzugsreinigung", category: "Fixpreis", value: "CHF 890" },
  { name: "Balkon extra", category: "Zuschlag", value: "+ CHF 80" },
  { name: "Stundensatz", category: "Stundensatz", value: "CHF 65" },
  { name: "Express-Zuschlag", category: "Prozent", value: "+ 15%" },
];

export function PricingRulesCard({
  ruleCount,
  advanced,
}: {
  ruleCount: number;
  advanced: boolean;
}) {
  const hasRules = ruleCount > 0;
  return (
    <SectionCard
      id="preisregeln"
      icon={Tag}
      title="Preisregeln"
      badge={
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
          {advanced ? "Erweitert" : "Einfach"}
        </span>
      }
    >
      {hasRules ? (
        <p className="mt-4 text-sm text-slate-600">
          {ruleCount} Preisregel(n) aktiv.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-500">
            Noch keine Preisregeln. So könnten Ihre Regeln aussehen
            <span className="text-slate-400"> (Beispiele)</span>:
          </p>
          <ul className="mt-3 space-y-1.5">
            {EXAMPLE_RULES.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate text-navy-800">
                  {r.name}
                  <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-inset ring-slate-200">
                    {r.category}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-slate-500">
                  {r.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <FoundationNote>
        Unterstützte Regeltypen: Fixpreis, Stundensatz, Paketpreis, Zuschlag,
        Prozent-Anpassung, Mindestpreis. Der Offerten-Assistent nutzt aktive
        Regeln für Offerten. Das Speichern eigener Regeln folgt im nächsten
        Schritt.
      </FoundationNote>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Activity feed                                                               */
/* -------------------------------------------------------------------------- */

const TONE_DOT: Record<ActivityTone, string> = {
  ready: "bg-blue-500",
  waiting: "bg-amber-500",
  info: "bg-slate-400",
  done: "bg-emerald-500",
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <SectionCard id="aktivitaet" icon={Activity} title="Heute im Büro">
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Noch keine Aktivität. Schliessen Sie die Einrichtung ab, damit Ihre
          digitalen Mitarbeiter starten können.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5 text-sm">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[item.tone]}`}
              />
              <span className="min-w-0 flex-1 text-slate-600">
                <span className="font-semibold text-navy-800">{item.worker}</span>{" "}
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Quick actions                                                               */
/* -------------------------------------------------------------------------- */

/** Shared card styling so the client Ask Office CTA matches these. */
export const QUICK_ACTION_CARD_CLASS =
  "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40";

interface QuickAction {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Büro einrichten", hint: "Schritte abschliessen", href: "#einrichtung", icon: Building2 },
  { label: "Mitarbeiter auswählen", hint: "Digitale Mitarbeiter aktivieren", href: "#mitarbeiter", icon: Users },
  { label: "Mailbox verbinden", hint: "Eingang & Ausgang", href: "#mailbox", icon: Mail },
  { label: "Offerte-Vorlage vorbereiten", hint: "Logo, Texte, MwSt.", href: "#vorlage", icon: FileText },
  { label: "Preisregeln festlegen", hint: "Fixpreis, Stundensatz, Zuschlag", href: "#preisregeln", icon: Tag },
];

/** Renders the 5 link cards plus a slot (`children`) for the Ask Office CTA. */
export function QuickActionGrid({ children }: { children?: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
        Schnellaktionen
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} href={a.href} className={QUICK_ACTION_CARD_CLASS}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy-900">
                  {a.label}
                </span>
                <span className="block text-xs text-slate-500">{a.hint}</span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          );
        })}
        {children}
      </div>
    </section>
  );
}
