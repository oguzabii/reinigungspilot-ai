"use client";

import { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import {
  buildOfferEmailDraft,
  type OfferDraftInput,
} from "@/components/offers/offer-send-draft";

/**
 * Collapsible **manual** send draft for an offer: a suggested subject + body
 * the user copies and sends from their own mailbox. Nothing is sent from here —
 * no SMTP, no email API, no bexio. Pure client-side clipboard convenience.
 */
export function OfferSendDraft(props: OfferDraftInput) {
  const { subject, body } = buildOfferEmailDraft(props);
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  async function copy(which: "subject" | "body", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard can be blocked (insecure context / permissions) — no-op.
    }
  }

  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60">
      <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-800">
        <Mail className="h-3.5 w-3.5 text-blue-600" />
        Versand-Entwurf (manuell)
      </summary>
      <div className="space-y-3 px-3 pb-3">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Kein automatischer Versand. Text kopieren und selbst per E-Mail senden
          – das PDF separat herunterladen und anhängen.
        </p>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Betreff</span>
            <button
              type="button"
              onClick={() => copy("subject", subject)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-navy-700 hover:border-blue-300 hover:text-blue-700"
            >
              {copied === "subject" ? (
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
          <input
            readOnly
            value={subject}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-navy-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Text</span>
            <button
              type="button"
              onClick={() => copy("body", body)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-navy-700 hover:border-blue-300 hover:text-blue-700"
            >
              {copied === "body" ? (
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
            rows={9}
            value={body}
            className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs leading-relaxed text-navy-900"
          />
        </div>
      </div>
    </details>
  );
}
