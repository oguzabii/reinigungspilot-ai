"use client";

import { useActionState } from "react";
import { Send, Check, AlertTriangle } from "lucide-react";
import { sendOutreachMessage, type SendActionState } from "./actions";

const initial: SendActionState = { status: "idle" };

/**
 * "E-Mail senden" — controlled, single-recipient, owner-approved send. Submits
 * only the candidate id; the server action re-reads the recipient (the
 * candidate's own stored email) and rebuilds the deterministic draft, so no
 * content or address comes from the client. One explicit click = one email.
 * After success it shows a static "Gesendet" chip. Premium + configured channel
 * only (the page decides whether to render this button at all).
 */
export function SendEmailButton({
  prospectId,
  sent,
}: {
  prospectId: string;
  sent: boolean;
}) {
  const [state, formAction, pending] = useActionState(sendOutreachMessage, initial);

  if (sent || state.status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Check className="h-3.5 w-3.5" />
        Gesendet
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="prospect_id" value={prospectId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Senden…" : "E-Mail senden"}
      </button>
      {(state.status === "error" ||
        state.status === "locked" ||
        state.status === "not_configured") &&
        state.message && (
          <span role="alert" className="inline-flex items-center gap-1 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            {state.message}
          </span>
        )}
    </form>
  );
}
