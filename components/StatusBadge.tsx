import { cn } from "@/lib/cn";
import type {
  LeadStatus,
  FollowUpState,
  CalendarState,
  RiskLevel,
} from "@/lib/demo-data";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
  accent: "bg-navy-50 text-navy-700 ring-navy-200",
};

const dotStyles: Record<BadgeTone, string> = {
  neutral: "bg-slate-400",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  accent: "bg-navy-500",
};

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  label,
  tone = "neutral",
  dot = false,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneStyles[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[tone])} />}
      {label}
    </span>
  );
}

/* Tone mappings for the demo's domain statuses. */

export function leadStatusTone(status: LeadStatus): BadgeTone {
  switch (status) {
    case "Neu":
      return "info";
    case "Qualifiziert":
      return "accent";
    case "Offerte":
      return "warning";
    case "Follow-up":
      return "neutral";
    case "Gewonnen":
      return "success";
    case "Verloren":
      return "danger";
  }
}

export function followUpStateTone(state: FollowUpState): BadgeTone {
  switch (state) {
    case "Fällig":
      return "warning";
    case "Geplant":
      return "info";
    case "Überfällig":
      return "danger";
    case "Erledigt":
      return "success";
  }
}

export function calendarStateTone(state: CalendarState): BadgeTone {
  switch (state) {
    case "Bestätigt":
      return "success";
    case "Geplant":
      return "info";
    case "Vorläufig":
      return "warning";
  }
}

export function riskTone(level: RiskLevel): BadgeTone {
  switch (level) {
    case "Niedrig":
      return "success";
    case "Mittel":
      return "warning";
    case "Hoch":
      return "danger";
  }
}
