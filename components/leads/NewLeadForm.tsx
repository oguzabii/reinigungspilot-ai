"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createLead, type ActionState } from "@/app/app-shell/leads/actions";
import {
  LEAD_STATUS_FLOW,
  LEAD_STATUS_META,
} from "@/components/leads/lead-status";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "manual", label: "Manuell" },
  { value: "website", label: "Website Anfrage" },
  { value: "email", label: "E-Mail" },
  { value: "google", label: "Google" },
  { value: "referral", label: "Empfehlung" },
  { value: "partner", label: "Partner / Verwaltung" },
  { value: "other", label: "Andere" },
];

const initialState: ActionState = { status: "idle" };

/**
 * Manual "Neuen Lead erfassen" form. Submits to the `createLead` server action,
 * which writes via the session client (RLS). Clears itself on success; the list
 * refreshes via `revalidatePath`.
 */
export function NewLeadForm({
  serviceSuggestions,
}: {
  serviceSuggestions: string[];
}) {
  const [state, formAction, pending] = useActionState(createLead, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="company_name" className={labelClass}>
          Firma / Name *
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          required
          className={inputClass}
          placeholder="z. B. Helvetia Immobilien AG"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact_name" className={labelClass}>
            Kontaktperson
          </label>
          <input id="contact_name" name="contact_name" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-Mail
          </label>
          <input id="email" name="email" type="email" autoComplete="off" className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Telefon
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor="service_interest" className={labelClass}>
            Interesse / Leistung
          </label>
          <input
            id="service_interest"
            name="service_interest"
            type="text"
            list="service-suggestions"
            className={inputClass}
          />
          <datalist id="service-suggestions">
            {serviceSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="source_type" className={labelClass}>
            Quelle
          </label>
          <select id="source_type" name="source_type" defaultValue="manual" className={inputClass}>
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" name="status" defaultValue="new" className={inputClass}>
            {LEAD_STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notizen
        </label>
        <textarea id="notes" name="notes" rows={3} className={inputClass} />
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
        <Plus className="h-4 w-4" strokeWidth={2.4} />
        {pending ? "Speichern…" : "Lead erfassen"}
      </button>
    </form>
  );
}
