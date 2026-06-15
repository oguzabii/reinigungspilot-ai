/**
 * Outreach send provider (v0.5.9). SERVER-ONLY.
 *
 * A tiny, dependency-free abstraction over an OFFICIAL transactional-email REST
 * API (Resend, `https://api.resend.com/emails`). It exists so the rest of the
 * app can ask "is a compliant send channel configured?" and "send this ONE
 * message" without knowing the provider.
 *
 * HARD RULES:
 *   - Configured ONLY when the owner sets `RESEND_API_KEY` + `RESEND_FROM_EMAIL`
 *     in the environment (never in the repo). Missing → `not_configured`, the
 *     app keeps working and the UI shows "Kanal nicht verbunden".
 *   - The key is NEVER logged and NEVER sent to the client.
 *   - This sends exactly ONE message to ONE recipient per call. There is NO bulk
 *     API, NO scheduling, NO background/cron send, NO WhatsApp. The caller (a
 *     server action) enforces package gating + explicit owner approval.
 *   - Nothing runs at import time; values are read lazily at call time.
 */

const SEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 10000;

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** True if a compliant send channel is configured (server-side). */
export function isSendConfigured(): boolean {
  return Boolean(readEnv("RESEND_API_KEY") && readEnv("RESEND_FROM_EMAIL"));
}

export type SendStatus = "ok" | "not_configured" | "error";

export interface SendResult {
  status: SendStatus;
  /** Human-readable note for the "error" status (never contains the key). */
  message?: string;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

/** Minimal RFC-5322-ish email sanity check (not a validator, just a guard). */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Send a single email to a single recipient through the configured provider.
 * Never throws — failures map to `{ status: "error" }` with a calm message.
 * The API key is read lazily and never logged/returned.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const key = readEnv("RESEND_API_KEY");
  const from = readEnv("RESEND_FROM_EMAIL");
  if (!key || !from) return { status: "not_configured" };

  const to = input.to.trim();
  if (!looksLikeEmail(to)) {
    return { status: "error", message: "Empfänger-E-Mail ist ungültig." };
  }
  if (!input.subject.trim() || !input.text.trim()) {
    return { status: "error", message: "Betreff und Text dürfen nicht leer sein." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(SEND_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject.slice(0, 200),
        text: input.text.slice(0, 8000),
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
