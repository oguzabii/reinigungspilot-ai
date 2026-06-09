import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login – Klarsa",
  description:
    "Anmeldung zum Klarsa-Arbeitsbereich. Foundation – Zugang nur für Staging, noch keine echten Kundendaten.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  // Read the public env on the SERVER via direct static references. NEXT_PUBLIC
  // values are inlined at build/render time; this is the most reliable gate and
  // avoids any client-side `process.env[name]` pitfalls.
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Link href="/" aria-label="Zur Startseite">
            <Logo className="h-10" priority />
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-navy-900">
            Anmelden
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Zugang zum Klarsa-Arbeitsbereich (Multi-Tenant).
          </p>

          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-inset ring-slate-100">
            Staging-Testzugang nur für interne Entwicklung. Keine echten
            Kundendaten.
          </p>

          <LoginForm isConfigured={isConfigured} />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-blue-700 hover:text-blue-800">
            <span aria-hidden="true">←</span> Zurück zur Website
          </Link>
        </p>
      </div>
    </div>
  );
}
