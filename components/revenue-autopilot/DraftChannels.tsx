"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, ShieldCheck } from "lucide-react";
import type { DraftChannel } from "@/components/revenue-autopilot/outreach";

/**
 * Copy-only multi-channel draft viewer. Renders a collapsible block with a
 * channel switcher (E-Mail / WhatsApp / Telefon / Follow-up …), the selected
 * draft in a read-only field and a "Kopieren" button.
 *
 * Nothing is sent from here — no SMTP, no email/WhatsApp API, no network. The
 * draft is prepared; the owner copies it, checks it, and sends it themselves.
 */
export function DraftChannels({
  channels,
  summary = "Outreach vorbereiten (kopieren & selbst senden)",
}: {
  channels: DraftChannel[];
  summary?: string;
}) {
  const [activeKey, setActiveKey] = useState(channels[0]?.key ?? "");
  const [copied, setCopied] = useState<"subject" | "text" | null>(null);

  if (channels.length === 0) return null;
  const active = channels.find((c) => c.key === activeKey) ?? channels[0];

  async function copy(which: "subject" | "text", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard can be blocked (insecure context / permissions) — no-op.
    }
  }

  return (
    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60">
      <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-800">
        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
        {summary}
      </summary>

      <div className="space-y-3 px-3 pb-3">
        {/* Channel switcher */}
        <div className="flex flex-wrap gap-1.5">
          {channels.map((c) => {
            const on = c.key === active.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setActiveKey(c.key);
                  setCopied(null);
                }}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ring-1 ring-inset ${
                  on
                    ? "bg-navy-900 text-white ring-navy-900"
                    : "bg-white text-navy-700 ring-slate-200 hover:ring-blue-300 hover:text-blue-700"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Optional subject */}
        {active.subject && (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Betreff</span>
              <CopyButton
                copied={copied === "subject"}
                onClick={() => copy("subject", active.subject ?? "")}
              />
            </div>
            <input
              readOnly
              value={active.subject}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-navy-900"
            />
          </div>
        )}

        {/* Body */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              {active.label}
            </span>
            <CopyButton
              copied={copied === "text"}
              onClick={() => copy("text", active.text)}
            />
          </div>
          <textarea
            readOnly
            rows={Math.min(14, Math.max(6, active.text.split("\n").length + 1))}
            value={active.text}
            className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs leading-relaxed text-navy-900"
          />
        </div>

        <p className="inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
          <ShieldCheck className="mt-px h-3 w-3 shrink-0 text-emerald-500" />
          Vorbereiteter Entwurf. Kein automatischer Versand – prüfen, anpassen und
          selbst senden.
        </p>
      </div>
    </details>
  );
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-navy-700 hover:border-blue-300 hover:text-blue-700"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" /> Kopiert
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> Kopieren
        </>
      )}
    </button>
  );
}
