import { X } from "lucide-react";
import { NOT_INCLUDED_V1 } from "@/lib/scope";
import { SectionHeader } from "./SectionHeader";

interface NotIncludedSectionProps {
  className?: string;
}

/** Honest "what this is NOT" boundaries (v1 product scope). */
export function NotIncludedSection({ className }: NotIncludedSectionProps) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
        <SectionHeader
          align="center"
          eyebrow="Klarheit"
          title="Was ReinigungsPilot AI bewusst nicht ist."
          description="Ehrliche Abgrenzung – damit Sie genau wissen, was Sie bekommen und was nicht."
        />
        <ul className="mx-auto mt-10 grid gap-3 sm:grid-cols-2">
          {NOT_INCLUDED_V1.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 ring-1 ring-inset ring-red-100">
                <X className="h-3.5 w-3.5" strokeWidth={2.6} />
              </span>
              <span className="text-sm text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
