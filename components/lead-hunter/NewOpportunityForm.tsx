"use client";

import { useActionState, useMemo, useState } from "react";
import { Crosshair, Sparkles, Wand2, Target, Library } from "lucide-react";
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
  scoreBadgeClass,
} from "@/components/lead-hunter/opportunity-meta";
import { analyzeOpportunity } from "@/components/lead-hunter/scoring";
import {
  inputClass,
  labelClass,
  submitClass,
  errorBoxClass,
  successBoxClass,
} from "@/components/leads/form-styles";

const initialState: ActionState = { status: "idle" };

/**
 * Optional seed when an opportunity is being prepared FROM a registered source
 * (v0.3.10 Source → Opportunity workflow). Pre-fills fields and carries the
 * source link (hidden `source_id`). The human still confirms and saves —
 * nothing is hidden or auto-submitted.
 */
export interface OpportunitySeed {
  sourceId: string;
  sourceLabel: string;
  /** Mapped to an allowed opportunity source value (whitelisted server-side). */
  sourceType?: string;
  /** Pre-filled "why interesting" context derived from the source. */
  reason?: string;
}

/**
 * Manual "Opportunity erfassen" form with a LIVE, deterministic analysis panel
 * (service matching + score explanation + recommended next action). No AI, no
 * API, no scraping — everything is computed client-side from the entered
 * signals. The human keeps control: suggestions are only applied when the user
 * clicks "übernehmen". Submits to the `createOpportunity` server action.
 *
 * When `seed` is provided, the form is pre-filled from a registered source and
 * the link is submitted as a hidden `source_id` field.
 */
export function NewOpportunityForm({ seed }: { seed?: OpportunitySeed }) {
  const [state, formAction, pending] = useActionState(
    createOpportunity,
    initialState,
  );
  // Remount (clearing all fields) on each successful submit via the changing
  // key — avoids a setState-in-effect; errors keep the user's input.
  return (
    <OpportunityFields
      key={state.resetToken ?? "init"}
      state={state}
      formAction={formAction}
      pending={pending}
      seed={seed}
    />
  );
}

function OpportunityFields({
  state,
  formAction,
  pending,
  seed,
}: {
  state: ActionState;
  formAction: (formData: FormData) => void;
  pending: boolean;
  seed?: OpportunitySeed;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Manuell");
  const [region, setRegion] = useState("");
  const [service, setService] = useState("");
  const [sourceType, setSourceType] = useState(seed?.sourceType ?? "manual");
  const [score, setScore] = useState("");
  const [reason, setReason] = useState(seed?.reason ?? "");
  const [nextAction, setNextAction] = useState("");

  const analysis = useMemo(
    () =>
      analyzeOpportunity({
        name,
        category,
        region,
        servicePotential: service,
        sourceType,
        score: score.trim() === "" ? null : Number.parseInt(score, 10),
      }),
    [name, category, region, service, sourceType, score],
  );

  const hasInput =
    name.trim() !== "" || service.trim() !== "" || region.trim() !== "";

  return (
    <form action={formAction} className="space-y-4">
      {seed && (
        <>
          {/* Carries the source link; the human still confirms + saves. */}
          <input type="hidden" name="source_id" value={seed.sourceId} />
          <div className="flex items-start gap-2 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-700 ring-1 ring-inset ring-navy-100">
            <Library className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
            <span>
              Aus Quelle:{" "}
              <strong className="font-semibold">{seed.sourceLabel}</strong> – die
              Opportunity wird mit dieser Quelle verknüpft. Felder prüfen und
              speichern.
            </span>
          </div>
        </>
      )}

      <div>
        <label htmlFor="op_name" className={labelClass}>
          Titel / Firma / Projekt *
        </label>
        <input
          id="op_name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="z. B. Neubau Wohnüberbauung Seefeld"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="op_category" className={labelClass}>
            Opportunity-Typ
          </label>
          <select
            id="op_category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
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
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClass}
            placeholder="z. B. Zürich"
          />
        </div>
        <div>
          <label htmlFor="op_source" className={labelClass}>
            Quelle
          </label>
          <select
            id="op_source"
            name="source_type"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className={inputClass}
          >
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
            value={service}
            onChange={(e) => setService(e.target.value)}
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
            value={score}
            onChange={(e) => setScore(e.target.value)}
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

      {/* Live deterministic analysis — no AI/API, computed from the inputs. */}
      {hasInput && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900">
              <Sparkles className="h-4 w-4 text-blue-600" />
              Analyse (deterministisch, keine KI/API)
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreBadgeClass(analysis.suggestedScore)}`}
            >
              Vorschlag Score {analysis.suggestedScore}
            </span>
          </div>

          {analysis.matchedServices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {analysis.matchedServices.map((svc) => (
                <span
                  key={svc}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-navy-700 ring-1 ring-inset ring-blue-200"
                >
                  <Target className="h-3 w-3 text-blue-600" />
                  {svc}
                </span>
              ))}
            </div>
          )}

          <ul className="mt-3 space-y-1.5">
            {analysis.factors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span
                  aria-hidden
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    f.tone === "positive"
                      ? "bg-emerald-500"
                      : f.tone === "hint"
                        ? "bg-amber-500"
                        : "bg-slate-300"
                  }`}
                />
                <span>
                  <strong className="font-medium text-navy-800">{f.label}</strong>{" "}
                  – {f.detail}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-inset ring-slate-100">
            <span className="font-medium text-slate-500">Empfohlene nächste Aktion:</span>{" "}
            {analysis.recommendedNextAction}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setReason(analysis.whyInteresting);
                setNextAction(analysis.recommendedNextAction);
                if (score.trim() === "") setScore(String(analysis.suggestedScore));
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Vorschläge übernehmen
            </button>
            <span className="self-center text-[11px] text-slate-400">
              füllt Grund, nächste Aktion und (falls leer) Score – bleibt editierbar
            </span>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="op_reason" className={labelClass}>
          Warum interessant
        </label>
        <textarea
          id="op_reason"
          name="reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
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
