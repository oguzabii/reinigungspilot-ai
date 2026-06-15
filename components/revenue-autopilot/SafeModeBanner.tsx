import { ShieldCheck } from "lucide-react";

/**
 * Always-on automation-status banner (v0.5.6). It reassures the owner that the
 * autopilot is visible and controlled — framed as how Klarsa works, not a list
 * of disclaimers — while keeping the hard guarantees (no spam, no hidden mass
 * outreach, every step logged). Shown on every automation surface.
 */
export function SafeModeBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p className="text-sm leading-relaxed text-emerald-900">
        <strong className="font-semibold">
          Autopilot sichtbar und kontrolliert.
        </strong>{" "}
        Klarsa arbeitet nach Paket und Freigabe-Regeln; Premium-Vollautomatik wird
        kanalweise aktiviert. Jeder Schritt ist sichtbar und protokolliert – kein
        Spam, keine versteckte Massen-Kontaktaufnahme, keine stille Terminbuchung.
      </p>
    </div>
  );
}
