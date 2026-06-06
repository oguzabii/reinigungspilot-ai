import { Route } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { SuccessTimeline } from "@/components/SuccessTimeline";
import { StatusBadge } from "@/components/StatusBadge";

export function CustomerSuccess() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Route}
        title="12-Monats-Erfolgsplan"
        description="Strukturierte Begleitung über das ganze Jahr – von Setup und Go-Live bis zur Verlängerung mit Treue-Angebot."
        badge={<StatusBadge label="Customer Success" tone="info" dot />}
      />
      <div className="max-w-3xl">
        <SuccessTimeline />
      </div>
    </div>
  );
}
