import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Compact dark page header used on public sub-pages (Pricing, Pilot, FAQ). */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="surface-hero">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20 lg:px-6">
        {eyebrow && (
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-inset ring-white/15">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-100">
            {description}
          </p>
        )}
        {children && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
        )}
      </div>
    </section>
  );
}
