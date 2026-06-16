/**
 * Outreach inbox provider — IMAP foundation (v0.5.10). SERVER-ONLY.
 *
 * SMTP sends; IMAP READS incoming replies. This file is the inbox half of the
 * mail channel. In v0.5.10 it is a SAFE FOUNDATION ONLY: it detects whether an
 * IMAP mailbox is configured and exposes a status, so the UI can show
 * "Antwort-Erkennung über IMAP vorbereitet". It does NOT connect, poll, or read
 * any mail yet.
 *
 * Deliberately deferred to v0.5.11 (reply tracking):
 *   - NO background polling, NO cron, NO automatic customer-data import.
 *   - When reading is added, it will be OWNER-TRIGGERED, read minimal headers
 *     (from/subject/date/snippet), match to existing outreach records, and store
 *     no full bodies unless necessary. No customer data in repo/docs.
 *
 * Configured via INBOX_PROVIDER=imap + IMAP_HOST/PORT/SECURE/USER/PASSWORD and an
 * optional IMAP_MAILBOX (default "INBOX"). Secrets are read lazily and never
 * logged / never sent to the client.
 */

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export type InboxProviderId = "imap";

/**
 * True if an IMAP mailbox is fully configured (host/port/user/password present
 * and INBOX_PROVIDER=imap). Connection is NOT attempted here.
 */
export function isInboxConfigured(): boolean {
  if (readEnv("INBOX_PROVIDER")?.toLowerCase() !== "imap") return false;
  return Boolean(
    readEnv("IMAP_HOST") &&
      readEnv("IMAP_PORT") &&
      readEnv("IMAP_USER") &&
      readEnv("IMAP_PASSWORD"),
  );
}

/** Owner-facing label of the configured inbox channel ("IMAP"), or null. */
export function inboxProviderLabel(): string | null {
  return isInboxConfigured() ? "IMAP" : null;
}

/** The mailbox to read replies from once reply-tracking lands (default INBOX). */
export function inboxMailbox(): string {
  return readEnv("IMAP_MAILBOX") ?? "INBOX";
}
