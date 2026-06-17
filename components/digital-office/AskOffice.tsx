"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Send, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import {
  respond,
  greeting,
  placeholder,
  defaultSuggestions,
  type AskOfficeContext,
  type AskLang,
  type AskOfficeProposal,
} from "@/lib/digital-office/ask-office";
import { requiredPackageNameForFeature } from "@/lib/digital-office/feature-gates";
import { QUICK_ACTION_CARD_CLASS } from "@/components/digital-office/OfficeSections";

/**
 * Ask Office — a YouTube-Studio-style right-side assistant panel.
 *
 * - Opens in German (greeting, chips, placeholder); each reply follows the
 *   language the user wrote in (German / Turkish / English).
 * - Gated: locked for Free/Starter (friendly upgrade state), enabled for Pro+.
 * - Deterministic + local: no external AI call. Any change is a PROPOSAL the
 *   user must confirm; this foundation persists nothing, so confirming records
 *   the intent honestly without changing data.
 *
 * The launcher button (top-right) and the `AskOfficeCtaCard` both open this one
 * panel via a window CustomEvent, so there is a single source of truth.
 */

const OPEN_EVENT = "klarsa:open-ask-office";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  lang: AskLang;
  proposal?: AskOfficeProposal;
  resolved?: boolean;
}

const UI: Record<
  AskLang,
  { confirm: string; cancel: string; confirmed: string; cancelled: string }
> = {
  de: {
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    confirmed:
      "Vorgemerkt — die Ausführung folgt im nächsten Schritt. Es wurde nichts geändert oder gesendet.",
    cancelled: "Abgebrochen — es wurde nichts geändert.",
  },
  tr: {
    confirm: "Onayla",
    cancel: "İptal",
    confirmed:
      "Not edildi — uygulama bir sonraki adımda gelecek. Hiçbir şey değiştirilmedi veya gönderilmedi.",
    cancelled: "İptal edildi — hiçbir şey değiştirilmedi.",
  },
  en: {
    confirm: "Confirm",
    cancel: "Cancel",
    confirmed:
      "Noted — execution comes in the next step. Nothing was changed or sent.",
    cancelled: "Cancelled — nothing was changed.",
  },
};

export function AskOffice({ context }: { context: AskOfficeContext }) {
  const enabled = context.askOfficeLevel !== "none";
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<AskLang>("de");
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<string[]>(defaultSuggestions("de"));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", text: greeting("de"), lang: "de" },
  ]);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open via the shared event (from the launcher and the CTA card).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Keep the conversation scrolled to the latest message; focus the input.
  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    if (enabled) inputRef.current?.focus();
  }, [open, messages, enabled]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reply = respond(trimmed, context);
    setMessages((prev) => [
      ...prev,
      { id: idRef.current++, role: "user", text: trimmed, lang: reply.lang },
      {
        id: idRef.current++,
        role: "assistant",
        text: reply.text,
        lang: reply.lang,
        proposal: reply.proposal,
      },
    ]);
    setLang(reply.lang);
    setChips(reply.suggestions ?? defaultSuggestions(reply.lang));
    setInput("");
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
                  {m.proposal && !m.resolved && (
                    <div className="mt-2 max-w-[85%] rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-900">
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
            </div>

            {/* Suggestion chips */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2.5">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => send(chip)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50"
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
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-navy-900 outline-none transition-colors focus:border-blue-400"
              />
              <button
                type="submit"
                aria-label="Senden"
                disabled={!input.trim()}
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
