"use client";

import { useActionState } from "react";
import { Search, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import { runDiscovery, type DiscoveryActionState } from "./actions";
import { SERVICE_SUGGESTIONS } from "@/components/lead-hunter/opportunity-meta";
import { inputClass, labelClass, submitClass } from "@/components/leads/form-styles";

const initial: DiscoveryActionState = { status: "idle" };

/**
 * Owner/admin manual discovery run. Submits to the `runDiscovery` server action,
 * which only calls the official Places API when a key is configured. Disabled
 * when the API is not configured or the user is not owner/admin.
 */
export function RunDiscoveryForm({
  configured,
  canRun,
  defaultRegion = "",
}: {
  configured: boolean;
  canRun: boolean;
  defaultRegion?: string;
}) {
  const [state, formAction, pending] = useActionState(runDiscovery, initial);
  const disabled = !configured || !canRun || pending;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="dk" className={labelClass}>
            Suchbegriff *
          </label>
          <input
            id="dk"
            name="keyword"
            type="text"
            required
            disabled={disabled}
            className={inputClass}
            placeholder="z. B. Liegenschaftsverwaltung"
          />
        </div>
        <div>
          <label htmlFor="dr" className={labelClass}>
            Region / Ort
          </label>
          <input
            id="dr"
            name="region"
            type="text"
            disabled={disabled}
            defaultValue={defaultRegion}
            className={inputClass}
            placeholder="z. B. Zürich"
          />
        </div>
        <div>
          <label htmlFor="ds" className={labelClass}>
            Service (Vorschlag)
          </label>
          <input
            id="ds"
            name="service"
            type="text"
            list="discovery_services"
            disabled={disabled}
            className={inputClass}
            placeholder="z. B. Büroreinigung"
          />
          <datalist id="discovery_services">
            {SERVICE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <button type="submit" disabled={disabled} className={submitClass}>
        <Search className="h-4 w-4" strokeWidth={2.2} />
        {pending ? "Suche läuft…" : "Discovery starten"}
      </button>

      {!configured && (
        <p className="text-xs text-slate-500">
          Discovery-API nicht konfiguriert – die Suche ist deaktiviert.
        </p>
      )}
      {configured && !canRun && (
        <p className="text-xs text-slate-500">
          Nur Inhaber/Admin dürfen die Discovery starten.
        </p>
      )}

      {state.status !== "idle" && state.message && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : state.status === "not_configured"
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      {state.result && state.result.candidates.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">
            Gefundene Betriebe ({state.result.candidates.length})
            {!state.result.autoCreate && " – Auto-Erstellung aus, bitte manuell prüfen/erfassen"}
          </p>
          <ul className="mt-2 space-y-1.5">
            {state.result.candidates.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>
                  <span className="font-medium text-navy-900">{c.name}</span>
                  {c.address && (
                    <span className="text-slate-500"> · {c.address}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
