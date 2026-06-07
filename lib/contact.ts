/**
 * Central contact details.
 *
 * Single source for the public contact e-mail and the prefilled mailto link.
 * Frontend/demo only — a mailto opens the visitor's mail client, the app does
 * not send mail itself.
 */

export const CONTACT_EMAIL = "info@reinigungspilot.ai";

export function contactMailto(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export const CONTACT_MAILTO = contactMailto("Beratung – ReinigungsPilot AI");
