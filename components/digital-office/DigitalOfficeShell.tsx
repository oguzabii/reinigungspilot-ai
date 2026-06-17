import Link from "next/link";
import { Sparkles, Building2, ChevronLeft, LogOut } from "lucide-react";

/**
 * Standalone top bar for the Digital Office Builder surface.
 *
 * Deliberately NOT the Klarsa money-chain navigation: this is a slim product
 * header so Digital Office visually owns the page. Klarsa stays reachable via a
 * discreet "Klarsa-Plattform" back-link (the product runs on the platform).
 * Server component — product mark, back-link, company chip and a logout form.
 */
export function DigitalOfficeShell({ companyName }: { companyName?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
            <Sparkles className="h-4 w-4 text-blue-300" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-navy-900">
            Digital Office Builder
          </span>
        </div>

        <div className="flex items-center gap-2">
          {companyName && (
            <span className="hidden items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </span>
          )}
          <Link
            href="/app-shell"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Klarsa-Plattform
          </Link>
          <form action="/logout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.2} />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
