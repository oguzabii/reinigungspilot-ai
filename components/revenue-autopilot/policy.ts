/**
 * Autopilot Rules Engine — the safe-by-default policy brain (v0.5.2).
 *
 * PURE and deterministic. It decides what Klarsa may do AUTOMATICALLY for a lead
 * category, given the owner's safe-mode toggles and which providers are
 * configured. Nothing here sends, books, scrapes or calls anything — it only
 * returns verdicts that the UI and server actions must honour.
 *
 * COMPLIANCE POSITION (hard, non-negotiable):
 *   - Cold, discovered candidates may be auto-CREATED and scored, but
 *     cold OUTREACH is ALWAYS blocked. No automatic cold email/calls, no spam.
 *   - Automatic messages are only ever allowed for INBOUND/opt-in, EXISTING
 *     customers or MANUALLY APPROVED contacts — and only when a compliant send
 *     provider is configured (sender identity + opt-out). None is today.
 *   - Appointments may be PROPOSED automatically, but an event is booked ONLY
 *     after the customer confirms / picks a slot. Never silent booking.
 */

export type LeadCategory =
  | "inbound"
  | "existing_customer"
  | "approved_contact"
  | "cold_discovered";

export interface CategoryMeta {
  key: LeadCategory;
  label: string;
  description: string;
}

export const CATEGORY_META: Record<LeadCategory, CategoryMeta> = {
  inbound: {
    key: "inbound",
    label: "Inbound / Opt-in",
    description:
      "Anfrage kam vom Kontakt selbst (Website-Formular, Anruf, E-Mail). Einwilligung liegt vor.",
  },
  existing_customer: {
    key: "existing_customer",
    label: "Bestandskunde",
    description: "Bestehende Geschäftsbeziehung mit laufendem Kontakt.",
  },
  approved_contact: {
    key: "approved_contact",
    label: "Freigegebener Kontakt",
    description:
      "Vom Inhaber manuell als kontaktierbar markiert (z. B. Empfehlung/Partner).",
  },
  cold_discovered: {
    key: "cold_discovered",
    label: "Kalt entdeckt",
    description:
      "Automatisch entdeckter Betrieb ohne vorherigen Kontakt und ohne Einwilligung.",
  },
};

/**
 * The named Autopilot modes (as requested). `blocked` modes are hard-locked and
 * cannot be enabled in this version.
 */
export interface AutopilotMode {
  key: string;
  label: string;
  description: string;
  /** Hard-blocked regardless of toggles/providers. */
  hardBlocked: boolean;
}

export const AUTOPILOT_MODES: AutopilotMode[] = [
  {
    key: "manual_only",
    label: "Nur manuell",
    description: "Klarsa bereitet vor; der Mensch entscheidet und handelt.",
    hardBlocked: false,
  },
  {
    key: "auto_create_candidate",
    label: "Kandidat automatisch erstellen",
    description:
      "Kalt entdeckte Betriebe werden als Prospect (Kandidat) erstellt – nicht kontaktiert, Outreach gesperrt.",
    hardBlocked: false,
  },
  {
    key: "auto_create_lead",
    label: "Lead automatisch erstellen",
    description:
      "Nur für Inbound/Opt-in: ein voller Lead wird automatisch angelegt.",
    hardBlocked: false,
  },
  {
    key: "auto_send_inbound_reply",
    label: "Inbound-Antwort automatisch senden",
    description:
      "Auto-Antwort auf Opt-in-Anfragen – nur mit konfiguriertem Versand-Provider.",
    hardBlocked: false,
  },
  {
    key: "auto_followup_existing_or_approved",
    label: "Follow-up an Bestand/freigegeben",
    description:
      "Automatisches Follow-up an Bestandskunden oder freigegebene Kontakte – nur mit Versand-Provider.",
    hardBlocked: false,
  },
  {
    key: "auto_appointment_proposal",
    label: "Terminvorschlag automatisch vorbereiten",
    description: "Vorschlag wird vorbereitet; Versand bleibt menschlich/erlaubt-abhängig.",
    hardBlocked: false,
  },
  {
    key: "auto_book_only_after_customer_confirmation",
    label: "Buchung nur nach Kundenbestätigung",
    description:
      "Ein Termin wird NIE automatisch gebucht – erst nach Bestätigung/Buchungslink-Auswahl des Kunden.",
    hardBlocked: false,
  },
];

/** Hard-blocked behaviours that no toggle can enable. */
export const HARD_BLOCKED = [
  {
    label: "Cold-Outreach (automatisch)",
    reason:
      "Automatischer Versand an kalt entdeckte/gescrapte Kontakte ist gesperrt – kein Spam.",
  },
  {
    label: "Automatische Telefonanrufe",
    reason: "Klarsa ruft niemanden automatisch an.",
  },
  {
    label: "Stille Terminbuchung",
    reason: "Keine Buchung ohne Bestätigung/Aktion des Kunden.",
  },
  {
    label: "Unkontrolliertes Scraping",
    reason: "Nur offizielle, freigegebene APIs – keine Seiten-/HTML-Extraktion.",
  },
] as const;

/** Owner-controlled safe-mode toggles, persisted in company_settings.settings.autopilot. */
export interface AutopilotToggles {
  /** Auto-create cold discovered businesses as prospects (candidates). */
  autoCreateColdCandidates: boolean;
  /** Auto-reply to inbound/opt-in leads (requires a send provider). */
  autoReplyInbound: boolean;
  /** Auto-follow-up existing/approved contacts (requires a send provider). */
  autoFollowupExistingApproved: boolean;
  /** Auto-prepare appointment proposals (preparation only, never books). */
  autoAppointmentProposal: boolean;
}

/** Safe defaults — everything OFF. The owner opts in explicitly. */
export const DEFAULT_AUTOPILOT_TOGGLES: AutopilotToggles = {
  autoCreateColdCandidates: false,
  autoReplyInbound: false,
  autoFollowupExistingApproved: false,
  autoAppointmentProposal: false,
};

/** Which external providers are configured (none send/calendar today). */
export interface ProviderStatus {
  /** GOOGLE_PLACES_API_KEY present (server-side). */
  discoveryConfigured: boolean;
  /** A compliant send provider (Gmail/SMTP/Resend) — not configured in v0.5.2. */
  sendConfigured: boolean;
  /** A calendar provider — not configured in v0.5.2. */
  calendarConfigured: boolean;
}

export interface PolicyVerdict {
  allowed: boolean;
  reason: string;
}

export interface CategoryPolicy {
  category: LeadCategory;
  /** Auto-create a candidate/lead record. */
  autoCreate: PolicyVerdict;
  /** Auto-send a first message. */
  autoMessage: PolicyVerdict;
  /** Auto-send a follow-up. */
  autoFollowup: PolicyVerdict;
  /** Auto-prepare an appointment proposal. */
  autoAppointment: PolicyVerdict;
  /** Auto-book a calendar event. */
  autoBook: PolicyVerdict;
}

const NO_SEND = "Kein Versand-Provider konfiguriert – nur Entwurf zum manuellen Senden.";
const COLD_BLOCK =
  "Cold-Outreach per Richtlinie gesperrt – kein automatischer Versand an kalt entdeckte Kontakte.";
const BOOK_BLOCK =
  "Terminbuchung nur nach Bestätigung/Buchungslink-Auswahl durch den Kunden – nie automatisch.";

/** Compute the automatic-action policy for one lead category. */
export function categoryPolicy(
  category: LeadCategory,
  toggles: AutopilotToggles,
  providers: ProviderStatus,
): CategoryPolicy {
  const sendAllowed = (on: boolean): PolicyVerdict => {
    if (!providers.sendConfigured) return { allowed: false, reason: NO_SEND };
    return on
      ? { allowed: true, reason: "Erlaubt – sicherer Kontakt-Typ, Provider konfiguriert." }
      : { allowed: false, reason: "Deaktiviert – in den Richtlinien aktivierbar." };
  };
  const proposal: PolicyVerdict = toggles.autoAppointmentProposal
    ? { allowed: true, reason: "Vorschlag wird vorbereitet (kein Versand/keine Buchung)." }
    : { allowed: false, reason: "Deaktiviert – in den Richtlinien aktivierbar." };
  const book: PolicyVerdict = { allowed: false, reason: BOOK_BLOCK };

  switch (category) {
    case "cold_discovered":
      return {
        category,
        autoCreate: providers.discoveryConfigured
          ? toggles.autoCreateColdCandidates
            ? {
                allowed: true,
                reason:
                  "Kandidat (Prospect) wird automatisch erstellt – kalt, nicht kontaktiert.",
              }
            : { allowed: false, reason: "Deaktiviert – nur Anzeige. In den Richtlinien aktivierbar." }
          : { allowed: false, reason: "Discovery-API nicht konfiguriert." },
        autoMessage: { allowed: false, reason: COLD_BLOCK },
        autoFollowup: {
          allowed: false,
          reason: "Erst nach manueller Freigabe des Kontakts/der Quelle.",
        },
        autoAppointment: {
          allowed: false,
          reason: "Kein Terminvorschlag an nicht kontaktierte Kaltkontakte.",
        },
        autoBook: book,
      };
    case "inbound":
      return {
        category,
        autoCreate: { allowed: true, reason: "Voller Lead wird erstellt (Opt-in liegt vor)." },
        autoMessage: sendAllowed(toggles.autoReplyInbound),
        autoFollowup: sendAllowed(toggles.autoReplyInbound),
        autoAppointment: proposal,
        autoBook: book,
      };
    case "existing_customer":
    case "approved_contact":
      return {
        category,
        autoCreate: { allowed: true, reason: "Bekannter/freigegebener Kontakt." },
        autoMessage: sendAllowed(toggles.autoFollowupExistingApproved),
        autoFollowup: sendAllowed(toggles.autoFollowupExistingApproved),
        autoAppointment: proposal,
        autoBook: book,
      };
  }
}

/** The full policy matrix across all categories (for the UI). */
export function policyMatrix(
  toggles: AutopilotToggles,
  providers: ProviderStatus,
): CategoryPolicy[] {
  return (Object.keys(CATEGORY_META) as LeadCategory[]).map((c) =>
    categoryPolicy(c, toggles, providers),
  );
}

/**
 * Classify a prospect/lead into a category from its source. Auto-discovered
 * (source_type 'google') is always cold; referral/partner are treated as
 * approved; bexio as existing; everything else as cold by default (safe).
 */
export function categoryForSource(sourceType: string): LeadCategory {
  if (sourceType === "referral" || sourceType === "partner") return "approved_contact";
  if (sourceType === "bexio") return "existing_customer";
  if (sourceType === "email" || sourceType === "website") return "inbound";
  return "cold_discovered";
}
