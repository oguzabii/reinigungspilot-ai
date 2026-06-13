"use client";

import { useActionState } from "react";
import { Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { updateAutopilotPolicy, type ActionState } from "./actions";
import type { AutopilotToggles } from "@/components/revenue-autopilot/policy";

const initial: ActionState = { status: "idle" };

interface ToggleDef {
  name: keyof AutopilotToggles;
  label: string;
  description: string;
  /** Extra gating note (e.g. provider not configured). */
  note?: string;
}

/**
 * Owner/admin safe-mode toggles. Only the SAFE modes are here — cold outreach,
 * auto-calls and silent booking are hard-blocked in `policy.ts` and intentionally
 * NOT toggleable. Submits to `updateAutopilotPolicy` (RLS settings domain).
 */
export function PolicyToggles({
  toggles,
  sendConfigured,
  discoveryConfigured,
  canManage,
}: {
  toggles: AutopilotToggles;
  sendConfigured: boolean;
  discoveryConfigured: boolean;
  canManage: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateAutopilotPolicy, initial);

  const defs: ToggleDef[] = [
    {
      name: "autoCreateColdCandidates",
      label: "Kalt entdeckte Kandidaten automatisch erstellen",
      description:
        "Discovery-Treffer werden als Prospect (Kandidat) gespeichert – kalt, nicht kontaktiert, Outreach gesperrt.",
      note: discoveryConfigured
        ? undefined
        : "Discovery-API nicht konfiguriert – ohne Schlüssel ohne Wirkung.",
    },
    {
      name: "autoReplyInbound",
      label: "Inbound-Antwort automatisch senden",
      description: "Auto-Antwort auf Opt-in-Anfragen (Website-Formular o. Ä.).",
      note: sendConfigured ? undefined : "Versand-Provider nicht konfiguriert – aktuell ohne Wirkung.",
    },
    {
      name: "autoFollowupExistingApproved",
      label: "Follow-up an Bestand/freigegeben automatisch",
      description: "Automatisches Follow-up an Bestandskunden oder freigegebene Kontakte.",
      note: sendConfigured ? undefined : "Versand-Provider nicht konfiguriert – aktuell ohne Wirkung.",
    },
    {
      name: "autoAppointmentProposal",
      label: "Terminvorschlag automatisch vorbereiten",
      description: "Bereitet einen Vorschlag vor – sendet nichts und bucht nichts.",
    },
  ];

  return (
    <form action={formAction} className="space-y-3">
      {defs.map((d) => (
        <label
          key={d.name}
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <input
            type="checkbox"
            name={d.name}
            defaultChecked={toggles[d.name]}
            disabled={!canManage}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-navy-900">{d.label}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
              {d.description}
            </span>
            {d.note && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                {d.note}
              </span>
            )}
          </span>
        </label>
      ))}

      {canManage ? (
        <button type="submit" disabled={pending} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800 disabled:opacity-60">
          <Save className="h-4 w-4" strokeWidth={2.2} />
          {pending ? "Speichern…" : "Richtlinien speichern"}
        </button>
      ) : (
        <p className="text-xs text-slate-500">
          Nur Inhaber/Admin dürfen die Richtlinien ändern.
        </p>
      )}

      {state.status !== "idle" && state.message && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
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
    </form>
  );
}
