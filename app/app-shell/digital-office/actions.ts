"use server";

/**
 * Digital Office — Ask Office chat action (vNext).
 *
 * Read-only: it does NOT write to the database. It authenticates the caller,
 * re-derives the SAFE, RLS-scoped office context on the server (never trusting a
 * client-supplied context, never service-role), and returns the assistant's
 * reply via the provider abstraction (AI if configured, else the local engine).
 *
 * Gating is enforced here too (defense in depth): if the package does not
 * include Ask Office, the action declines cleanly.
 */

import { getCurrentCompanyContext } from "@/lib/auth/session";
import { loadOfficeView } from "@/lib/digital-office/office-data";
import {
  generateAskOfficeReply,
  type AskOfficeChatResult,
} from "@/lib/digital-office/ask-office-chat";
import type { AskTurn } from "@/lib/digital-office/ask-office";

const MAX_TURNS = 20;
const MAX_CONTENT = 4000;

function sanitize(history: AskTurn[]): AskTurn[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (t): t is AskTurn =>
        !!t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim().length > 0,
    )
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_CONTENT) }));
}

function note(text: string): AskOfficeChatResult {
  return { text, lang: "de", mode: "local", providerLabel: null, status: "ok" };
}

export async function askOfficeChat(
  history: AskTurn[],
): Promise<AskOfficeChatResult> {
  const context = await getCurrentCompanyContext();
  if (!context?.activeCompanyId) {
    return note("Bitte erneut anmelden, um Ask Office zu nutzen.");
  }

  const view = await loadOfficeView(context.activeCompanyId);
  if (!view.askEnabled) {
    return note(
      "Ask Office ist in Ihrem Paket noch nicht enthalten. Ab Pro verfügbar.",
    );
  }

  const turns = sanitize(history);
  if (turns.length === 0) {
    return note("Bitte schreiben Sie eine kurze Frage an Ihr digitales Büro.");
  }

  return generateAskOfficeReply(turns, view.askContext);
}
