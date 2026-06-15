/**
 * Outreach Draft Agent — copy-only message drafts (v0.5.0).
 *
 * PURE and deterministic. Given an opportunity or a lead (the tenant's own,
 * RLS-filtered data) it assembles Swiss-German business drafts the owner can
 * COPY, edit and send themselves:
 *   - E-Mail (Betreff + Text)
 *   - WhatsApp / SMS (kurz)
 *   - Telefon-Skript (Gesprächsleitfaden)
 *   - Follow-up (kurze Erinnerung)
 *
 * HARD GUARDRAILS:
 *   - NOTHING is sent. No SMTP, no Gmail/Resend, no WhatsApp API, no network.
 *   - No AI/LLM call — these are deterministic templates.
 *   - No customer data is stored or committed; drafts are built at request time
 *     from the tenant's own rows and rendered as editable copy text.
 *   - Unknown specifics use clearly-marked [Platzhalter] the owner fills in.
 *
 * Swiss conventions: "ss" instead of "ß", polite "Sie", neutral "Guten Tag".
 */

export interface OutreachContext {
  /** Display name of the company/contact (lead.company_name or prospect.name). */
  name: string;
  /** Contact person, if known. */
  contactName: string | null;
  /** Service interest / matched service (e.g. "Büroreinigung"). */
  service: string | null;
  /** Region / town, if known. */
  region: string | null;
  /** Registry source label, if the chance came from one (for warm intros). */
  sourceLabel: string | null;
  /** True for warm channels (referral/partner) → softer, warmer intro. */
  warm: boolean;
  /** Signing person (company_settings.sender_name), or null. */
  senderPerson: string | null;
  /** Company brand name (always present). */
  senderCompany: string;
}

export interface DraftChannel {
  /** Stable identity for React keys / channel selection. */
  key: string;
  label: string;
  /** Optional subject line (email only). */
  subject?: string;
  /** The body text (copyable). */
  text: string;
}

function greeting(contactName: string | null): string {
  return contactName ? `Guten Tag ${contactName},` : "Guten Tag,";
}

function signature(ctx: OutreachContext): string {
  return ctx.senderPerson
    ? `Freundliche Grüsse\n${ctx.senderPerson}\n${ctx.senderCompany}`
    : `Freundliche Grüsse\n${ctx.senderCompany}`;
}

/** Short service/region phrase, e.g. " – unter anderem Büroreinigung in Zürich". */
function focusPhrase(ctx: OutreachContext): string {
  const parts: string[] = [];
  if (ctx.service) parts.push(ctx.service);
  if (ctx.region) parts.push(`Region ${ctx.region}`);
  if (parts.length === 0) return "";
  return ` – ${parts.join(", ")}`;
}

function warmLine(ctx: OutreachContext): string {
  if (!ctx.warm) return "";
  return ctx.sourceLabel
    ? `wir wurden über ${ctx.sourceLabel} auf Sie aufmerksam. `
    : "wir kommen auf eine Empfehlung hin auf Sie zu. ";
}

export function buildOutreachDrafts(ctx: OutreachContext): DraftChannel[] {
  const who = ctx.senderPerson
    ? `${ctx.senderPerson} von ${ctx.senderCompany}`
    : ctx.senderCompany;
  const focus = focusPhrase(ctx);
  const warm = warmLine(ctx);

  // E-Mail ------------------------------------------------------------------
  const emailSubject = ctx.service
    ? `${ctx.service} für ${ctx.name}`
    : `Reinigung für ${ctx.name}`;
  const emailBody = [
    greeting(ctx.contactName),
    "",
    `mein Name ist ${who}${focus ? `. Wir sind auf professionelle Reinigung spezialisiert${focus}` : ""}. ${warm}` +
      `Gerne würde ich unverbindlich besprechen, wie wir ${ctx.name} unterstützen können.`,
    "",
    "Hätten Sie diese oder nächste Woche kurz Zeit für ein Telefonat? Ein passendes Zeitfenster nenne ich Ihnen gerne.",
    "",
    signature(ctx),
  ].join("\n");

  // WhatsApp / SMS ----------------------------------------------------------
  const waBody = [
    `${greeting(ctx.contactName)} hier ${who}.`,
    `${warm}Wir bieten professionelle Reinigung${focus} an.`,
    `Dürfen wir ${ctx.name} ein unverbindliches Angebot machen? Wann passt Ihnen ein kurzes Telefonat?`,
    ctx.senderPerson ? `Freundliche Grüsse, ${ctx.senderPerson}` : `Freundliche Grüsse`,
  ].join("\n");

  // Telefon-Skript ----------------------------------------------------------
  const phoneBody = [
    `Gesprächsleitfaden – ${ctx.name}`,
    "",
    `1. Begrüssung: "Guten Tag, ${who}."`,
    `2. Aufhänger: ${ctx.warm ? `"${ctx.sourceLabel ? `Wir wurden über ${ctx.sourceLabel}` : "Wir wurden"} auf Sie aufmerksam."` : `"Wir sind in ${ctx.region ?? "Ihrer Region"} für professionelle Reinigung tätig."`}`,
    `3. Bedarf klären: "Wie organisieren Sie aktuell ${ctx.service ?? "Ihre Reinigung"}? Wo gibt es Verbesserungspotenzial?"`,
    `4. Nutzen: "Wir übernehmen das zuverlässig, mit fixem Ansprechpartner und klarer Offerte."`,
    `5. Abschluss: "Ich schicke Ihnen gerne eine unverbindliche Offerte – oder wir schauen es kurz vor Ort an. Was passt Ihnen besser?"`,
    `6. Termin festhalten: [Datum/Zeit notieren] → danach in Klarsa als Lead/Termin erfassen.`,
  ].join("\n");

  // Follow-up ---------------------------------------------------------------
  const followupBody = [
    greeting(ctx.contactName),
    "",
    `ich komme kurz auf mein Angebot für ${ctx.name} zurück${focus ? ` (${ctx.service ?? "Reinigung"})` : ""}.`,
    "",
    "Gerne beantworte ich offene Fragen oder bespreche die nächsten Schritte. Passt Ihnen ein kurzes Telefonat diese Woche?",
    "",
    signature(ctx),
  ].join("\n");

  return [
    { key: "email", label: "E-Mail", subject: emailSubject, text: emailBody },
    { key: "whatsapp", label: "WhatsApp / SMS", text: waBody },
    { key: "phone", label: "Telefon-Skript", text: phoneBody },
    { key: "followup", label: "Follow-up", text: followupBody },
  ];
}

export interface OfferFollowupContext {
  /** Offer reference, e.g. "OF-2026-001". */
  reference: string;
  /** Linked lead/customer display name, if any. */
  leadName: string | null;
  /** Valid-until date string, if any. */
  validUntil: string | null;
  senderPerson: string | null;
  senderCompany: string;
}

/**
 * A short follow-up draft for a sent offer that is awaiting a reply (copy-only).
 * Deterministic Swiss-German; nothing is sent.
 */
export function buildOfferFollowupDrafts(ctx: OfferFollowupContext): DraftChannel[] {
  const sig = ctx.senderPerson
    ? `Freundliche Grüsse\n${ctx.senderPerson}\n${ctx.senderCompany}`
    : `Freundliche Grüsse\n${ctx.senderCompany}`;
  const who = ctx.leadName ?? "Sie";
  const email = [
    "Guten Tag,",
    "",
    `gerne komme ich kurz auf unsere Offerte ${ctx.reference} für ${who} zurück.`,
    ctx.validUntil ? `Sie ist gültig bis ${ctx.validUntil}.` : "",
    "",
    "Darf ich offene Fragen beantworten oder die nächsten Schritte mit Ihnen besprechen? Ein kurzes Telefonat diese Woche genügt.",
    "",
    sig,
  ]
    .filter((l) => l !== "")
    .join("\n");
  const wa = [
    `Guten Tag, kurze Rückfrage zu unserer Offerte ${ctx.reference}.`,
    "Passt das Angebot so für Sie, oder dürfen wir etwas anpassen?",
    ctx.senderPerson ? `Freundliche Grüsse, ${ctx.senderPerson}` : "Freundliche Grüsse",
  ].join("\n");
  return [
    { key: "offer_email", label: "E-Mail", subject: `Offerte ${ctx.reference}`, text: email },
    { key: "offer_wa", label: "WhatsApp / SMS", text: wa },
  ];
}
