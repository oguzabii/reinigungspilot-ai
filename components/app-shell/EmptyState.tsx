import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/**
 * Shared premium empty state for the app shell. Every empty state should not
 * just say "nothing here" — it should explain the next concrete action and,
 * where useful, link straight to it. Keeps the product feeling intentional and
 * "ready" rather than dead, even on a brand-new tenant.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  cta?: { label: string; href: string };
  /** `ready` = a confident blue accent (the system is armed, awaiting input). */
  tone?: "neutral" | "ready";
}) {
  const ring =
    tone === "ready"
      ? "border-blue-200 bg-gradient-to-b from-blue-50/60 to-white"
      : "border-slate-300 bg-white";
  const iconWrap =
    tone === "ready"
      ? "bg-blue-50 text-blue-600 ring-blue-100"
      : "bg-slate-50 text-slate-400 ring-slate-100";

  return (
    <div
      className={`rounded-2xl border border-dashed ${ring} px-6 py-10 text-center`}
    >
      <span
        className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset ${iconWrap}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
        {description}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
        >
          {cta.label}
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      )}
    </div>
  );
}
