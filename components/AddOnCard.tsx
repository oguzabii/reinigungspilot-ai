import {
  Plus,
  Star,
  Crosshair,
  Globe,
  Workflow,
  Megaphone,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AddOn, AddOnCategory } from "@/lib/addons";
import { formatChf, formatChfRange } from "@/lib/format";

const CATEGORY_ICON: Record<AddOnCategory, LucideIcon> = {
  Leads: Crosshair,
  Reichweite: Globe,
  Integration: Workflow,
  Marketing: Megaphone,
  Konto: Users,
  "Setup & Daten": Wrench,
};

interface PriceLines {
  primary: string;
  secondary?: string;
}

function priceLines(addon: AddOn): PriceLines {
  if (addon.setupFromChf != null && addon.setupToChf != null) {
    return {
      primary: formatChfRange(addon.setupFromChf, addon.setupToChf),
      secondary: "einmalig / Setup",
    };
  }
  if (addon.setupChf != null && addon.monthlyChf != null) {
    return {
      primary: `${formatChf(addon.monthlyChf)} / Monat`,
      secondary: `+ ${formatChf(addon.setupChf)} Setup`,
    };
  }
  if (addon.monthlyChf != null) {
    return {
      primary: addon.unit
        ? formatChf(addon.monthlyChf)
        : `${formatChf(addon.monthlyChf)} / Monat`,
      secondary: addon.unit,
    };
  }
  if (addon.setupChf != null) {
    return { primary: formatChf(addon.setupChf), secondary: "Setup" };
  }
  if (addon.oneTimeChf != null) {
    return { primary: formatChf(addon.oneTimeChf), secondary: "einmalig" };
  }
  return { primary: "Auf Anfrage" };
}

export function AddOnCard({ addon }: { addon: AddOn }) {
  const price = priceLines(addon);
  const Icon = CATEGORY_ICON[addon.category];
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        {addon.popular && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            Beliebt
          </span>
        )}
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {addon.category}
      </p>
      <h3 className="mt-0.5 text-base font-semibold tracking-tight text-navy-900">
        {addon.name}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">
        {addon.description}
      </p>

      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-base font-semibold text-navy-900">{price.primary}</p>
          {price.secondary && (
            <p className="text-xs text-slate-500">{price.secondary}</p>
          )}
        </div>
        <button
          type="button"
          aria-label={`${addon.name} hinzufügen`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          Hinzufügen
        </button>
      </div>
    </div>
  );
}
