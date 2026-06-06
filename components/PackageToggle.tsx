"use client";

import type { PackageId } from "@/lib/packages";
import { PACKAGE_LIST } from "@/lib/packages";
import { cn } from "@/lib/cn";

interface PackageToggleProps {
  value: PackageId;
  onChange: (id: PackageId) => void;
  /** Text appended after the package name, e.g. "Demo". */
  suffix?: string;
  size?: "sm" | "md";
  theme?: "dark" | "light";
  className?: string;
}

/** Segmented control used to switch the active package in the demo. */
export function PackageToggle({
  value,
  onChange,
  suffix = "Demo",
  size = "md",
  theme = "dark",
  className,
}: PackageToggleProps) {
  const isDark = theme === "dark";
  return (
    <div
      role="tablist"
      aria-label="Paket auswählen"
      className={cn(
        "inline-flex rounded-xl p-1 ring-1 ring-inset",
        isDark
          ? "bg-navy-950/40 ring-white/10"
          : "bg-slate-100 ring-slate-200",
        className,
      )}
    >
      {PACKAGE_LIST.map((pkg) => {
        const active = pkg.id === value;
        return (
          <button
            key={pkg.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(pkg.id)}
            className={cn(
              "rounded-lg font-medium transition-colors",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              active
                ? "bg-white text-navy-900 shadow-sm"
                : isDark
                  ? "text-navy-100 hover:text-white"
                  : "text-slate-600 hover:text-navy-900",
            )}
          >
            {pkg.name}
            {suffix ? ` ${suffix}` : ""}
          </button>
        );
      })}
    </div>
  );
}
