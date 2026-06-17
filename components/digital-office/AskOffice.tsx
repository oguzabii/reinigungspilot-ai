"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Lock, ArrowRight, ShieldCheck } from "lucide-react";
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

/**
 * Ask Office — an always-visible docked assistant panel ("Frag Ihr digitales
 * Büro"). It is the central assistant of the standalone surface, not a hidden
 * FAQ widget: a real, context-aware chat that keeps local history, answers the
 * user's actual message via a server action (AI provider if configured, else the
 * local engine), and shows the mode honestly.
 *
 * - Desktop: docked, sticky right column. Mobile: a prominent in-flow section.
 * - Opens in German; each reply follows the user's language (DE / TR / EN).
 * - Gated: locked for Free/Starter (friendly upgrade), enabled for Pro+.
 * - Any change is an approval-required PROPOSAL — nothing is executed silently.
 */

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

export function AskOfficeDock({
  context,
  initialMode,
  providerLabel,
}: {
  context: AskOfficeContext;
  initialMode: AskOfficeMode;
  providerLabel: string | null;
}) {
  const enabled = context.askOfficeLevel !== "none";
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

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
      : "Lokaler Modus";

  return (
    <section
      id="ask-office"
      className="flex scroll-mt-20 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-6rem)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
          <Sparkles className="h-4 w-4 text-blue-300" />
        </span>
        <div>
          <p className="text-sm font-semibold text-navy-900">Ask Office</p>
          <p className="text-xs text-slate-500">Frag Ihr digitales Büro</p>
        </div>
      </div>

      {enabled ? (
        <>
          {/* Honest mode + approval indicator */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${mode === "ai" ? "bg-emerald-500" : "bg-blue-500"}`}
              />
              <span className="text-[11px] font-medium text-slate-500">{modeLabel}</span>
            </span>
            <span className="text-[11px] text-slate-400">· Änderungen brauchen Freigabe</span>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 max-h-[55vh] lg:max-h-none"
          >
            {messages.map((m) => (
              <div key={m.id}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
                  <div className="mt-2 max-w-[88%] rounded-xl border border-amber-200 bg-amber-50 p-3">
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
              <div className="flex max-w-[88%] items-center gap-1 rounded-2xl bg-slate-100 px-3.5 py-3">
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
    </section>
  );
}

function LockedPanel() {
  const required = requiredPackageNameForFeature("ask_office") || "Pro";
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
        <Sparkles className="h-7 w-7 text-blue-300" />
      </span>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
        <Lock className="h-3.5 w-3.5" />
        Ab {required} verfügbar
      </span>
      <h3 className="mt-4 text-lg font-semibold text-navy-900">Frag Ihr digitales Büro</h3>
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
