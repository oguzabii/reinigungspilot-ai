import { Store } from "lucide-react";
import { ADDONS, ADDON_CATEGORY_ORDER } from "@/lib/addons";
import { ModuleHeader } from "@/components/ModuleHeader";
import { AddOnCard } from "@/components/AddOnCard";
import { StatusBadge } from "@/components/StatusBadge";

export function AddOnStore() {
  return (
    <div className="space-y-8">
      <ModuleHeader
        icon={Store}
        title="Add-on Store"
        description="Erweitern Sie Ihr Paket jederzeit mit zusätzlichen Modulen – flexibel, transparent und ohne Vertragsumbau."
        badge={<StatusBadge label={`${ADDONS.length} Add-ons`} tone="accent" />}
      />

      {ADDON_CATEGORY_ORDER.map((category) => {
        const items = ADDONS.filter((addon) => addon.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {category}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((addon) => (
                <AddOnCard key={addon.id} addon={addon} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
