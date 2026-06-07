import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV = [
  { label: "Preise", href: "/pricing" },
  { label: "Beratung", href: "/beratung" },
  { label: "FAQ", href: "/faq" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" aria-label="ReinigungsPilot AI Startseite">
          <Logo variant="light" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-navy-200 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Demo ansehen
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>

      {/* Mobile navigation row */}
      <div className="border-t border-white/10 md:hidden">
        <nav className="mx-auto flex max-w-6xl items-center justify-center gap-6 px-4 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-navy-200 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
