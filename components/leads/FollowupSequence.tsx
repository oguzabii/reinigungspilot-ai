"use client";

import { useActionState } from "react";
import { Repeat, Play, Square, MailCheck, Send, CheckCircle2 } from "lucide-react";
import {
  startFollowupSequence,
  stopFollowupSequence,
  sendDueFollowups,
  type SequenceState,
} from "@/app/app-shell/leads/sequence-actions";
import { FOLLOWUP_STAGE_LABELS } from "@/components/leads/lead-status";
import type { FollowupStage } from "@/lib/database-types";

const initial: SequenceState = { status: "idle" };

export interface SeqStep {
  stage: string;
  status: string;
  dueAt: string;
}

const OPEN = new Set(["planned", "due", "overdue"]);

function fmt(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}.${m}.${y}` : iso.slice(0, 10);
}

type SeqAction = typeof startFollowupSequence;

/** One sequence button bound to a server action (start/stop/reply/send-due). */
function SeqButton({
  action,
  leadId,
  reason,
  label,
  pendingLabel,
  className,
  icon: Icon,
}: {
  action: SeqAction;
  leadId: string;
  reason?: string;
  label: string;
  pendingLabel: string;
  className: string;
  icon: typeof Play;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="inline-flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="lead_id" value={leadId} />
      {reason && <input type="hidden" name="reason" value={reason} />}
      <button type="submit" disabled={pending} className={className}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        {pending ? pendingLabel : label}
      </button>
      {state.status !== "idle" && state.message && (
        <span
          className={`text-xs ${
            state.status === "success" ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}

const startCls =
  "inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60";
const stopCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800 disabled:opacity-60";
const replyCls =
  "inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60";
const sendCls =
  "inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60";

/**
 * Automatic follow-up sequence control for a lead. Shows the current state
 * (active step / next due / done) and the right action. Sending is only offered
 * when a channel is configured (`canSend`); otherwise the sequence schedules and
 * tracks steps as reminders.
 */
export function FollowupSequence({
  leadId,
  steps,
  canSend,
}: {
  leadId: string;
  steps: SeqStep[];
  canSend: boolean;
}) {
  const open = steps
    .filter((s) => OPEN.has(s.status))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const doneCount = steps.filter((s) => s.status === "done").length;
  const active = open.length > 0;
  const next = open[0];

  if (active) {
    const stageLabel = FOLLOWUP_STAGE_LABELS[next.stage as FollowupStage] ?? next.stage;
    return (
      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800">
          <Repeat className="h-3.5 w-3.5" />
          Follow-up-Sequenz aktiv · Schritt {doneCount + 1}/3
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          Nächste Erinnerung: <strong className="font-semibold">{stageLabel}</strong> am {fmt(next.dueAt)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {canSend && (
            <SeqButton
              action={sendDueFollowups}
              leadId={leadId}
              label="Fällige jetzt senden"
              pendingLabel="Senden…"
              className={sendCls}
              icon={Send}
            />
          )}
          <SeqButton
            action={stopFollowupSequence}
            leadId={leadId}
            reason="reply"
            label="Antwort erhalten"
            pendingLabel="Stoppen…"
            className={replyCls}
            icon={MailCheck}
          />
          <SeqButton
            action={stopFollowupSequence}
            leadId={leadId}
            reason="manual"
            label="Sequenz stoppen"
            pendingLabel="Stoppen…"
            className={stopCls}
            icon={Square}
          />
        </div>
      </div>
    );
  }

  if (doneCount > 0) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> Sequenz abgeschlossen
        </span>
        <SeqButton
          action={startFollowupSequence}
          leadId={leadId}
          label="Sequenz erneut starten"
          pendingLabel="Starten…"
          className={startCls}
          icon={Repeat}
        />
      </div>
    );
  }

  return (
    <div className="mt-3">
      <SeqButton
        action={startFollowupSequence}
        leadId={leadId}
        label="Automatische Follow-up-Sequenz starten"
        pendingLabel="Starten…"
        className={startCls}
        icon={Play}
      />
    </div>
  );
}
