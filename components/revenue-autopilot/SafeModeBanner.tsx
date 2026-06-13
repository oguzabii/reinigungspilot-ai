import { ShieldCheck } from "lucide-react";

/**
 * Always-on reassurance banner: the Autopilot runs in safe mode. It restates the
 * hard guarantees so the owner (and any reviewer) sees them on every automation
 * surface.
 */
export function SafeModeBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p className="text-sm leading-relaxed text-emerald-900">
        <strong className="font-semibold">Autopilot Safe-Mode aktiv.</strong>{" "}
        Cold-Outreach ist gesperrt, es gibt keinen automatischen Versand an kalt
        entdeckte Kontakte, keine automatischen Anrufe und keine stille
        Terminbuchung. Discovery nutzt nur die offizielle API (kein Scraping) und
        läuft nur, wenn der Inhaber sie startet.
      </p>
    </div>
  );
}
