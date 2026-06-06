import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Standard white surface card used across the demo modules. */
export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section title used inside a Panel. */
export function PanelTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold uppercase tracking-wide text-slate-500",
        className,
      )}
    >
      {children}
    </h3>
  );
}
