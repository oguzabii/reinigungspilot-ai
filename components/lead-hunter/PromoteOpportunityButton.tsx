"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRightToLine, CheckCircle2, ChevronRight } from "lucide-react";
import {
  promoteOpportunity,
  type ActionState,
} from "@/app/app-shell/lead-hunter/actions";

const initialState: ActionState = { status: "idle" };

/**
 * "In Lead Inbox übernehmen" — promotes an opportunity into a lead via the
 * `promoteOpportunity` server action (session client + RLS). After promotion (or
 * if already promoted) it does NOT dead-end: it confirms "Im Lead Inbox" and
 * offers the clear next steps (open the inbox, plan a follow-up, prepare an
 * offer). No email, no automation, no external call.
 */
export function PromoteOpportunityButton({
  opportunityId,
  promoted,
}: {
  opportunityId: string;
  promoted: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    promoteOpportunity,
    initialState,
  );

  if (promoted || state.status === "success") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Im Lead Inbox
        </span>
        <NextLink href="/app-shell/leads" label="Lead öffnen" />
        <NextLink href="/app-shell/leads" label="Follow-up planen" />
        <NextLink href="/app-shell/offers" label="Offerte vorbereiten" />
      </div>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-2">
      <input type="hidden" name="prospect_id" value={opportunityId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <ArrowRightToLine className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? "Übernehmen…" : "In Lead Inbox übernehmen"}
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-amber-700">
          {state.message}
        </span>
      )}
    </form>
  );
}

function NextLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-700 hover:text-blue-800"
    >
      {label}
      <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}
