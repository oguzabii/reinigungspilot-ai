"use client";

import { useActionState, useEffect, useRef } from "react";
import { Crosshair } from "lucide-react";
import {
  createOpportunity,
  type ActionState,
} from "@/app/app-shell/lead-hunter/actions";
import {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_SOURCES,
  SERVICE_SUGGESTIONS,
  PROSPECT_STATUS_FLOW,
  PROSPECT_STATUS_META,
} from "@/components/lead-hunter/opportunity-meta";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

const initialState: ActionState = { status: "idle" };

/**
 * Manual "Opportunity erfassen" form. Submits to the `createOpportunity` server
 * action (session client + RLS). No scraping, no auto-search, no external
 * source — a human enters the opportunity.
 */
export function NewOpportunityForm() {
  const [state, formAction, pending] = useActionState(
    createOpportunity,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="op_name" className={labelClass}>
          Titel / Firma / Projekt *
        </label>
        <input
          id="op_name"
          name="name"
          type="text"
          required
          className={inputClass}
          placeholder="z. B. Neubau Wohnüberbauung Seefeld"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="op_category" className={labelClass}>
            Opportunity-Typ
          </label>
          <select id="op_category" name="category" defaultValue="Manuell" className={inputClass}>
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="op_region" className={labelClass}>
            Region / Ort
          </label>
          <input
            id="op_region"
            name="region"
            type="text"
            className={inputClass}
            placeholder="z. B. Zürich"
          />
        </div>
        <div>
          <label htmlFor="op_source" className={labelClass}>
            Quelle
          </label>
          <select id="op_source" name="source_type" defaultValue="manual" className={inputClass}>
            {OPPORTUNITY_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="op_service" className={labelClass}>
            Service-Potenzial
          </label>
          <input
            id="op_service"
            name="service_potential"
            type="text"
            list="op_service_suggestions"
            className={inputClass}
            placeholder="z. B. Bauendreinigung"
          />
          <datalist id="op_service_suggestions">
            {SERVICE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="op_score" className={labelClass}>
            Score (0–100)
          </label>
          <input
            id="op_score"
            name="score"
            type="number"
            min={0}
            max={100}
            className={inputClass}
            placeholder="z. B. 70"
          />
        </div>
        <div>
          <label htmlFor="op_status" className={labelClass}>
            Status
          </label>
          <select id="op_status" name="status" defaultValue="scored" className={inputClass}>
            {PROSPECT_STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {PROSPECT_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="op_reason" className={labelClass}>
          Warum interessant
        </label>
        <textarea
          id="op_reason"
          name="reason"
          rows={2}
          className={inputClass}
          placeholder="Kurzbegründung – warum diese Opportunity relevant ist"
        />
      </div>

      <div>
        <label htmlFor="op_next" className={labelClass}>
          Nächste Aktion
        </label>
        <input
          id="op_next"
          name="next_action"
          type="text"
          className={inputClass}
          placeholder="z. B. Bauleitung kontaktieren"
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
        <Crosshair className="h-4 w-4" strokeWidth={2.2} />
        {pending ? "Speichern…" : "Opportunity erfassen"}
      </button>
    </form>
  );
}
