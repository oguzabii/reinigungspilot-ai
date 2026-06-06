import { Table2 } from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { ModuleHeader } from "@/components/ModuleHeader";
import { ComparisonTable } from "@/components/ComparisonTable";

interface Props {
  pkg: PackageId;
  onSelectPackage: (id: PackageId) => void;
}

export function PackageComparison({ pkg, onSelectPackage }: Props) {
  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Table2}
        title="Paketvergleich"
        description="Alle Limiten und Leistungen im direkten Vergleich. Klicken Sie auf ein Paket, um die Demo zu wechseln."
      />
      <ComparisonTable activePkg={pkg} onSelectPackage={onSelectPackage} />
    </div>
  );
}
