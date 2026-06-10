"use client";

import { useActionState, useEffect, useRef } from "react";
import { BellPlus } from "lucide-react";
import { createFollowup, type ActionState } from "@/app/app-shell/leads/actions";
import {
  FOLLOWUP_STAGES,
  FOLLOWUP_STAGE_LABELS,
  FOLLOWUP_CHANNELS,
} from "@/components/leads/lead-status";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

export interface LeadOption {
  id: string;
  name: string;
}

const initialState: ActionState = { status: "idle" };

/**
 * Manual "Follow-up erstellen" form. Submits to the `createFollowup` server
 * action (session client + RLS; the linked lead is verified to belong to the
 * active tenant). No sending, no automation — this only plans a task.
 */
export function NewFollowupForm({ leads }: { leads: LeadOption[] }) {
  const [state, formAction, pending] = useActionState(
    createFollowup,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  // The BROWSER converts the user's local wall-clock input into a real instant
  // (ISO/UTC) — the server must not reinterpret it in its own timezone. The
  // hidden input is uncontrolled (set imperatively) so form.reset() clears it.
  const dueIsoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  if (leads.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Erfassen Sie zuerst einen Lead – Follow-ups werden mit einem Lead
        verknüpft.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fu_lead_id" className={labelClass}>
            Lead *
          </label>
          <select id="fu_lead_id" name="lead_id" required className={inputClass}>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fu_stage" className={labelClass}>
            Stufe *
          </label>
          <select id="fu_stage" name="stage" defaultValue="24h" className={inputClass}>
            {FOLLOWUP_STAGES.map((s) => (
              <option key={s} value={s}>
                {FOLLOWUP_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fu_due_at" className={labelClass}>
            Fällig am *
          </label>
          <input
            id="fu_due_at"
            name="due_at"
            type="datetime-local"
            required
            className={inputClass}
            onChange={(e) => {
              // Imperative (uncontrolled): no setState in render path, and
              // form.reset() on success clears it back to the empty default.
              if (!dueIsoRef.current) return;
              const d = new Date(e.target.value);
              dueIsoRef.current.value = Number.isNaN(d.getTime())
                ? ""
                : d.toISOString();
            }}
          />
          <input ref={dueIsoRef} type="hidden" name="due_at_iso" />
        </div>
        <div>
          <label htmlFor="fu_channel" className={labelClass}>
            Kanal
          </label>
          <select id="fu_channel" name="channel" defaultValue="" className={inputClass}>
            <option value="">–</option>
            {FOLLOWUP_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="fu_note" className={labelClass}>
          Titel / Notiz *
        </label>
        <input
          id="fu_note"
          name="note"
          type="text"
          required
          className={inputClass}
          placeholder="z. B. Offerte nachfassen"
        />
      </div>

      {state.status !== "idle" && state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "success" ? successBoxClass : errorBoxClass}
        >
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitClass}>
        <BellPlus className="h-4 w-4" strokeWidth={2.2} />
        {pending ? "Speichern…" : "Follow-up erstellen"}
      </button>
    </form>
  );
}
