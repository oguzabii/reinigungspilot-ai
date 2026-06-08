import Link from "next/link";
import { Logo } from "@/components/Logo";

const LINKS = [
  { label: "Demo", href: "/demo" },
  { label: "Demo-Skript", href: "/demo-script" },
  { label: "Sales-Kit", href: "/sales-kit" },
  { label: "Video-Skript", href: "/video-script" },
];

/** Header for internal (noindex) tool pages: demo script, sales kit. */
export function InternalHeader() {
  return (
    <header className="border-b border-white/10 bg-navy-900">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/">
          <Logo priority />
        </Link>
        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-4 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-navy-200 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-200 ring-1 ring-inset ring-amber-400/30">
            Intern
          </span>
        </div>
      </div>
    </header>
  );
}
