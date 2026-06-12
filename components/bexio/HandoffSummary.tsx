"use client";

import { useState } from "react";
import { ClipboardList, Copy, Check } from "lucide-react";
import {
  buildHandoffSummary,
  type HandoffSummaryInput,
} from "@/components/bexio/handoff-summary";

/**
 * Collapsible, copyable bexio handoff summary: the customer/invoice data a human
 * pastes into bexio by hand. Nothing is sent from here — no bexio API, no token,
 * no network. Pure client-side clipboard convenience.
 */
export function HandoffSummary(props: HandoffSummaryInput) {
  const text = buildHandoffSummary(props);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context / permissions) — no-op.
    }
  }

  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60">
      <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-800">
        <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
        bexio-Übergabe – Zusammenfassung kopieren
      </summary>
      <div className="space-y-2 px-3 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] leading-relaxed text-slate-500">
            Manuell in bexio erfassen – kein automatischer Versand, keine
            API-Verbindung.
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-navy-700 hover:border-blue-300 hover:text-blue-700"
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
        </div>
        <textarea
          readOnly
          rows={12}
          value={text}
          className="w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs leading-relaxed text-navy-900"
        />
      </div>
    </details>
  );
}
