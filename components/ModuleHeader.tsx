import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ModuleHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

/** Consistent header for each demo module view. */
export function ModuleHeader({
  icon: Icon,
  title,
  description,
  badge,
  actions,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 max-w-xl text-sm text-slate-600">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
