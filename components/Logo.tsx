import { cn } from "@/lib/cn";
import { LogoMark } from "./LogoMark";

interface LogoProps {
  variant?: "dark" | "light";
  showName?: boolean;
  className?: string;
}

/** ReinigungsPilot AI brand lockup. `light` is for use on dark surfaces. */
export function Logo({ variant = "dark", showName = true, className }: LogoProps) {
  const isLight = variant === "light";
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={34} className="rounded-[8px] shadow-sm" />
      {showName && (
        <span
          className={cn(
            "text-lg font-semibold tracking-tight",
            isLight ? "text-white" : "text-navy-900",
          )}
        >
          ReinigungsPilot
          <span className={isLight ? "text-blue-300" : "text-blue-600"}> AI</span>
        </span>
      )}
    </span>
  );
}
