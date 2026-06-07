import { ShieldCheck, Inbox, Zap, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; label: string; sub: string }[] = [
  {
    icon: ShieldCheck,
    label: "Schweizer B2B-Fokus",
    sub: "Verwaltungen, Praxen, Büros & Gewerbe",
  },
  {
    icon: Inbox,
    label: "Kein Lead geht verloren",
    sub: "Alle Anfragen zentral & priorisiert",
  },
  {
    icon: Zap,
    label: "In Minuten zur Offerte",
    sub: "Preis, PDF und E-Mail automatisch",
  },
  {
    icon: TrendingUp,
    label: "Planbarer Umsatz",
    sub: "Pipeline & Prognose im Dashboard",
  },
];

export function TrustBar() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  {item.label}
                </p>
                <p className="text-sm text-slate-500">{item.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
