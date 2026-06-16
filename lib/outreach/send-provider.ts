/**
 * Outreach send provider (v0.5.9, provider-based since v0.5.10). SERVER-ONLY.
 *
 * A tiny abstraction over OFFICIAL transactional-email channels so the rest of
 * the app can ask "is a compliant send channel configured?", "which one?" and
 * "send this ONE message" without knowing the provider. Two providers:
 *
 *   - `resend` — official Resend REST API (`https://api.resend.com/emails`),
 *     dependency-free (fetch). Configured via RESEND_API_KEY + RESEND_FROM_EMAIL.
 *   - `smtp`   — a real mailbox over SMTP (e.g. info@clean-24.ch) via nodemailer.
 *     Configured via SMTP_HOST/PORT/SECURE/USER/PASSWORD/FROM.
 *
 * `OUTREACH_SEND_PROVIDER=resend|smtp` selects the channel. If unset, Resend is
 * preferred when configured, else SMTP — so existing Resend setups keep working
 * exactly as before.
 *
 * HARD RULES:
 *   - Configured ONLY when the owner sets the relevant env (never in the repo).
 *     Missing → `not_configured`; the app keeps working and the UI shows
 *     "Kanal nicht verbunden".
 *   - Keys/passwords are NEVER logged and NEVER sent to the client.
 *   - This sends exactly ONE message to ONE recipient per call. There is NO bulk
 *     API, NO scheduling, NO background/cron send, NO WhatsApp. The caller (a
 *     server action) enforces package gating + explicit owner approval.
 *   - Nothing runs at import time; values are read lazily at call time. nodemailer
 *     is loaded lazily (dynamic import) only when an SMTP send actually happens.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 10000;

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export type SendProviderId = "resend" | "smtp";

export type SendStatus = "ok" | "not_configured" | "error";

export interface SendResult {
  status: SendStatus;
  /** Human-readable note for the "error" status (never contains a secret). */
  message?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

/** Minimal RFC-5322-ish email sanity check (a guard, not a validator). */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function resendConfigured(): boolean {
  return Boolean(readEnv("RESEND_API_KEY") && readEnv("RESEND_FROM_EMAIL"));
}

function smtpConfigured(): boolean {
  return Boolean(
    readEnv("SMTP_HOST") &&
      readEnv("SMTP_PORT") &&
      readEnv("SMTP_USER") &&
      readEnv("SMTP_PASSWORD") &&
      readEnv("SMTP_FROM"),
  );
}

/**
 * The send channel that will actually be used, or null if none is configured.
 * Honours an explicit `OUTREACH_SEND_PROVIDER`; otherwise prefers Resend, then
 * SMTP (so prior Resend-only setups are unchanged).
 */
export function activeSendProvider(): SendProviderId | null {
  const explicit = readEnv("OUTREACH_SEND_PROVIDER")?.toLowerCase();
  if (explicit === "smtp") return smtpConfigured() ? "smtp" : null;
  if (explicit === "resend") return resendConfigured() ? "resend" : null;
  if (resendConfigured()) return "resend";
  if (smtpConfigured()) return "smtp";
  return null;
}

/** True if a compliant send channel is configured (server-side). */
export function isSendConfigured(): boolean {
  return activeSendProvider() !== null;
}

/** Owner-facing label of the active channel ("SMTP" / "Resend"), or null. */
export function sendProviderLabel(): string | null {
  const p = activeSendProvider();
  return p === "smtp" ? "SMTP" : p === "resend" ? "Resend" : null;
}

/**
 * Send a single email to a single recipient through the configured channel.
 * Never throws — failures map to `{ status: "error" }` with a calm message.
 * Secrets are read lazily and never logged/returned.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const provider = activeSendProvider();
  if (!provider) return { status: "not_configured" };

  const to = input.to.trim();
  if (!looksLikeEmail(to)) {
    return { status: "error", message: "Empfänger-E-Mail ist ungültig." };
  }
  if (!input.subject.trim() || !input.text.trim()) {
    return { status: "error", message: "Betreff und Text dürfen nicht leer sein." };
  }

  const payload: SendEmailInput = {
    to,
    subject: input.subject.slice(0, 200),
    text: input.text.slice(0, 8000),
  };
  return provider === "smtp" ? sendViaSmtp(payload) : sendViaResend(payload);
}

/* -------------------------------------------------------------------------- */
/* Resend (REST, dependency-free)                                              */
/* -------------------------------------------------------------------------- */

async function sendViaResend(input: SendEmailInput): Promise<SendResult> {
  const key = readEnv("RESEND_API_KEY");
  const from = readEnv("RESEND_FROM_EMAIL");
  if (!key || !from) return { status: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      // Do NOT echo the response body verbatim (avoid leaking any token/PII).
      return {
        status: "error",
        message: "Versand momentan nicht möglich (Kanal-Zugriff oder Kontingent prüfen).",
      };
    }
    return { status: "ok" };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      status: "error",
      message: aborted
        ? "Versand hat das Zeitlimit überschritten – bitte später erneut versuchen."
        : "Versand fehlgeschlagen – bitte später erneut versuchen.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* SMTP (real mailbox via nodemailer)                                          */
/* -------------------------------------------------------------------------- */

async function sendViaSmtp(input: SendEmailInput): Promise<SendResult> {
  const host = readEnv("SMTP_HOST");
  const portRaw = readEnv("SMTP_PORT");
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASSWORD");
  const from = readEnv("SMTP_FROM");
  if (!host || !portRaw || !user || !pass || !from) {
    return { status: "not_configured" };
  }
  const port = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(port)) {
    return { status: "error", message: "SMTP-Port ist ungültig." };
  }
  // `secure` defaults from the port (465 = implicit TLS) unless set explicitly.
  const secureRaw = readEnv("SMTP_SECURE");
  const secure = secureRaw ? secureRaw.toLowerCase() === "true" : port === 465;

  try {
    // Lazy, server-only import — nodemailer is never bundled or loaded unless an
    // SMTP send actually happens (see serverExternalPackages in next.config.ts).
    const { createTransport } = await import("nodemailer");
    const transporter = createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: REQUEST_TIMEOUT_MS,
      greetingTimeout: REQUEST_TIMEOUT_MS,
      socketTimeout: 15000,
    });
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { status: "ok" };
  } catch {
    // Never surface host/credentials or the raw error to the UI.
    return {
      status: "error",
      message: "Versand über SMTP momentan nicht möglich – bitte SMTP-Konfiguration prüfen.",
    };
  }
}
