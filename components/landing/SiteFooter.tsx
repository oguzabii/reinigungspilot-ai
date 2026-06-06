import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo variant="light" />
            <p className="mt-3 max-w-sm text-sm text-navy-300">
              Das AI-Vertriebsbüro für Reinigungsfirmen in der Schweiz – Leads
              finden, Offerten erstellen und Aufträge gewinnen, ohne Zeit im Büro
              zu verlieren.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Produkt</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="#module" className="transition-colors hover:text-white">
                  Module
                </Link>
              </li>
              <li>
                <Link href="#pakete" className="transition-colors hover:text-white">
                  Pakete
                </Link>
              </li>
              <li>
                <Link href="#addons" className="transition-colors hover:text-white">
                  Add-ons
                </Link>
              </li>
              <li>
                <Link href="/demo" className="transition-colors hover:text-white">
                  Live-Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Demo-Unternehmen</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="font-medium text-white">Muster Reinigung GmbH</li>
              <li>Region Zürich</li>
              <li>Starter · Pro · Premium</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-6 text-xs text-navy-400">
          <p>© 2026 ReinigungsPilot AI · Demo-Version</p>
          <p>Alle Daten sind fiktiv und dienen ausschliesslich der Demonstration.</p>
        </div>
      </div>
    </footer>
  );
}
