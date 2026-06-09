"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createLead, type CreateLeadState } from "@/app/app-shell/leads/actions";

const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "manual", label: "Manuell" },
  { value: "website", label: "Website Anfrage" },
  { value: "email", label: "E-Mail" },
  { value: "google", label: "Google" },
  { value: "referral", label: "Empfehlung" },
  { value: "partner", label: "Partner / Verwaltung" },
  { value: "other", label: "Andere" },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "new", label: "Neu" },
  { value: "qualified", label: "Qualifiziert" },
  { value: "offer_ready", label: "Offerte bereit" },
  { value: "won", label: "Gewonnen" },
  { value: "lost", label: "Verloren" },
];

const initialState: CreateLeadState = { status: "idle" };

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";
const labelClass = "block text-xs font-medium text-slate-600";

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
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
          className={
            state.status === "success"
              ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
              : "rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200"
          }
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} />
        {pending ? "Speichern…" : "Lead erfassen"}
      </button>
    </form>
  );
}
