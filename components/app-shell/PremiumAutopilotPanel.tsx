import Link from "next/link";
import {
  Sparkles,
  CalendarClock,
  MapPin,
  UserRound,
  ChevronRight,
} from "lucide-react";
import type {
  PremiumDigest,
  DigestRow,
  DigestState,
} from "@/components/app-shell/premium-digest";

/**
 * Premium "Klarsa hat für Sie gearbeitet" panel (v0.5.6).
 *
 * The Premium owner opens Klarsa and sees what the autopilot did for them —
 * companies checked, opportunities found, contacts prepared, replies, offers and
 * appointments — plus the next confirmed appointment. Numbers come straight from
 * the digest (real, RLS-scoped data). Rows whose channel is not connected show a
 * calm honest state rather than a fabricated number. Presentational only.
 */

const DOT: Record<DigestState, string> = {
  active: "bg-emerald-500",
  waiting: "bg-amber-500",
  channel: "bg-slate-300",
  empty: "bg-slate-300",
};

/** Deterministic, SSR-safe "DD.MM.YYYY · HH:mm" from an ISO string (UTC). */
function formatWhen(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y} · ${iso.slice(11, 16)}`;
}

export function PremiumAutopilotPanel({ digest }: { digest: PremiumDigest }) {
  const { rows, nextAppointment, hasActivity } = digest;
  return (
    <section className="overflow-hidden rounded-2xl border border-navy-900 shadow-sm">
      {/* Header band */}
      <div className="surface-hero px-5 py-5 text-white sm:px-6">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
          <Sparkles className="h-3.5 w-3.5" />
          Premium · Vollautomatisches AI-Verkaufsbüro
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {hasActivity
            ? "Klarsa hat für Sie gearbeitet"
            : "Klarsa ist für Sie bereit"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-navy-100">
          {hasActivity
            ? "Ihr Verkaufsbüro im Überblick – sichtbar und kontrolliert."
            : "Sobald Chancen und Kanäle laufen, sehen Sie hier, was Klarsa für Sie erledigt hat."}
        </p>
      </div>

      {/* Status rows */}
      <div className="bg-white p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rows.map((row) => (
            <StatTile key={row.key} row={row} />
          ))}
        </div>

        {/* Next appointment highlight */}
        <div className="mt-4 rounded-2xl border border-navy-100 bg-navy-50/60 p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-navy-500">
            <CalendarClock className="h-3.5 w-3.5 text-blue-600" />
            Nächster Termin
          </p>
          {nextAppointment ? (
            <div className="mt-2">
              <p className="text-base font-semibold tabular-nums text-navy-900">
                {formatWhen(nextAppointment.whenIso)}{" "}
                <span className="text-xs font-normal text-slate-400">(UTC)</span>
              </p>
              <p className="mt-1 font-medium text-navy-800">
                {nextAppointment.topic}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {nextAppointment.customer && (
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5 text-slate-400" />
                    {nextAppointment.customer}
                  </span>
                )}
                {nextAppointment.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {nextAppointment.location}
                  </span>
                )}
              </div>
              <Link
                href="/app-shell/jobs"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Termin öffnen
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Noch kein Termin geplant. Sobald ein Auftrag terminiert ist,
              erscheint hier der nächste Termin mit Kunde, Ort und Thema.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function StatTile({ row }: { row: DigestRow }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{row.label}</span>
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${DOT[row.state]}`}
        />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-navy-900">
        {row.value}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
        {row.sublabel}
      </p>
    </div>
  );
}
