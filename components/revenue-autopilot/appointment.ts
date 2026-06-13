/**
 * Appointment Coordination Assistant — copy-only proposal drafts (v0.5.0).
 *
 * PURE and deterministic. Builds Swiss-German appointment-proposal messages the
 * owner copies, edits and sends themselves.
 *
 * HARD GUARDRAILS:
 *   - NO Google/Microsoft Calendar API, NO free/busy read, NO automatic booking,
 *     NO external sync, NO network.
 *   - Klarsa cannot know real availability, so proposed time windows are clearly
 *     marked [Platzhalter] for the owner to fill in. Nothing is reserved.
 */

import type { DraftChannel } from "@/components/revenue-autopilot/outreach";

export interface AppointmentContext {
  name: string;
  contactName: string | null;
  service: string | null;
  senderPerson: string | null;
  senderCompany: string;
}

function greeting(contactName: string | null): string {
  return contactName ? `Guten Tag ${contactName},` : "Guten Tag,";
}

function signature(ctx: AppointmentContext): string {
  return ctx.senderPerson
    ? `Freundliche Grüsse\n${ctx.senderPerson}\n${ctx.senderCompany}`
    : `Freundliche Grüsse\n${ctx.senderCompany}`;
}

/**
 * Two appointment drafts: a proposal with placeholder time windows, and a
 * confirmation message once the owner has agreed a slot.
 */
export function buildAppointmentDrafts(ctx: AppointmentContext): DraftChannel[] {
  const leistung = ctx.service ?? "Reinigung";

  const proposal = [
    greeting(ctx.contactName),
    "",
    `gerne können wir die ${leistung} für ${ctx.name} kurz vor Ort besprechen, damit ich Ihnen eine passende Offerte erstellen kann.`,
    "",
    "Ich hätte folgende Zeitfenster:",
    "• [Wochentag, TT.MM. um HH:MM Uhr]",
    "• [Wochentag, TT.MM. um HH:MM Uhr]",
    "• [Wochentag, TT.MM. um HH:MM Uhr]",
    "",
    "Passt Ihnen einer dieser Termine? Gerne richte ich mich auch nach Ihrem Vorschlag.",
    "",
    signature(ctx),
  ].join("\n");

  const confirmation = [
    greeting(ctx.contactName),
    "",
    `besten Dank – ich bestätige unseren Termin für die ${leistung} bei ${ctx.name}:`,
    "",
    "• Datum/Zeit: [TT.MM. um HH:MM Uhr]",
    "• Ort: [Adresse]",
    "",
    "Falls etwas dazwischenkommt, geben Sie mir bitte kurz Bescheid. Ich freue mich auf das Gespräch.",
    "",
    signature(ctx),
  ].join("\n");

  return [
    { key: "termin_vorschlag", label: "Terminvorschlag", text: proposal },
    { key: "termin_bestaetigung", label: "Terminbestätigung", text: confirmation },
  ];
}
