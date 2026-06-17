"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Send, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import {
  greeting,
  placeholder,
  defaultSuggestions,
  type AskLang,
  type AskOfficeProposal,
  type AskTurn,
} from "@/lib/digital-office/ask-office";
import type { AskOfficeContext } from "@/lib/digital-office/ask-office-context";
import type {
  AskOfficeChatResult,
  AskOfficeMode,
} from "@/lib/digital-office/ask-office-chat";
import { requiredPackageNameForFeature } from "@/lib/digital-office/feature-gates";
import { askOfficeChat } from "@/app/app-shell/digital-office/actions";
import { QUICK_ACTION_CARD_CLASS } from "@/components/digital-office/OfficeSections";

/**
 * Ask Office — a YouTube-Studio-style right-side assistant panel.
 *
 * - Real conversation: keeps local chat history for the session and answers the
 *   user's actual message via a server action (AI provider if configured, else
 *   the local context-aware engine). The header shows the mode honestly.
 * - Context-aware: every reply draws on the office context; used facets are
 *   shown as subtle chips under the answer.
 * - Opens in German; each reply follows the user's language (DE / TR / EN).
 * - Gated: locked for Free/Starter (friendly upgrade state), enabled for Pro+.
 * - Any change is an approval-required PROPOSAL — nothing is executed silently.
 */

const OPEN_EVENT = "klarsa:open-ask-office";
const MAX_TURNS = 16;

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  lang: AskLang;
  proposal?: AskOfficeProposal;
  resolved?: boolean;
  contextUsed?: string[];
}

const UI: Record<
  AskLang,
  {
    confirm: string;
    cancel: string;
    confirmed: string;
    cancelled: string;
    context: string;
    draft: string;
    proposal: string;
    approval: string;
    error: string;
  }
> = {
  de: {
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    confirmed:
      "Vorgemerkt — die Ausführung folgt im nächsten Schritt. Es wurde nichts geändert oder gesendet.",
    cancelled: "Abgebrochen — es wurde nichts geändert.",
    context: "Kontext",
    draft: "Entwurf",
    proposal: "Vorschlag",
    approval: "Freigabe nötig",
    error: "Ask Office ist momentan nicht erreichbar. Bitte später erneut versuchen.",
  },
  tr: {
    confirm: "Onayla",
    cancel: "İptal",
    confirmed:
      "Not edildi — uygulama bir sonraki adımda gelecek. Hiçbir şey değiştirilmedi veya gönderilmedi.",
    cancelled: "İptal edildi — hiçbir şey değiştirilmedi.",
    context: "Bağlam",
    draft: "Taslak",
    proposal: "Öneri",
    approval: "Onay gerekli",
    error: "Ask Office şu anda erişilemiyor. Lütfen daha sonra tekrar deneyin.",
  },
  en: {
    confirm: "Confirm",
    cancel: "Cancel",
    confirmed:
      "Noted — execution comes in the next step. Nothing was changed or sent.",
    cancelled: "Cancelled — nothing was changed.",
    context: "Context",
    draft: "Draft",
    proposal: "Proposal",
    approval: "approval required",
    error: "Ask Office is unavailable right now. Please try again later.",
  },
};

function proposalBadge(kind: AskOfficeProposal["kind"], lang: AskLang): string {
  const isDraft =
    kind === "send_email" || kind === "task" || kind === "followup" || kind === "template";
  const base = isDraft ? UI[lang].draft : UI[lang].proposal;
  return `${base} · ${UI[lang].approval}`;
}

export function AskOffice({
  context,
  initialMode,
  providerLabel,
}: {
  context: AskOfficeContext;
  initialMode: AskOfficeMode;
  providerLabel: string | null;
}) {
  const enabled = context.askOfficeLevel !== "none";
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<AskLang>("de");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<AskOfficeMode>(initialMode);
  const [chips, setChips] = useState<string[]>(defaultSuggestions("de"));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", text: greeting("de"), lang: "de" },
  ]);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    if (enabled && !pending) inputRef.current?.focus();
  }, [open, messages, pending, enabled]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const turns: AskTurn[] = [
      ...messages.map((m) => ({ role: m.role, content: m.text })),
      { role: "user" as const, content: trimmed },
    ].slice(-MAX_TURNS);

    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: "user", text: trimmed, lang },
    ]);
    setInput("");
    setPending(true);

    try {
      const result: AskOfficeChatResult = await askOfficeChat(turns);
      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          role: "assistant",
          text: result.text,
          lang: result.lang,
          proposal: result.proposal,
          contextUsed: result.contextUsed,
        },
      ]);
      setLang(result.lang);
      setMode(result.mode);
      setChips(result.suggestions ?? defaultSuggestions(result.lang));
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "assistant", text: UI[lang].error, lang },
      ]);
    } finally {
      setPending(false);
    }
  }

  function resolveProposal(messageId: number, msgLang: AskLang, confirmed: boolean) {
    setMessages((prev) => [
      ...prev.map((m) => (m.id === messageId ? { ...m, resolved: true } : m)),
      {
        id: idRef.current++,
        role: "assistant",
        text: confirmed ? UI[msgLang].confirmed : UI[msgLang].cancelled,
        lang: msgLang,
      },
    ]);
  }

  const modeLabel =
    mode === "ai"
      ? `KI-Modus${providerLabel ? ` · ${providerLabel}` : ""}`
      : "Lokaler Modus · kontextbezogen";

  return (
    <>
      {/* Launcher (top-right, like YouTube Studio's Ask button) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed right-4 top-[4.75rem] z-20 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
      >
        <Sparkles className="h-4 w-4 text-blue-600" />
        Ask Office
        {!enabled && <Lock className="h-3.5 w-3.5 text-slate-400" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/30 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-label="Ask Office"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
              <Sparkles className="h-4 w-4 text-blue-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">Ask Office</p>
              <p className="text-xs text-slate-500">{context.companyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Schliessen"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {enabled ? (
          <>
            {/* Honest mode indicator */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${mode === "ai" ? "bg-emerald-500" : "bg-blue-500"}`}
              />
              <span className="text-[11px] font-medium text-slate-500">{modeLabel}</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div key={m.id}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "ml-auto bg-blue-600 text-white"
                        : "bg-slate-100 text-navy-900"
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.role === "assistant" && m.contextUsed && m.contextUsed.length > 0 && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {UI[m.lang].context}: {m.contextUsed.join(" · ")}
                    </p>
                  )}

                  {m.proposal && !m.resolved && (
                    <div className="mt-2 max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        {proposalBadge(m.proposal.kind, m.lang)}
                      </span>
                      <p className="mt-1.5 text-xs font-semibold text-amber-900">
                        {m.proposal.summary}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => resolveProposal(m.id, m.lang, true)}
                          className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {UI[m.lang].confirm}
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveProposal(m.id, m.lang, false)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          {UI[m.lang].cancel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {pending && (
                <div className="flex max-w-[85%] items-center gap-1 rounded-2xl bg-slate-100 px-3.5 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              )}
            </div>

            {/* Suggestion chips */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2.5">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={pending}
                    onClick={() => send(chip)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-slate-200 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder(lang)}
                disabled={pending}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-navy-900 outline-none transition-colors focus:border-blue-400 disabled:bg-slate-50"
              />
              <button
                type="submit"
                aria-label="Senden"
                disabled={!input.trim() || pending}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <LockedPanel />
        )}
      </aside>
    </>
  );
}

function LockedPanel() {
  const required = requiredPackageNameForFeature("ask_office") || "Pro";
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
        <Sparkles className="h-7 w-7 text-blue-300" />
      </span>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
        <Lock className="h-3.5 w-3.5" />
        Ab {required} verfügbar
      </span>
      <h3 className="mt-4 text-lg font-semibold text-navy-900">Ask Office</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
        Ihr kontextbewusster Büro-Assistent: Büro zusammenfassen, nächste Schritte
        vorschlagen, Aufgaben und Follow-ups entwerfen – mit Freigabe.
      </p>
      <Link
        href="/pricing"
        className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        Mit {required} öffnen
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/** The 6th quick-action card. Opens the same panel via the shared event. */
export function AskOfficeCtaCard({ enabled }: { enabled: boolean }) {
  const required = requiredPackageNameForFeature("ask_office") || "Pro";
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_EVENT))}
      className={QUICK_ACTION_CARD_CLASS}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
        <Sparkles className="h-4 w-4 text-blue-300" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy-900">
          Ask Office öffnen
        </span>
        <span className="block text-xs text-slate-500">
          {enabled ? "Kontextbewusster Büro-Assistent" : `Ab ${required} verfügbar`}
        </span>
      </span>
      {enabled ? (
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      ) : (
        <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
      )}
    </button>
  );
}
