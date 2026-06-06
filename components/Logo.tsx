import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

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
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1 ring-white/10"
        style={{ backgroundImage: "linear-gradient(135deg, #3b82f6 0%, #0f1e3c 95%)" }}
      >
        <Sparkles className="h-5 w-5 text-white" strokeWidth={2.2} />
      </span>
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
