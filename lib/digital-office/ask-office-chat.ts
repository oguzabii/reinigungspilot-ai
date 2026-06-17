/**
 * Ask Office — chat provider abstraction (vNext). SERVER-ONLY.
 *
 * One interface, two modes:
 *   - `local` (default): the deterministic, context-aware engine in
 *     `ask-office.ts`. No external call, fully honest.
 *   - `ai`: an OpenAI-compatible chat completion, used ONLY when the owner sets
 *     the relevant env (never in the repo). The conversational text comes from
 *     the model; the structured, approval-required ACTION PROPOSAL still comes
 *     from the local detector — so actions stay gated regardless of provider.
 *
 * HARD RULES (mirrors lib/outreach/send-provider.ts):
 *   - Configured ONLY via env: `ASK_OFFICE_AI_API_KEY` (+ optional
 *     `ASK_OFFICE_AI_BASE_URL`, `ASK_OFFICE_AI_MODEL`, `ASK_OFFICE_AI_PROVIDER`).
 *     Missing → `local` mode; the UI says so honestly. No key in the repo.
 *   - The key is read lazily, NEVER logged and NEVER returned to the client.
 *   - The context passed to the model is the safe, tenant-scoped
 *     `AskOfficeContext` only — no secrets, no credentials, no raw env.
 *   - On any AI error/timeout → fall back to the local engine (status
 *     `fallback`), never throw to the caller.
 *   - The model is instructed to PROPOSE, never to claim it sent/changed/booked
 *     anything.
 */

import {
  respond,
  detectLanguage,
  type AskLang,
  type AskOfficeProposal,
  type AskTurn,
} from "./ask-office";
import type { AskOfficeContext } from "./ask-office-context";

const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

export type AskOfficeMode = "ai" | "local";

export interface AskOfficeChatResult {
  text: string;
  lang: AskLang;
  proposal?: AskOfficeProposal;
  suggestions?: string[];
  contextUsed?: string[];
  mode: AskOfficeMode;
  /** Owner-facing provider label when in AI mode, else null. */
  providerLabel: string | null;
  /** `ok` = produced by `mode`; `fallback` = AI failed, local was used. */
  status: "ok" | "fallback";
}

function readEnv(name: string): string | undefined {
  if (typeof window !== "undefined") return undefined;
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/** True if a real AI provider is configured (server-side only). */
export function isAiProviderConfigured(): boolean {
  return Boolean(readEnv("ASK_OFFICE_AI_API_KEY"));
}

/** The active mode. `ai` only when a provider is configured. */
export function askOfficeMode(): AskOfficeMode {
  return isAiProviderConfigured() ? "ai" : "local";
}

/** Owner-facing provider label ("KI" / a configured name), or null in local mode. */
export function askOfficeProviderLabel(): string | null {
  if (!isAiProviderConfigured()) return null;
  return readEnv("ASK_OFFICE_AI_PROVIDER") ?? "KI";
}

/* -------------------------------------------------------------------------- */
/* Public entry                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Generate the next assistant reply. `history` is the full local chat history;
 * the last user turn is the message to answer. Always resolves — never throws.
 */
export async function generateAskOfficeReply(
  history: AskTurn[],
  context: AskOfficeContext,
): Promise<AskOfficeChatResult> {
  const lastUser = [...history].reverse().find((t) => t.role === "user");
  const message = lastUser?.content?.trim() ?? "";
  const local = respond(message, context, history);

  // Local mode (default, honest baseline).
  if (askOfficeMode() === "local") {
    return {
      text: local.text,
      lang: local.lang,
      proposal: local.proposal,
      suggestions: local.suggestions,
      contextUsed: local.contextUsed,
      mode: "local",
      providerLabel: null,
      status: "ok",
    };
  }

  // AI mode: model writes the prose, local detector keeps the action structured.
  try {
    const lang = detectLanguage(message);
    const text = await callProvider(history, context, lang);
    return {
      text,
      lang,
      proposal: local.proposal,
      suggestions: local.suggestions,
      contextUsed: local.contextUsed,
      mode: "ai",
      providerLabel: askOfficeProviderLabel(),
      status: "ok",
    };
  } catch {
    // Honest fallback — AI was configured but unavailable; we used local.
    return {
      text: local.text,
      lang: local.lang,
      proposal: local.proposal,
      suggestions: local.suggestions,
      contextUsed: local.contextUsed,
      mode: "local",
      providerLabel: null,
      status: "fallback",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* OpenAI-compatible provider (dependency-free, env-gated)                      */
/* -------------------------------------------------------------------------- */

const LANG_NAME: Record<AskLang, string> = {
  de: "German",
  tr: "Turkish",
  en: "English",
};

function buildSystemPrompt(context: AskOfficeContext, lang: AskLang): string {
  const c = context;
  return [
    `You are "Ask Office", the assistant inside a customer's self-service Digital Office Builder.`,
    `Answer in ${LANG_NAME[lang]}. Be concise, concrete and friendly.`,
    `Only use the office context below. Do not invent data you were not given.`,
    `You may PROPOSE actions, but you must never claim to have sent an email, changed a price, connected a mailbox, or booked/deleted anything — the app handles approval and execution separately.`,
    `Do not translate company names, customer names or saved template names.`,
    ``,
    `Office context (tenant-scoped, non-secret):`,
    `- Company: ${c.companyName}`,
    `- Package: ${c.packageName} (Ask Office level: ${c.askOfficeLevel}, automation: ${c.automationLevel})`,
    `- Setup progress: ${c.setupDone}/${c.setupTotal}; open steps: ${c.missingSteps.join(", ") || "none"}`,
    `- Active workers: ${c.activeWorkers.join(", ") || "none"}`,
    `- Available (locked) workers: ${c.availableWorkers.join(", ") || "none"}`,
    `- Mailbox status: ${c.mailboxStatus}`,
    `- Offer template configured: ${c.hasTemplate ? "yes" : "no"}`,
    `- Pricing rules configured: ${c.hasPricingRules ? "yes" : "no"} (level: ${c.pricingRulesLevel})`,
    `- Open tasks: ${c.openTasks}; pending approvals: ${c.pendingApprovals}`,
    `- Current page: ${c.route}`,
  ].join("\n");
}

async function callProvider(
  history: AskTurn[],
  context: AskOfficeContext,
  lang: AskLang,
): Promise<string> {
  const key = readEnv("ASK_OFFICE_AI_API_KEY");
  if (!key) throw new Error("not_configured");
  const base = (readEnv("ASK_OFFICE_AI_BASE_URL") ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const model = readEnv("ASK_OFFICE_AI_MODEL") ?? DEFAULT_MODEL;

  // Keep the payload bounded: last 12 turns, each length-capped.
  const turns = history.slice(-12).map((t) => ({
    role: t.role,
    content: t.content.slice(0, 2000),
  }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 400,
        messages: [
          { role: "system", content: buildSystemPrompt(context, lang) },
          ...turns,
        ],
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`provider_${res.status}`);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("empty_response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
