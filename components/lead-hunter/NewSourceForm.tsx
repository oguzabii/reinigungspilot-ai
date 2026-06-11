"use client";

import { useActionState, useState } from "react";
import { Plus, Library } from "lucide-react";
import {
  createLeadSource,
  type ActionState,
} from "@/app/app-shell/lead-hunter/sources/actions";
import {
  REGISTRY_SOURCE_TYPE_OPTIONS,
  SOURCE_PRESETS,
  SOURCE_PHASE_META,
  phaseFor,
} from "@/components/lead-hunter/source-meta";
import type { SourceType } from "@/lib/database-types";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

const initialState: ActionState = { status: "idle" };

/**
 * Manual "Quelle erfassen" form for the Source Registry. A human registers a
 * controlled source; nothing is fetched, scraped or queried. Quick-fill presets
 * only fill EMPTY fields, so the person keeps control. Submits to the
 * `createLeadSource` server action (RLS: settings domain, owner/admin).
 */
export function NewSourceForm() {
  const [state, formAction, pending] = useActionState(
    createLeadSource,
    initialState,
  );
  // Remount (clearing all fields) on each successful submit via the changing
  // key — avoids a setState-in-effect; errors keep the user's input.
  return (
    <SourceFields
      key={state.resetToken ?? "init"}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}

function SourceFields({
  state,
  formAction,
  pending,
}: {
  state: ActionState;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<SourceType>("manual");
  const [notes, setNotes] = useState("");
  const [enabled, setEnabled] = useState(true);

  const phase = SOURCE_PHASE_META[phaseFor(type)];

  return (
    <form action={formAction} className="space-y-4">
      {/* Quick-fill presets — controlled source examples. Fills empty fields. */}
      <div>
        <span className={labelClass}>Vorlage (optional)</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SOURCE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setType(preset.type);
                if (label.trim() === "") setLabel(preset.label);
                if (notes.trim() === "") setNotes(preset.note);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus className="h-3 w-3" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="src_label" className={labelClass}>
          Bezeichnung der Quelle *
        </label>
        <input
          id="src_label"
          name="label"
          type="text"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={inputClass}
          placeholder="z. B. Bauprojekte Zürich"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="src_type" className={labelClass}>
            Quellen-Typ
          </label>
          <select
            id="src_type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as SourceType)}
            className={inputClass}
          >
            {REGISTRY_SOURCE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span
              className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${phase.className}`}
            >
              {phase.label}
            </span>
            {phase.description}
          </p>
        </div>

        <div>
          <span className={labelClass}>Status</span>
          <label
            htmlFor="src_enabled"
            className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 shadow-sm"
          >
            <input
              id="src_enabled"
              name="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
            />
            {enabled ? "Aktiv – für Lead Hunter freigegeben" : "Inaktiv – pausiert"}
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="src_notes" className={labelClass}>
          Notiz / Beschreibung
        </label>
        <textarea
          id="src_notes"
          name="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          placeholder="Kontext – z. B. Region, Kategorie, worauf zu achten ist"
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
        <Library className="h-4 w-4" strokeWidth={2.2} />
        {pending ? "Speichern…" : "Quelle registrieren"}
      </button>
    </form>
  );
}
