"use client";

import { useActionState } from "react";
import { Save, CheckCircle2, AlertTriangle, UserRound } from "lucide-react";
import { updateProspectContact, type ContactActionState } from "./actions";
import { inputClass, labelClass } from "@/components/leads/form-styles";

const initial: ContactActionState = { status: "idle" };

/**
 * Add / update a candidate's contact details so a controlled email can be sent.
 * Submits to `updateProspectContact` (session client + RLS). Collapsible to keep
 * the card tidy; opens by default when no email is on file yet.
 */
export function ProspectContactForm({
  prospectId,
  email,
  phone,
  website,
  person,
  openByDefault,
}: {
  prospectId: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  person: string | null;
  openByDefault: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProspectContact, initial);

  return (
    <details open={openByDefault} className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60">
      <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-800">
        <UserRound className="h-3.5 w-3.5 text-blue-600" />
        {email ? "Kontaktangaben bearbeiten" : "Kontaktangaben fehlen – ergänzen"}
      </summary>
      <form action={formAction} className="space-y-2.5 px-3 pb-3">
        <input type="hidden" name="prospect_id" value={prospectId} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <label htmlFor={`ce-${prospectId}`} className={labelClass}>
              E-Mail
            </label>
            <input
              id={`ce-${prospectId}`}
              name="contact_email"
              type="email"
              defaultValue={email ?? ""}
              className={inputClass}
              placeholder="kontakt@firma.ch"
            />
          </div>
          <div>
            <label htmlFor={`cper-${prospectId}`} className={labelClass}>
              Ansprechperson
            </label>
            <input
              id={`cper-${prospectId}`}
              name="contact_person"
              type="text"
              defaultValue={person ?? ""}
              className={inputClass}
              placeholder="Vorname Name"
            />
          </div>
          <div>
            <label htmlFor={`cph-${prospectId}`} className={labelClass}>
              Telefon
            </label>
            <input
              id={`cph-${prospectId}`}
              name="contact_phone"
              type="text"
              defaultValue={phone ?? ""}
              className={inputClass}
              placeholder="+41 …"
            />
          </div>
          <div>
            <label htmlFor={`cw-${prospectId}`} className={labelClass}>
              Website
            </label>
            <input
              id={`cw-${prospectId}`}
              name="contact_website"
              type="text"
              defaultValue={website ?? ""}
              className={inputClass}
              placeholder="https://…"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" strokeWidth={2.2} />
          {pending ? "Speichern…" : "Kontaktangaben speichern"}
        </button>
        {state.status !== "idle" && state.message && (
          <p
            className={`inline-flex items-center gap-1 text-xs ${
              state.status === "success" ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {state.status === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            {state.message}
          </p>
        )}
      </form>
    </details>
  );
}
