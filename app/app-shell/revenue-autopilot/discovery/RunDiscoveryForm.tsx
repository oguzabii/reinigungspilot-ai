"use client";

import { useActionState, useState } from "react";
import { Search, CheckCircle2, AlertTriangle, Building2, Lock } from "lucide-react";
import { runDiscovery, type DiscoveryActionState } from "./actions";
import { SERVICE_SUGGESTIONS } from "@/components/lead-hunter/opportunity-meta";
import { inputClass, labelClass, submitClass } from "@/components/leads/form-styles";

const initial: DiscoveryActionState = { status: "idle" };

/**
 * Owner/admin Approved Discovery run. Picks an approved source (Google Places or
 * the official Baugesuche feed) and submits to the `runDiscovery` server action,
 * which only calls the official API/feed when that source is configured. The
 * result breakdown (Gefunden · Neu erstellt · Bereits vorhanden · Übersprungen ·
 * Fehler) is shown after a run.
 */
export function RunDiscoveryForm({
  googleConfigured,
  baugesucheConfigured,
  canRun,
  defaultRegion = "",
}: {
  googleConfigured: boolean;
  baugesucheConfigured: boolean;
  canRun: boolean;
  defaultRegion?: string;
}) {
  const [state, formAction, pending] = useActionState(runDiscovery, initial);
  const [source, setSource] = useState<"google" | "baugesuche">(
    googleConfigured || !baugesucheConfigured ? "google" : "baugesuche",
  );

  const sourceConfigured = source === "google" ? googleConfigured : baugesucheConfigured;
  const disabled = !canRun || pending || !sourceConfigured;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="dsrc" className={labelClass}>
          Quelle
        </label>
        <select
          id="dsrc"
          name="source"
          value={source}
          onChange={(e) => setSource(e.target.value as "google" | "baugesuche")}
          disabled={!canRun || pending}
          className={inputClass}
        >
          <option value="google">
            Google Places{googleConfigured ? "" : " (nicht verbunden)"}
          </option>
          <option value="baugesuche">
            Baugesuche Zürich (offiziell){baugesucheConfigured ? "" : " (nicht verbunden)"}
          </option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="dk" className={labelClass}>
            Suchbegriff {source === "google" ? "*" : "(optional)"}
          </label>
          <input
            id="dk"
            name="keyword"
            type="text"
            required={source === "google"}
            disabled={disabled}
            className={inputClass}
            placeholder={source === "google" ? "z. B. Liegenschaftsverwaltung" : "Filter (optional)"}
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

      {source === "baugesuche" && (
        <p className="text-xs text-slate-500">
          Baugesuche zieht die neuesten offiziellen Bauprojekte (kein Suchbegriff
          nötig). Treffer werden als Bauprojekt-Kandidaten vorbereitet.
        </p>
      )}

      <button type="submit" disabled={disabled} className={submitClass}>
        <Search className="h-4 w-4" strokeWidth={2.2} />
        {pending ? "Suche läuft…" : "Discovery starten"}
      </button>

      {!sourceConfigured && (
        <p className="text-xs text-slate-500">
          Diese Quelle ist nicht verbunden – die Suche ist deaktiviert. Eine andere
          Quelle wählen oder die Quelle verbinden.
        </p>
      )}
      {sourceConfigured && !canRun && (
        <p className="text-xs text-slate-500">
          Nur Inhaber/Admin dürfen die Discovery starten.
        </p>
      )}

      {state.status !== "idle" && state.message && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : state.status === "not_configured" || state.status === "locked"
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : state.status === "locked" ? (
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      {state.result && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <ResultStat label="Gefunden" value={state.result.found} tone="neutral" />
          <ResultStat label="Neu erstellt" value={state.result.created} tone="good" />
          <ResultStat label="Bereits vorhanden" value={state.result.existing} tone="muted" />
          <ResultStat label="Übersprungen" value={state.result.skipped} tone="muted" />
          <ResultStat label="Fehler" value={state.result.errors} tone={state.result.errors > 0 ? "warn" : "muted"} />
        </div>
      )}

      {state.result && state.result.candidates.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">
            Gefundene Einträge ({state.result.candidates.length})
            {!state.result.autoCreate && " – Auto-Erstellung aus, bitte manuell prüfen/erfassen"}
          </p>
          <ul className="mt-2 space-y-1.5">
            {state.result.candidates.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>
                  <span className="font-medium text-navy-900">{c.name}</span>
                  {c.region && <span className="text-slate-500"> · {c.region}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "good" | "muted" | "warn";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "neutral"
          ? "border-navy-100 bg-navy-50 text-navy-700"
          : "border-slate-200 bg-slate-50 text-slate-500";
  return (
    <div className={`rounded-xl border p-2.5 text-center ${cls}`}>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] font-medium leading-tight">{label}</p>
    </div>
  );
}
